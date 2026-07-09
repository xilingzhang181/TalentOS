/**
 * GET /api/resumes/[id]
 *
 * Fetch a single resume with its parsed JSON and analysis history.
 *
 * Auth: Clerk (required)
 * Returns: Full resume object including parsed_json
 * Status: 404 if not found, 403 if not the owner
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { findResumeById, listAnalysesByResume } from '@/lib/db';

// ─── Response Helpers ────────────────────────────────────────────────────────

function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
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

    // ── 3. Fetch resume with ownership check ───────────────────────────
    const resume = await findResumeById(id, userId);
    if (!resume) {
      // Check if the resume exists but belongs to another user
      const anyResume = await findResumeById(id);
      if (anyResume) {
        return errorResponse('You do not have permission to access this resume.', 403);
      }
      return errorResponse('Resume not found.', 404);
    }

    // ── 4. Fetch associated analyses ───────────────────────────────────
    const analyses = await listAnalysesByResume(id, 10);

    // ── 5. Return full resume data ─────────────────────────────────────
    return successResponse({
      id: resume.id,
      file_name: resume.fileName,
      file_size_bytes: resume.fileSizeBytes,
      mime_type: resume.mimeType,
      status: resume.status,
      parsed_json: resume.parsedJson,
      error_message: resume.errorMessage,
      created_at: resume.createdAt,
      updated_at: resume.updatedAt,
      analyses: analyses.map((a) => ({
        id: a.id,
        match_score: a.matchScore,
        feedback: a.feedback,
        feedback_json: a.feedbackJson,
        processing_time_ms: a.processingTimeMs,
        model_used: a.modelUsed,
        cost_cents: a.costCents,
        created_at: a.createdAt,
        job_description: a.jobDescription,
        skill_gaps: a.skillGaps,
      })),
    });
  } catch (err) {
    console.error('[api/resumes/[id]] Unexpected error:', err);
    return errorResponse('An internal server error occurred.', 500);
  }
}
