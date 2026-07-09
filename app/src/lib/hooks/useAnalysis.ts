"use client";

import { useState, useRef, useCallback } from "react";
import type { PipelineResult } from "@/lib/ai-pipeline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AnalyzeOptions {
  /** Number of milliseconds between poll attempts (default 2 000). */
  pollInterval?: number;
  /** Maximum poll attempts before giving up (default 60). */
  maxPolls?: number;
  /** Optional rewrite options to pass through. */
  rewriteOptions?: {
    sections?: string[];
    tone?: "professional" | "concise" | "detailed";
  };
}

interface AnalyzeState {
  analyze: (
    resumeId: string,
    jdText: string,
    options?: AnalyzeOptions,
  ) => Promise<PipelineResult | null>;
  isAnalyzing: boolean;
  error: string | null;
  result: PipelineResult | null;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Custom hook that wraps the analysis API with loading / error state,
 * automatic retry, and async-polling support.
 */
export function useAnalysis(): AnalyzeState {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const abortRef = useRef(false);

  const analyze = useCallback(
    async (
      resumeId: string,
      jdText: string,
      options?: AnalyzeOptions,
    ): Promise<PipelineResult | null> => {
      const pollInterval = options?.pollInterval ?? 2000;
      const maxPolls = options?.maxPolls ?? 60;

      setIsAnalyzing(true);
      setError(null);
      setResult(null);
      abortRef.current = false;

      try {
        // ── Kick off analysis ──────────────────────────────────────
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId,
            jdText,
            rewriteOptions: options?.rewriteOptions,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(
            body?.error ?? `Analysis request failed (${response.status})`,
          );
        }

        const data: { jobId?: string; status?: string; result?: PipelineResult } =
          await response.json();

        // If the API returns the full result immediately
        if (data.result) {
          setResult(data.result);
          setIsAnalyzing(false);
          return data.result;
        }

        // ── Poll for completion ────────────────────────────────────
        const jobId = data.jobId;
        if (!jobId) {
          throw new Error("No job ID returned from analysis endpoint");
        }

        for (let attempt = 0; attempt < maxPolls; attempt++) {
          if (abortRef.current) {
            setIsAnalyzing(false);
            return null;
          }

          await new Promise((r) => setTimeout(r, pollInterval));

          const pollRes = await fetch(`/api/analyze/${jobId}`, {
            method: "GET",
          });

          if (!pollRes.ok) {
            throw new Error(`Polling failed (${pollRes.status})`);
          }

          const pollData: { status: string; result?: PipelineResult } =
            await pollRes.json();

          if (pollData.status === "completed" && pollData.result) {
            setResult(pollData.result);
            setIsAnalyzing(false);
            return pollData.result;
          }

          if (pollData.status === "failed") {
            throw new Error("Analysis pipeline failed on the server");
          }
          // Otherwise keep polling
        }

        throw new Error(
          `Analysis did not complete within ${maxPolls * pollInterval / 1000}s`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setIsAnalyzing(false);
        return null;
      }
    },
    [],
  );

  return { analyze, isAnalyzing, error, result };
}
