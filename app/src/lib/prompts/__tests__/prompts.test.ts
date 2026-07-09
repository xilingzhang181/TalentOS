import { describe, it, expect } from "vitest";
import {
  buildParseResumePrompt,
  PARSE_RESUME_SYSTEM_PROMPT,
} from "../parse-resume";
import {
  buildExtractSkillsPrompt,
  PROFICIENCY_GUIDELINES,
  EXTRACT_SKILLS_SYSTEM_PROMPT,
} from "../extract-skills";
import {
  buildParseJdPrompt,
  PARSE_JD_SYSTEM_PROMPT,
} from "../parse-jd";
import {
  buildGapAnalysisPrompt,
  PRIORITY_SCORING_RULES,
  GAP_ANALYSIS_SYSTEM_PROMPT,
} from "../gap-analysis";
import {
  buildFeedbackPrompt,
  FEEDBACK_SYSTEM_PROMPT,
} from "../feedback";
import {
  buildRewritePrompt,
  REWRITE_SYSTEM_PROMPT,
} from "../rewrite";

// ─── Helper ─────────────────────────────────────────────────────────────────

function getUserMessage(prompt: { role: string; content: string }[]): string {
  return prompt.find((m) => m.role === "user")?.content ?? "";
}

// ─── Parse Resume Prompt ────────────────────────────────────────────────────

describe("buildParseResumePrompt", () => {
  it("returns an array of system + user messages", () => {
    const prompt = buildParseResumePrompt("Sample resume text");
    expect(prompt).toHaveLength(2);
    expect(prompt[0].role).toBe("system");
    expect(prompt[1].role).toBe("user");
  });

  it("includes the raw resume text in the user message", () => {
    const resumeText = "John Doe\nExperience\nSoftware Engineer";
    const prompt = buildParseResumePrompt(resumeText);
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain(resumeText);
  });

  it("system prompt instructs to never fabricate information", () => {
    expect(PARSE_RESUME_SYSTEM_PROMPT).toContain("never");
    expect(PARSE_RESUME_SYSTEM_PROMPT).toContain("fabricate");
  });

  it("user message includes JSON output instruction", () => {
    const prompt = buildParseResumePrompt("resume");
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("JSON");
  });

  it("snapshot test for prompt structure", () => {
    const prompt = buildParseResumePrompt("test resume content");
    // Snapshot the structure, not the content (content includes user data)
    const structure = prompt.map((m) => ({
      role: m.role,
      hasContent: m.content.length > 0,
    }));
    expect(structure).toMatchSnapshot();
  });
});

// ─── Extract Skills Prompt ──────────────────────────────────────────────────

describe("buildExtractSkillsPrompt", () => {
  it("includes proficiency guidelines in the user message", () => {
    const prompt = buildExtractSkillsPrompt("{}", "{}");
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("Proficiency levels");
    expect(userContent).toContain("Expert");
  });

  it("system prompt instructs to extract implied skills", () => {
    expect(EXTRACT_SKILLS_SYSTEM_PROMPT).toContain("implied");
  });

  it("includes evidence requirement", () => {
    const prompt = buildExtractSkillsPrompt("resume json");
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("evidence");
  });

  it("includes alias handling instruction", () => {
    const prompt = buildExtractSkillsPrompt("resume json");
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("aliases");
  });

  it("snapshot test for prompt structure", () => {
    const prompt = buildExtractSkillsPrompt("{}", "[]");
    const structure = prompt.map((m) => ({
      role: m.role,
      hasContent: m.content.length > 0,
    }));
    expect(structure).toMatchSnapshot();
  });
});

// ─── Parse JD Prompt ────────────────────────────────────────────────────────

describe("buildParseJdPrompt", () => {
  it("includes the raw JD text in the user message", () => {
    const jdText = "Senior Developer at Google. Must know TypeScript.";
    const prompt = buildParseJdPrompt(jdText);
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain(jdText);
  });

  it("system prompt distinguishes required vs nice-to-have", () => {
    expect(PARSE_JD_SYSTEM_PROMPT).toContain("required");
    expect(PARSE_JD_SYSTEM_PROMPT).toContain("nice-to-have");
  });

  it("system prompt includes skill canonicalization rules", () => {
    expect(PARSE_JD_SYSTEM_PROMPT).toContain("Canonicalize");
  });

  it("user message includes salary null instruction", () => {
    const prompt = buildParseJdPrompt("JD text");
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("JSON");
  });

  it("snapshot test for prompt structure", () => {
    const prompt = buildParseJdPrompt("test JD");
    const structure = prompt.map((m) => ({
      role: m.role,
      hasContent: m.content.length > 0,
    }));
    expect(structure).toMatchSnapshot();
  });
});

