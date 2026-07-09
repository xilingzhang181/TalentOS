"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DiffLine {
  /** Line content (without the +/- prefix). */
  text: string;
  /** 1 = added, -1 = removed, 0 = unchanged. */
  type: 1 | -1 | 0;
}

export interface DiffViewProps {
  /** Original text. */
  original: string;
  /** Rewritten text. */
  rewritten: string;
  /** Show line numbers. Default true. */
  showLineNumbers?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  LCS-based simple diff                                              */
/* ------------------------------------------------------------------ */

/**
 * Compute a simple line-by-line diff using Longest Common Subsequence.
 * Returns DiffLine[] with type: 1 (added), -1 (removed), 0 (unchanged).
 */
function computeDiff(original: string, rewritten: string): DiffLine[] {
  const origLines = original.split("\n");
  const rewLines = rewritten.split("\n");

  // LCS table
  const m = origLines.length;
  const n = rewLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0) as number[],
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === rewLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === rewLines[j - 1]) {
      result.unshift({ text: origLines[i - 1], type: 0 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ text: rewLines[j - 1], type: 1 });
      j--;
    } else {
      result.unshift({ text: origLines[i - 1], type: -1 });
      i--;
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function DiffView({
  original,
  rewritten,
  showLineNumbers = true,
  className,
}: DiffViewProps) {
  const lines = useMemo(() => computeDiff(original, rewritten), [original, rewritten]);

  // Compute line numbers for original and rewritten
  let origLineNum = 0;
  let rewLineNum = 0;

  const numberedLines = lines.map((line) => {
    let left: number | null = null;
    let right: number | null = null;

    if (line.type === 0) {
      origLineNum++;
      rewLineNum++;
      left = origLineNum;
      right = rewLineNum;
    } else if (line.type === -1) {
      origLineNum++;
      left = origLineNum;
    } else {
      rewLineNum++;
      right = rewLineNum;
    }

    return { ...line, left, right };
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-gray-200 bg-gray-900 text-sm font-mono",
        className,
      )}
      role="region"
      aria-label="差异视图"
    >
      {/* Header */}
      <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
        <span className="text-xs font-medium text-gray-400">
          统一差异视图
        </span>
        <div className="ml-auto flex gap-4 text-xs text-gray-500">
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500" />
            新增
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />
            删除
          </span>
        </div>
      </div>

      {/* Lines */}
      <div className="max-h-96 overflow-auto">
        {numberedLines.map((line, idx) => {
          const isAdd = line.type === 1;
          const isRemove = line.type === -1;
          const isContext = line.type === 0;

          return (
            <div
              key={idx}
              className={cn(
                "flex border-b border-gray-800 last:border-b-0",
                isAdd && "bg-green-900/20",
                isRemove && "bg-red-900/20",
                isContext && "bg-transparent",
              )}
            >
              {/* Line numbers */}
              {showLineNumbers && (
                <>
                  {/* Left (original) line number */}
                  <span
                    className={cn(
                      "w-12 shrink-0 select-none text-right pr-1 py-0.5 text-[11px] leading-5",
                      isRemove ? "text-red-400/70" : "text-gray-500",
                    )}
                    aria-hidden="true"
                  >
                    {line.left ?? ""}
                  </span>
                  {/* Right (rewritten) line number */}
                  <span
                    className={cn(
                      "w-12 shrink-0 select-none text-right pr-1 py-0.5 text-[11px] leading-5",
                      isAdd ? "text-green-400/70" : "text-gray-500",
                    )}
                    aria-hidden="true"
                  >
                    {line.right ?? ""}
                  </span>
                </>
              )}

              {/* Sign column */}
              <span
                className={cn(
                  "w-6 shrink-0 select-none py-0.5 text-center text-[11px] leading-5 font-bold",
                  isAdd && "text-green-400",
                  isRemove && "text-red-400",
                  isContext && "text-gray-600",
                )}
                aria-hidden="true"
              >
                {isAdd ? "+" : isRemove ? "-" : " "}
              </span>

              {/* Content */}
              <span
                className={cn(
                  "flex-1 whitespace-pre-wrap break-all py-0.5 pr-4 text-[13px] leading-5",
                  isAdd && "text-green-300",
                  isRemove && "text-red-300 line-through",
                  isContext && "text-gray-300",
                )}
              >
                {line.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

DiffView.displayName = "DiffView";

export { DiffView };
