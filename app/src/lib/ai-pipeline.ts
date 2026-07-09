/**
 * AI Pipeline Orchestrator — runs the 7-step analysis pipeline.
 *
 * Steps:
 *   1. Parse resume (local text extraction)
 *   2. Extract skills (GPT-4o-mini)
 *   3. Parse job description (GPT-4o-mini)
 *   4. Semantic matching (pgvector cosine similarity + skill scoring)
 *   5. Gap analysis (GPT-4o)
 *   6. Feedback generation (GPT-4o)
 *   7. Resume rewrite suggestions (GPT-4o, optional)
 *
 * Steps 1-3 run sequentially (each depends on the prior).
 * Embeddings (resume + JD) run in parallel after Step 3.
 * Steps 5-7 each depend on their predecessors.
 *
 * Every step is wrapped in try/catch for graceful degradation:
 * if a step fails, the pipeline continues with partial results.
 */

import { db, findResumeById, updateResumeStatus } from './db';
import { FAST_MODEL, REASONING_MODEL, chatCompletion, generateEmbedding, estimateCostForStep } from './ai-clients';
import { buildParseResumePrompt, PARSE_RESUME_RESPONSE_SCHEMA } from './prompts/parse-resume';
import { buildExtractSkillsPrompt, EXTRACT_SKILLS_RESPONSE_SCHEMA } from './prompts/extract-skills';
import { buildParseJdPrompt, PARSE_JD_RESPONSE_SCHEMA } from './prompts/parse-jd';
import { buildGapAnalysisPrompt, GAP_ANALYSIS_RESPONSE_SCHEMA } from './prompts/gap-analysis';
import { buildFeedbackPrompt, FEEDBACK_RESPONSE_SCHEMA } from './prompts/feedback';
import { buildRewritePrompt, REWRITE_RESPONSE_SCHEMA } from './prompts/rewrite';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Status of a pipeline step execution. */
export type StepStatus = 'success' | 'error' | 'skipped';

/** Result wrapper for any pipeline step. */
export interface StepResult<T> {
  status: StepStatus;
  data: T | null;
  error: string | null;
  time_ms: number;
  cost_cents: number;
}

// ── Step 1: Parse Resume Output ──

export interface ParsedResumeContact {
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  website: string | null;
}

export interface ParsedExperience {
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  description: string;
  bullets: string[];
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  year: string | null;
  details: string | null;
}

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
}

export interface ParseResumeOutput {
  contact: ParsedResumeContact;
  summary: string | null;
  experience: ParsedExperience[];
  education: ParsedEducation[];
  skills: string[];
  certifications: string[];
  languages: string[];
  projects: ParsedProject[];
  metadata: {
    word_count: number;
    section_count: number;
    parsing_confidence: number;
  };
  raw_text: string;
}

// ── Step 2: Skill Extraction Output ──

export type SkillCategory =
  | 'technical'
  | 'language'
  | 'tool'
  | 'framework'
  | 'methodology'
  | 'soft_skill'
  | 'certification'
  | 'domain_knowledge';

export interface ExtractedSkill {
  name: string;
  category: SkillCategory;
  proficiency_level: number;
  years_experience: number;
  evidence: string;
  aliases: string[];
}

export interface ExtractSkillsOutput {
  skills: ExtractedSkill[];
}

// ── Step 3: JD Parse Output ──

export interface JDSalaryRange {
  min: number | null;
  max: number | null;
  currency: string;
  period: string;
}

export interface JDRequiredSkill {
  name: string;
  category: SkillCategory;
  required_level: number;
  context: string;
}

export interface JDNiceToHaveSkill {
  name: string;
  category: SkillCategory;
  preferred_level: number;
  context: string;
}

export interface JDQualifications {
  education: string[];
  experience_years: number | null;
  other: string[];
}

export interface JDCompanyInfo {
  industry: string | null;
  size: string | null;
  tech_stack: string[];
}

