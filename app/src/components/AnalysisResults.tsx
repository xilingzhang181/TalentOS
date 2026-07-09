"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Confidence = "high" | "medium" | "low";

export interface DimensionScore {
  name: string;
  nameEn: string;
  score: number;
  confidence: Confidence;
  details?: string;
}

export interface AnalysisResult {
  id: string;
  overallScore: number;
  dimensions: DimensionScore[];
  strengths: string[];
  gaps: string[];
  actionItems: {
    text: string;
    effort: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
  }[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score < 30) return "text-red-600";
  if (score <= 70) return "text-amber-600";
  return "text-green-600";
}

function scoreRingColor(score: number): string {
  if (score < 30) return "stroke-red-500";
  if (score <= 70) return "stroke-amber-500";
  return "stroke-green-500";
}

function scoreBg(score: number): string {
  if (score < 30) return "bg-red-100 text-red-700";
  if (score <= 70) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

const confidenceLabel: Record<Confidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const confidenceColor: Record<Confidence, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

const effortLabel: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const impactLabel: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

/* ------------------------------------------------------------------ */
/*  Circular Gauge                                                     */
/* ------------------------------------------------------------------ */

function CircularGauge({ score }: { score: number }) {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
        {/* Track */}
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Fill */}
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          className={`${scoreRingColor(score)} transition-all duration-1000 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${scoreColor(score)}`}>
          {Math.round(score)}
        </span>
        <span className="text-sm text-gray-500">匹配度</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  /* Progressive rendering: details appear after a delay */
  const [showDimensions, setShowDimensions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowDimensions(true), 600);
    const t2 = setTimeout(() => setShowDetails(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ---- Overall Score ---- */}
      <section className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">综合匹配度</h2>
        <CircularGauge score={result.overallScore} />
        <p className="max-w-md text-center text-sm text-gray-500">
          以下基于您上传的简历与职位描述的智能匹配分析结果
        </p>
      </section>

      {/* ---- Dimension Breakdown ---- */}
      {showDimensions && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">
            五维匹配分析
          </h3>
          <div className="space-y-5">
            {result.dimensions.map((dim) => (
              <div key={dim.nameEn}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {dim.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor[dim.confidence]}`}
                    >
                      置信度: {confidenceLabel[dim.confidence]}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${scoreColor(dim.score)}`}>
                    {Math.round(dim.score)}
                  </span>
                </div>
                <Progress value={dim.score} />
                {dim.details && (
                  <p className="mt-1 text-xs text-gray-500">{dim.details}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Strengths & Gaps ---- */}
      {showDetails && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Strengths */}
          <section className="rounded-xl border border-green-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-green-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              核心优势
            </h3>
            <ul className="space-y-3">
              {result.strengths.map((s, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>

          {/* Gaps */}
          <section className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              关键差距
            </h3>
            <ul className="space-y-3">
              {result.gaps.map((g, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800"
                >
                  {g}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* ---- Action Items ---- */}
      {showDetails && result.actionItems.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            改进建议
          </h3>
          <ul className="space-y-3">
            {result.actionItems.map((item, i) => (
              <li
                key={i}
                className="flex flex-wrap items-start gap-3 rounded-lg border border-gray-100 px-4 py-3"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <div className="mt-1.5 flex gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.effort === "low" ? "bg-green-100 text-green-700" : item.effort === "medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      难度: {effortLabel[item.effort]}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.impact === "high" ? "bg-green-100 text-green-700" : item.impact === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                      影响: {impactLabel[item.impact]}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
