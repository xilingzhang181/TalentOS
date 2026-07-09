/**
 * GET /api/matches
 *
 * List matches for the authenticated user with pagination and filtering.
 *
 * Auth: Clerk (required)
 * Query params:
 *   page      - Page number (default: 1)
 *   limit     - Results per page (default: 20, max: 100)
 *   min_score - Minimum match score filter
 *   status    - Filter by match status (new, viewed, applied, dismissed)
 *   search    - Search by job title or company name
 *
 * Returns paginated results sorted by score DESC with meta info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// ─── Response Helpers ────────────────────────────────────────────────────────

function successResponse<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, data, meta }, { status });
}

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_STATUSES = ['new', 'viewed', 'applied', 'dismissed'] as const;

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // ── 1. Authenticate ────────────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('Authentication required. Please sign in.', 401);
    }

    // ── 2. Parse query params ──────────────────────────────────────────
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    );
    const minScoreParam = searchParams.get('min_score');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search')?.trim() || '';

    const minScore = minScoreParam ? parseFloat(minScoreParam) : undefined;
    if (minScoreParam && (isNaN(minScore!) || minScore! < 0 || minScore! > 100)) {
      return errorResponse('min_score must be a number between 0 and 100.', 400);
    }

    if (statusParam && !VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number])) {
      return errorResponse(
        `Invalid status: ${statusParam}. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400,
      );
    }

    const status = statusParam as typeof VALID_STATUSES[number] | undefined;

    // ── 3. Build where clause ──────────────────────────────────────────
    const where: Record<string, unknown> = { userId };

    if (minScore !== undefined) {
      where.score = { gte: minScore };
    }

    if (status) {
      where.status = status;
    }

    // Search by job title or company (via relation filter)
    if (searchParam) {
      where.job = {
        OR: [
          { title: { contains: searchParam, mode: 'insensitive' } },
          { company: { contains: searchParam, mode: 'insensitive' } },
        ],
      };
    }

    // ── 4. Fetch paginated results with count ──────────────────────────
    const offset = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      db.match.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              remotePolicy: true,
            },
          },
        },
      }),
      db.match.count({ where }),
    ]);

    const hasMore = offset + matches.length < total;

    // ── 5. Return paginated results ────────────────────────────────────
    return successResponse(
      matches.map((m) => ({
        id: m.id,
        score: m.score,
        semantic_score: m.semanticScore,
        skills_score: m.skillsScore,
        status: m.status,
        created_at: m.createdAt,
        job: m.job,
      })),
      {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit),
      },
    );
  } catch (err) {
    console.error('[api/matches] Unexpected error:', err);
    return errorResponse('An internal server error occurred.', 500);
  }
}
