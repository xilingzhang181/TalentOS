"use client";

import { use } from "react";
import Link from "next/link";
import { useMatchDetail } from "@/lib/hooks/useMatches";
import { cn, formatScore, scoreStrokeColor } from "@/lib/utils";
import MatchExplanation from "@/components/MatchExplanation";
import SkillMatchGrid from "@/components/SkillMatchGrid";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Large score gauge                                                  */
/* ------------------------------------------------------------------ */

function LargeScoreGauge({ score }: { score: number }) {
  const info = formatScore(score);
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor = scoreStrokeColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-bold", info.colorClasses)}>
            {score}
          </span>
          <span className={cn("mt-1 text-sm font-medium", info.colorClasses)}>
            {info.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Top gauge */}
      <div className="flex justify-center">
        <div className="h-[180px] w-[180px] rounded-full bg-gray-200" />
      </div>
      {/* Job info */}
      <div className="space-y-3">
        <div className="h-6 w-1/2 rounded bg-gray-200" />
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-1/4 rounded bg-gray-200" />
      </div>
      {/* Explanation */}
      <div className="space-y-4">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="h-20 w-full rounded bg-gray-100" />
        <div className="h-20 w-full rounded bg-gray-100" />
      </div>
      {/* Skill grid */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="h-12 w-full rounded bg-gray-100" />
        <div className="h-12 w-full rounded bg-gray-100" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-white p-16 text-center">
      <svg className="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">加载失败</h3>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
        重试
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { match, isLoading, error } = useMatchDetail(id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Back button */}
      <Link
        href="/dashboard/matches"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        返回列表
      </Link>

      {/* Loading */}
      {isLoading && <DetailSkeleton />}

      {/* Error */}
      {error && !isLoading && <ErrorState message={error} />}

      {/* Content */}
      {!isLoading && !error && match && (
        <>
          {/* ─── Top: Score gauge + Job header ──────────────────────── */}
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <LargeScoreGauge score={match.matchScore} />

            <div className="mt-6 text-center">
              <h1 className="text-xl font-bold text-gray-900">
                {match.jobTitle}
              </h1>
              <p className="mt-1 text-base text-gray-600">{match.company}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
                {match.location && (
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {match.location}
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    match.remotePolicy === "remote"
                      ? "bg-emerald-100 text-emerald-700"
                      : match.remotePolicy === "hybrid"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700",
                  )}
                >
                  {match.remotePolicy === "remote"
                    ? "远程"
                    : match.remotePolicy === "hybrid"
                      ? "混合"
                      : "现场"}
                </span>
              </div>
              {match.salaryMin != null && match.salaryMax != null && (
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  {match.salaryCurrency}{" "}
                  {(match.salaryMin / 1000).toFixed(0)}k -{" "}
                  {(match.salaryMax / 1000).toFixed(0)}k
                </p>
              )}
            </div>
          </section>

          {/* ─── Job description ────────────────────────────────────── */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              岗位描述
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
              {match.jobDescription || "暂无详细岗位描述"}
            </div>
          </section>

          {/* ─── Match explanation ──────────────────────────────────── */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <MatchExplanation
              strengths={match.explanation.strengths}
              gaps={match.explanation.gaps}
              transferables={match.explanation.transferables}
              jobUrl={match.jobUrl}
            />
          </section>

          {/* ─── Skill match grid ───────────────────────────────────── */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SkillMatchGrid categories={match.skillMatch} />
          </section>

          {/* ─── Related analyses ───────────────────────────────────── */}
          {match.relatedAnalyses && match.relatedAnalyses.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                相关分析
              </h2>
              <ul className="space-y-2">
                {match.relatedAnalyses.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/analysis/${a.id}`}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {a.title}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          formatScore(a.score).colorClasses,
                        )}
                      >
                        {a.score}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ─── Action buttons ─────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {match.jobUrl && (
              <Button
                onClick={() =>
                  window.open(match.jobUrl, "_blank", "noopener,noreferrer")
                }
                className="gap-2"
              >
                申请岗位
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </Button>
            )}
            <Link href={`/dashboard/analysis/${match.resumeId}`}>
              <Button variant="outline">查看分析报告</Button>
            </Link>
            <Link href="/dashboard/matches">
              <Button variant="ghost">返回列表</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
