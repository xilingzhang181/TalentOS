"use client";

import { useState } from "react";
import { cn, levelDots } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SkillGapItem {
  skillName: string;
  gapType: "missing" | "partial" | "outdated" | "emerging";
  requiredLevel: number;
  currentLevel: number;
  priority: "high" | "medium" | "low";
  recommendation: string;
  learningResources: {
    type: "course" | "book" | "project" | "certification";
    name: string;
    estimatedTime: string;
  }[];
}

export interface SkillGapListProps {
  gaps: SkillGapItem[];
}

/* ------------------------------------------------------------------ */
/*  Gap type config                                                    */
/* ------------------------------------------------------------------ */

const gapTypeConfig: Record<
  SkillGapItem["gapType"],
  { icon: string; label: string; color: string }
> = {
  missing: { icon: "缺失", label: "缺失", color: "bg-red-100 text-red-700" },
  partial: { icon: "部分", label: "部分掌握", color: "bg-amber-100 text-amber-700" },
  outdated: { icon: "过时", label: "可能过时", color: "bg-blue-100 text-blue-700" },
  emerging: { icon: "新兴", label: "趋势技能", color: "bg-indigo-100 text-indigo-700" },
};

const priorityConfig: Record<string, { label: string; classes: string }> = {
  high: { label: "高优先", classes: "bg-red-100 text-red-700" },
  medium: { label: "中等", classes: "bg-amber-100 text-amber-700" },
  low: { label: "低优先", classes: "bg-gray-100 text-gray-600" },
};

const resourceTypeIcon: Record<string, string> = {
  course: "课程",
  book: "书籍",
  project: "项目",
  certification: "认证",
};

/* ------------------------------------------------------------------ */
/*  Level dots (inline)                                                */
/* ------------------------------------------------------------------ */

function LevelDisplay({
  current,
  required,
}: {
  current: number;
  required: number;
}) {
  const c = levelDots(current);
  const r = levelDots(required);

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex flex-col items-center gap-1">
        <span className="text-gray-500">当前</span>
        <span className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                i < c.filled ? "bg-blue-500" : "bg-gray-200",
              )}
            />
          ))}
        </span>
      </div>
      <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
      <div className="flex flex-col items-center gap-1">
        <span className="text-gray-500">要求</span>
        <span className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                i < r.filled ? "bg-emerald-500" : "bg-gray-200",
              )}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sort helper                                                        */
/* ------------------------------------------------------------------ */

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

function sortByPriority(items: SkillGapItem[]): SkillGapItem[] {
  return [...items].sort(
    (a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9),
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SkillGapList({ gaps }: SkillGapListProps) {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const sorted = sortByPriority(gaps);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">技能缺口分析</h2>

      {sorted.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          暂无技能缺口数据
        </div>
      )}

      <ul className="space-y-3">
        {sorted.map((gap) => {
          const gt = gapTypeConfig[gap.gapType];
          const pr = priorityConfig[gap.priority] ?? priorityConfig.low;
          const isExpanded = expandedSkill === gap.skillName;

          return (
            <li
              key={gap.skillName}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Gap type icon */}
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        gt.color,
                      )}
                    >
                      {gt.icon.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {gap.skillName}
                      </p>
                      <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", gt.color)}>
                        {gt.label}
                      </span>
                    </div>
                  </div>

                  {/* Priority badge */}
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      pr.classes,
                    )}
                  >
                    {pr.label}
                  </span>
                </div>

                {/* Level comparison */}
                <div className="mt-3">
                  <LevelDisplay current={gap.currentLevel} required={gap.requiredLevel} />
                </div>

                {/* Recommendation */}
                <p className="mt-3 text-sm text-gray-600">{gap.recommendation}</p>

                {/* Learning resources toggle */}
                {gap.learningResources.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSkill((prev) =>
                        prev === gap.skillName ? null : gap.skillName,
                      )
                    }
                    className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <svg
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        isExpanded && "rotate-90",
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    学习路径 ({gap.learningResources.length})
                  </button>
                )}
              </div>

              {/* Expanded learning resources */}
              {isExpanded && gap.learningResources.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-2">
                  {gap.learningResources.map((res) => (
                    <div
                      key={res.name}
                      className="flex items-start gap-3 rounded-lg bg-white p-3 border border-gray-100"
                    >
                      <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        {resourceTypeIcon[res.type] ?? res.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {res.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          预计时长: {res.estimatedTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