export interface ParseJDOutput {
  title: string;
  company: string | null;
  location: string | null;
  remote_policy: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  salary_range: JDSalaryRange;
  required_skills: JDRequiredSkill[];
  nice_to_have_skills: JDNiceToHaveSkill[];
  responsibilities: string[];
  qualifications: JDQualifications;
  company_info: JDCompanyInfo;
  parsing_confidence: number;
}

// ── Step 4: Semantic Match Output ──

export interface SemanticMatchOutput {
  semantic_score: number;
  skills_score: number;
  combined_score: number;
}

// ── Step 5: Gap Analysis Output ──

export interface LearningResource {
  type: 'course' | 'book' | 'project' | 'certification';
  name: string;
  estimated_time: string;
}

export interface SkillGapItem {
  skill_name: string;
  gap_type: 'missing' | 'partial' | 'outdated' | 'emerging';
  required_level: number;
  current_level: number;
  recommendation: string;
  priority: number;
  learning_resources: LearningResource[];
  urgency_reason: string;
}

export interface TransferableSkill {
  from: string;
  to: string;
  adaptability: string;
}

export interface GapAnalysisOutput {
  gaps: SkillGapItem[];
  overall_assessment: string;
  transferable_skills: TransferableSkill[];
}

// ── Step 6: Feedback Output ──

export interface FeedbackStrength {
  point: string;
  evidence: string;
  impact: string;
}

export interface FeedbackImprovement {
  area: string;
  current_issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface FeedbackKeyword {
  keyword: string;
  reason: string;
}

export interface FeedbackActionItem {
  action: string;
  effort: '5min' | '30min' | '2hrs' | 'half_day';
  impact: 'high' | 'medium' | 'low';
}

export interface FeedbackOutput {
  summary: string;
  overall_score: number;
  ats_score: { score: number; issues: string[]; suggestions: string[] };
  formatting_score: { score: number; issues: string[]; suggestions: string[] };
  strengths: FeedbackStrength[];
  improvements: FeedbackImprovement[];
  keywords_to_add: FeedbackKeyword[];
  section_specific_feedback: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
  action_items: FeedbackActionItem[];
}

// ── Step 7: Rewrite Output ──

export interface RewriteSection {
  section: string;
  original: string;
  rewritten: string;
  reasoning: string;
  keywords_added: string[];
  impact_improvement: string;
}

export interface FullRewrittenResume {
  summary: string | null;
  experience: { company: string; title: string; bullets: string[] }[];
  skills: string[];
}

export interface RewriteOutput {
  rewrites: RewriteSection[];
  full_rewritten_resume: FullRewrittenResume;
}

// ── Full Pipeline Result ──

/** Complete result of the analysis pipeline. */
export interface PipelineResult {
  resume_id: string;
  steps: {
    parse: StepResult<ParseResumeOutput>;
    extract_skills: StepResult<ExtractSkillsOutput>;
    jd_parse: StepResult<ParseJDOutput>;
    embedding_resume: StepResult<{ embedding: number[] }>;
    embedding_jd: StepResult<{ embedding: number[] }>;
    match: StepResult<SemanticMatchOutput>;
    gap_analysis: StepResult<GapAnalysisOutput>;
    feedback: StepResult<FeedbackOutput>;
    rewrite?: StepResult<RewriteOutput>;
  };
  total_cost_cents: number;
  total_time_ms: number;
}

// ─── Pipeline Orchestration ─────────────────────────────────────────────────

/**
 * Run the full 7-step analysis pipeline for a resume against a job description.
 *
 * @param resumeId       - UUID of the uploaded resume.
 * @param jdText         - Raw job description text (user-pasted or scraped).
 * @param rewriteOptions - Optional Step 7 configuration.
 * @returns              - PipelineResult with all step outputs.
 */
export async function runAnalysisPipeline(
  resumeId: string,
  jdText: string,
  rewriteOptions?: {
    sections?: string[];
    tone?: 'professional' | 'concise' | 'detailed';
  },
): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const results: Partial<PipelineResult['steps']> = {};

