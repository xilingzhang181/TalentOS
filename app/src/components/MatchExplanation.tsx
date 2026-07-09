"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MatchStrength {
  skill: string;
  evidence: string;
  strength: "strong" | "moderate";
  confidence: number;
}

export interface MatchGap {
  skill: string;
  priority: "必须" | "加分";
  recommendation: string;
  confidence: number;
}

export interface TransferableSkill {
  from: string;
  to: string;
  confidence: number;
}

export interface MatchExplanationProps {
  strengths: MatchStrength[];
  gaps: MatchGap[];
  transferables: TransferableSkill[];
  jobUrl?: string;
}

/* ------------------------------------------------------------------ */
/*  Confidence indicator                                               */
/* ------------------------------------------------------------------ */

function ConfidenceDot({ level }: { level: number }) {
  const color =
    level >= 0.8
      ? "bg-emerald-500"
      : level >= 0.6
        ? "bg-amber-500"
        : "bg-gray-400";

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <span className={cn("inline-block h-2 w-2 rounded-full", color)} />
      置信度 {Math.round(level * 100)}%
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MatchExplanation({
  strengths,
  gaps,
  transferables,
  jobUrl,
}: MatchExplanationProps) {
  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <h2 className="text-lg font-bold text-gray-900">
        为什么推荐这个岗位
      </h2>

      {/* ─── Strengths ─────────────────────────────────────────────── */}
      {strengths.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            匹配优势
          </h3>
          <ul className="space-y-3">
            {strengths.map((s) => (
              <li
                key={s.skill}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {s.skill}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{s.evidence}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      s.strength === "strong"
                        ? "bg-emerald-200 text-emerald-800"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {s.strength === "strong" ? "强匹配" : "较好匹配"}
                  </span>
                </div>
                <div className="mt-2">
                  <ConfidenceDot level={s.confidence} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Gaps ───────────────────────────────────────────────────── */}
      {gaps.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            需要提升的领域
          </h3>
          <ul className="space-y-3">
            {gaps.map((g) => (
              <li
                key={g.skill}
                className={cn(
                  "rounded-lg border p-4",
                  g.priority === "必须"
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {g.skill}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {g.recommendation}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      g.priority === "必须"
                        ? "bg-red-200 text-red-800"
                        : "bg-amber-200 text-amber-700",
                    )}
                  >
                    {g.priority}
                  </span>
                </div>
                <div className="mt-2">
                  <ConfidenceDot level={g.confidence} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Transferable skills ────────────────────────────────────── */}
      {transferables.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            可迁移技能
          </h3>
          <ul className="space-y-2">
            {transferables.map((t) => (
              <li
                key={`${t.from}-${t.to}`}
                className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3"
              >
                <span className="flex-1 text-sm text-gray-700">
                  你的{" "}
                  <span className="font-medium text-blue-700">{t.from}</span>{" "}
                  经验可以迁移到{" "}
                  <span className="font-medium text-blue-700">{t.to}</span>
                </span>
                <ConfidenceDot level={t.confidence} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      {jobUrl && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => window.open(jobUrl, "_blank", "noopener,noreferrer")}
            className="gap-2"
          >
            申请这个岗位
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
