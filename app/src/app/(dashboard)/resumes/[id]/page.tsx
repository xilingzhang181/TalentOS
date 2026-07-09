"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";
import { RewritePanel } from "@/components/RewritePanel";
import { ReportExport } from "@/components/ReportExport";
import { ShareableLink } from "@/components/ShareableLink";
import { FullPageLoader } from "@/components/LoadingStates";
import type { DimensionScore } from "@/components/AnalysisResults";
import type { RewriteSection } from "@/lib/ai-pipeline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ResumeDetail {
  id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  status: string;
  parsed_json: {
    contact?: {
      name: string;
      email: string | null;
      phone: string | null;
      location: string | null;
    };
    summary?: string | null;
    experience?: {
      title: string;
      company: string;
      location: string | null;
      start_date: string;
      end_date: string | null;
      bullets: string[];
    }[];
    education?: {
      degree: string;
      institution: string;
      year: string | null;
    }[];
    skills?: string[];
    certifications?: string[];
    languages?: string[];
    metadata?: {
      word_count: number;
      section_count: number;
      parsing_confidence: number;
    };
  } | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  analyses: AnalysisSummary[];
}

interface AnalysisSummary {
  id: string;
  match_score: number | null;
  feedback: string | null;
  feedback_json: {
    summary?: string;
    overall_score?: number;
    strengths?: { point: string; evidence: string; impact: string }[];
    improvements?: { area: string; current_issue: string; suggestion: string; priority: string }[];
    ats_score?: { score: number; issues: string[]; suggestions: string[] };
    keywords_to_add?: { keyword: string; reason: string }[];
  } | null;
  processing_time_ms: number | null;
  model_used: string | null;
  cost_cents: number | null;
  created_at: string;
  job_description?: {
    id: string;
    title: string;
    company: string | null;
  } | null;
  skill_gaps?: {
    skill_name: string;
    gap_type: string;
    required_level: number;
    current_level: number;
    recommendation: string;
    priority: number;
  }[];
}

