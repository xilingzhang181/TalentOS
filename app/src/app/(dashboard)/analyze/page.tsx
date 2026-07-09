"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUploader from "@/components/ResumeUploader";
import JDInput from "@/components/JDInput";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  { label: "上传简历", key: "upload" },
  { label: "职位描述", key: "jd" },
  { label: "分析中", key: "processing" },
  { label: "结果", key: "results" },
] as const;

const PROCESSING_STAGES = [
  { text: "📄 解析简历中...", duration: 2500 },
  { text: "🔍 提取技能...", duration: 2500 },
  { text: "📊 分析匹配度...", duration: 2500 },
  { text: "✍️ 生成建议...", duration: 2500 },
] as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StepKey = (typeof STEPS)[number]["key"];

/* ------------------------------------------------------------------ */
/*  Stepper                                                            */
/* ------------------------------------------------------------------ */

function Stepper({ current }: { current: StepKey }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="分析步骤" className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const isActive = i === currentIdx;
          const isCompleted = i < currentIdx;

          return (
            <li
              key={step.key}
              className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
                    isCompleted && "bg-blue-600 text-white",
                    isActive && "bg-blue-100 text-blue-700 ring-2 ring-blue-600",
                    !isCompleted && !isActive && "bg-gray-100 text-gray-400",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={[
                    "mt-1.5 text-xs font-medium",
                    isActive ? "text-blue-700" : isCompleted ? "text-blue-600" : "text-gray-400",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={[
                    "mx-2 mb-6 h-0.5 flex-1 transition-all",
                    isCompleted ? "bg-blue-600" : "bg-gray-200",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Processing Animation                                               */
/* ------------------------------------------------------------------ */

function ProcessingView({ analysisId }: { analysisId: string | null }) {
  const [stageIdx, setStageIdx] = useState(0);
  const router = useRouter();

  React.useEffect(() => {
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout>;

    const run = async () => {
      // Animate through stages
      for (let i = 0; i < PROCESSING_STAGES.length; i++) {
        if (!mounted) return;
        setStageIdx(i);
        await new Promise<void>((resolve) => {
          timeout = setTimeout(resolve, PROCESSING_STAGES[i].duration);
        });
      }

      if (mounted && analysisId) {
        router.push(`/analyze/${analysisId}`);
      }
    };

    run();
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [analysisId, router]);

  const progress = ((stageIdx + 1) / PROCESSING_STAGES.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-gray-200 bg-white px-8 py-16 shadow-sm">
      {/* Animated dots */}
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-600"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      {/* Current stage */}
      <p className="text-lg font-medium text-gray-800 transition-all">
        {PROCESSING_STAGES[stageIdx]?.text || "准备中..."}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-2 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-gray-500">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AnalyzePage() {
  const [step, setStep] = useState<StepKey>("upload");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleResumeUploaded = useCallback((id: string) => {
    setResumeId(id);
    setStep("jd");
  }, []);

  const handleJdSubmit = useCallback(
    async (data: { jdText: string; jobTitle: string; companyName: string }) => {
      if (!resumeId) return;

      setApiError(null);
      setStep("processing");

      try {
        const res = await fetch("/api/analyses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId,
            jdText: data.jdText,
            jobTitle: data.jobTitle,
            companyName: data.companyName,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "分析请求失败，请稍后重试");
        }

        const result = await res.json();
        setAnalysisId(result.analysisId);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "分析请求失败，请稍后重试");
        setStep("jd");
      }
    },
    [resumeId],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">简历分析</h1>
      <p className="mb-8 text-sm text-gray-500">
        上传简历并粘贴职位描述，AI 将为你生成精准的匹配度分析
      </p>

      <Stepper current={step} />

      {/* API error banner */}
      {apiError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {apiError}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            第一步：上传简历
          </h2>
          <ResumeUploader onUploaded={handleResumeUploaded} />
        </div>
      )}

      {/* Step 2: JD Input */}
      {step === "jd" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            第二步：粘贴职位描述
          </h2>
          <JDInput onSubmit={handleJdSubmit} />
        </div>
      )}

      {/* Step 3: Processing */}
      {step === "processing" && <ProcessingView analysisId={analysisId} />}
    </div>
  );
}
