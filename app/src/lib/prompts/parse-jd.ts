/**
 * Step 3: Job Description Parsing Prompt
 *
 * Parses raw JD text into structured requirements, nice-to-haves,
 * responsibilities, and company metadata.
 */

/** System message for the JD parser model. */
export const PARSE_JD_SYSTEM_PROMPT = `You are a job description analyst. Parse the following job description into structured requirements.

Distinguish STRICTLY between "required" and "nice-to-have" sections.
If the JD does not separate them, infer from language:
- Required: "must have", "required", "experience with", "proficient in"
- Nice-to-have: "preferred", "bonus", "nice to have", "plus", "familiarity with"

Canonicalize skill names to industry-standard names (e.g., "K8s" -> "Kubernetes", "JS" -> "JavaScript").
If salary is not provided, set to null -- do NOT estimate.
Extract company tech stack from the JD if mentioned.`;

/** JSON schema the model must conform to. */
export const PARSE_JD_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' },
    company: { type: ['string', 'null'] },
    location: { type: ['string', 'null'] },
    remote_policy: {
      type: 'string' as const,
      enum: ['remote', 'hybrid', 'onsite', 'unknown'],
    },
    salary_range: {
      type: 'object' as const,
      properties: {
        min: { type: ['number', 'null'] },
        max: { type: ['number', 'null'] },
        currency: { type: 'string' },
        period: { type: 'string' },
      },
      required: ['min', 'max', 'currency', 'period'],
    },
    required_skills: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' },
          category: {
            type: 'string' as const,
            enum: ['technical', 'tool', 'framework', 'methodology', 'soft_skill', 'certification'],
          },
          required_level: { type: 'number', minimum: 1, maximum: 5 },
          context: { type: 'string', description: 'How this skill is used in the role' },
        },
        required: ['name', 'category', 'required_level', 'context'],
      },
    },
    nice_to_have_skills: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' },
          category: {
            type: 'string' as const,
            enum: ['technical', 'tool', 'framework', 'methodology', 'soft_skill', 'certification'],
          },
          preferred_level: { type: 'number', minimum: 1, maximum: 5 },
          context: { type: 'string', description: 'Why this is preferred' },
        },
        required: ['name', 'category', 'preferred_level', 'context'],
      },
    },
    responsibilities: { type: 'array' as const, items: { type: 'string' } },
    qualifications: {
      type: 'object' as const,
      properties: {
        education: { type: 'array' as const, items: { type: 'string' } },
        experience_years: { type: ['number', 'null'] },
        other: { type: 'array' as const, items: { type: 'string' } },
      },
      required: ['education', 'experience_years', 'other'],
    },
    company_info: {
      type: 'object' as const,
      properties: {
        industry: { type: ['string', 'null'] },
        size: { type: ['string', 'null'] },
        tech_stack: { type: 'array' as const, items: { type: 'string' } },
      },
      required: ['industry', 'size', 'tech_stack'],
    },
    parsing_confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: [
    'title', 'company', 'location', 'remote_policy', 'salary_range',
    'required_skills', 'nice_to_have_skills', 'responsibilities',
    'qualifications', 'company_info', 'parsing_confidence',
  ],
} as const;

/**
 * Build the full prompt messages for JD parsing.
 * @param rawJdText - The raw job description text.
 * @returns Array of chat messages to send to the model.
 */
export function buildParseJdPrompt(rawJdText: string) {
  return [
    { role: 'system' as const, content: PARSE_JD_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `JOB DESCRIPTION:\n\n${rawJdText}\n\nParse the job description above. Output valid JSON matching the required schema.`,
    },
  ];
}