type PageStatus = "loading" | "success" | "error";

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  processed: { label: "已处理", color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  processing: { label: "处理中", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500" },
  pending: { label: "待处理", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  failed: { label: "失败", color: "bg-red-100 text-red-700", dotColor: "bg-red-500" },
};

function getStatusDisplay(status: string) {
  return statusConfig[status] ?? statusConfig.pending;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Resume Content Viewer                                              */
/* ------------------------------------------------------------------ */

function ResumeContentViewer({ parsedJson }: { parsedJson: ResumeDetail["parsed_json"] }) {
  if (!parsedJson) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        简历尚未解析或解析失败
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Contact */}
      {parsedJson.contact && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            联系方式
          </h4>
          <div className="rounded-lg border border-gray-200 p-4 space-y-1">
            <p className="font-medium text-gray-900">{parsedJson.contact.name}</p>
            {parsedJson.contact.email && (
              <p className="text-gray-600">{parsedJson.contact.email}</p>
            )}
            {parsedJson.contact.phone && (
              <p className="text-gray-600">{parsedJson.contact.phone}</p>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {parsedJson.summary && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            个人简介
          </h4>
          <p className="rounded-lg border border-gray-200 p-4 text-gray-700 leading-relaxed">
            {parsedJson.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {parsedJson.experience && parsedJson.experience.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            工作经历
          </h4>
          <div className="space-y-3">
            {parsedJson.experience.map((exp, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-gray-900">{exp.title}</p>
                  <span className="text-xs text-gray-400">
                    {exp.start_date}
                    {exp.end_date ? ` - ${exp.end_date}` : " - 至今"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{exp.company}</p>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} className="text-gray-700 text-xs leading-relaxed">
                        - {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {parsedJson.skills && parsedJson.skills.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            技能
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {parsedJson.skills.map((skill, i) => (
              <Badge key={i} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {parsedJson.education && parsedJson.education.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            教育背景
          </h4>
          {parsedJson.education.map((edu, i) => (
            <div key={i} className="mb-2 rounded-lg border border-gray-200 p-3">
              <p className="font-medium text-gray-900">{edu.degree}</p>
              {edu.institution && <p className="text-sm text-gray-600">{edu.institution}</p>}
              {edu.year && <p className="text-xs text-gray-400">{edu.year}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
      {parsedJson.metadata && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex gap-4 text-xs text-gray-400">
            <span>字数: {parsedJson.metadata.word_count}</span>
            <span>段落数: {parsedJson.metadata.section_count}</span>
            <span>解析置信度: {Math.round(parsedJson.metadata.parsing_confidence * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params?.id as string;

  const [status, setStatus] = useState<PageStatus>("loading");
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("content");
  const [acceptedRewrites, setAcceptedRewrites] = useState<RewriteSection[]>([]);

  // --- Fetch resume detail
  useEffect(() => {
    if (!resumeId) return;

    let cancelled = false;

    async function fetchResume() {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error ?? "获取简历详情失败");
        }
        const body = await response.json();
        if (!cancelled) {
          setResume(body.data ?? body);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "获取简历详情失败");
          setStatus("error");
        }
      }
    }

    fetchResume();
    return () => { cancelled = true; };
  }, [resumeId]);

  // --- Handle export
  const handleExport = useCallback((rewrites: RewriteSection[]) => {
    setAcceptedRewrites(rewrites);
    // Scroll to the report section
    setActiveTab("report");
  }, []);

  // --- Loading state
  if (status === "loading") {
    return <FullPageLoader message="正在加载简历详情..." />;
  }

  // --- Error state
  if (status === "error" || !resume) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <svg
          className="mb-4 h-12 w-12 text-red-400"
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
        <p className="mb-2 text-lg font-semibold text-gray-900">加载失败</p>
        <p className="mb-6 text-sm text-gray-500">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/resumes")}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const latestAnalysis = resume.analyses?.[0] ?? null;
  const statusInfo = getStatusDisplay(resume.status);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{resume.file_name}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusInfo.color,
              )}
            >
              <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", statusInfo.dotColor)} />
              {statusInfo.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span>{formatFileSize(resume.file_size_bytes)}</span>
            <span className="text-gray-300">|</span>
            <span>上传于 {formatDate(resume.created_at)}</span>
            <span className="text-gray-300">|</span>
            <span>{resume.mime_type}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/analyze">
            <Button size="sm">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              开始新分析
            </Button>
          </Link>
          {latestAnalysis && (
            <ShareableLink analysisId={latestAnalysis.id} />
          )}
        </div>
      </div>

      {/* ---- Error message ---- */}
      {resume.error_message && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{resume.error_message}</p>
        </div>
      )}

      {/* ---- Tabs ---- */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          <TabTrigger value="content">简历内容</TabTrigger>
          <TabTrigger value="analyses">
            分析历史
            {resume.analyses.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {resume.analyses.length}
              </Badge>
            )}
          </TabTrigger>
          <TabTrigger value="rewrite">简历优化</TabTrigger>
          <TabTrigger value="report">导出报告</TabTrigger>
        </TabList>

        {/* ---- Tab: Resume Content ---- */}
        <TabContent value="content">
          <Card>
            <CardContent className="pt-6">
              <ResumeContentViewer parsedJson={resume.parsed_json} />
            </CardContent>
          </Card>
        </TabContent>

        {/* ---- Tab: Analysis History ---- */}
        <TabContent value="analyses">
          {resume.analyses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <svg
                className="mx-auto h-10 w-10 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
                />
              </svg>
              <p className="mt-3 text-sm text-gray-500">
                尚未对这份简历进行分析
              </p>
              <Link href="/analyze" className="mt-4 inline-block">
                <Button size="sm">开始分析</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {resume.analyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/analyze/${analysis.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          分析 #{analysis.id.slice(0, 8)}
                        </span>
                        {analysis.job_description && (
                          <Badge variant="secondary">
                            {analysis.job_description.title}
                            {analysis.job_description.company && ` @ ${analysis.job_description.company}`}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(analysis.created_at)}
                        {analysis.processing_time_ms != null && (
                          <span> -- 耗时 {(analysis.processing_time_ms / 1000).toFixed(1)}s</span>
                        )}
                      </p>
                    </div>
                    {analysis.match_score != null && (
                      <div className="text-right">
                        <span
                          className={cn(
                            "text-2xl font-bold",
                            analysis.match_score >= 80
                              ? "text-emerald-600"
                              : analysis.match_score >= 60
                                ? "text-amber-500"
                                : analysis.match_score >= 40
                                  ? "text-orange-500"
                                  : "text-red-500",
                          )}
                        >
                          {Math.round(analysis.match_score)}
                        </span>
                        <p className="text-xs text-gray-400">匹配度</p>
                      </div>
                    )}
                  </div>
                  {analysis.feedback && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {analysis.feedback}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </TabContent>

        {/* ---- Tab: Rewrite ---- */}
        <TabContent value="rewrite">
          <RewritePanel
            resumeId={resumeId}
            onExport={handleExport}
          />
        </TabContent>

        {/* ---- Tab: Export Report ---- */}
        <TabContent value="report">
          {latestAnalysis?.feedback_json ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-gray-900">
                  导出分析报告
                </h3>
                <p className="mb-4 text-sm text-gray-500">
                  生成包含匹配度、五维分析、优势与差距、改进建议的完整 PDF 报告
                </p>
                <ReportExport
                  overallScore={latestAnalysis.match_score ?? 0}
                  dimensions={
                    (latestAnalysis.feedback_json as unknown as { dimensions?: DimensionScore[] })?.dimensions ??
                    latestAnalysis.feedback_json.strengths?.map((s, i) => ({
                      name: s.point,
                      nameEn: `strength_${i}`,
                      score: 80,
                      confidence: "medium" as const,
                    })) ?? []
                  }
                  strengths={latestAnalysis.feedback_json.strengths?.map((s) => s.point) ?? []}
                  gaps={latestAnalysis.feedback_json.improvements?.map((g) => g.suggestion) ?? []}
                  actionItems={[]}
                  acceptedRewrites={acceptedRewrites.length > 0 ? acceptedRewrites : undefined}
                  resumeFilename={resume.file_name}
                  jobTitle={latestAnalysis.job_description?.title}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <svg
                className="mx-auto h-10 w-10 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.424 48.424 0 018.5 0m-8.5 0V6.375c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.104"
                />
              </svg>
              <p className="mt-3 text-sm text-gray-500">
                暂无分析数据可导出，请先完成一次简历分析
              </p>
              <Link href="/analyze" className="mt-4 inline-block">
                <Button size="sm">开始分析</Button>
              </Link>
            </div>
          )}
        </TabContent>
      </Tabs>
    </div>
  );
}
