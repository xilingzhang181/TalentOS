"use client";

import React, { useCallback, useRef, useState } from "react";
import { Button } from "./ui/button";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

interface ResumeUploaderProps {
  /** Called after a successful upload with the server-assigned resume ID. */
  onUploaded?: (resumeId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    return "仅支持 PDF 和 DOCX 格式的简历文件";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `文件大小不能超过 10 MB，当前文件 ${formatFileSize(file.size)}`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ResumeUploader({ onUploaded }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  /* ------ drag handlers ------ */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((s) => (s === "uploading" ? s : "dragging"));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((s) => (s === "dragging" ? "idle" : s));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) processFile(dropped);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ------ file processing ------ */
  const processFile = useCallback(
    (selected: File) => {
      const validationError = validateFile(selected);
      if (validationError) {
        setState("error");
        setError(validationError);
        setFile(selected);
        return;
      }

      setFile(selected);
      setError(null);
      uploadFile(selected);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const uploadFile = async (selected: File) => {
    setState("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", selected);

    try {
      // Fake progress tick while the real upload runs
      const progressTimer = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 15));
      }, 400);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "上传失败，请稍后重试");
      }

      const data = await res.json();
      setProgress(100);
      setState("success");
      setResumeId(data.resumeId);
      onUploaded?.(data.resumeId);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "上传失败，请稍后重试");
    }
  };

  /* ------ click to upload ------ */
  const handleClick = () => {
    if (state !== "uploading") inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
    // reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleReset = () => {
    setState("idle");
    setProgress(0);
    setFile(null);
    setError(null);
    setResumeId(null);
  };

  /* ------ rendering ------ */
  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={state === "uploading" ? -1 : 0}
        aria-label="上传简历文件"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all",
          state === "uploading" && "pointer-events-none border-blue-300 bg-blue-50",
          state === "success" && "border-green-300 bg-green-50",
          state === "error" && "border-red-300 bg-red-50",
          state === "dragging" && "border-blue-500 bg-blue-50 scale-[1.02]",
          state === "idle" && "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Idle / dragging */}
        {(state === "idle" || state === "dragging") && (
          <>
            <svg
              className="mb-4 h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="mb-1 text-base font-medium text-gray-700">
              拖拽简历到此处，或点击上传
            </p>
            <p className="text-sm text-gray-500">
              支持 PDF、DOCX 格式，最大 10 MB
            </p>
          </>
        )}

        {/* Uploading */}
        {state === "uploading" && (
          <div className="w-full max-w-xs">
            <svg
              className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mb-2 text-sm font-medium text-gray-700">正在上传...</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(progress))}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Success */}
        {state === "success" && (
          <>
            <svg
              className="mb-4 h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mb-1 text-base font-semibold text-green-700">上传成功</p>
            <p className="text-sm text-gray-600">
              {file?.name}
              {file && <span className="ml-1 text-gray-400">({formatFileSize(file.size)})</span>}
            </p>
            {resumeId && (
              <p className="mt-1 text-xs text-gray-400">ID: {resumeId}</p>
            )}
          </>
        )}

        {/* Error */}
        {state === "error" && (
          <>
            <svg
              className="mb-4 h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="mb-1 text-base font-semibold text-red-700">上传失败</p>
            <p className="text-sm text-red-600">{error}</p>
          </>
        )}
      </div>

      {/* Error reset */}
      {state === "error" && (
        <div className="mt-3 text-center">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            重新上传
          </Button>
        </div>
      )}

      {/* Success actions */}
      {state === "success" && (
        <div className="mt-3 text-center">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            重新上传
          </Button>
        </div>
      )}

      {/* Trust signal */}
      <p className="mt-3 text-center text-xs text-gray-400" aria-live="polite">
        🔒 您的简历加密传输，处理后即删除
      </p>
    </div>
  );
}
