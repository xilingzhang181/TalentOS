/**
 * POST /api/resumes/upload
 *
 * Upload a resume file (PDF or DOCX), parse it, and store the record.
 *
 * Auth: Clerk (required)
 * Body: multipart/form-data with a "file" field
 * Returns: { resume_id, status, file_name, created_at }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createResume } from '@/lib/db';
import { parseDocument } from '@/lib/file-parser';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

// ─── Response Helpers ────────────────────────────────────────────────────────

function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate ────────────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('Authentication required. Please sign in.', 401);
    }

    // ── 2. Parse form data ─────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse('Invalid form data. Expected multipart/form-data.', 400);
    }

    const file = formData.get('file');

    // ── 3. Validate file exists ────────────────────────────────────────
    if (!file || !(file instanceof File)) {
      return errorResponse('No file provided. Please upload a resume file.', 400);
    }

    if (file.size === 0) {
      return errorResponse('The uploaded file is empty.', 400);
    }

    // ── 4. Validate file type ──────────────────────────────────────────
    const mimeType = file.type;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return errorResponse(
        `Unsupported file type: ${mimeType || 'unknown'}. ` +
        'Only PDF and DOCX files are accepted.',
        400,
      );
    }

    // ── 5. Validate file size ──────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return errorResponse(
        `File too large (${sizeMB} MB). Maximum allowed size is 10 MB.`,
        400,
      );
    }

    // ── 6. Read file buffer ────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── 7. Parse document ──────────────────────────────────────────────
    let parsed;
    try {
      parsed = await parseDocument(buffer, mimeType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse document.';
      console.error('[api/resumes/upload] Parse error:', msg);
      return errorResponse(`Document parsing failed: ${msg}`, 422);
    }

    // ── 8. Build a temporary file URL ──────────────────────────────────
    // In production, upload to S3/Blob storage and use the returned URL.
    // For now, store a placeholder path that includes the user and filename.
    const ext = MIME_TYPE_EXTENSIONS[mimeType] ?? '.bin';
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileUrl = `local://${userId}/${Date.now()}-${safeFileName}`;

    // ── 9. Create resume record in DB ──────────────────────────────────
    const resume = await createResume({
      userId,
      fileUrl,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType,
      rawText: parsed.raw_text,
    });

    console.log(
      `[api/resumes/upload] Resume ${resume.id} created for user ${userId} ` +
      `(${file.name}, ${parsed.metadata.word_count} words, ` +
      `confidence=${parsed.metadata.confidence})`,
    );

    // ── 10. Return result ──────────────────────────────────────────────
    return successResponse({
      resume_id: resume.id,
      status: resume.status,
      file_name: resume.fileName,
      created_at: resume.createdAt,
      parse_info: {
        word_count: parsed.metadata.word_count,
        confidence: parsed.metadata.confidence,
        sections_found: Object.keys(parsed.sections),
        warnings: parsed.warnings,
      },
    }, 201);
  } catch (err) {
    console.error('[api/resumes/upload] Unexpected error:', err);
    return errorResponse('An internal server error occurred.', 500);
  }
}
