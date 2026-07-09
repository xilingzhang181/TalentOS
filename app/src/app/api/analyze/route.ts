/**
 * POST /api/analyze
 *
 * Run the full AI analysis pipeline for a resume against a job description.
 *
 * Auth: Clerk (required)
 * Body: { resume_id, jd_text, jd_title?, jd_company? }
 *
 * Pipeline steps:
 *   1. Verify resume ownership
 *   2. Create job_description record
 *   3. Run runAnalysisPipeline(resume_id, jd_text)
 *   4. Store results in resume_analyses, skill_gaps, matches
 *   5. Return full analysis result
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  findResumeById,
  createJobDescription,
  createAnalysis,
  upsertMatch,
  upsertSkill,
} from '@/lib/db';
import { runAnalysisPipeline } from '@/lib/ai-pipeline';
import type { SkillGapItem } from '@/lib/ai-pipeline';

// ─── Response Helpers ────────────────────────────────────────────────────────

function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyzeRequestBody {
  resume_id?: string;
  jd_text?: string;
  jd_title?: string;
  jd_company?: string;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ── 1. Authenticate ────────────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('Authentication required. Please sign in.', 401);
    }

    // ── 2. Parse and validate body ─────────────────────────────────────
    let body: AnalyzeRequestBody;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body.', 400);
    }

    const { resume_id, jd_text, jd_title, jd_company } = body;

    if (!resume_id || typeof resume_id !== 'string') {
      return errorResponse('resume_id is required.', 400);
    }

    if (!jd_text || typeof jd_text !== 'string' || jd_text.trim().length === 0) {
      return errorResponse('jd_text is required and must be non-empty.', 400);
    }

    // ── 3. Verify resume ownership ─────────────────────────────────────
    const resume = await findResumeById(resume_id, userId);
    if (!resume) {
      const anyResume = await findResumeById(resume_id);
      if (anyResume) {
        return errorResponse('You do not have permission to analyze this resume.', 403);
      }
      return errorResponse('Resume not found.', 404);
    }

    // ── 4. Create job description record ───────────────────────────────
    const jobDescription = await createJobDescription({
      title: jd_title || 'Untitled Position',
      company: jd_company || undefined,
      rawText: jd_text.trim(),
      source: 'user_paste',
    });

    console.log(
      `[api/analyze] Starting analysis for resume ${resume_id} ` +
      `against JD ${jobDescription.id} ("${jobDescription.title}")`,
    );

    // ── 5. Mark resume as processing ───────────────────────────────────
    await db.resume.update({
      where: { id: resume_id },
      data: { status: 'processing' },
    });

    // ── 6. Run the AI pipeline ─────────────────────────────────────────
    let pipelineResult;
    try {
      pipelineResult = await runAnalysisPipeline(resume_id, jd_text.trim());
    } catch (err) {
      console.error('[api/analyze] Pipeline failed:', err);

      // Mark resume as failed
      const msg = err instanceof Error ? err.message : 'Pipeline execution failed';
      await db.resume.update({
        where: { id: resume_id },
        data: { status: 'failed', errorMessage: msg },
      });

      return errorResponse(`Analysis pipeline failed: ${msg}`, 500);
    }

    // ── 7. Store analysis results ──────────────────────────────────────
    const matchData = pipelineResult.steps.match?.data;
    const feedbackData = pipelineResult.steps.feedback?.data;
    const gapData = pipelineResult.steps.gap_analysis?.data;

    // 7a. Create resume_analyses record
    const analysis = await createAnalysis({
      resumeId: resume_id,
      jobDescriptionId: jobDescription.id,
      matchScore: matchData?.combined_score ?? undefined,
      skillsMatch: matchData
        ? {
            semantic_score: matchData.semantic_score,
            skills_score: matchData.skills_score,
            combined_score: matchData.combined_score,
          }
        : undefined,
      feedback: feedbackData?.summary ?? undefined,
      feedbackJson: feedbackData ? (feedbackData as unknown as object) : undefined,
      processingTimeMs: pipelineResult.total_time_ms,
      modelUsed: 'gpt-4o/gpt-4o-mini',
      costCents: pipelineResult.total_cost_cents,
    });

    // 7b. Store skill gaps
    if (gapData?.gaps && gapData.gaps.length > 0) {
      await storeSkillGaps(analysis.id, gapData.gaps);
    }

    // 7c. Create or update match record
    if (matchData) {
      await upsertMatch({
        userId,
        jobId: jobDescription.id,
        score: matchData.combined_score,
        semanticScore: matchData.semantic_score,
        skillsScore: matchData.skills_score,
        explanation: feedbackData?.summary ?? undefined,
        explanationJson: feedbackData ? (feedbackData as unknown as object) : undefined,
      });
    }

    // ── 8. Log cost and timing ─────────────────────────────────────────
    const totalApiTime = Date.now() - startTime;
    console.log(
      `[api/analyze] Completed in ${pipelineResult.total_time_ms}ms ` +
      `(pipeline) / ${totalApiTime}ms (total). ` +
      `Cost: ${pipelineResult.total_cost_cents} cents. ` +
      `Match score: ${matchData?.combined_score ?? 'N/A'}`,
    );

    // ── 9. Return result ───────────────────────────────────────────────
    return successResponse({
      analysis_id: analysis.id,
      resume_id,
      job_description: {
        id: jobDescription.id,
        title: jobDescription.title,
        company: jobDescription.company,
      },
      match: matchData,
      feedback: feedbackData,
      gap_analysis: gapData,
      pipeline: {
        steps_completed: Object.entries(pipelineResult.steps)
          .filter(([_, v]) => v?.status === 'success')
          .map(([k]) => k),
        steps_failed: Object.entries(pipelineResult.steps)
          .filter(([_, v]) => v?.status === 'error')
          .map(([k, v]) => ({ step: k, error: v?.error })),
        total_cost_cents: pipelineResult.total_cost_cents,
        total_time_ms: pipelineResult.total_time_ms,
      },
    }, 201);
  } catch (err) {
    console.error('[api/analyze] Unexpected error:', err);
    return errorResponse('An internal server error occurred.', 500);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Store skill gaps from pipeline output, creating Skill records as needed.
 */
async function storeSkillGaps(
  analysisId: string,
  gaps: SkillGapItem[],
): Promise<void> {
  for (const gap of gaps) {
    try {
      // Find or create the skill record
      const skill = await upsertSkill({
        name: gap.skill_name,
        category: 'technical', // Default; pipeline doesn't always specify category
      });

      // Create the skill gap record
      await db.skillGap.create({
        data: {
          analysisId,
          skillId: skill.id,
          gapType: gap.gap_type,
          requiredLevel: gap.required_level,
          currentLevel: gap.current_level,
          recommendation: gap.recommendation,
          priority: gap.priority,
        },
      });
    } catch (err) {
      console.error(
        `[api/analyze] Failed to store skill gap "${gap.skill_name}":`,
        err,
      );
      // Continue with other gaps — don't fail the whole request
    }
  }
}
