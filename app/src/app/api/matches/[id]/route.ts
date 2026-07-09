/**
 * GET /api/matches/[id]
 *
 * Fetch a single match with full job description and analysis data.
 * Automatically marks the match status as 'viewed'.
 *
 * Auth: Clerk (required)
 * Returns: Enriched match data with job details, analysis, skill gaps
 * Status: 404 if not found, 403 if not the owner
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

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
      return errorResponse('Match ID is required.', 400);
    }

    // ── 3. Fetch match with ownership check ────────────────────────────
    const match = await db.match.findFirst({
      where: { id, userId },
      include: {
        job: {
          include: {
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                skillGaps: {
                  orderBy: { priority: 'desc' },
                  include: { skill: { select: { id: true, name: true, category: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      // Check if it exists but belongs to another user
      const anyMatch = await db.match.findUnique({ where: { id } });
      if (anyMatch) {
        return errorResponse('You do not have permission to access this match.', 403);
      }
      return errorResponse('Match not found.', 404);
    }

    // ── 4. Mark as viewed ──────────────────────────────────────────────
    if (match.status === 'new') {
      await db.match.update({
        where: { id },
        data: { status: 'viewed' },
      });
    }

    // ── 5. Assemble enriched response ──────────────────────────────────
    const latestAnalysis = match.job.analyses[0] ?? null;

    return successResponse({
      id: match.id,
      score: match.score,
      semantic_score: match.semanticScore,
      skills_score: match.skillsScore,
      explanation: match.explanation,
      explanation_json: match.explanationJson,
      status: 'viewed', // Updated
      created_at: match.createdAt,
      job: {
        id: match.job.id,
        title: match.job.title,
        company: match.job.company,
        location: match.job.location,
        remote_policy: match.job.remotePolicy,
        salary_min: match.job.salaryMin,
        salary_max: match.job.salaryMax,
        source: match.job.source,
      },
      analysis: latestAnalysis
        ? {
            id: latestAnalysis.id,
            match_score: latestAnalysis.matchScore,
            feedback: latestAnalysis.feedback,
            feedback_json: latestAnalysis.feedbackJson,
            skills_match: latestAnalysis.skillsMatch,
            processing_time_ms: latestAnalysis.processingTimeMs,
            model_used: latestAnalysis.modelUsed,
            cost_cents: latestAnalysis.costCents,
            created_at: latestAnalysis.createdAt,
          }
        : null,
      skill_gaps: latestAnalysis?.skillGaps.map((gap) => ({
        id: gap.id,
        skill_name: gap.skill.name,
        skill_category: gap.skill.category,
        gap_type: gap.gapType,
        required_level: gap.requiredLevel,
        current_level: gap.currentLevel,
        recommendation: gap.recommendation,
        priority: gap.priority,
      })) ?? [],
    });
  } catch (err) {
    console.error('[api/matches/[id]] Unexpected error:', err);
    return errorResponse('An internal server error occurred.', 500);
  }
}
