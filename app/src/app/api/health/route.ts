/**
 * GET /api/health
 *
 * Health check endpoint. Verifies database connectivity and returns status.
 * No authentication required.
 *
 * Returns: { status, timestamp, version, db }
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Response Helpers ────────────────────────────────────────────────────────

function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: string, status = 500) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version ?? '0.1.0';

  try {
    // Check database connectivity with a lightweight query
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1 AS health_check`;
    const dbLatencyMs = Date.now() - dbStart;

    return successResponse({
      status: 'ok',
      timestamp,
      version,
      db: {
        status: 'connected',
        latency_ms: dbLatencyMs,
      },
      environment: process.env.NODE_ENV ?? 'unknown',
    });
  } catch (err) {
    console.error('[api/health] Database connection failed:', err);

    const errorMsg = err instanceof Error ? err.message : 'Database connection failed';

    return errorResponse(
      `Service degraded: ${errorMsg}`,
      503,
    );
  }
}
