"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RewritePreview } from "@/components/RewritePreview";
import { FullPageLoader, InlineLoader } from "@/components/LoadingStates";
import type { RewriteSection } from "@/lib/ai-pipeline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RewritePanelProps {
  /** Resume ID to rewrite. */
  resumeId: string;
  /** Callback when export is triggered (after accepting changes). */
  onExport?: (acceptedRewrites: RewriteSection[]) => void;
  className?: string;
}

interface RewriteState {
  rewrites: RewriteSection[];
  fullRewrittenResume: unknown | null;
  meta?: {
    sections: string[];
    tone: string;
    processing_time_ms: number;
    cost_cents: number;
  };
}

type PanelStatus = "idle" | "loading" | "success" | "error";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function RewritePanel({ resumeId, onExport, className }: RewritePanelProps) {
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [rewriteData, setRewriteData] = useState<RewriteState | null>(null);
  const [acceptedSections, setAcceptedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // --- Trigger rewrite generation
  const handleGenerateRewrite = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: ["summary", "experience", "skills"],
          tone: "professional",
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? `请求失败 (${response.status})`);
      }

      if (!body.success || !body.data) {
        throw new Error(body?.error ?? "生成优化版本失败");
      }

      setRewriteData(body.data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "生成优化版本时发生未知错误");
    }
  }, [resumeId]);

  // --- Individual section toggle
  const handleSectionToggle = useCallback(
    (section: string, accepted: boolean) => {
      setAcceptedSections((prev) => {
        const next = new Set(prev);
        if (accepted) next.add(section);
        else next.delete(section);
        return next;
      });
    },
    [],
  );

  // --- Accept all
  const handleAcceptAll = useCallback(() => {
    if (!rewriteData) return;
    setAcceptedSections(new Set(rewriteData.rewrites.map((r) => r.section)));
  }, [rewriteData]);

  // --- Reject all
  const handleRejectAll = useCallback(() => {
    setAcceptedSections(new Set());
  }, []);

  // --- Export accepted changes
  const handleExport = useCallback(() => {
    if (!rewriteData) return;
    const accepted = rewriteData.rewrites.filter((r) =>
      acceptedSections.has(r.section),
    );
    onExport?.(accepted);
  }, [rewriteData, acceptedSections, onExport]);

  // --- Retry
  const handleRetry = useCallback(() => {
    setStatus("idle");
    setRewriteData(null);
    setError(null);
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* ---- Idle state: trigger button ---- */}
      {status === "idle" && (
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-900">
            简历智能优化
          </h3>
          <p className="mb-4 text-sm text-gray-500 max-w-md mx-auto">
            AI 将根据分析结果，自动优化您的简历内容并展示修改前后差异
          </p>
          <Button onClick={handleGenerateRewrite} size="lg">
            生成优化版本
          </Button>
        </section>
      )}

      {/* ---- Loading state ---- */}
      {status === "loading" && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-12 text-center shadow-sm">
          <FullPageLoader message="AI 正在优化你的简历... 请稍候" />
          <p className="mt-2 text-xs text-blue-500">
            通常需要 30-60 秒，取决于简历长度
          </p>
        </section>
      )}

      {/* ---- Error state ---- */}
      {status === "error" && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            />
          </svg>
          <h3 className="mb-1 text-base font-semibold text-red-900">
            优化生成失败
          </h3>
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={handleRetry}>
              重新生成
            </Button>
            <Button variant="destructive" onClick={handleRetry}>
              返回
            </Button>
          </div>
        </section>
      )}

      {/* ---- Success: show rewrite preview ---- */}
      {status === "success" && rewriteData && (
        <>
          {/* Meta info bar */}
          {rewriteData.meta && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                处理耗时 {(rewriteData.meta.processing_time_ms / 1000).toFixed(1)}s
              </span>
              <Badge variant="secondary">语气: {rewriteData.meta.tone === "professional" ? "专业" : rewriteData.meta.tone}</Badge>
              <Badge variant="secondary">{rewriteData.rewrites.length} 个章节</Badge>
            </div>
          )}

          {/* RewritePreview with all controls */}
          <RewritePreview
            rewrites={rewriteData.rewrites}
            acceptedSections={acceptedSections}
            onSectionToggle={handleSectionToggle}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
          />

          {/* Export button */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {acceptedSections.size === 0
                  ? "尚未选择任何修改"
                  : `已选择 ${acceptedSections.size}/${rewriteData.rewrites.length} 个修改`}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                选择要应用的修改后，点击导出生成最终简历
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
              >
                重新生成
              </Button>
              <Button
                size="sm"
                disabled={acceptedSections.size === 0}
                onClick={handleExport}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                导出优化后简历
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

RewritePanel.displayName = "RewritePanel";

export { RewritePanel };
