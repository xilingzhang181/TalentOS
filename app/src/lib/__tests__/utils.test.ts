import { describe, it, expect } from "vitest";
import { cn, formatScore, formatDate, truncate, scoreStrokeColor } from "../utils";

// ─── cn() ───────────────────────────────────────────────────────────────────

describe("cn", () => {
  it("joins multiple class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("returns empty string for no truthy args", () => {
    expect(cn(false, undefined, null)).toBe("");
  });

  it("handles a single class", () => {
    expect(cn("single")).toBe("single");
  });

  it("handles empty string arguments", () => {
    // empty strings are falsy and should be filtered
    expect(cn("a", "", "b")).toBe("a b");
  });
});

// ─── formatScore() ──────────────────────────────────────────────────────────

describe("formatScore", () => {
  it("returns green band for scores >= 80", () => {
    const result = formatScore(85);
    expect(result.band).toBe("green");
    expect(result.label).toBe("强匹配");
  });

  it("returns yellow band for scores 60-79", () => {
    const result = formatScore(70);
    expect(result.band).toBe("yellow");
    expect(result.label).toBe("较好匹配");
  });

  it("returns orange band for scores 40-59", () => {
    const result = formatScore(50);
    expect(result.band).toBe("orange");
    expect(result.label).toBe("一般匹配");
  });

  it("returns red band for scores < 40", () => {
    const result = formatScore(20);
    expect(result.band).toBe("red");
    expect(result.label).toBe("匹配度低");
  });

  it("clamps score above 100 to 100", () => {
    const result = formatScore(150);
    expect(result.band).toBe("green");
  });

  it("clamps negative scores to 0", () => {
    const result = formatScore(-10);
    expect(result.band).toBe("red");
  });

  it("rounds fractional scores", () => {
    const result = formatScore(79.6);
    expect(result.band).toBe("green"); // rounds to 80
  });

  it("includes color and bg classes", () => {
    const result = formatScore(90);
    expect(result.textClass).toContain("emerald");
    expect(result.bgClass).toContain("emerald");
  });
});

// ─── formatDate() ───────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats an ISO date string to Chinese format", () => {
    expect(formatDate("2025-03-15")).toBe("2025年3月15日");
  });

  it("formats full ISO datetime", () => {
    expect(formatDate("2024-12-01T10:30:00Z")).toContain("2024年");
  });

  it("returns original string for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("does not add leading zeros to month/day", () => {
    const result = formatDate("2025-01-09");
    expect(result).toBe("2025年1月9日");
  });
});

// ─── truncate() ─────────────────────────────────────────────────────────────

describe("truncate", () => {
  it("returns original text when within maxLength", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends ellipsis when exceeding maxLength", () => {
    const result = truncate("hello world", 5);
    expect(result.length).toBeLessThanOrEqual(8); // "hello..."
    expect(result).toContain("...");
  });

  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });

  it("handles exact maxLength", () => {
    expect(truncate("abcde", 5)).toBe("abcde");
  });

  it("trims trailing whitespace before ellipsis", () => {
    const result = truncate("hello  world", 6);
    expect(result).not.toMatch(/ $/); // no trailing space before ...
  });
});

// ─── scoreStrokeColor() ─────────────────────────────────────────────────────

describe("scoreStrokeColor", () => {
  it("returns emerald for scores >= 80", () => {
    expect(scoreStrokeColor(85)).toBe("#10b981");
  });

  it("returns amber for scores 60-79", () => {
    expect(scoreStrokeColor(70)).toBe("#f59e0b");
  });

  it("returns orange for scores 40-59", () => {
    expect(scoreStrokeColor(50)).toBe("#f97316");
  });

  it("returns red for scores < 40", () => {
    expect(scoreStrokeColor(20)).toBe("#ef4444");
  });

  it("returns emerald at exactly 80", () => {
    expect(scoreStrokeColor(80)).toBe("#10b981");
  });

  it("returns red at exactly 0", () => {
    expect(scoreStrokeColor(0)).toBe("#ef4444");
  });
});