  try {
    // ── Step 1: Parse Resume (local text extraction) ────────────────────
    results.parse = await executeStep('parse_resume', async () => {
      const resume = await findResumeById(resumeId);
      if (!resume) throw new Error('Resume not found');
      if (!resume.rawText) throw new Error('Resume has no extracted text');

      const parsed = parseResumeLocally(resume.rawText);
      return { ...parsed, raw_text: resume.rawText };
    });

    if (results.parse.status === 'error') {
      // Cannot continue without parsed resume
      return buildPartialResult(resumeId, results, pipelineStart);
    }

    // ── Step 2: Extract Skills (GPT-4o-mini) ────────────────────────────
    results.extract_skills = await executeStep('extract_skills', async () => {
      const { content } = await chatCompletion(
        buildExtractSkillsPrompt(JSON.stringify(results.parse!.data, null, 2)),
        { model: FAST_MODEL, temperature: 0.1 },
      );
      return safeJsonParse<ExtractSkillsOutput>(content);
    });

    // ── Step 3: Parse Job Description (GPT-4o-mini) ────────────────────
    results.jd_parse = await executeStep('jd_parse', async () => {
      const { content } = await chatCompletion(
        buildParseJdPrompt(jdText),
        { model: FAST_MODEL, temperature: 0.1 },
      );
      return safeJsonParse<ParseJDOutput>(content);
    });

    // ── Embeddings: resume + JD in parallel ─────────────────────────────
    const [embeddingResumeResult, embeddingJdResult] = await Promise.all([
      executeStep('embedding_resume', async () => {
        const embedding = await generateEmbedding(results.parse!.data!.raw_text);
        return { embedding };
      }),
      executeStep('embedding_jd', async () => {
        const embedding = await generateEmbedding(jdText);
        return { embedding };
      }),
    ]);

    results.embedding_resume = embeddingResumeResult;
    results.embedding_jd = embeddingJdResult;

    // ── Step 4: Semantic Matching (pgvector / cosine) ───────────────────
    results.match = await executeStep('match', async () => {
      // If both embeddings are available, compute cosine similarity
      const resumeVec = results.embedding_resume?.data?.embedding;
      const jdVec = results.embedding_jd?.data?.embedding;

      if (resumeVec && jdVec) {
        const semanticScore = cosineSimilarity(resumeVec, jdVec);
        const skillsScore = computeSkillsScore(
          results.extract_skills?.data?.skills ?? [],
          results.jd_parse?.data?.required_skills ?? [],
          results.jd_parse?.data?.nice_to_have_skills ?? [],
        );
        const combinedScore = Math.round(
          semanticScore * 100 * 0.4 + skillsScore * 0.6,
        );
        return {
          semantic_score: Math.round(semanticScore * 1000) / 1000,
          skills_score: Math.round(skillsScore * 10) / 10,
          combined_score: Math.min(100, Math.max(0, combinedScore)),
        };
      }

      // Fallback: skill-only scoring
      const skillsScore = computeSkillsScore(
        results.extract_skills?.data?.skills ?? [],
        results.jd_parse?.data?.required_skills ?? [],
        results.jd_parse?.data?.nice_to_have_skills ?? [],
      );
      return {
        semantic_score: 0,
        skills_score: Math.round(skillsScore * 10) / 10,
        combined_score: Math.round(skillsScore),
      };
    });

    // ── Step 5: Gap Analysis (GPT-4o) ──────────────────────────────────
    results.gap_analysis = await executeStep('gap_analysis', async () => {
      const match = results.match!.data!;
      const topMatches = (results.extract_skills?.data?.skills ?? [])
        .slice(0, 5)
        .map((s) => s.name)
        .join(', ') || 'N/A';
      const weakestAreas = (results.jd_parse?.data?.required_skills ?? [])
        .filter(
          (req) => !(results.extract_skills?.data?.skills ?? [])
            .some((s) => s.name.toLowerCase() === req.name.toLowerCase()),
        )
        .slice(0, 5)
        .map((s) => s.name)
        .join(', ') || 'N/A';

      const { content } = await chatCompletion(
        buildGapAnalysisPrompt(
          JSON.stringify(results.extract_skills!.data!, null, 2),
          JSON.stringify(results.jd_parse!.data!.required_skills, null, 2),
          JSON.stringify(results.jd_parse!.data!.nice_to_have_skills, null, 2),
          {
            semanticScore: match.semantic_score,
            topMatches,
            weakestAreas,
          },
        ),
        { model: REASONING_MODEL, temperature: 0.3 },
      );
      return safeJsonParse<GapAnalysisOutput>(content);
    });

    // ── Step 6: Feedback Generation (GPT-4o) ───────────────────────────
    results.feedback = await executeStep('feedback', async () => {
      const match = results.match!.data!;
      const { content } = await chatCompletion(
        buildFeedbackPrompt(
          JSON.stringify(results.parse!.data, null, 2),
          JSON.stringify(results.extract_skills!.data!, null, 2),
          JSON.stringify(results.jd_parse!.data!, null, 2),
          {
            combinedScore: match.combined_score,
            semanticScore: match.semantic_score,
            skillsScore: match.skills_score,
          },
          JSON.stringify(results.gap_analysis!.data!, null, 2),
        ),
        { model: REASONING_MODEL, temperature: 0.4 },
      );
      return safeJsonParse<FeedbackOutput>(content);
    });

    // ── Step 7: Rewrite Suggestions (optional, GPT-4o) ─────────────────
    if (rewriteOptions) {
      results.rewrite = await executeStep('rewrite', async () => {
        const sections = rewriteOptions.sections ?? ['summary', 'experience', 'skills'];
        const { content } = await chatCompletion(
          buildRewritePrompt(
            JSON.stringify(results.parse!.data, null, 2),
            JSON.stringify(results.jd_parse!.data!, null, 2),
            JSON.stringify(results.feedback!.data!, null, 2),
            sections,
            rewriteOptions.tone ?? 'professional',
          ),
          { model: REASONING_MODEL, temperature: 0.5, max_tokens: 4096 },
        );
        return safeJsonParse<RewriteOutput>(content);
      });
    }

    // ── Mark resume as processed ────────────────────────────────────────
    if (results.parse?.data) {
      await updateResumeStatus(resumeId, 'processed', {
        parsedJson: results.parse.data as unknown as object,
      });
    }

    return buildPipelineResult(resumeId, results, pipelineStart);
  } catch (error) {
    console.error('[ai-pipeline] Unexpected error:', error);
    return buildPartialResult(resumeId, results, pipelineStart);
  }
}

