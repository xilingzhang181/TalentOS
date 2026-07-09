"use client";

import React, { useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 10_000;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface JDInputProps {
  /** Called when the user submits a valid job description. */
  onSubmit?: (data: {
    jdText: string;
    jobTitle: string;
    companyName: string;
  }) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function JDInput({ onSubmit }: JDInputProps) {
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jdError, setJdError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const charCount = jdText.length;
  const isTooShort = jdText.length > 0 && jdText.length < MIN_JD_LENGTH;
  const isValid = jdText.length >= MIN_JD_LENGTH && jdText.length <= MAX_JD_LENGTH;

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_JD_LENGTH) {
        setJdText(value);
        if (jdError) setJdError(null);
      }
    },
    [jdError],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (jdText.trim().length < MIN_JD_LENGTH) {
        setJdError(`职位描述至少需要 ${MIN_JD_LENGTH} 个字符`);
        return;
      }

      setJdError(null);
      setSubmitting(true);

      try {
        onSubmit?.({
          jdText: jdText.trim(),
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [jdText, jobTitle, companyName, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Job title + company */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="职位名称（可选）"
          placeholder="例：高级前端工程师"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          maxLength={100}
        />
        <Input
          label="公司名称（可选）"
          placeholder="例：字节跳动"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* JD textarea */}
      <div className="w-full">
        <label htmlFor="jd-textarea" className="mb-1.5 block text-sm font-medium text-gray-700">
          职位描述 <span className="text-red-500">*</span>
        </label>

        <textarea
          id="jd-textarea"
          value={jdText}
          onChange={handleTextChange}
          placeholder="粘贴职位描述"
          rows={10}
          aria-invalid={!!jdError}
          aria-describedby="jd-char-count jd-error"
          className={[
            "flex w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900",
            "placeholder:text-gray-400 resize-y",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            jdError
              ? "border-red-400 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500",
          ].join(" ")}
        />

        {/* Char count + error */}
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {jdError && (
              <p id="jd-error" className="text-sm text-red-600" role="alert">
                {jdError}
              </p>
            )}
          </div>
          <p
            id="jd-char-count"
            className={[
              "text-sm tabular-nums",
              isTooShort ? "text-amber-600" : "text-gray-400",
            ].join(" ")}
          >
            {charCount.toLocaleString()} / {MAX_JD_LENGTH.toLocaleString()}
            {isTooShort && (
              <span className="ml-1 text-xs">(至少还需 {MIN_JD_LENGTH - charCount} 字)</span>
            )}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">AI 将在 60 秒内完成分析</p>
        <Button
          type="submit"
          disabled={!isValid || submitting}
          loading={submitting}
        >
          开始分析
        </Button>
      </div>
    </form>
  );
}