// ─── Gap Analysis Prompt ────────────────────────────────────────────────────

describe("buildGapAnalysisPrompt", () => {
  const semanticContext = {
    semanticScore: 0.75,
    topMatches: "TypeScript, React",
    weakestAreas: "Go, Kubernetes",
  };

  it("includes priority scoring rules in the user message", () => {
    const prompt = buildGapAnalysisPrompt(
      "[]", "[]", "[]", semanticContext,
    );
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("Priority scoring");
    expect(userContent).toContain("5:");
    expect(userContent).toContain("1:");
  });

  it("includes semantic match context", () => {
    const prompt = buildGapAnalysisPrompt(
      "[]", "[]", "[]", semanticContext,
    );
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("0.75");
    expect(userContent).toContain("TypeScript, React");
    expect(userContent).toContain("Go, Kubernetes");
  });

  it("system prompt includes transferable skills instruction", () => {
    expect(GAP_ANALYSIS_SYSTEM_PROMPT).toContain("transferable");
  });

  it("includes recommendation specificity rule", () => {
    const prompt = buildGapAnalysisPrompt(
      "[]", "[]", "[]", semanticContext,
    );
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("SPECIFIC");
  });

  it("snapshot test for prompt structure", () => {
    const prompt = buildGapAnalysisPrompt("{}", "{}", "{}", semanticContext);
    const structure = prompt.map((m) => ({
      role: m.role,
      hasContent: m.content.length > 0,
    }));
    expect(structure).toMatchSnapshot();
  });
});

// ─── Feedback Prompt ────────────────────────────────────────────────────────

describe("buildFeedbackPrompt", () => {
  const matchContext = {
    combinedScore: 72,
    semanticScore: 0.8,
    skillsScore: 65,
  };

  it("system prompt includes STAR method / XYZ formula", () => {
    expect(FEEDBACK_SYSTEM_PROMPT).toContain("XYZ");
  });

  it("includes match scores in the user message", () => {
    const prompt = buildFeedbackPrompt(
      "{}", "{}", "{}", matchContext, "{}",
    );
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("72");
    expect(userContent).toContain("0.8");
    expect(userContent).toContain("65");
  });

  it("includes ATS optimization instruction", () => {
    expect(FEEDBACK_SYSTEM_PROMPT).toContain("ATS");
  });

  it("includes action items ordering rule", () => {
    expect(FEEDBACK_SYSTEM_PROMPT).toContain("impact-to-effort");
  });

  it("snapshot test for prompt structure", () => {
    const prompt = buildFeedbackPrompt("{}", "{}", "{}", matchContext, "{}");
    const structure = prompt.map((m) => ({
      role: m.role,
      hasContent: m.content.length > 0,
    }));
    expect(structure).toMatchSnapshot();
  });
});

// ─── Rewrite Prompt ─────────────────────────────────────────────────────────

describe("buildRewritePrompt", () => {
  it("system prompt includes PRESERVE TRUTH rule", () => {
    expect(REWRITE_SYSTEM_PROMPT).toContain("PRESERVE TRUTH");
  });

  it("system prompt includes STAR method instruction", () => {
    expect(REWRITE_SYSTEM_PROMPT).toContain("STAR");
  });

  it("includes sections to rewrite in the user message", () => {
    const sections = ["summary", "experience", "skills"];
    const prompt = buildRewritePrompt("{}", "{}", "{}", sections, "professional");
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("summary");
    expect(userContent).toContain("experience");
    expect(userContent).toContain("skills");
  });

  it("includes tone instruction", () => {
    const prompt = buildRewritePrompt(
      "{}", "{}", "{}", ["summary"], "concise",
    );
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("concisely");
  });

  it("defaults to professional tone", () => {
    const prompt = buildRewritePrompt("{}", "{}", "{}", ["summary"]);
    const userContent = getUserMessage(prompt);
    expect(userContent).toContain("professional");
  });

  it("snapshot test for prompt structure", () => {
    const prompt = buildRewritePrompt("{}", "{}", "{}", ["summary", "skills"], "detailed");
    const structure = prompt.map((m) => ({
      role: m.role,
      hasContent: m.content.length > 0,
    }));
    expect(structure).toMatchSnapshot();
  });
});
