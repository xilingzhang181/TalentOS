"use client";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SkillEntry {
  name: string;
  yourLevel: number;
  requiredLevel: number;
  match: "strong" | "partial" | "gap";
}

export interface SkillCategory {
  category: string;
  skills: SkillEntry[];
}

export interface SkillMatchGridProps {
  categories: SkillCategory[];
}

/* ------------------------------------------------------------------ */
/*  Level dots                                                         */
/* ------------------------------------------------------------------ */

function LevelDots({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            i < level ? "bg-current" : "bg-gray-200",
          )}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Match colour mapping                                               */
/* ------------------------------------------------------------------ */

function matchColors(match: SkillEntry["match"]): {
  text: string;
  border: string;
  bg: string;
  dot: string;
} {
  switch (match) {
    case "strong":
      return {
        text: "text-emerald-700",
        border: "border-emerald-200",
        bg: "bg-emerald-50",
        dot: "text-emerald-500",
      };
    case "partial":
      return {
        text: "text-amber-600",
        border: "border-amber-200",
        bg: "bg-amber-50",
        dot: "text-amber-500",
      };
    case "gap":
      return {
        text: "text-red-600",
        border: "border-red-200",
        bg: "bg-red-50",
        dot: "text-red-500",
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Category label map                                                 */
/* ------------------------------------------------------------------ */

const categoryLabels: Record<string, string> = {
  technical: "技术技能",
  tool: "工具",
  framework: "框架",
  language: "语言",
  soft_skill: "软技能",
  methodology: "方法论",
  domain_knowledge: "领域知识",
  certification: "认证",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SkillMatchGrid({ categories }: SkillMatchGridProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">技能匹配详情</h2>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <span>你的技能</span>
        <span className="w-16 text-center">匹配</span>
        <span>岗位要求</span>
      </div>

      {categories.map((cat) => (
        <div key={cat.category} className="space-y-2">
          {/* Category header */}
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full bg-blue-500",
              )}
            />
            {categoryLabels[cat.category] ?? cat.category}
          </h3>

          {/* Skill rows */}
          <div className="space-y-2">
            {cat.skills.map((skill) => {
              const colors = matchColors(skill.match);
              return (
                <div
                  key={skill.name}
                  className={cn(
                    "grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border p-3",
                    colors.border,
                    colors.bg,
                  )}
                >
                  {/* Your skill */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {skill.name}
                    </p>
                    <div className={cn("mt-1", colors.dot)}>
                      <LevelDots level={skill.yourLevel} />
                    </div>
                  </div>

                  {/* Match indicator */}
                  <div className="flex w-16 flex-col items-center">
                    {skill.match === "strong" && (
                      <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {skill.match === "partial" && (
                      <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {skill.match === "gap" && (
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>

                  {/* Required level */}
                  <div className="min-w-0 text-right">
                    <p className="text-sm text-gray-600">要求</p>
                    <div className={cn("mt-1 flex justify-end", colors.dot)}>
                      <LevelDots level={skill.requiredLevel} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          暂无技能匹配数据
        </div>
      )}
    </div>
  );
}
