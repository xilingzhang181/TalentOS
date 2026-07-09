/**
 * Step 2: Skill Extraction Prompt
 *
 * Identifies all skills from a structured resume (output of Step 1)
 * with proficiency levels, years of experience, and exact evidence quotes.
 */

/** System message for the skill extraction model. */
export const EXTRACT_SKILLS_SYSTEM_PROMPT = `You are a technical skills extractor. Analyze the following resume and extract every skill mentioned or implied.

You must extract BOTH explicit skills ("Proficient in Python") AND implied skills (mentions "built REST APIs" -> infer "REST API Design").

Do NOT add skills not supported by the resume text.
Include soft skills if clearly evidenced (e.g., "Led a team of 8" -> "Team Leadership").`;

/** Proficiency level guidelines shown to the model. */
export const PROFICIENCY_GUIDELINES = `
Proficiency levels:
- 5 (Expert): Used as primary language/tool for 3+ years, or listed as "expert"
- 4 (Advanced): Strong daily use for 1-3 years
- 3 (Intermediate): Regular use for 6-12 months
- 2 (Basic): Some project experience, < 6 months
- 1 (Awareness): Mentioned or listed but no evidence of use
`;

/** JSON schema the model must conform to. */
export const EXTRACT_SKILLS_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    skills: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Canonical skill name (e.g., TypeScript not TS)' },
          category: {
            type: 'string' as const,
            enum: [
              'technical',
              'language',
              'tool',
              'framework',
              'methodology',
              'soft_skill',
              'certification',
              'domain_knowledge',
            ],
          },
          proficiency_level: { type: 'number', minimum: 1, maximum: 5 },
          years_experience: { type: 'number', minimum: 0 },
          evidence: { type: 'string', description: 'Exact text from resume supporting this skill' },
          aliases: { type: 'array' as const, items: { type: 'string' } },
        },
        required: ['name', 'category', 'proficiency_level', 'years_experience', 'evidence', 'aliases'],
      },
    },
  },
  required: ['skills'],
} as const;

/**
 * Build the full prompt messages for skill extraction.
 * @param structuredResume - JSON-stringified resume output from Step 1.
 * @returns Array of chat messages to send to the model.
 */
export function buildExtractSkillsPrompt(structuredResume: string) {
  return [
    { role: 'system' as const, content: EXTRACT_SKILLS_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `RESUME:\n${structuredResume}

OUTPUT JSON matching the required schema.

RULES:
1. Extract BOTH explicit skills ("Proficient in Python") AND implied skills (mentions "built REST APIs" -> infer "REST API Design").
${PROFICIENCY_GUIDELINES}
4. evidence: Quote the EXACT phrase from the resume. Do not paraphrase.
5. Do NOT add skills not supported by the resume text.
6. years_experience: Estimate from resume timeline. If unclear, use 0.5 as minimum.
7. Include soft skills if clearly evidenced (e.g., "Led a team of 8" -> "Team Leadership").`,
    },
  ];
}