// ─── Local Resume Parsing (Step 1 helper) ───────────────────────────────────

/**
 * Heuristic local parser that extracts structured data from raw resume text
 * without calling the LLM. Falls back gracefully when sections are missing.
 */
function parseResumeLocally(rawText: string): Omit<ParseResumeOutput, 'raw_text'> {
  const sections = detectSectionsHeuristic(rawText);
  const contact = extractContact(rawText);
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  return {
    contact,
    summary: sections['summary'] ?? null,
    experience: parseExperienceSection(sections['experience'] ?? ''),
    education: parseEducationSection(sections['education'] ?? ''),
    skills: parseListSection(sections['skills'] ?? ''),
    certifications: parseListSection(sections['certifications'] ?? ''),
    languages: parseListSection(sections['languages'] ?? ''),
    projects: [], // Projects are harder to parse heuristically
    metadata: {
      word_count: wordCount,
      section_count: Object.keys(sections).length,
      parsing_confidence: 0.7, // Heuristic baseline
    },
  };
}

/** Simple heuristic section detection (mirrors file-parser detectSections). */
function detectSectionsHeuristic(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const patterns: Record<string, RegExp[]> = {
    contact: [/^(contact|personal)\s*(info|information)?\s*$/im],
    summary: [/^(summary|professional\s+summary|profile|objective|about\s+me)\s*$/im],
    experience: [/^(experience|work\s+experience|employment|work\s+history|professional\s+experience)\s*$/im],
    education: [/^(education|academic)\s*$/im],
    skills: [/^(skills?|technical\s+skills?|technologies|competencies|proficiencies)\s*$/im],
    projects: [/^(projects?|portfolio|side\s+projects?)\s*$/im],
    certifications: [/^(certifications?|licenses?|credentials?|awards?)\s*$/im],
    languages: [/^(languages?|foreign\s+languages?)\s*$/im],
  };

  const allPatterns = Object.values(patterns).flat();
  const lines = text.split('\n');

  for (const [name, pats] of Object.entries(patterns)) {
    for (let i = 0; i < lines.length; i++) {
      if (pats.some((p) => p.test(lines[i].trim()))) {
        const collected: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const next = lines[j].trim();
          if (next.length > 0 && allPatterns.some((p) => p.test(next))) break;
          collected.push(lines[j]);
          j++;
        }
        sections[name] = collected.join('\n').trim();
        break;
      }
    }
  }

  return sections;
}

