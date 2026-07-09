"use client";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface StatCardData {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  /** 1 = up trend, -1 = down trend, 0 = flat */
  trend: 1 | -1 | 0;
  trendLabel?: string;
}

export interface DashboardStatsProps {
  stats: StatCardData[];
}

/* ------------------------------------------------------------------ */
/*  Trend indicator                                                    */
/* ------------------------------------------------------------------ */

function TrendIndicator({ trend, label }: { trend: 1 | -1 | 0; label?: string }) {
  if (trend === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        trend === 1 ? "text-emerald-600" : "text-red-500",
      )}
    >
      <svg
        className={cn("h-3 w-3", trend === -1 && "rotate-180")}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
        />
      </svg>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Gradient presets for each card                                     */
/* ------------------------------------------------------------------ */

const gradients = [
  "from-blue-600 to-blue-500",
  "from-emerald-600 to-emerald-500",
  "from-violet-600 to-violet-500",
  "from-amber-600 to-amber-500",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "relative overflow-hidden rounded-xl bg-gradient-to-br p-5 text-white shadow-lg",
            gradients[i % gradients.length],
          )}
        >
          {/* Subtle pattern overlay */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/5" />

          <div className="relative">
            {/* Icon */}
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              {stat.icon}
            </div>

            {/* Value */}
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>

            {/* Label + trend */}
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-white/80">{stat.label}</p>
              <TrendIndicator trend={stat.trend} label={stat.trendLabel} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Default stats factory                                              */
/* ------------------------------------------------------------------ */

export function defaultDashboardStats(data: {
  totalAnalyses: number;
  averageScore: number;
  matchedJobs: number;
  highestScore: number;
}): StatCardData[] {
  return [
    {
      label: "总分析次数",
      value: data.totalAnalyses,
      trend: 1,
      trendLabel: "",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
      ),
    },
    {
      label: "平均匹配度",
      value: `${data.averageScore}%`,
      trend: 1,
      trendLabel: "",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
      ),
    },
    {
      label: "匹配岗位数",
      value: data.matchedJobs,
      trend: 1,
      trendLabel: "",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
    },
    {
      label: "最高匹配度",
      value: `${data.highestScore}%`,
      trend: 0,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.015 6.015 0 01-2.27.273 6.015 6.015 0 01-2.27-.273m4.54 0a6.012 6.012 0 01-4.54 0" />
        </svg>
      ),
    },
  ];
}
