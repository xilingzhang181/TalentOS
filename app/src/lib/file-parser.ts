/**
 * File Parser — PDF and DOCX extraction with section detection and quality scoring.
 *
 * Uses `pdf-parse` for PDF documents and `mammoth` for DOCX.
 * Includes heuristic section detection, text cleaning, and a confidence
 * score assessing extraction quality.
 */

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Detected resume sections keyed by section name. */
export type ResumeSection = Record<string, string>;

/** Metadata about the parsed document. */
export interface ParseMetadata {
  /** Number of words in extracted text. */
  word_count: number;
  /** Number of characters in extracted text. */
  character_count: number;
  /** Page count (PDF only, null for DOCX). */
  page_count: number | null;
  /** Which library performed the extraction. */
  parsing_method: 'pdf-parse' | 'mammoth';
  /** Quality confidence score 0.0-1.0. */
  confidence: number;
}

/** Result of parsing a document file. */
export interface ParseResult {
  /** Cleaned, full-text extraction. */
  raw_text: string;
  /** Heuristically detected sections. */
  sections: ResumeSection;
  /** Extraction metadata. */
  metadata: ParseMetadata;
  /** Non-fatal warnings (scanned PDF, low quality, etc.). */
  warnings: string[];
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Parse a PDF or DOCX file buffer into structured text.
 *
 * @param buffer  - Raw file bytes.
 * @param mimeType - MIME type string (must be PDF or DOCX).
 * @returns       - Parsed result with cleaned text, sections, and metadata.
 * @throws        - If the file type is unsupported, encrypted, or corrupt.
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<ParseResult> {
  const warnings: string[] = [];

  let rawText: string;
  let pageCount: number | null = null;
  let method: 'pdf-parse' | 'mammoth';

  // --- Dispatch to the correct parser ---
  if (mimeType === 'application/pdf') {
    const pdf = await parsePDF(buffer);
    rawText = pdf.text;
    pageCount = pdf.numpages;
    method = 'pdf-parse';
    warnings.push(...pdf.warnings);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    rawText = await parseDOCX(buffer);
    method = 'mammoth';
  } else {
    throw new Error(`Unsupported file type: ${mimeType}. Only PDF and DOCX are accepted.`);
  }

  // --- Clean extracted text ---
  const cleanedText = cleanText(rawText);

  // --- Guard: empty document ---
  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 10) {
    throw new Error('The document appears to be empty. Please upload a file with content.');
  }

  // --- Quality assessment ---
  const confidence = assessQuality(cleanedText);
  if (confidence < 0.3) {
    warnings.push(
      'Low-quality extraction. The file may be a scanned PDF or contain mostly images. ' +
      'Consider uploading a text-based PDF or DOCX.',
    );
  }

  // --- Section detection ---
  const sections = detectSections(cleanedText);

  return {
    raw_text: cleanedText,
    sections,
    metadata: {
      word_count: wordCount,
      character_count: cleanedText.length,
      page_count: pageCount,
      parsing_method: method,
      confidence,
    },
    warnings,
  };
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Parse PDF using pdf-parse v2 with error handling for encrypted and scanned documents.
 *
 * The v2 API uses a class-based parser: construct with `new PDFParse({ data })`,
 * call `getText()`, then `destroy()` to release resources.
 */
async function parsePDF(buffer: Buffer): Promise<{
  text: string;
  numpages: number | null;
  warnings: string[];
}> {
  const warnings: string[] = [];

  // pdf-parse v2 expects Uint8Array, not Node Buffer — convert explicitly
  const data = new Uint8Array(buffer);

  let parser: PDFParse;
  try {
    parser = new PDFParse({ data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.toLowerCase().includes('encrypted') || msg.toLowerCase().includes('password')) {
      throw new Error(
        'PDF is password-protected. Please upload an unprotected version.',
      );
    }
    throw new Error(`Failed to load PDF: ${msg}`);
  }

  try {
    const textResult = await parser.getText();
    const total = textResult.total; // total page count

    // Detect potential scanned / image-only PDF
    if (textResult.text.trim().length < 50 && total > 0) {
      warnings.push(
        'PDF appears to contain mostly images. ' +
        'Consider converting to a text-based PDF or uploading as DOCX.',
      );
    }

    return {
      text: textResult.text,
      numpages: total,
      warnings,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.toLowerCase().includes('encrypted') || msg.toLowerCase().includes('password')) {
      throw new Error(
        'PDF is password-protected. Please upload an unprotected version.',
      );
    }
    if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('corrupt')) {
      throw new Error(
        'The PDF file appears to be corrupted. Please re-export and try again.',
      );
    }

    throw new Error(`Failed to parse PDF: ${msg}`);
  } finally {
    // Always release the parser's internal document reference
    try { await parser.destroy(); } catch { /* ignore cleanup errors */ }
  }
}

/**
 * Parse DOCX using mammoth for clean text extraction.
 */
async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    // Log non-fatal warnings from mammoth
    const errors = result.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      console.warn('[file-parser] DOCX extraction warnings:', errors);
    }

    return result.value;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.toLowerCase().includes('corrupt') || msg.toLowerCase().includes('zip')) {
      throw new Error(
        'The DOCX file appears to be corrupted. Please re-save it from your word processor and try again.',
      );
    }

    throw new Error(
      'Failed to parse DOCX file. The file may be corrupted or not a valid DOCX.',
    );
  }
}