/** Extract contact info using regex patterns. */
function extractContact(text: string): ParsedResumeContact {
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.\w{2,}(?:\/[\w-]*)*/gi)
    ?.filter((u) => !u.includes('linkedin.com'))?.[0] ?? null;

  // Name is typically the first non-empty line
  const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? '';

  return {
    name: firstLine,
    email: emailMatch?.[0] ?? null,
    phone: phoneMatch?.[0] ?? null,
    location: null, // Hard to extract reliably with regex
    linkedin: linkedinMatch?.[0] ?? null,
    website: websiteMatch,
  };
}

/** Parse the experience section into structured entries. */
function parseExperienceSection(section: string): ParsedExperience[] {
  if (!section.trim()) return [];

  // Split on double newline or patterns that look like job separators
  const entries = section.split(/\n\n+/);
  return entries
    .filter((e) => e.trim().length > 0)
    .map((entry) => {
      const lines = entry.split('\n').map((l) => l.trim()).filter(Boolean);
      const firstLine = lines[0] ?? '';
      // Try to split "Title at Company" or "Title | Company"
      const titleCompany = firstLine.split(/\s*(?:at|@|\||-)\s*/);
      const bullets = lines
        .filter((l) => /^[•‣◦⁃∙\-\*\•]/.test(l))
        .map((l) => l.replace(/^[•‣◦⁃∙\-\*\•\s]+/, '').trim());

      return {
        title: titleCompany[0]?.trim() ?? firstLine,
        company: titleCompany[1]?.trim() ?? '',
        location: null,
        start_date: '',
        end_date: null,
        description: lines.join(' '),
        bullets,
      };
    });
}

/** Parse the education section. */
function parseEducationSection(section: string): ParsedEducation[] {
  if (!section.trim()) return [];
  const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => ({
    degree: line,
    institution: '',
    year: null,
    details: null,
  }));
}

