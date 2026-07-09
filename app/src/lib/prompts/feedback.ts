/**
 * Step 6: Feedback Generation Prompt
 *
 * Generates comprehensive, actionable feedback combining all prior
 * analysis steps. Acts as a senior career coach persona.
 */

/** System message for the feedback generation model. */
export const FEEDBACK_SYSTEM_PROMPT = `You are a senior career coach and resume expert. Provide comprehensive feedback on this resume's fit for the target role.

Be honest but constructive. Acknowledge strengths before suggesting improvements.
Feedback should be specific to THIS resume and THIS job, not generic advice.
Use the "XYZ + S" formula when suggesting impact statements:
  "Accomplished [X] as measured by [Y] by doing [Z] - Situation"

Action items should be ordered by impact-to-effort ratio (highest first).
Include at least 3 keywords the candidate should add to their resume for ATS optimization.`;

/** JSON schema the model must conform to. */
export const FEEDBACK_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    summary: { type: 'string', description: '2-3 sentence overall assessment' },
    overall_score: { type: 'number', minimum: 0, maximum: 100 },
    ats_score: {
      type: 'object' as const,
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        issues: { type: 'array' as const, items: { type: 'string' } },
        suggestions: { type: 'array' as const, items: { type: 'string' } },
      },
      required: ['score', 'issues', 'suggestions'],
    },
    formatting_score: {
      type: 'object' as const,
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        issues: { type: 'array' as const, items: { type: 'string' } },
        suggestions: { type: 'array' as const, items: { type: 'string' } },
      },
      required: ['score', 'issues', 'suggestions'],
    },
    strengths: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          point: { type: 'string' },
          evidence: { type: 'string', description: 'Specific example from the resume' },
          impact: { type: 'string', description: 'Why this matters for this role' },
        },
        required: ['point', 'evidence', 'impact'],
      },
    },
    improvements: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          area: { type: 'string' },
          current_issue: { type: 'string', description: 'What is wrong or weak' },
          suggestion: { type: 'string', description: 'Specific fix' },
          priority: { type: 'string' as const, enum: ['high', 'medium', 'low'] },
        },
        required: ['area', 'current_issue', 'suggestion', 'priority'],
      },
    },
    keywords_to_add: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          keyword: { type: 'string' },
          reason: { type: 'string', description: 'Why this keyword matters for ATS or the role' },
        },
        required: ['keyword', 'reason'],
      },
    },
    section_specific_feedback: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string' },
        experience: { type: 'string' },
        skills: { type: 'string' },
        education: { type: 'string' },
      },
      required: ['summary', 'experience', 'skills', 'education'],
    },
    action_items: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          action: { type: 'string' },
          effort: { type: 'string' as const, enum: ['5min', '30min', '2hrs', 'half_day'] },
          impact: { type: 'string' as const, enum: ['high', 'medium', 'low'] },
        },
        required: ['action', 'effort', 'impact'],
      },
    },
  },
  required: [
    'summary', 'overall_score', 'ats_score', 'formatting_score',
    'strengths', 'improvements', 'keywords_to_add',
    'section_specific_feedback', 'action_items',
  ],
} as const;

/**
 * Build the full prompt messages for feedback generation.
 *
 * @param resumeJson - JSON-stringified parsed resume from Step 1.
 * @param skillsJson - JSON-stringified extracted skills from Step 2.
 * @param jdJson - JSON-stringified parsed JD from Step 3.
 * @param matchContext - Match scoring results from Step 4.
 * @param gapAnalysisJson - JSON-stringified gap analysis from Step 5.
 * @returns Array of chat messages to send to the model.
 */
export function buildFeedbackPrompt(
  resumeJson: string,
  skillsJson: string,
  jdJson: string,
  matchContext: {
    combinedScore: number;
    semanticScore: number;
    skillsScore: number;
  },
  gapAnalysisJson: string,
) {
  return [
    { role: 'system' as const, content: FEEDBACK_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `CANDIDATE RESUME:\n${resumeJson}

EXTRACTED SKILLS:\n${skillsJson}

TARGET JOB DESCRIPTION:\n${jdJson}

MATCH ANALYSIS:
- Combined Score: ${matchContext.combinedScore}/100
- Semantic Score: ${matchContext.semanticScore}
- Skills Score: ${matchContext.skillsScore}

GAP ANALYSIS:\n${gapAnalysisJson}

Output valid JSON matching the required schema.`,
    },
  ];
}
