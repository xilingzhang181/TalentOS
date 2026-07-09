"use client";

import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineLoader } from "@/components/LoadingStates";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ShareableLinkProps {
  /** Analysis or resume ID to create a shareable link for. */
  analysisId: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function ShareableLink({ analysisId, className }: ShareableLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Generate shareable link
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/analyses/${analysisId}/share`, {
        method: "POST",
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? `生成分享链接失败 (${response.status})`);
      }

      // Build the shareable URL
      const data = body.data ?? body;
      const token = data.share_token ?? data.token ?? analysisId;
      const url = `${window.location.origin}/shared/${token}`;
      setShareUrl(url);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成分享链接时发生错误");
    } finally {
      setIsGenerating(false);
    }
  }, [analysisId]);

  // --- Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select input text
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [shareUrl]);

  return (
    <div className={cn("inline-flex", className)}>
      {/* Trigger button */}
      {!isOpen && (
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <InlineLoader size="sm" />
              生成中...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                />
              </svg>
              分享分析
            </>
          )}
        </Button>
      )}

      {/* Shareable link panel */}
      {isOpen && (
        <div
          className={cn(
            "rounded-xl border border-gray-200 bg-white p-4 shadow-sm",
            "animate-in fade-in slide-in-from-top-1 duration-200",
            "w-full max-w-md",
          )}
          role="region"
          aria-label="分享链接"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                分享链接已生成
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShareUrl(null);
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="关闭分享面板"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* URL input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={shareUrl ?? ""}
              readOnly
              aria-label="分享链接"
              className="font-mono text-xs bg-gray-50"
            />
            <Button
              size="sm"
              onClick={handleCopy}
              className={cn(
                "shrink-0 transition-colors",
                copied && "bg-green-600 hover:bg-green-700",
              )}
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  已复制!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  复制
                </>
              )}
            </Button>
          </div>

          {/* Success toast */}
          {copied && (
            <div
              className="mt-2 flex items-center gap-1.5 text-xs text-green-600"
              role="status"
              aria-live="polite"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              链接已复制!
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>
          )}

          {/* Privacy note */}
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-gray-400">
            <svg className="mt-0.5 h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            分享链接不包含个人信息
          </p>
        </div>
      )}
    </div>
  );
}

ShareableLink.displayName = "ShareableLink";

export { ShareableLink };
