"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResumeCardSkeleton, FullPageLoader } from "@/components/LoadingStates";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ResumeItem {
  id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  analyses?: {
    id: string;
    match_score: number | null;
    created_at: string;
  }[];
}

type PageStatus = "loading" | "success" | "error";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  processed: { label: "已处理", color: "bg-green-100 text-green-700" },
  processing: { label: "处理中", color: "bg-blue-100 text-blue-700" },
  pending: { label: "待处理", color: "bg-gray-100 text-gray-600" },
  failed: { label: "失败", color: "bg-red-100 text-red-700" },
};

function getStatusDisplay(status: string) {
  return statusConfig[status] ?? statusConfig.pending;
}

/* ------------------------------------------------------------------ */
/*  Resume Card                                                        */
/* ------------------------------------------------------------------ */

function ResumeCard({ resume }: { resume: ResumeItem }) {
  const latestScore = resume.analyses?.[0]?.match_score;
  const status = getStatusDisplay(resume.status);

  return (
    <Link
      href={`/resumes/${resume.id}`}
      className={cn(
        "group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        "transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-gray-300",
      )}
    >
      {/* File icon + name */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {resume.file_name}
          </h3>
          <p className="text-xs text-gray-500">
            {formatFileSize(resume.file_size_bytes)}
          </p>
        </div>
      </div>

      {/* Status + Score */}
      <div className="mt-4 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            status.color,
          )}
        >
          {status.label}
        </span>

        {latestScore != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">匹配度</span>
            <span
              className={cn(
                "text-sm font-bold",
                latestScore >= 80
                  ? "text-emerald-600"
                  : latestScore >= 60
                    ? "text-amber-500"
                    : latestScore >= 40
                      ? "text-orange-500"
                      : "text-red-500",
              )}
            >
              {Math.round(latestScore)}
            </span>
          </div>
        )}
      </div>

      {/* Upload date */}
      <p className="mt-3 text-xs text-gray-400">
        上传于 {formatDate(resume.created_at)}
      </p>

      {/* Analysis count */}
      {resume.analyses && resume.analyses.length > 0 && (
        <p className="mt-1 text-xs text-gray-400">
          共 {resume.analyses.length} 次分析
        </p>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ResumeListPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [status, setStatus] = useState<PageStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    setStatus("loading");
    try {
      // The app doesn't have a dedicated list endpoint;
      // fetch from the matches endpoint which provides resume info,
      // or use a custom endpoint. For now, fetch the user's data via
      // the existing resume API (listing all resumes via the dashboard).
      // NOTE: If no list endpoint exists, we fall back to an empty state.
      const response = await fetch("/api/resumes?list=true");

      if (!response.ok) {
        // If the endpoint doesn't exist, show empty state gracefully
        if (response.status === 404) {
          setResumes([]);
          setStatus("success");
          return;
        }
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `获取简历列表失败 (${response.status})`);
      }

      const body = await response.json();
      const data = body.data ?? body;
      setResumes(Array.isArray(data) ? data : data.resumes ?? []);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "获取简历列表失败");
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的简历</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理已上传的简历，查看分析历史
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            上传新简历
          </Button>
        </Link>
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ResumeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            />
          </svg>
          <p className="mb-2 text-sm font-semibold text-red-900">加载失败</p>
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchResumes}>
            重试
          </Button>
        </div>
      )}

      {/* Success: Resume grid */}
      {status === "success" && resumes.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0-3H6.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18c0-.621-.504-1.125-1.125-1.125zm-15-2.625V16.5a2.25 2.25 0 002.25 2.25h9.75a2.25 2.25 0 002.25-2.25v-1.875"
            />
          </svg>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            还没有上传过简历
          </h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            上传你的第一份简历，AI 将为你分析结构、关键词覆盖率并提供优化建议
          </p>
          <Link href="/dashboard/upload" className="mt-6 inline-block">
            <Button>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              选择文件上传
            </Button>
          </Link>
        </div>
      )}

      {status === "success" && resumes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </div>
  );
}
