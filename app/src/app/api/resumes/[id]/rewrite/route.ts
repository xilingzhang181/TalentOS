/**
 * POST /api/resumes/[id]/rewrite
 *
 * Generate AI-powered rewrite suggestions for specific resume sections.
 * Requires a previous analysis to exist for the resume.
 *
 * Auth: Clerk (required)
 * Body: { sections?, tone? }
 *   sections - Array of section names to rewrite (default: ["summary", "experience", "skills"])
 *   tone     - Writing tone: "professional" | "concise" | "detailed" (default: "professional")
 *
 * Returns: Rewrites array with original/rewritten content
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, findResumeById, listAnalysesByResume } from '@/lib/db';
import { generateRewrites } from '@/lib/ai-pipeline';

// ─── Response Helpers ────────────────────────────────────────────────────────

function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VALID_SECTIONS = new Set(['summary', 'experience', 'skills', 'education', 'projects']);
const VALID_TONES = new Set(['professional', 'concise', 'detailed']);
const DEFAULT_SECTIONS = ['summary', 'experience', 'skills'];
const DEFAULT_TONE = 'professional';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RewriteRequestBody {
  sections?: string[];
  tone?: string;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // ── 1. Authenticate ────────────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('Authentication required. Please sign in.', 401);
    }

    // ── 2. Validate param ──────────────────────────────────────────────
    const { id } = await params;
    if (!id) {
      return errorResponse('Resume ID is required.', 400);
    }

    // ── 3. Parse and validate body ─────────────────────────────────────
    let body: RewriteRequestBody = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable — use defaults
      body = {};
    }

    // Validate sections
    const sections = body.sections ?? DEFAULT_SECTIONS;
    if (!Array.isArray(sections) || sections.length === 0) {
      return errorResponse('sections must be a non-empty array of section names.', 400);
    }

    const invalidSections = sections.filter((s) => !VALID_SECTIONS.has(s));
    if (invalidSections.length > 0) {
      return errorResponse(
        `Invalid sections: ${invalidSections.join(', ')}. ` +
        `Valid options: ${Array.from(VALID_SECTIONS).join(', ')}`,
        400,
      );
    }

    // Validate tone
    const tone = (body.tone ?? DEFAULT_TONE) as 'professional' | 'concise' | 'detailed';
    if (body.tone && !VALID_TONES.has(body.tone)) {
      return errorResponse(
        `Invalid tone: ${body.tone}. Must be one of: ${Array.from(VALID_TONES).join(', ')}`,
        400,
      );
    }

    // ── 4. Verify resume ownership ─────────────────────────────────────
    const resume = await findResumeById(id, userId);
    if (!resume) {
      const anyResume = await findResumeById(id);
      if (anyResume) {
        return errorResponse('You do not have permission to rewrite this resume.', 403);
      }
      return errorResponse('Resume not found.', 404);
    }

    // ── 5. Fetch latest analysis ───────────────────────────────────────
    const analyses = await listAnalysesByResume(id, 1);
    const latestAnalysis = analyses[0];

    if (!latestAnalysis) {
      return errorResponse(
        'No analysis found for this resume. Please run an analysis first before requesting rewrites.',
        400,
      );
    }

    // ── 6. Get feedback and JD parsed data from the analysis ───────────
    const feedbackJson = latestAnalysis.feedbackJson;
    const jobDescriptionId = latestAnalysis.jobDescriptionId;

    if (!feedbackJson) {
      return errorResponse(
        'The latest analysis is missing feedback data. Please re-run the analysis.',
        400,
      );
    }

    // Fetch the job description's parsed JSON
    let jdParsed: unknown = null;
    if (jobDescriptionId) {
      const jd = await db.jobDescription.findUnique({
        where: { id: jobDescriptionId },
        select: { parsedJson: true },
      });
      jdParsed = jd?.parsedJson ?? null;
    }

    if (!jdParsed) {
      return errorResponse(
        'The job description data is missing. Please re-run the analysis.',
        400,
      );
    }

    // ── 7. Call generateRewrites ────────────────────────────────────────
    console.log(
      `[api/resumes/${id}/rewrite] Generating rewrites for sections: ${sections.join(', ')} ` +
      `with tone: ${tone}`,
    );

    const rewriteResult = await generateRewrites(
      {
        parsedJson: resume.parsedJson,
        rawText: resume.rawText,
      },
      jdParsed,
      feedbackJson,
      sections,
      tone,
    );

    if (rewriteResult.status === 'error') {
      console.error('[api/resumes/[id]/rewrite] Rewrite generation failed:', rewriteResult.error);
      return errorResponse(
        `Rewrite generation failed: ${rewriteResult.error}`,
        500,
      );
    }

    console.log(
      `[api/resumes/${id}/rewrite] Completed in ${rewriteResult.time_ms}ms, ` +
      `cost: ${rewriteResult.cost_cents} cents`,
    );

    // ── 8. Return result ───────────────────────────────────────────────
    return successResponse({
      resume_id: id,
      rewrites: rewriteResult.data?.rewrites ?? [],
      full_rewritten_resume: rewriteResult.data?.full_rewritten_resume ?? null,
      meta: {
        sections,
        tone,
        processing_time_ms: rewriteResult.time_ms,
        cost_cents: rewriteResult.cost_cents,
      },
    }, 201);
  } catch (err) {
    console.error('[api/resumes/[id]/rewrite] Unexpected error:', err);
    return errorResponse('An internal server error occurred.', 500);
  }
}
