"use client";

import React, { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { DimensionScore, Confidence } from "@/components/AnalysisResults";
import type { RewriteSection } from "@/lib/ai-pipeline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ReportExportProps {
  /** Analysis overall score (0-100). */
  overallScore: number;
  /** Five-dimension breakdown. */
  dimensions: DimensionScore[];
  /** Strengths list. */
  strengths: string[];
  /** Gaps list. */
  gaps: string[];
  /** Action items. */
  actionItems: { text: string; effort: string; impact: string }[];
  /** Optional accepted rewrite snippets for before/after section. */
  acceptedRewrites?: RewriteSection[];
  /** Resume filename for the report title. */
  resumeFilename?: string;
  /** Target job title. */
  jobTitle?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Score color helpers                                                */
/* ------------------------------------------------------------------ */

function scoreColorHex(score: number): string {
  if (score < 30) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#10b981";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "强匹配";
  if (score >= 60) return "较好匹配";
  if (score >= 40) return "一般匹配";
  return "匹配度低";
}

const confidenceLabel: Record<Confidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

/* ------------------------------------------------------------------ */
/*  Report HTML generator                                              */
/* ------------------------------------------------------------------ */

function buildReportHTML(props: ReportExportProps): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  const dimensionsHTML = props.dimensions
    .map(
      (d) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;color:#374151">${d.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;background:${
            d.confidence === "high"
              ? "#dcfce7"
              : d.confidence === "medium"
                ? "#fef3c7"
                : "#f3f4f6"
          };color:${
            d.confidence === "high"
              ? "#166534"
              : d.confidence === "medium"
                ? "#92400e"
                : "#6b7280"
          }">置信度 ${confidenceLabel[d.confidence]}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:${scoreColorHex(d.score)}">${Math.round(d.score)}</td>
      </tr>`,
    )
    .join("");

  const strengthsHTML = props.strengths
    .map(
      (s) =>
        `<li style="margin-bottom:8px;padding:10px 14px;background:#f0fdf4;border-radius:8px;color:#166534;font-size:14px">${s}</li>`,
    )
    .join("");

  const gapsHTML = props.gaps
    .map(
      (g) =>
        `<li style="margin-bottom:8px;padding:10px 14px;background:#fffbeb;border-radius:8px;color:#92400e;font-size:14px">${g}</li>`,
    )
    .join("");

  const actionsHTML = props.actionItems
    .map(
      (item, i) =>
        `<li style="margin-bottom:8px;padding:10px 14px;background:#f9fafb;border-radius:8px;font-size:14px;color:#374151">
          <strong style="color:#2563eb">${i + 1}.</strong> ${item.text}
          <span style="margin-left:8px;font-size:12px;color:#6b7280">难度: ${item.effort} / 影响: ${item.impact}</span>
        </li>`,
    )
    .join("");

  let rewritesHTML = "";
  if (props.acceptedRewrites && props.acceptedRewrites.length > 0) {
    const rows = props.acceptedRewrites
      .map(
        (r) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;vertical-align:top;color:#374151;white-space:nowrap">${r.section}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;color:#991b1b;background:#fef2f2;font-size:13px;white-space:pre-wrap">${escapeHtml(r.original)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;color:#166534;background:#f0fdf4;font-size:13px;white-space:pre-wrap">${escapeHtml(r.rewritten)}</td>
        </tr>`,
      )
      .join("");

    rewritesHTML = `
      <div style="margin-top:36px">
        <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:12px;border-bottom:2px solid #e5e7eb;padding-bottom:8px">简历修改前后对比</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb">章节</th>
              <th style="padding:10px 12px;text-align:left;font-weight:600;color:#991b1b;border-bottom:2px solid #e5e7eb">原文</th>
              <th style="padding:10px 12px;text-align:left;font-weight:600;color:#166534;border-bottom:2px solid #e5e7eb">优化后</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TalentOS 分析报告 - ${props.resumeFilename ?? "简历"}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 20mm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0; padding: 40px; background: white; color: #111827;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;padding-bottom:16px;border-bottom:3px solid #2563eb">
    <div>
      <div style="font-size:24px;font-weight:800;color:#2563eb;letter-spacing:-0.5px">TalentOS</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px">AI 职业分析平台</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:14px;color:#6b7280">生成日期</div>
      <div style="font-size:14px;font-weight:600;color:#111827">${dateStr}</div>
      ${props.resumeFilename ? `<div style="font-size:12px;color:#9ca3af;margin-top:2px">${escapeHtml(props.resumeFilename)}</div>` : ""}
      ${props.jobTitle ? `<div style="font-size:12px;color:#9ca3af">目标岗位: ${escapeHtml(props.jobTitle)}</div>` : ""}
    </div>
  </div>

  <!-- Overall Score -->
  <div style="text-align:center;margin:32px 0;padding:28px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb">
    <div style="font-size:14px;color:#6b7280;margin-bottom:4px">综合匹配度</div>
    <div style="font-size:56px;font-weight:800;color:${scoreColorHex(props.overallScore)};line-height:1">${Math.round(props.overallScore)}</div>
    <div style="font-size:14px;color:#6b7280;margin-top:4px">${scoreLabel(props.overallScore)}</div>
  </div>

  <!-- Five-dimension breakdown -->
  <div style="margin-top:28px">
    <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:12px;border-bottom:2px solid #e5e7eb;padding-bottom:8px">五维匹配分析</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb">维度</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb">置信度</th>
          <th style="padding:10px 12px;text-align:right;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb">得分</th>
        </tr>
      </thead>
      <tbody>${dimensionsHTML}</tbody>
    </table>
  </div>

  <!-- Strengths & Gaps -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px">
    <div>
      <h2 style="font-size:18px;font-weight:700;color:#166534;margin-bottom:12px;border-bottom:2px solid #bbf7d0;padding-bottom:8px">核心优势</h2>
      <ul style="list-style:none;padding:0;margin:0">${strengthsHTML}</ul>
    </div>
    <div>
      <h2 style="font-size:18px;font-weight:700;color:#92400e;margin-bottom:12px;border-bottom:2px solid #fde68a;padding-bottom:8px">关键差距</h2>
      <ul style="list-style:none;padding:0;margin:0">${gapsHTML}</ul>
    </div>
  </div>

  <!-- Action Items -->
  ${props.actionItems.length > 0 ? `
  <div style="margin-top:28px">
    <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:12px;border-bottom:2px solid #e5e7eb;padding-bottom:8px">改进建议</h2>
    <ul style="list-style:none;padding:0;margin:0">${actionsHTML}</ul>
  </div>` : ""}

  <!-- Rewrite before/after -->
  ${rewritesHTML}

  <!-- Footer -->
  <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center">
    <p style="font-size:12px;color:#9ca3af">本报告由 TalentOS AI 自动生成，仅供参考</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function ReportExport({
  overallScore,
  dimensions,
  strengths,
  gaps,
  actionItems,
  acceptedRewrites,
  resumeFilename,
  jobTitle,
  className,
}: ReportExportProps) {
  const handlePrint = useCallback(() => {
    const html = buildReportHTML({
      overallScore,
      dimensions,
      strengths,
      gaps,
      actionItems,
      acceptedRewrites,
      resumeFilename,
      jobTitle,
    });

    // Open in a new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Slight delay to let the document render before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }, [
    overallScore,
    dimensions,
    strengths,
    gaps,
    actionItems,
    acceptedRewrites,
    resumeFilename,
    jobTitle,
  ]);

  return (
    <Button variant="outline" onClick={handlePrint} className={className}>
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
          d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.424 48.424 0 018.5 0m-8.5 0V6.375c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.104"
        />
      </svg>
      下载分析报告
    </Button>
  );
}

ReportExport.displayName = "ReportExport";

export { ReportExport };
