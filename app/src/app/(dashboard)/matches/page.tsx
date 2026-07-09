"use client";

import { useState } from "react";
import { useMatches } from "@/lib/hooks/useMatches";
import MatchCard from "@/components/MatchCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function MatchCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Gauge placeholder */}
      <div className="flex items-start justify-between">
        <div className="h-14 w-14 rounded-full bg-gray-200" />
        <div className="flex gap-1.5">
          <div className="h-5 w-12 rounded-full bg-gray-200" />
          <div className="h-5 w-14 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
      <div className="mt-4 h-3 w-full rounded bg-gray-100" />
      <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-16 rounded-full bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter bar                                                         */
/* ------------------------------------------------------------------ */

const remoteOptions = [
  { value: "all", label: "全部" },
  { value: "remote", label: "远程" },
  { value: "hybrid", label: "混合" },
  { value: "onsite", label: "现场" },
] as const;

function FilterBar({
  minScore,
  onMinScoreChange,
  remotePolicy,
  onRemotePolicyChange,
  search,
  onSearchChange,
}: {
  minScore: number;
  onMinScoreChange: (v: number) => void;
  remotePolicy: string;
  onRemotePolicyChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:gap-6">
      {/* Search */}
      <div className="flex-1 min-w-0">
        <label className="mb-1 block text-xs font-medium text-gray-500">
          搜索
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="公司、职位、地点..."
            className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Min score slider */}
      <div className="w-full sm:w-48">
        <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
          <span>最低匹配度</span>
          <span className="font-semibold text-gray-700">{minScore}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={minScore}
          onChange={(e) => onMinScoreChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
        />
      </div>

      {/* Remote policy toggle */}
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-gray-500">
          工作模式
        </label>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {remoteOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onRemotePolicyChange(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                remotePolicy === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
      <svg
        className="h-16 w-16 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
        />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        暂无匹配结果
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        上传简历并分析后，我们会为你推荐匹配的岗位
      </p>
      <Button className="mt-6" onClick={() => (window.location.href = "/dashboard/upload")}>
        上传简历
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MatchesPage() {
  const [minScore, setMinScore] = useState(0);
  const [remotePolicy, setRemotePolicy] = useState("all");
  const [search, setSearch] = useState("");

  const { matches, isLoading, error, loadMore, hasMore } = useMatches({
    minScore,
    remotePolicy: remotePolicy as "remote" | "hybrid" | "onsite" | "all",
    search,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">为你推荐的岗位</h1>
        {!isLoading && (
          <p className="mt-1 text-sm text-gray-500">
            共找到 <span className="font-medium text-gray-700">{matches.length}</span> 个匹配岗位
          </p>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar
        minScore={minScore}
        onMinScoreChange={setMinScore}
        remotePolicy={remotePolicy}
        onRemotePolicyChange={setRemotePolicy}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          加载失败: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && matches.length === 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && matches.length === 0 && <EmptyState />}

      {/* Match grid */}
      {matches.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !isLoading && matches.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore}>
            加载更多
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {isLoading && matches.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
