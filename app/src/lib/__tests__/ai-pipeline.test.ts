import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock OpenAI ────────────────────────────────────────────────────────────

const mockChatCreate = vi.fn();
const mockEmbeddingsCreate = vi.fn();

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: { completions: { create: mockChatCreate } },
      embeddings: { create: mockEmbeddingsCreate },
    })),
  };
});

// ─── Mock database module ───────────────────────────────────────────────────

const mockFindResumeById = vi.fn();
const mockUpdateResumeStatus = vi.fn();

vi.mock("../db", () => ({
  db: {},
  findResumeById: (...args: any[]) => mockFindResumeById(...args),
  updateResumeStatus: (...args: any[]) => mockUpdateResumeStatus(...args),
}));

// ─── Mock ai-clients to bypass singleton client creation ────────────────────

vi.mock("../ai-clients", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("../ai-clients");
  return {
    ...actual,
    // Override getOpenAIClient so it doesn't read process.env
    getOpenAIClient: vi.fn().mockReturnValue({
      chat: { completions: { create: mockChatCreate } },
      embeddings: { create: mockEmbeddingsCreate },
    }),
    // Keep real constants
    FAST_MODEL: actual.FAST_MODEL,
    REASONING_MODEL: actual.REASONING_MODEL,
    EMBEDDING_MODEL: actual.EMBEDDING_MODEL,
    STEP_COST_ESTIMATES: actual.STEP_COST_ESTIMATES,
    estimateCostForStep: actual.estimateCostForStep,
    generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
    chatCompletion: vi.fn(),
  };
});

// ─── Mock prompts (return trivial values) ───────────────────────────────────

vi.mock("../prompts/parse-resume", () => ({
  buildParseResumePrompt: vi.fn().mockReturnValue([{ role: "system", content: "parse" }]),
  PARSE_RESUME_RESPONSE_SCHEMA: {},
}));

vi.mock("../prompts/extract-skills", () => ({
  buildExtractSkillsPrompt: vi.fn().mockReturnValue([{ role: "system", content: "skills" }]),
  EXTRACT_SKILLS_RESPONSE_SCHEMA: {},
}));

vi.mock("../prompts/parse-jd", () => ({
  buildParseJdPrompt: vi.fn().mockReturnValue([{ role: "system", content: "jd" }]),
  PARSE_JD_RESPONSE_SCHEMA: {},
}));

vi.mock("../prompts/gap-analysis", () => ({
  buildGapAnalysisPrompt: vi.fn().mockReturnValue([{ role: "system", content: "gap" }]),
  GAP_ANALYSIS_RESPONSE_SCHEMA: {},
}));

vi.mock("../prompts/feedback", () => ({
  buildFeedbackPrompt: vi.fn().mockReturnValue([{ role: "system", content: "feedback" }]),
  FEEDBACK_RESPONSE_SCHEMA: {},
}));

