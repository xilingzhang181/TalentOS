/**
 * Step 7: Resume Rewrite Prompt
 *
 * Generates before/after text snippets showing how to improve
 * specific resume sections, plus a full rewritten version.
 */

/** System message for the resume rewrite model. */
export const REWRITE_SYSTEM_PROMPT = `You are an expert resume writer. Rewrite the specified sections of this resume to better match the target job description.

CRITICAL RULES:
1. PRESERVE TRUTH. Never fabricate experience, skills, or achievements that are not in the original resume.
2. Enhance language and impact, don't change facts.
3. Use the STAR method for bullet points: Situation, Task, Action, Result.
4. Quantify achievements wherever possible (numbers, percentages, dollar amounts).
5. Mirror the language from the job description naturally -- don't keyword-stuff.
6. Each rewritten section should be no more than 3x the original length.
7. Maintain the candidate's authentic voice -- don't make it sound like a different person.`;

/** JSON schema the model must conform to. */
export const REWRITE_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    rewrites: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          section: {
            type: 'string',
            description: "Section path, e.g. 'summary', 'experience[0].bullets[2]', 'skills'",
          },
          original: { type: 'string' },
          rewritten: { type: 'string' },
          reasoning: { type: 'string', description: 'Why this change improves the resume for this specific role' },
          keywords_added: { type: 'array' as const, items: { type: 'string' } },
          impact_improvement: { type: 'string', description: 'Estimated improvement description' },
        },
        required: ['section', 'original', 'rewritten', 'reasoning', 'keywords_added', 'impact_improvement'],
      },
    },
    full_rewritten_resume: {
      type: 'object' as const,
      properties: {
        summary: { type: ['string', 'null'] },
        experience: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              company: { type: 'string' },
              title: { type: 'string' },
              bullets: { type: 'array' as const, items: { type: 'string' } },
            },
            required: ['company', 'title', 'bullets'],
          },
        },
        skills: { type: 'array' as const, items: { type: 'string' } },
      },
      required: ['summary', 'experience', 'skills'],
    },
  },
  required: ['rewrites', 'full_rewritten_resume'],
} as const;

/**
 * Build the full prompt messages for resume rewriting.
 *
 * @param resumeJson - JSON-stringified parsed resume from Step 1.
 * @param jdJson - JSON-stringified parsed JD from Step 3.
 * @param feedbackJson - JSON-stringified feedback from Step 6.
 * @param sectionsToRewrite - Which sections to rewrite (e.g. ["summary", "experience", "skills"]).
 * @param tone - Desired tone: 'professional' | 'concise' | 'detailed'.
 * @returns Array of chat messages to send to the model.
 */
export function buildRewritePrompt(
  resumeJson: string,
  jdJson: string,
  feedbackJson: string,
  sectionsToRewrite: string[],
  tone: 'professional' | 'concise' | 'detailed' = 'professional',
) {
  const toneInstructions: Record<string, string> = {
    professional: 'Write in a polished, professional tone suitable for corporate environments.',
    concise: 'Write concisely. Cut filler words. Every sentence must earn its place.',
    detailed: 'Write with rich detail. Expand thin sections with specific context and nuance.',
  };

  return [
    { role: 'system' as const, content: REWRITE_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `ORIGINAL RESUME:\n${resumeJson}

TARGET JOB:\n${jdJson}

FEEDBACK:\n${feedbackJson}

REWRITE SECTIONS: ${JSON.stringify(sectionsToRewrite)}

TONE: ${toneInstructions[tone] ?? toneInstructions.professional}

Output valid JSON matching the required schema.

IMPORTANT: The "full_rewritten_resume" should compile all rewrites into a complete, ready-to-use format with all original sections preserved (even ones not rewritten, copied as-is).`,
    },
  ];
}
