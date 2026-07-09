"use client";

import { useState } from "react";
import Link from "next/link";
import { cn, formatScore, truncate } from "@/lib/utils";
import type { MatchItem } from "@/lib/hooks/useMatches";

/* ------------------------------------------------------------------ */
/*  Circular progress indicator                                        */
/* ------------------------------------------------------------------ */

function ScoreGauge({ score, size = 56 }: { score: number; size?: number }) {
  const info = formatScore(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Stroke colour by band
  const strokeMap: Record<string, string> = {
    green: "#10b981",
    yellow: "#f59e0b",
    orange: "#f97316",
    red: "#ef4444",
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeMap[info.band]}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={cn("absolute text-sm font-bold", info.colorClasses)}>
        {score}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Remote policy badge                                                */
/* ------------------------------------------------------------------ */

const policyLabels: Record<string, string> = {
  remote: "远程",
  hybrid: "混合",
  onsite: "现场",
  unknown: "待定",
};

const policyBadgeClasses: Record<string, string> = {
  remote: "bg-emerald-100 text-emerald-700",
  hybrid: "bg-blue-100 text-blue-700",
  onsite: "bg-purple-100 text-purple-700",
  unknown: "bg-gray-100 text-gray-600",
};

function RemotePolicyBadge({ policy }: { policy: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        policyBadgeClasses[policy] ?? policyBadgeClasses.unknown,
      )}
    >
      {policyLabels[policy] ?? policy}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  MatchCard                                                          */
/* ------------------------------------------------------------------ */

export interface MatchCardProps {
  match: MatchItem;
}

export default function MatchCard({ match }: MatchCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const scoreInfo = formatScore(match.matchScore);

  const salaryDisplay =
    match.salaryMin != null && match.salaryMax != null
      ? `${match.salaryCurrency} ${(match.salaryMin / 1000).toFixed(0)}k-${(match.salaryMax / 1000).toFixed(0)}k`
      : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        "transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-gray-300",
        "cursor-pointer",
      )}
    >
      {/* Top row: score + badges */}
      <div className="flex items-start justify-between">
        <ScoreGauge score={match.matchScore} />
        <div className="flex flex-wrap gap-1.5">
          <RemotePolicyBadge policy={match.remotePolicy} />
          {match.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Job info */}
      <div className="mt-3 flex-1">
        <Link
          href={`/dashboard/matches/${match.id}`}
          className="block focus:outline-none"
        >
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {match.jobTitle}
          </h3>
        </Link>
        <p className="mt-0.5 text-sm text-gray-600">{match.company}</p>
        {match.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {match.location}
          </p>
        )}
      </div>

      {/* Summary */}
      <p className="mt-3 text-sm text-gray-500 line-clamp-2">
        {truncate(match.matchSummary, 100)}
      </p>

      {/* Salary */}
      {salaryDisplay && (
        <p className="mt-2 text-sm font-medium text-emerald-600">
          {salaryDisplay}
        </p>
      )}

      {/* Score label */}
      <div className="mt-3 flex items-center gap-2">
        <span className={cn("text-xs font-medium", scoreInfo.colorClasses)}>
          {scoreInfo.label}
        </span>
      </div>

      {/* Expandable explanation preview */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowExplanation((v) => !v);
          }}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <svg
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              showExplanation && "rotate-90",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          为什么匹配？
        </button>
        {showExplanation && (
          <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-3">
            {match.matchSummary}
          </p>
        )}
      </div>
    </div>
  );
}
