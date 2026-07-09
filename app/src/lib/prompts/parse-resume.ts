/**
 * Step 1: Resume Parsing Prompt
 *
 * Used as a fallback when heuristic section detection fails
 * (confidence < threshold). Sends raw resume text to GPT-4o-mini
 * for structured extraction.
 */

/** System message for the resume parser model. */
export const PARSE_RESUME_SYSTEM_PROMPT = `You are a resume parser. Given the raw text of a resume, extract structured information. You must only extract information that is explicitly present in the text. Never fabricate, infer, or hallucinate details.

Output valid JSON matching the schema provided. If a field is not found, set it to null or an empty array.`;

/** JSON schema the model must conform to (used as response_format). */
export const PARSE_RESUME_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    contact: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' },
        email: { type: ['string', 'null'] },
        phone: { type: ['string', 'null'] },
        location: { type: ['string', 'null'] },
        linkedin: { type: ['string', 'null'] },
        website: { type: ['string', 'null'] },
      },
      required: ['name', 'email', 'phone', 'location', 'linkedin', 'website'],
    },
    summary: { type: ['string', 'null'] },
    experience: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          location: { type: ['string', 'null'] },
          start_date: { type: 'string' },
          end_date: { type: ['string', 'null'] },
          description: { type: 'string' },
          bullets: { type: 'array' as const, items: { type: 'string' } },
        },
        required: ['title', 'company', 'location', 'start_date', 'end_date', 'description', 'bullets'],
      },
    },
    education: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          degree: { type: 'string' },
          institution: { type: 'string' },
          year: { type: ['string', 'null'] },
          details: { type: ['string', 'null'] },
        },
        required: ['degree', 'institution', 'year', 'details'],
      },
    },
    skills: { type: 'array' as const, items: { type: 'string' } },
    certifications: { type: 'array' as const, items: { type: 'string' } },
    languages: { type: 'array' as const, items: { type: 'string' } },
    projects: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          technologies: { type: 'array' as const, items: { type: 'string' } },
        },
        required: ['name', 'description', 'technologies'],
      },
    },
    metadata: {
      type: 'object' as const,
      properties: {
        word_count: { type: 'number' },
        section_count: { type: 'number' },
        parsing_confidence: { type: 'number' },
      },
      required: ['word_count', 'section_count', 'parsing_confidence'],
    },
  },
  required: ['contact', 'summary', 'experience', 'education', 'skills', 'certifications', 'languages', 'projects', 'metadata'],
} as const;

/**
 * Build the full prompt messages for resume parsing.
 * @param rawText - The extracted text from the resume file.
 * @returns Array of chat messages to send to the model.
 */
export function buildParseResumePrompt(rawText: string) {
  return [
    { role: 'system' as const, content: PARSE_RESUME_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `INPUT RESUME TEXT:\n\n${rawText}\n\nExtract structured information from the resume above. Output valid JSON matching the required schema.

RULES:
- If a field is not found, set it to null or empty array.
- Preserve original wording for descriptions and bullets.
- Normalize dates to "YYYY-MM" or "Present" format where possible.
- Do NOT invent information that is not in the resume text.`,
    },
  ];
}
