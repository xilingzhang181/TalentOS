/**
 * Step 5: Gap Analysis Prompt
 *
 * Compares candidate skills against JD requirements to identify
 * gaps with prioritized, actionable recommendations.
 */

/** System message for the gap analysis model. */
export const GAP_ANALYSIS_SYSTEM_PROMPT = `You are a career gap analyst. Compare the candidate's skills against the job requirements and identify all gaps.

Be SPECIFIC in recommendations. "Learn JavaScript" is bad. "Complete 'JavaScript: The Complete Guide' on Udemy, then build a portfolio project using TypeScript and Node.js" is good.

Identify transferable skills: a Python developer can learn Java faster than a non-programmer.
Do not be discouraging. Frame gaps as opportunities.
If a gap is about years of experience, acknowledge that years are an imperfect proxy.`;

/** Priority scoring guidelines shown to the model. */
export const PRIORITY_SCORING_RULES = `
Priority scoring:
- 5: Required skill, completely missing, role is impossible without it
- 4: Required skill, partially present (e.g., knows React but role needs Next.js)
- 3: Required skill, present but at lower level than requested
- 2: Nice-to-have skill, completely missing
- 1: Nice-to-have skill, present but could be stronger
`;

/** JSON schema the model must conform to. */
export const GAP_ANALYSIS_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    gaps: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          skill_name: { type: 'string' },
          gap_type: {
            type: 'string' as const,
            enum: ['missing', 'partial', 'outdated', 'emerging'],
          },
          required_level: { type: 'number', minimum: 1, maximum: 5 },
          current_level: { type: 'number', minimum: 0, maximum: 5 },
          recommendation: { type: 'string', description: 'Specific, actionable advice' },
          priority: { type: 'number', minimum: 1, maximum: 5 },
          learning_resources: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                type: { type: 'string' as const, enum: ['course', 'book', 'project', 'certification'] },
                name: { type: 'string' },
                estimated_time: { type: 'string' },
              },
              required: ['type', 'name', 'estimated_time'],
            },
          },
          urgency_reason: { type: 'string', description: 'Why this gap matters for this specific role' },
        },
        required: [
          'skill_name', 'gap_type', 'required_level', 'current_level',
          'recommendation', 'priority', 'learning_resources', 'urgency_reason',
        ],
      },
    },
    overall_assessment: { type: 'string' },
    transferable_skills: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: "Candidate's skill" },
          to: { type: 'string', description: 'Required skill' },
          adaptability: { type: 'string', description: 'How transferable is this skill' },
        },
        required: ['from', 'to', 'adaptability'],
      },
    },
  },
  required: ['gaps', 'overall_assessment', 'transferable_skills'],
} as const;

/**
 * Build the full prompt messages for gap analysis.
 *
 * @param candidateSkills - JSON-stringified extracted skills from Step 2.
 * @param requiredSkills - JSON-stringified required skills from the JD.
 * @param niceToHaveSkills - JSON-stringified nice-to-have skills from the JD.
 * @param semanticContext - Semantic match metadata for context.
 * @returns Array of chat messages to send to the model.
 */
export function buildGapAnalysisPrompt(
  candidateSkills: string,
  requiredSkills: string,
  niceToHaveSkills: string,
  semanticContext: {
    semanticScore: number;
    topMatches: string;
    weakestAreas: string;
  },
) {
  return [
    { role: 'system' as const, content: GAP_ANALYSIS_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `CANDIDATE SKILLS:\n${candidateSkills}

JOB REQUIRED SKILLS:\n${requiredSkills}

JOB NICE-TO-HAVE SKILLS:\n${niceToHaveSkills}

SEMANTIC MATCH CONTEXT:
- Overall similarity: ${semanticContext.semanticScore}
- Strongest skill overlap: ${semanticContext.topMatches}
- Weakest areas: ${semanticContext.weakestAreas}

Output valid JSON matching the required schema.

RULES:
${PRIORITY_SCORING_RULES}
2. Be SPECIFIC in recommendations. "Learn JavaScript" is bad. "Complete 'JavaScript: The Complete Guide' on Udemy, then build a portfolio project using TypeScript and Node.js" is good.
3. Identify transferable skills: a Python developer can learn Java faster than a non-programmer.
4. Do not be discouraging. Frame gaps as opportunities.
5. If a gap is about years of experience, acknowledge that years are an imperfect proxy.`,
    },
  ];
}
