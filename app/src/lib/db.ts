/**
 * Database Client — Prisma singleton with common query helpers.
 *
 * Exports the PrismaClient instance and typed convenience wrappers
 * for the most frequent queries in TalentOS.
 *
 * NOTE: The Prisma schema outputs the generated client to `src/generated/prisma`
 * (configured via `output = "../src/generated/prisma"` in schema.prisma).
 * Always run `npx prisma generate` after changing the schema.
 *
 * Prisma 7 uses a driver-adapter pattern. The `PrismaPg` adapter wraps
 * a `pg.Pool` and is passed as `adapter` to `PrismaClient`.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type User,
  type Resume,
  type JobDescription,
  type Skill,
  type UserSkill,
  type ResumeAnalysis,
  type SkillGap,
  type Match,
} from '../generated/prisma/client';
import type {
  CareerStage,
  ResumeStatus,
  RemotePolicy,
  JobSource,
  SkillCategory,
  SkillSource,
  GapType,
  MatchStatus,
} from '../generated/prisma/client';

// Re-export model types for downstream consumers.
export type { User, Resume, JobDescription, Skill, UserSkill, ResumeAnalysis, SkillGap, Match };
export type { CareerStage, ResumeStatus, RemotePolicy, JobSource, SkillCategory, SkillSource, GapType, MatchStatus };

// ─── Singleton ──────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Singleton PrismaClient instance.
 *
 * In development, attach to `globalThis` so hot-reloads do not create
 * a new connection pool per module reload.
 *
 * Prisma 7 requires a driver adapter (PrismaPg) which wraps a pg.Pool.
 * The connection string is read from `DATABASE_URL`.
 */
export const db: PrismaClient =
  globalForPrisma.prisma ??
  (() => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set. Add it to your .env.local file.',
      );
    }
    const adapter = new PrismaPg(databaseUrl);
    return new PrismaClient({ adapter });
  })();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// ─── User Helpers ───────────────────────────────────────────────────────────

/**
 * Find a user by email address.
 *
 * @returns The user record, or `null` if not found.
 */
export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

/**
 * Find a user by primary key.
 */
export async function findUserById(id: string) {
  return db.user.findUnique({ where: { id } });
}

/**
 * Create a new user.
 */
export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  careerStage?: 'student' | 'early_career' | 'mid_career' | 'senior' | 'executive' | 'career_change';
  targetRole?: string;
}) {
  return db.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      careerStage: data.careerStage ?? 'mid_career',
      targetRole: data.targetRole ?? null,
    },
  });
}

// ─── Resume Helpers ─────────────────────────────────────────────────────────

/**
 * Find a resume by ID, optionally scoped to a specific user.
 */
export async function findResumeById(id: string, userId?: string) {
  return db.resume.findFirst({
    where: userId ? { id, userId } : { id },
  });
}

/**
 * Create a resume record after file upload.
 */
export async function createResume(data: {
  userId: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  rawText?: string;
}) {
  return db.resume.create({
    data: {
      userId: data.userId,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes,
      mimeType: data.mimeType,
      rawText: data.rawText ?? null,
      status: data.rawText ? 'uploaded' : 'failed',
    },
  });
}

/**
 * Update resume status after processing.
 */
export async function updateResumeStatus(
  id: string,
  status: 'uploaded' | 'processing' | 'processed' | 'failed',
  extras?: { parsedJson?: object; errorMessage?: string },
) {
  return db.resume.update({
    where: { id },
    data: {
      status,
      ...(extras?.parsedJson !== undefined && { parsedJson: extras.parsedJson }),
      ...(extras?.errorMessage !== undefined && { errorMessage: extras.errorMessage }),
    },
  });
}

/**
 * List resumes for a user, ordered by creation date.
 */
export async function listResumesByUser(userId: string, limit = 20, offset = 0) {
  return db.resume.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    select: {
      id: true,
      fileName: true,
      fileSizeBytes: true,
      mimeType: true,
      status: true,
      errorMessage: true,
      createdAt: true,
    },
  });
}

// ─── Job Description Helpers ────────────────────────────────────────────────

/**
 * Create a job description record from user-pasted or scraped text.
 */
export async function createJobDescription(data: {
  title: string;
  company?: string;
  rawText: string;
  source?: 'manual' | 'linkedin' | 'indeed' | 'glassdoor' | 'api' | 'user_paste';
  sourceUrl?: string;
}) {
  return db.jobDescription.create({
    data: {
      title: data.title,
      company: data.company ?? 'Unknown',
      rawText: data.rawText,
      source: data.source ?? 'user_paste',
      sourceUrl: data.sourceUrl ?? null,
    },
  });
}

