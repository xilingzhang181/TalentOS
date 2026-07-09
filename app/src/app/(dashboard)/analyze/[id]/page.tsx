"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AnalysisResults, { type AnalysisResult } from "@/components/AnalysisResults";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageStatus = "loading" | "error" | "success";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [status, setStatus] = useState<PageStatus>("loading");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function fetchAnalysis() {
      try {
        const res = await fetch(`/api/analyses/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "获取分析结果失败");
        }
        const data = await res.json();
        if (!cancelled) {
          setResult(data);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "获取分析结果失败");
          setStatus("error");
        }
      }
    }

    fetchAnalysis();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ------ Loading ------ */
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <svg
          className="mb-4 h-10 w-10 animate-spin text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-500">正在加载分析结果...</p>
      </div>
    );
  }

  /* ------ Error ------ */
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <svg
          className="mb-4 h-12 w-12 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="mb-2 text-lg font-semibold text-gray-900">加载失败</p>
        <p className="mb-6 text-sm text-gray-500">{errorMsg}</p>
        <Button variant="outline" onClick={() => router.push("/analyze")}>
          返回分析
        </Button>
      </div>
    );
  }

  /* ------ Success ------ */
  if (!result) return null;

  return (
    <div className="space-y-8">
      {/* Header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分析结果</h1>
          <p className="mt-1 text-sm text-gray-500">分析 ID: {result.id}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/matches")}>
            查看匹配岗位
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            下载报告
          </Button>
          <Button size="sm" onClick={() => router.push("/analyze")}>
            尝试另一个JD
          </Button>
        </div>
      </div>

      {/* Results */}
      <AnalysisResults result={result} />

      {/* Before/After Diff placeholder */}
      <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <svg
          className="mx-auto mb-3 h-10 w-10 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
          />
        </svg>
        <h3 className="mb-1 text-base font-semibold text-gray-700">
          简历优化前后对比
        </h3>
        <p className="mb-3 text-sm text-gray-500">
          此功能即将上线 — 基于分析建议，AI 将自动优化您的简历内容并展示修改前后差异。
        </p>
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500">
          Phase 5 即将推出
        </span>
      </section>
    </div>
  );
}
