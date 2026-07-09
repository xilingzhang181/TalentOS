import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ParseMetadata } from "../file-parser";

// ─── Mock external modules ──────────────────────────────────────────────────

vi.mock("pdf-parse", () => {
  return {
    PDFParse: vi.fn().mockImplementation(() => ({
      getText: vi.fn().mockResolvedValue({
        text: "John Doe\njohn@example.com\n\nExperience\nSoftware Engineer at Acme Corp\n- Built REST APIs\n- Led team of 5\n\nEducation\nBS Computer Science MIT\n\nSkills\nTypeScript Python React Node.js",
        total: 1,
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("mammoth", () => {
  return {
    default: {
      extractRawText: vi.fn().mockResolvedValue({
        value: "Jane Smith\njane@example.com\n\nExperience\nSenior Developer at TechCo\n- Built scalable systems\n\nSkills\nJava Spring Boot AWS",
        messages: [],
      }),
    },
  };
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("file-parser", () => {
  let parseDocument: typeof import("../file-parser").parseDocument;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../file-parser");
    parseDocument = mod.parseDocument;
  });

  // ── PDF Parsing ───────────────────────────────────────────────────────

  describe("PDF parsing", () => {
    it("parses a valid PDF buffer and returns structured result", async () => {
      const buffer = Buffer.from("fake pdf content");
      const result = await parseDocument(buffer, "application/pdf");

      expect(result.raw_text).toContain("John Doe");
      expect(result.raw_text).toContain("john@example.com");
      expect(result.metadata.parsing_method).toBe("pdf-parse");
      expect(result.metadata.page_count).toBe(1);
      expect(result.metadata.word_count).toBeGreaterThan(10);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("detects sections from parsed PDF text", async () => {
      const buffer = Buffer.from("fake pdf content");
      const result = await parseDocument(buffer, "application/pdf");

      expect(result.sections).toBeDefined();
      // Should detect at least experience and skills sections
      const sectionKeys = Object.keys(result.sections);
      expect(sectionKeys.length).toBeGreaterThan(0);
    });
  });

  // ── DOCX Parsing ─────────────────────────────────────────────────────

  describe("DOCX parsing", () => {
    it("parses a valid DOCX buffer", async () => {
      const buffer = Buffer.from("fake docx content");
      const result = await parseDocument(
        buffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      expect(result.raw_text).toContain("Jane Smith");
      expect(result.metadata.parsing_method).toBe("mammoth");
      expect(result.metadata.page_count).toBeNull();
    });
  });

  // ── Text Cleaning ────────────────────────────────────────────────────

  describe("text cleaning", () => {
    it("removes control characters while preserving newlines", async () => {
      // The pdf-parse mock returns clean text; verify cleaning runs
      const buffer = Buffer.from("fake pdf");
      const result = await parseDocument(buffer, "application/pdf");

      // Cleaned text should not contain control characters
      // eslint-disable-next-line no-control-regex
      expect(result.raw_text).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
    });

    it("collapses multiple spaces into one", async () => {
      const buffer = Buffer.from("fake pdf");
      const result = await parseDocument(buffer, "application/pdf");

      // No double spaces should remain
      expect(result.raw_text).not.toMatch(/  /);
    });

    it("trims leading and trailing whitespace", async () => {
      const buffer = Buffer.from("fake pdf");
      const result = await parseDocument(buffer, "application/pdf");

      expect(result.raw_text).not.toMatch(/^\s/);
      expect(result.raw_text).not.toMatch(/\s$/);
    });
  });

  // ── Section Detection ────────────────────────────────────────────────

  describe("section detection", () => {
    it("detects the experience section", async () => {
      const buffer = Buffer.from("fake pdf");
      const result = await parseDocument(buffer, "application/pdf");

      expect(result.sections).toHaveProperty("experience");
      expect(result.sections.experience).toContain("Acme Corp");
    });

    it("detects the skills section", async () => {
      const buffer = Buffer.from("fake pdf");
      const result = await parseDocument(buffer, "application/pdf");

      expect(result.sections).toHaveProperty("skills");
    });
  });

  // ── Quality Assessment ───────────────────────────────────────────────

  describe("quality assessment", () => {
    it("returns a confidence score between 0 and 1", async () => {
      const buffer = Buffer.from("fake pdf");
      const result = await parseDocument(buffer, "application/pdf");

      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata.confidence).toBeLessThanOrEqual(1);
    });

    it("gives higher confidence to documents with resume-like sections", async () => {
      const buffer = Buffer.from("fake pdf");
      const result = await parseDocument(buffer, "application/pdf");

      // The mock text contains Experience, Education, Skills — should score well
      expect(result.metadata.confidence).toBeGreaterThan(0.5);
    });
  });

  // ── Error Handling ───────────────────────────────────────────────────

  describe("error handling", () => {
    it("throws on unsupported file type", async () => {
      const buffer = Buffer.from("image content");
      await expect(
        parseDocument(buffer, "image/png"),
      ).rejects.toThrow("Unsupported file type");
    });

    it("throws for image/jpeg MIME type", async () => {
      const buffer = Buffer.from("image content");
      await expect(
        parseDocument(buffer, "image/jpeg"),
      ).rejects.toThrow("Only PDF and DOCX are accepted");
    });
  });

  // ── Empty Document Handling ──────────────────────────────────────────

  describe("empty document handling", () => {
    it("throws for documents with too few words", async () => {
      // Override the mock to return very little text
      const { PDFParse } = await import("pdf-parse");
      const mockInstance = {
        getText: vi.fn().mockResolvedValue({ text: "hi", total: 1 }),
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(PDFParse).mockImplementationOnce(() => mockInstance as any);

      const buffer = Buffer.from("almost empty pdf");
      await expect(
        parseDocument(buffer, "application/pdf"),
      ).rejects.toThrow("appears to be empty");
    });
  });

  // ── Metadata ─────────────────────────────────────────────────────────

  describe("metadata", () => {
    it("includes word_count and character_count", async () => {
      const buffer = Buffer.from("fake pdf");
      const result = await parseDocument(buffer, "application/pdf");

      expect(typeof result.metadata.word_count).toBe("number");
      expect(typeof result.metadata.character_count).toBe("number");
      expect(result.metadata.word_count).toBeGreaterThan(0);
      expect(result.metadata.character_count).toBeGreaterThan(0);
    });
  });
});