/**
 * Update a JD with parsed JSON and embedding after AI processing.
 */
export async function updateJobDescription(
  id: string,
  data: {
    parsedJson?: object;
    embeddingVector?: string; // Raw pgvector literal, e.g. "[0.1, 0.2, ...]"
    title?: string;
    company?: string;
    location?: string;
    remotePolicy?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
    salaryMin?: number;
    salaryMax?: number;
  },
) {
  return db.jobDescription.update({
    where: { id },
    data,
  });
}

// ─── Skill Helpers ──────────────────────────────────────────────────────────

/**
 * Find or create a skill by canonical name.
 */
export async function upsertSkill(data: {
  name: string;
  category: 'technical' | 'language' | 'tool' | 'framework' | 'methodology' | 'soft_skill' | 'certification' | 'domain_knowledge';
  aliases?: string[];
}) {
  return db.skill.upsert({
    where: { name: data.name },
    update: { aliases: data.aliases ?? [] },
    create: {
      name: data.name,
      category: data.category,
      aliases: data.aliases ?? [],
    },
  });
}

/**
 * Find a skill by name (case-insensitive via exact match).
 */
export async function findSkillByName(name: string) {
  return db.skill.findUnique({ where: { name } });
}

// ─── Analysis Helpers ───────────────────────────────────────────────────────

/**
 * Create a resume analysis record.
 */
export async function createAnalysis(data: {
  resumeId: string;
  jobDescriptionId?: string;
  matchScore?: number;
  skillsMatch?: object;
  feedback?: string;
  feedbackJson?: object;
  processingTimeMs?: number;
  modelUsed?: string;
  costCents?: number;
}) {
  return db.resumeAnalysis.create({
    data: {
      resumeId: data.resumeId,
      jobDescriptionId: data.jobDescriptionId ?? null,
      matchScore: data.matchScore ?? null,
      skillsMatch: data.skillsMatch ?? undefined,
      feedback: data.feedback ?? null,
      feedbackJson: data.feedbackJson ?? undefined,
      processingTimeMs: data.processingTimeMs ?? null,
      modelUsed: data.modelUsed ?? null,
      costCents: data.costCents ?? null,
    },
  });
}

/**
 * List analyses for a resume, newest first.
 */
export async function listAnalysesByResume(resumeId: string, limit = 10) {
  return db.resumeAnalysis.findMany({
    where: { resumeId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      jobDescription: {
        select: { id: true, title: true, company: true },
      },
      skillGaps: {
        orderBy: { priority: 'desc' },
      },
    },
  });
}

// ─── Match Helpers ──────────────────────────────────────────────────────────

/**
 * Create a match record (or update if user+job already matched).
 */
export async function upsertMatch(data: {
  userId: string;
  jobId: string;
  score?: number;
  semanticScore?: number;
  skillsScore?: number;
  explanation?: string;
  explanationJson?: object;
}) {
  return db.match.upsert({
    where: {
      userId_jobId: { userId: data.userId, jobId: data.jobId },
    },
    update: {
      score: data.score ?? undefined,
      semanticScore: data.semanticScore ?? undefined,
      skillsScore: data.skillsScore ?? undefined,
      explanation: data.explanation ?? undefined,
      explanationJson: data.explanationJson ?? undefined,
    },
    create: {
      userId: data.userId,
      jobId: data.jobId,
      score: data.score ?? null,
      semanticScore: data.semanticScore ?? null,
      skillsScore: data.skillsScore ?? null,
      explanation: data.explanation ?? null,
      explanationJson: data.explanationJson ?? undefined,
    },
  });
}

/**
 * List matches for a user with optional filters.
 */
export async function listMatchesByUser(
  userId: string,
  opts?: {
    minScore?: number;
    status?: 'new' | 'viewed' | 'applied' | 'dismissed';
    search?: string;
    limit?: number;
    offset?: number;
  },
) {
  const where: Record<string, unknown> = { userId };

  if (opts?.minScore !== undefined) {
    where.score = { gte: opts.minScore };
  }
  if (opts?.status) {
    where.status = opts.status;
  }

  return db.match.findMany({
    where,
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    take: opts?.limit ?? 20,
    skip: opts?.offset ?? 0,
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
  });
}