/**
 * Clean extracted text:
 * - Remove control characters (preserving newlines and tabs)
 * - Collapse multiple spaces
 * - Collapse 3+ consecutive newlines to double
 * - Trim each line
 */
function cleanText(text: string): string {
  return text
    // Remove control characters except \n \t \r
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse runs of spaces to a single space
    .replace(/ {2,}/g, ' ')
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Trim the whole string
    .trim();
}

/**
 * Assess extraction quality on a 0.0-1.0 scale.
 *
 * Factors: word count, presence of resume-like section headers,
 * contact info patterns (email, phone).
 */
function assessQuality(text: string): number {
  let score = 0.5; // baseline

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Length signals
  if (wordCount > 200) score += 0.15;
  if (wordCount > 500) score += 0.1;
  if (wordCount < 50) score -= 0.3;

  // Resume-like section patterns
  const sectionPatterns: RegExp[] = [
    /experience|employment|work history/i,
    /education/i,
    /skills?|technologies|competencies/i,
    /summary|objective|profile/i,
    /projects?/i,
    /certifications?|licenses/i,
  ];

  const matchCount = sectionPatterns.filter((p) => p.test(text)).length;
  score += matchCount * 0.05;

  // Contact info signals
  if (/[\w.+-]+@[\w.-]+\.\w{2,}/.test(text)) score += 0.1;
  if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) score += 0.05;

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Detect resume sections using heuristic header pattern matching.
 *
 * Scans for well-known section headers (case-insensitive) and collects
 * all text between consecutive headers.
 */
function detectSections(text: string): ResumeSection {
  const sections: ResumeSection = {};

  const sectionPatterns: Record<string, RegExp[]> = {
    contact: [/^(contact|personal)\s*(info|information)?\s*$/im],
    summary: [
      /^(summary|professional\s+summary|profile|objective|about\s+me)\s*$/im,
    ],
    experience: [
      /^(experience|work\s+experience|employment|work\s+history|professional\s+experience)\s*$/im,
    ],
    education: [/^(education|academic)\s*$/im],
    skills: [
      /^(skills?|technical\s+skills?|technologies|competencies|proficiencies)\s*$/im,
    ],
    projects: [/^(projects?|portfolio|side\s+projects?)\s*$/im],
    certifications: [
      /^(certifications?|licenses?|credentials?|awards?)\s*$/im,
    ],
    languages: [/^(languages?|foreign\s+languages?)\s*$/im],
  };

  const allPatterns = Object.values(sectionPatterns).flat();
  const lines = text.split('\n');

  for (const [sectionName, patterns] of Object.entries(sectionPatterns)) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isMatch = patterns.some((p) => p.test(line));

      if (isMatch) {
        const sectionLines: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          // Stop at next known section header
          if (nextLine.length > 0 && allPatterns.some((p) => p.test(nextLine))) {
            break;
          }
          sectionLines.push(lines[j]);
          j++;
        }
        sections[sectionName] = sectionLines.join('\n').trim();
        break; // Move on to the next section type
      }
    }
  }

  return sections;
}