/** Parse a simple comma/bullet list section (skills, certifications, etc.). */
function parseListSection(section: string): string[] {
  if (!section.trim()) return [];
  // Split on bullets, commas, or newlines
  return section
    .split(/[\n,•\-\*•]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ─── Matching Helpers ───────────────────────────────────────────────────────

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions mismatch: ${a.length} vs ${b.length}`);
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Compute skill-level matching score (0-100).
 *
 * Required skills are worth 10 points each; nice-to-have worth 4 points.
 * Partial matches (lowercase exact, alias match) score proportionally.
 */
function computeSkillsScore(
  candidateSkills: ExtractedSkill[],
  requiredSkills: JDRequiredSkill[],
  niceToHaveSkills: JDNiceToHaveSkill[],
): number {
  const candidateNames = new Set(
    candidateSkills.flatMap((s) => [
      s.name.toLowerCase(),
      ...s.aliases.map((a) => a.toLowerCase()),
    ]),
  );

  let maxScore = requiredSkills.length * 10 + niceToHaveSkills.length * 4;
  if (maxScore === 0) return 50; // No skills in JD

  let earned = 0;

  for (const req of requiredSkills) {
    const reqLower = req.name.toLowerCase();
    if (candidateNames.has(reqLower)) {
      // Exact match (or alias match)
      const skill = candidateSkills.find(
        (s) => s.name.toLowerCase() === reqLower ||
          s.aliases.some((a) => a.toLowerCase() === reqLower),
      );
      const proficiencyRatio = skill ? skill.proficiency_level / 5 : 0.7;
      earned += 10 * proficiencyRatio;
    }
  }

  for (const nice of niceToHaveSkills) {
    const niceLower = nice.name.toLowerCase();
    if (candidateNames.has(niceLower)) {
      earned += 4;
    }
  }

  return (earned / maxScore) * 100;
}

// ─── Step Executor ──────────────────────────────────────────────────────────

/**
 * Execute a pipeline step with timing, error handling, and cost tracking.
 */
async function executeStep<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<StepResult<T>> {
  const start = Date.now();
  try {
    const data = await fn();
    return {
      status: 'success',
      data,
      error: null,
      time_ms: Date.now() - start,
      cost_cents: estimateCostForStep(name),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ai-pipeline] Step "${name}" failed:`, msg);
    return {
      status: 'error',
      data: null,
      error: msg,
      time_ms: Date.now() - start,
      cost_cents: 0,
    };
  }
}

// ─── Result Builders ────────────────────────────────────────────────────────

/**
 * Assemble the final PipelineResult from collected step outputs.
 */
function buildPipelineResult(
  resumeId: string,
  results: Partial<PipelineResult['steps']>,
  pipelineStart: number,
): PipelineResult {
  const allSteps = Object.values(results) as StepResult<unknown>[];
  const totalCostCents = allSteps.reduce((sum, s) => sum + (s?.cost_cents ?? 0), 0);

  return {
    resume_id: resumeId,
    steps: results as PipelineResult['steps'],
    total_cost_cents: totalCostCents,
    total_time_ms: Date.now() - pipelineStart,
  };
}

/**
 * Build a partial result when the pipeline fails early.
 */
function buildPartialResult(
  resumeId: string,
  results: Partial<PipelineResult['steps']>,
  pipelineStart: number,
): PipelineResult {
  return buildPipelineResult(resumeId, results, pipelineStart);
}

// ─── Rewrite-Only Entry Point ───────────────────────────────────────────────

/**
 * Generate rewrite suggestions for an existing analysis.
 * This is called from the /api/resumes/:id/rewrite endpoint.
 *
 * @param resume      - Full resume record from the database.
 * @param jdParsed    - Parsed JD JSON from the analysis.
 * @param feedbackJson - Feedback JSON from the analysis.
 * @param sections    - Sections to rewrite.
 * @param tone        - Desired writing tone.
 * @returns           - Rewrite output with before/after snippets.
 */
export async function generateRewrites(
  resume: { parsedJson: unknown; rawText?: string | null },
  jdParsed: unknown,
  feedbackJson: unknown,
  sections: string[],
  tone: 'professional' | 'concise' | 'detailed' = 'professional',
): Promise<StepResult<RewriteOutput>> {
  return executeStep('rewrite', async () => {
    const { content } = await chatCompletion(
      buildRewritePrompt(
        JSON.stringify(resume.parsedJson, null, 2),
        JSON.stringify(jdParsed, null, 2),
        JSON.stringify(feedbackJson, null, 2),
        sections,
        tone,
      ),
      { model: REASONING_MODEL, temperature: 0.5, max_tokens: 4096 },
    );
    return safeJsonParse<RewriteOutput>(content);
  });
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Safely parse a JSON string, stripping markdown fences if present.
 * Returns the parsed object or throws a descriptive error.
 */
function safeJsonParse<T>(raw: string): T {
  // Strip markdown code fences if the model wraps output in ```json ... ```
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Failed to parse model JSON response (first 200 chars): ${cleaned.slice(0, 200)}`,
    );
  }
}