vi.mock("../prompts/rewrite", () => ({
  buildRewritePrompt: vi.fn().mockReturnValue([{ role: "system", content: "rewrite" }]),
  REWRITE_RESPONSE_SCHEMA: {},
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("ai-pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: resume exists with raw text
    mockFindResumeById.mockResolvedValue({
      id: "resume-123",
      rawText: "John Doe\njohn@example.com\n\nExperience\nEngineer at Acme\nSkills\nTypeScript Python",
    });

    mockUpdateResumeStatus.mockResolvedValue(undefined);
  });

  // ── Pipeline Steps ───────────────────────────────────────────────────

  describe("Step 1: Parse Resume", () => {
    it("calls findResumeById with the resume ID", async () => {
      const { runAnalysisPipeline } = await import("../ai-pipeline");

      mockChatCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"skills":[]}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
        model: "gpt-4o-mini",
      });

      // The pipeline does local parsing for Step 1, so chat won't be called for parse
      // We just need to verify the resume was fetched
      await runAnalysisPipeline("resume-123", "Some JD text");

      expect(mockFindResumeById).toHaveBeenCalledWith("resume-123");
    });

    it("returns error step when resume is not found", async () => {
      mockFindResumeById.mockResolvedValueOnce(null);

      const { runAnalysisPipeline } = await import("../ai-pipeline");
      const result = await runAnalysisPipeline("nonexistent", "Some JD");

      expect(result.steps.parse.status).toBe("error");
      expect(result.steps.parse.error).toContain("Resume not found");
    });
  });

  describe("Step 2: Extract Skills", () => {
    it("calls chatCompletion for skill extraction", async () => {
      const { runAnalysisPipeline, chatCompletion } = await import("../ai-pipeline");

      vi.mocked(chatCompletion).mockResolvedValueOnce({
        content: JSON.stringify({ skills: [] }),
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
        cost_usd: 0.001,
        model: "gpt-4o-mini",
      });

      await runAnalysisPipeline("resume-123", "JD text");

      // chatCompletion should have been called for extract_skills and jd_parse at minimum
      expect(chatCompletion).toHaveBeenCalled();
    });
  });

  // ── Error Handling ───────────────────────────────────────────────────

  describe("error handling", () => {
    it("handles API failures gracefully with partial results", async () => {
      const { runAnalysisPipeline, chatCompletion } = await import("../ai-pipeline");

      vi.mocked(chatCompletion).mockRejectedValue(new Error("API rate limit exceeded"));

      const result = await runAnalysisPipeline("resume-123", "JD text");

      // Pipeline should complete with partial results, not throw
      expect(result).toBeDefined();
      expect(result.resume_id).toBe("resume-123");
      expect(result.steps.parse.status).toBe("success"); // local step succeeds
    });

    it("stops pipeline when Step 1 fails", async () => {
      mockFindResumeById.mockResolvedValueOnce(null);

      const { runAnalysisPipeline } = await import("../ai-pipeline");
      const result = await runAnalysisPipeline("resume-123", "JD text");

      expect(result.steps.parse.status).toBe("error");
      // Subsequent steps should not exist
      expect(result.steps.extract_skills).toBeUndefined();
    });
  });

  // ── Cost Calculation ─────────────────────────────────────────────────

  describe("cost calculation", () => {
    it("tracks total_cost_cents in the pipeline result", async () => {
      const { runAnalysisPipeline, chatCompletion } = await import("../ai-pipeline");

      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ skills: [] }),
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
        cost_usd: 0.01,
        model: "gpt-4o-mini",
      });

      const result = await runAnalysisPipeline("resume-123", "JD text");

      expect(typeof result.total_cost_cents).toBe("number");
      expect(result.total_cost_cents).toBeGreaterThanOrEqual(0);
    });

    it("records time_ms for each step", async () => {
      const { runAnalysisPipeline, chatCompletion } = await import("../ai-pipeline");

      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ skills: [] }),
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
        cost_usd: 0.001,
        model: "gpt-4o-mini",
      });

      const result = await runAnalysisPipeline("resume-123", "JD text");

      expect(result.steps.parse.time_ms).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Embedding Generation ─────────────────────────────────────────────

  describe("embedding generation", () => {
    it("generates embeddings for both resume and JD text", async () => {
      const { runAnalysisPipeline, generateEmbedding, chatCompletion } = await import("../ai-pipeline");

      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ skills: [] }),
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
        cost_usd: 0.001,
        model: "gpt-4o-mini",
      });

      await runAnalysisPipeline("resume-123", "JD text");

      expect(generateEmbedding).toHaveBeenCalledTimes(2);
    });

    it("returns embedding steps with 1536-dimension vectors", async () => {
      const { runAnalysisPipeline, chatCompletion } = await import("../ai-pipeline");

      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ skills: [] }),
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
        cost_usd: 0.001,
        model: "gpt-4o-mini",
      });

      const result = await runAnalysisPipeline("resume-123", "JD text");

      expect(result.steps.embedding_resume.status).toBe("success");
      expect(result.steps.embedding_resume.data?.embedding).toHaveLength(1536);
    });
  });

  // ── Graceful Degradation ─────────────────────────────────────────────

  describe("graceful degradation", () => {
    it("continues pipeline when a non-critical step fails", async () => {
      const { runAnalysisPipeline, chatCompletion } = await import("../ai-pipeline");

      // First call (extract_skills) succeeds, second (jd_parse) fails, rest fail too
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({ skills: [] }),
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
          cost_usd: 0.001,
          model: "gpt-4o-mini",
        })
        .mockRejectedValueOnce(new Error("API timeout"))
        .mockRejectedValue(new Error("API unavailable"));

      const result = await runAnalysisPipeline("resume-123", "JD text");

      // Parse step succeeds (local), extract_skills succeeds
      expect(result.steps.parse.status).toBe("success");
      expect(result.steps.extract_skills.status).toBe("success");
      // jd_parse fails
      expect(result.steps.jd_parse.status).toBe("error");
      // Pipeline still returns a result object
      expect(result.resume_id).toBe("resume-123");
    });
  });

  // ── Pipeline Result Structure ────────────────────────────────────────

  describe("pipeline result structure", () => {
    it("includes resume_id, total_cost_cents, and total_time_ms", async () => {
      const { runAnalysisPipeline, chatCompletion } = await import("../ai-pipeline");

      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ skills: [] }),
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
        cost_usd: 0.001,
        model: "gpt-4o-mini",
      });

      const result = await runAnalysisPipeline("resume-123", "JD text");

      expect(result).toHaveProperty("resume_id", "resume-123");
      expect(result).toHaveProperty("total_cost_cents");
      expect(result).toHaveProperty("total_time_ms");
      expect(result).toHaveProperty("steps");
    });
  });
});
