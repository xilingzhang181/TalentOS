"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Base skeleton block                                                */
/* ------------------------------------------------------------------ */

function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-gray-200",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  FullPageLoader                                                     */
/* ------------------------------------------------------------------ */

interface FullPageLoaderProps {
  /** Message shown below the spinner. */
  message?: string;
  className?: string;
}

function FullPageLoader({ message, className }: FullPageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center py-24",
        className,
      )}
    >
      <svg
        className="mb-4 h-10 w-10 animate-spin text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p className="text-sm text-gray-500">{message ?? "加载中..."}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  InlineLoader                                                       */
/* ------------------------------------------------------------------ */

interface InlineLoaderProps {
  /** Size of the spinner: sm (16px), md (20px), lg (24px). */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

function InlineLoader({ size = "md", className }: InlineLoaderProps) {
  return (
    <svg
      role="status"
      aria-label="加载中"
      className={cn("animate-spin text-current", spinnerSizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  AnalysisResultSkeleton — mirrors AnalysisResults layout            */
/* ------------------------------------------------------------------ */

function AnalysisResultSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-label="分析结果加载中"
      className={cn("mx-auto max-w-4xl space-y-8", className)}
    >
      {/* Overall score card */}
      <section className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-[180px] w-[180px] rounded-full" />
        <Skeleton className="h-4 w-64" />
      </section>

      {/* Dimension breakdown */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-5 h-5 w-36" />
        <div className="space-y-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-green-200 bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-5 w-24" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-5 w-24" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MatchCardSkeleton — mirrors MatchCard layout                       */
/* ------------------------------------------------------------------ */

function MatchCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-label="岗位加载中"
      className={cn(
        "flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>

      {/* Job info */}
      <div className="mt-3 space-y-1.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>

      {/* Summary */}
      <Skeleton className="mt-3 h-10 w-full" />

      {/* Salary */}
      <Skeleton className="mt-2 h-4 w-32" />

      {/* Score label */}
      <Skeleton className="mt-3 h-3 w-16" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ResumeCardSkeleton — for resume list grid                          */
/* ------------------------------------------------------------------ */

function ResumeCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-label="简历加载中"
      className={cn(
        "flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {/* File icon + name */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4 truncate" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Status + score */}
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-8 w-14 rounded-full" />
      </div>

      {/* Date */}
      <Skeleton className="mt-3 h-3 w-28" />
    </div>
  );
}

export {
  Skeleton,
  FullPageLoader,
  InlineLoader,
  AnalysisResultSkeleton,
  MatchCardSkeleton,
  ResumeCardSkeleton,
};
