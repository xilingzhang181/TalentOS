/* ------------------------------------------------------------------ */
/*  Utility helpers — class merging, formatting, misc                  */
/* ------------------------------------------------------------------ */

/**
 * Merge class-name strings, dropping falsy / undefined values.
 * Lightweight replacement for clsx + tailwind-merge — enough for
 * this project's needs without adding extra dependencies.
 */
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  Score helpers                                                      */
/* ------------------------------------------------------------------ */

type ScoreBand = "green" | "yellow" | "orange" | "red";

export interface ScoreInfo {
  band: ScoreBand;
  label: string;
  colorClasses: string;
  /** Tailwind text colour */
  textClass: string;
  /** Tailwind bg colour */
  bgClass: string;
}

/** Return display info for a 0-100 match score. */
export function formatScore(score: number): ScoreInfo {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));

  if (clamped >= 80) {
    return {
      band: "green",
      label: "强匹配",
      colorClasses: "text-emerald-600",
      textClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
    };
  }
  if (clamped >= 60) {
    return {
      band: "yellow",
      label: "较好匹配",
      colorClasses: "text-amber-500",
      textClass: "text-amber-500",
      bgClass: "bg-amber-50",
    };
  }
  if (clamped >= 40) {
    return {
      band: "orange",
      label: "一般匹配",
      colorClasses: "text-orange-500",
      textClass: "text-orange-500",
      bgClass: "bg-orange-50",
    };
  }
  return {
    band: "red",
    label: "匹配度低",
    colorClasses: "text-red-500",
    textClass: "text-red-500",
    bgClass: "bg-red-50",
  };
}

/** CSS stroke colour for the circular SVG gauge. */
export function scoreStrokeColor(score: number): string {
  if (score >= 80) return "#10b981"; // emerald-500
  if (score >= 60) return "#f59e0b"; // amber-500
  if (score >= 40) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */

/** Format an ISO date string into a Chinese-friendly display. */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return dateStr;
  }
}

/** Truncate text and append an ellipsis when exceeding maxLength. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

/** Async sleep helper (useful for polling). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/*  Level dots                                                         */
/* ------------------------------------------------------------------ */

/** Return the number of filled dots for a 1-5 proficiency level. */
export function levelDots(level: number): { filled: number; empty: number } {
  const filled = Math.min(5, Math.max(0, Math.round(level)));
  return { filled, empty: 5 - filled };
}
