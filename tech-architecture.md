# TalentOS — Technical Architecture Document

> **Version:** 1.0  
> **Last Updated:** 2026-07-10  
> **Status:** Production-Ready Reference  

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [AI Pipeline Architecture](#3-ai-pipeline-architecture)
4. [API Design](#4-api-design)
5. [File Processing Pipeline](#5-file-processing-pipeline)
6. [Cost Model](#6-cost-model)
7. [Development Environment Setup](#7-development-environment-setup)

---

## 1. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Next.js 14 (App Router) + Tailwind CSS + shadcn/ui               │    │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │    │
│  │  │ Dashboard │  │ Resume Upload│  │ JD Analysis│  │ Match View  │  │    │
│  │  │  Page     │  │  Flow        │  │  Flow      │  │  Page       │  │    │
│  │  └──────────┘  └──────────────┘  └────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTPS (REST / tRPC)
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                             API LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Next.js API Routes  +  tRPC (type-safe RPC)                      │    │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │    │
│  │  │  Auth     │  │  Resume      │  │  Analysis  │  │  Match      │  │    │
│  │  │  Router   │  │  Router      │  │  Router    │  │  Router     │  │    │
│  │  └──────────┘  └──────────────┘  └────────────┘  └─────────────┘  │    │
│  └──────────────────────────┬──────────────────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
         ┌─────────────────────┼──────────────────────┐
         │                     │                      │
┌────────▼────────┐  ┌────────▼────────┐  ┌─────────▼────────┐
│  AI PIPELINE    │  │  DATABASE        │  │  FILE STORAGE    │
│  ┌────────────┐ │  │  ┌────────────┐  │  │  ┌────────────┐  │
│  │ Step 1:    │ │  │  │ PostgreSQL  │  │  │  │ S3 / Vercel│  │
│  │ Parse      │ │  │  │ + pgvector  │  │  │  │ Blob       │  │
│  ├────────────┤ │  │  ├────────────┤  │  │  ├────────────┤  │
│  │ Step 2:    │ │  │  │ users      │  │  │  │ resume PDF/│  │
│  │ Extract    │ │  │  │ resumes    │  │  │  │ DOCX files │  │
│  ├────────────┤ │  │  │ analyses   │  │  │  ├────────────┤  │
│  │ Step 3:    │ │  │  │ jobs       │  │  │  │ generated  │  │
│  │ JD Parse   │ │  │  │ skills     │  │  │  │ rewrites   │  │
│  ├────────────┤ │  │  │ matches    │  │  │  └────────────┘  │
│  │ Step 4:    │ │  │  └────────────┘  │  └──────────────────┘
│  │ Match      │ │  └─────────────────┘
│  ├────────────┤ │
│  │ Step 5:    │ │
│  │ Gap        │ │
│  ├────────────┤ │
│  │ Step 6:    │ │
│  │ Feedback   │ │
│  ├────────────┤ │
│  │ Step 7:    │ │
│  │ Rewrite    │ │
│  └────────────┘ │
└─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │ OpenAI API     │  │ Claude API     │  │ Clerk/NextAuth │                │
│  │ (GPT-4o-mini,  │  │ (backup for    │  │ (auth/SSO)     │                │
│  │  GPT-4o)       │  │  analysis)     │  │                │                │
│  └────────────────┘  └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Purpose | Technology | Scaling Strategy |
|---|---|---|---|
| **Frontend** | User interface, client-side routing, form handling | Next.js 14 (App Router), Tailwind CSS, shadcn/ui | Vercel Edge Network CDN; static pages served from edge |
| **API Layer** | Request handling, auth middleware, rate limiting | Next.js API Routes + tRPC (type-safe RPC) | Serverless functions; auto-scale on Vercel |
| **AI Pipeline** | Multi-step resume/JD processing, matching, feedback | OpenAI GPT-4o-mini + GPT-4o; Claude (fallback) | Background job queue (Inngest or BullMQ) |
| **Database** | Persistent storage, vector embeddings | PostgreSQL 15 + pgvector extension | Supabase (managed Postgres); read replicas at scale |
| **File Storage** | Resume uploads, generated rewrites | Vercel Blob (dev) / AWS S3 (prod) | S3 with CloudFront CDN |
| **Auth** | Authentication, session management, SSO | Clerk (preferred) or NextAuth.js v5 | Clerk handles scaling; no custom infra |

### Tech Stack Decisions & Rationale

**Frontend: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui**

- **Why Next.js 14 App Router:** Server Components reduce client-side JS; server actions simplify form handling; built-in API routes eliminate a separate backend service. The App Router's colocation model (`page.tsx` next to `layout.tsx` in the same folder) keeps related code together.
- **Why Tailwind CSS + shadcn/ui:** shadcn/ui provides accessible, customizable components that live in your codebase (not a node_modules dependency). Tailwind's utility-first approach pairs naturally with shadcn and eliminates CSS-in-JS runtime overhead.

**Backend: Next.js API Routes + tRPC**

- **Why tRPC over plain REST:** End-to-end type safety between frontend and backend — no manual API contract maintenance, no runtime type mismatches. tRPC procedures are just TypeScript functions; the client auto-generates typed hooks.
- **Why not a separate backend service:** For an MVP, a monolith is faster to ship, easier to debug, and simpler to deploy. If the AI pipeline needs to scale independently, extract it into a standalone worker later (Inngest handles this).

**Database: PostgreSQL + pgvector**

- **Why pgvector:** Embeddings live alongside relational data. No need for a separate vector database (Pinecone, Weaviate) for a platform with fewer than 1M vectors — pgvector handles this scale with reasonable performance and zero operational overhead.
- **Why PostgreSQL:** ACID compliance, mature ecosystem, JSONB for flexible parsed resume data, full-text search for job title lookups.

**AI: OpenAI API (GPT-4o-mini for extraction, GPT-4o for analysis) + Claude API (backup)**

- **Why GPT-4o-mini for extraction:** High throughput, low cost (~$0.15/1M input tokens). Skill extraction and resume parsing are structured tasks that don't require GPT-4o's reasoning depth.
- **Why GPT-4o for analysis:** Match scoring and gap analysis require nuanced judgment. GPT-4o's reasoning capabilities justify the higher cost (~$2.50/1M input tokens) for these steps.
- **Why Claude as backup:** Redundancy. If OpenAI has downtime, the pipeline degrades gracefully to Claude (same prompts, different API).

**File Storage: Vercel Blob (dev) / S3 (prod)**

- **Why Vercel Blob for dev:** Zero config, integrates with Vercel deployments, free tier covers development needs.
- **Why S3 for prod:** Cost-effective at scale ($0.023/GB/month), CloudFront CDN for fast global access, lifecycle policies for archival.

**Auth: Clerk (preferred) or NextAuth.js v5**

- **Why Clerk:** Managed auth service — handles OAuth (Google, GitHub, LinkedIn), magic links, MFA, session management, and user management UI. Eliminates weeks of auth code. Free tier covers up to 10,000 MAU.
- **Why NextAuth.js v5 as fallback:** If you need zero vendor dependency, NextAuth.js v5 (Auth.js) is self-hosted, open-source, and supports the same OAuth providers. Trade-off: more setup and maintenance.

**Deployment: Vercel + Supabase**

- **Why Vercel:** Native Next.js support, automatic preview deployments per PR, edge functions, serverless scaling, integrated analytics.
- **Why Supabase:** Managed PostgreSQL with built-in pgvector, dashboard for data inspection, Row Level Security, and a generous free tier ($0 for 500MB database).

---

## 2. Database Schema

### Prerequisites

Enable the `vector` extension in PostgreSQL before running migrations:

```sql
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- trigram similarity for fuzzy skill matching
```

### Full Schema

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),           -- NULL if using Clerk/SSO only
  career_stage  VARCHAR(50) CHECK (career_stage IN (
    'student', 'early_career', 'mid_career', 'senior', 'executive', 'career_change'
  )),
  target_role   VARCHAR(255),
  linkedin_url  VARCHAR(500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_career_stage ON users (career_stage);
CREATE INDEX idx_users_target_role ON users USING gin (target_role gin_trgm_ops);

-- ============================================================
-- RESUMES
-- ============================================================
CREATE TABLE resumes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url        VARCHAR(1000) NOT NULL,           -- S3/Blob URL to original file
  file_name       VARCHAR(500) NOT NULL,
  file_size_bytes INTEGER,
  mime_type       VARCHAR(50) CHECK (mime_type IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  raw_text        TEXT,                               -- extracted text from PDF/DOCX
  parsed_json     JSONB DEFAULT '{}'::jsonb,           -- structured sections, contact info, etc.
  embedding_vector vector(1536),                       -- OpenAI text-embedding-3-small dimension
  status          VARCHAR(20) NOT NULL DEFAULT 'uploaded' CHECK (status IN (
    'uploaded', 'processing', 'processed', 'failed'
  )),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON resumes (user_id);
CREATE INDEX idx_resumes_status ON resumes (status);
CREATE INDEX idx_resumes_embedding ON resumes USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
-- Note: ivfflat index requires at least 100 rows; use lists = sqrt(rows) as a guideline
-- For < 100 rows, skip the index and use sequential scan

-- ============================================================
-- JOB DESCRIPTIONS
-- ============================================================
CREATE TABLE job_descriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(500) NOT NULL,
  company         VARCHAR(255),
  location        VARCHAR(255),
  remote_policy   VARCHAR(50) CHECK (remote_policy IN ('remote', 'hybrid', 'onsite', 'unknown')),
  salary_min      INTEGER,
  salary_max      INTEGER,
  raw_text        TEXT NOT NULL,
  parsed_json     JSONB DEFAULT '{}'::jsonb,           -- requirements, nice-to-haves, responsibilities
  embedding_vector vector(1536),
  source          VARCHAR(50) CHECK (source IN ('manual', 'linkedin', 'indeed', 'glassdoor', 'api', 'user_paste')),
  source_url      VARCHAR(1000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jd_embedding ON job_descriptions USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_jd_company ON job_descriptions (company);
CREATE INDEX idx_jd_title ON job_descriptions USING gin (title gin_trgm_ops);
CREATE INDEX idx_jd_source ON job_descriptions (source);

-- ============================================================
-- SKILLS
-- ============================================================
CREATE TABLE skills (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      VARCHAR(255) NOT NULL UNIQUE,
  category  VARCHAR(100) CHECK (category IN (
    'technical', 'language', 'tool', 'framework', 'methodology',
    'soft_skill', 'certification', 'domain_knowledge'
  )),
  aliases   TEXT[] DEFAULT '{}',    -- alternative names, e.g. {"ReactJS", "React.js", "React"}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skills_name ON skills (name);
CREATE INDEX idx_skills_category ON skills (category);
CREATE INDEX idx_skills_name_trgm ON skills USING gin (name gin_trgm_ops);

-- ============================================================
-- USER SKILLS
-- ============================================================
CREATE TABLE user_skills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id          UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  -- 1 = awareness, 2 = basic, 3 = intermediate, 4 = advanced, 5 = expert
  years_experience  NUMERIC(4,1),
  evidence          TEXT,              -- e.g. "Listed in resume, 3 years at Acme Corp"
  source            VARCHAR(50) CHECK (source IN ('resume_extracted', 'user_added', 'jd_derived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, skill_id)
);

CREATE INDEX idx_user_skills_user_id ON user_skills (user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills (skill_id);
CREATE INDEX idx_user_skills_proficiency ON user_skills (proficiency_level);

-- ============================================================
-- RESUME ANALYSES
-- ============================================================
CREATE TABLE resume_analyses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id           UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_description_id  UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
  match_score         NUMERIC(4,1) CHECK (match_score BETWEEN 0 AND 100),
  skills_match        JSONB DEFAULT '{}'::jsonb,
  -- Format: { "matched": [...], "missing": [...], "extra": [...] }
  feedback            TEXT,
  feedback_json       JSONB DEFAULT '{}'::jsonb,
  -- Structured feedback: { "strengths": [...], "improvements": [...], "summary": "..." }
  processing_time_ms  INTEGER,
  model_used          VARCHAR(100),
  cost_cents          INTEGER,         -- cost in cents for this analysis
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analyses_resume_id ON resume_analyses (resume_id);
CREATE INDEX idx_analyses_jd_id ON resume_analyses (job_description_id);
CREATE INDEX idx_analyses_match_score ON resume_analyses (match_score DESC);

-- ============================================================
-- SKILL GAPS
-- ============================================================
CREATE TABLE skill_gaps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id     UUID NOT NULL REFERENCES resume_analyses(id) ON DELETE CASCADE,
  skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  gap_type        VARCHAR(50) NOT NULL CHECK (gap_type IN (
    'missing',        -- skill required by JD but not on resume
    'partial',        -- skill present but below required proficiency
    'outdated',       -- skill on resume but potentially outdated
    'emerging'        -- skill trending in market but not yet on resume
  )),
  required_level  INTEGER CHECK (required_level BETWEEN 1 AND 5),
  current_level   INTEGER CHECK (current_level BETWEEN 1 AND 5),
  recommendation  TEXT,
  priority        INTEGER CHECK (priority BETWEEN 1 AND 5),
  -- 1 = nice-to-have gap, 5 = critical blocker
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_gaps_analysis_id ON skill_gaps (analysis_id);
CREATE INDEX idx_skill_gaps_skill_id ON skill_gaps (skill_id);
CREATE INDEX idx_skill_gaps_priority ON skill_gaps (priority DESC);

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
  score           NUMERIC(4,1) CHECK (score BETWEEN 0 AND 100),
  semantic_score  NUMERIC(4,3),       -- cosine similarity from embeddings (0.0 to 1.0)
  skills_score    NUMERIC(4,1),       -- weighted skill match percentage
  explanation     TEXT,               -- natural language explanation of match quality
  explanation_json JSONB DEFAULT '{}'::jsonb,
  -- { "strong_matches": [...], "gaps": [...], "verdict": "...", "recommendation": "..." }
  status          VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'applied', 'dismissed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_user_id ON matches (user_id);
CREATE INDEX idx_matches_job_id ON matches (job_id);
CREATE INDEX idx_matches_score ON matches (score DESC);
CREATE INDEX idx_matches_user_score ON matches (user_id, score DESC);
CREATE INDEX idx_matches_status ON matches (status);
CREATE UNIQUE INDEX idx_matches_user_job UNIQUE (user_id, job_id);

-- ============================================================
-- HELPER: Updated-at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at BEFORE UPDATE ON user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jd_updated_at BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Schema Diagram (Simplified)

```
users ──────┬──── resumes ────── resume_analyses ────── skill_gaps
            │        │                  │
            │        │                  └──────► skills ◄──── user_skills
            │        │
            └────────┴─── matches ────── job_descriptions
```

---

## 3. AI Pipeline Architecture

### Pipeline Overview

```
Resume File ──► [Step 1: Parse] ──► [Step 2: Extract Skills] ──► [Embed Resume]
                                                                    │
Job Description ──► [Step 3: Parse JD] ──► [Embed JD] ─────────────┤
                                                                    │
                                                    [Step 4: Semantic Match]
                                                                    │
                                                    [Step 5: Gap Analysis]
                                                                    │
                                                    [Step 6: Feedback Gen]
                                                                    │
                                                    [Step 7: Rewrite Suggestions]
```

### Step 1: Resume Parsing

**Purpose:** Convert PDF/DOCX to structured text with section detection.

| Field | Value |
|---|---|
| **Model** | None (rule-based) — falls back to GPT-4o-mini for section detection if heuristic parsing fails |
| **Input** | Raw file buffer (PDF or DOCX) |
| **Output** | `{ raw_text: string, sections: { contact, summary, experience, education, skills, other }, metadata: { page_count, word_count } }` |
| **Error Handling** | Corrupted file → return error status; scanned PDF → attempt OCR hint with error message |
| **Cost** | $0.001 (text extraction is local; GPT-4o-mini only on fallback) |

**Prompt template (fallback section detection):**

```
You are a resume parser. Given the raw text of a resume, extract structured information.

INPUT:
{raw_text}

OUTPUT JSON:
{
  "contact": {
    "name": "string",
    "email": "string | null",
    "phone": "string | null",
    "location": "string | null",
    "linkedin": "string | null",
    "website": "string | null"
  },
  "summary": "string | null",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string | null",
      "start_date": "string",
      "end_date": "string | null",
      "description": "string",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string | null",
      "details": "string | null"
    }
  ],
  "skills": ["string"],
  "certifications": ["string"],
  "languages": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "metadata": {
    "word_count": 0,
    "section_count": 0,
    "parsing_confidence": 0.0
  }
}

RULES:
- If a field is not found, set it to null or empty array.
- Preserve original wording for descriptions and bullets.
- Normalize dates to "YYYY-MM" or "Present" format where possible.
- Do NOT invent information that is not in the resume text.
```

### Step 2: Skill Extraction

**Purpose:** Identify all skills from the resume with proficiency levels and evidence.

| Field | Value |
|---|---|
| **Model** | GPT-4o-mini (fast, cheap, structured extraction) |
| **Input** | Structured resume JSON from Step 1 |
| **Output** | `{ skills: [{ name, category, proficiency_level, years_experience, evidence, aliases }] }` |
| **Error Handling** | Empty skill list → flag resume as low-quality; duplicate skills → merge by alias matching |
| **Cost** | ~$0.01 per resume (input: ~2K tokens, output: ~1K tokens) |

**Prompt template:**

```
You are a technical skills extractor. Analyze the following resume and extract every skill mentioned or implied.

RESUME:
{resume_structured_json}

OUTPUT JSON:
{
  "skills": [
    {
      "name": "Canonical skill name (e.g., 'TypeScript' not 'TS')",
      "category": "technical | language | tool | framework | methodology | soft_skill | certification | domain_knowledge",
      "proficiency_level": 1-5,
      "years_experience": 3.0,
      "evidence": "Exact text from resume supporting this skill",
      "aliases": ["AlternativeName1", "AlternativeName2"]
    }
  ]
}

RULES:
1. Extract BOTH explicit skills ("Proficient in Python") AND implied skills (mentions "built REST APIs" → infer "REST API Design").
2. Proficiency levels:
   - 5: Used as primary language/tool for 3+ years, or listed as "expert"
   - 4: Strong daily use for 1-3 years
   - 3: Regular use for 6-12 months
   - 2: Some project experience, < 6 months
   - 1: Mentioned or listed but no evidence of use
3. years_experience: Estimate from resume timeline. If unclear, use 0.5 as minimum.
4. evidence: Quote the EXACT phrase from the resume. Do not paraphrase.
5. Do NOT add skills not supported by the resume text.
6. Include soft skills if clearly evidenced (e.g., "Led a team of 8" → "Team Leadership").
```

### Step 3: Job Description Parsing

**Purpose:** Parse JD into requirements, nice-to-haves, and responsibilities with embedded metadata.

| Field | Value |
|---|---|
| **Model** | GPT-4o-mini for parsing; GPT-4o-mini for embedding via `text-embedding-3-small` |
| **Input** | Raw JD text (pasted or scraped) |
| **Output** | `{ parsed_json: {...}, embedding: vector(1536) }` |
| **Error Handling** | Non-JD text → return error with suggestion to check input; incomplete JD → parse what exists, mark fields as `inferred: false` |
| **Cost** | ~$0.003 per JD (parsing: ~$0.001, embedding: ~$0.002) |

**Prompt template:**

```
You are a job description analyst. Parse the following job description into structured requirements.

JOB DESCRIPTION:
{raw_jd_text}

OUTPUT JSON:
{
  "title": "string",
  "company": "string | null",
  "location": "string | null",
  "remote_policy": "remote | hybrid | onsite | unknown",
  "salary_range": {
    "min": "number | null",
    "max": "number | null",
    "currency": "USD",
    "period": "annual"
  },
  "required_skills": [
    {
      "name": "Canonical skill name",
      "category": "technical | tool | framework | methodology | soft_skill | certification",
      "required_level": 1-5,
      "context": "How this skill is used in the role"
    }
  ],
  "nice_to_have_skills": [
    {
      "name": "Canonical skill name",
      "category": "technical | tool | framework | methodology | soft_skill | certification",
      "preferred_level": 1-5,
      "context": "Why this is preferred"
    }
  ],
  "responsibilities": ["string"],
  "qualifications": {
    "education": ["string"],
    "experience_years": "number | null",
    "other": ["string"]
  },
  "company_info": {
    "industry": "string | null",
    "size": "string | null",
    "tech_stack": ["string"]
  },
  "parsing_confidence": 0.0-1.0
}

RULES:
1. Distinguish STRICTLY between "required" and "nice-to-have" sections.
2. If the JD does not separate them, infer from language:
   - Required: "must have", "required", "experience with", "proficient in"
   - Nice-to-have: "preferred", "bonus", "nice to have", "plus", "familiarity with"
3. Canonicalize skill names to industry-standard names (e.g., "K8s" → "Kubernetes", "JS" → "JavaScript").
4. If salary is not provided, set to null — do NOT estimate.
5. Extract company tech stack from the JD if mentioned.
```

**Embedding generation (post-parse):**

```typescript
// After parsing, create a combined text for embedding
const embeddingInput = `
Job Title: ${parsed.title}
Company: ${parsed.company}
Required Skills: ${parsed.required_skills.map(s => s.name).join(', ')}
Nice to Have: ${parsed.nice_to_have_skills.map(s => s.name).join(', ')}
Responsibilities: ${parsed.responsibilities.join('. ')}
`;

const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: embeddingInput,
  dimensions: 1536
});

// Store response.data[0].embedding in job_descriptions.embedding_vector
```

### Step 4: Semantic Matching

**Purpose:** Compute cosine similarity between resume and JD embeddings; combine with skill-level matching.

| Field | Value |
|---|---|
| **Model** | pgvector cosine similarity (no LLM call for base similarity) |
| **Input** | Resume embedding + JD embedding |
| **Output** | `{ semantic_score: 0.0-1.0, combined_score: 0-100 }` |
| **Error Handling** | Missing embeddings → re-run embedding step; pgvector error → fall back to keyword matching |
| **Cost** | $0.00 (pgvector computation is local) |

**Scoring formula:**

```typescript
interface MatchScore {
  semantic_score: number;    // cosine similarity from pgvector: 0.0 to 1.0
  skills_score: number;      // weighted skill overlap: 0 to 100
  combined_score: number;    // final composite: 0 to 100
}

function calculateMatchScore(
  semanticScore: number,
  skillMatches: SkillMatch[],
  requiredSkills: RequiredSkill[],
  niceToHaveSkills: RequiredSkill[]
): MatchScore {
  // Weight: 40% semantic similarity + 60% skill overlap
  const SEMANTIC_WEIGHT = 0.4;
  const SKILLS_WEIGHT = 0.6;

  // Skill scoring: required skills are worth 10 points each, nice-to-have worth 4 points
  const maxSkillScore =
    requiredSkills.length * 10 + niceToHaveSkills.length * 4;
  const earnedSkillScore = skillMatches.reduce((sum, match) => {
    if (match.type === 'required') {
      return sum + 10 * match.partialScore;  // 0.0 to 1.0
    } else {
      return sum + 4 * match.partialScore;
    }
  }, 0);

  const skillsScore = maxSkillScore > 0
    ? (earnedSkillScore / maxSkillScore) * 100
    : 50;

  const combinedScore = Math.round(
    semanticScore * 100 * SEMANTIC_WEIGHT + skillsScore * SKILLS_WEIGHT
  );

  return {
    semantic_score: semanticScore,
    skills_score: Math.round(skillsScore * 10) / 10,
    combined_score: Math.min(100, Math.max(0, combinedScore)),
  };
}

interface SkillMatch {
  skillName: string;
  type: 'required' | 'nice_to_have';
  partialScore: number;   // 0.0 to 1.0 (1.0 = exact match, 0.5 = alias match, 0.3 = category match)
  matchedFrom: string | null;
  reason: string;
}
```

### Step 5: Gap Analysis

**Purpose:** Compare resume skills against JD requirements to identify gaps with prioritized recommendations.

| Field | Value |
|---|---|
| **Model** | GPT-4o (requires nuanced judgment about skill relevance) |
| **Input** | Resume skills (Step 2) + JD requirements (Step 3) + semantic match context |
| **Output** | `{ gaps: [{ skill, gap_type, required_level, current_level, recommendation, priority }] }` |
| **Error Handling** | No gaps found → return empty array with "strong match" flag; all skills missing → return critical gaps with learning plan |
| **Cost** | ~$0.005 per analysis (input: ~3K tokens, output: ~1.5K tokens) |

**Prompt template:**

```
You are a career gap analyst. Compare the candidate's skills against the job requirements and identify all gaps.

CANDIDATE SKILLS:
{candidate_skills_json}

JOB REQUIRED SKILLS:
{required_skills_json}

JOB NICE-TO-HAVE SKILLS:
{nice_to_have_skills_json}

SEMANTIC MATCH CONTEXT:
- Overall similarity: {semantic_score}
- Strongest skill overlap: {top_matches}
- Weakest areas: {weakest_areas}

OUTPUT JSON:
{
  "gaps": [
    {
      "skill_name": "string",
      "gap_type": "missing | partial | outdated | emerging",
      "required_level": 1-5,
      "current_level": 0-5,
      "recommendation": "Specific, actionable advice for closing this gap",
      "priority": 1-5,
      "learning_resources": [
        {
          "type": "course | book | project | certification",
          "name": "string",
          "estimated_time": "string"
        }
      ],
      "urgency_reason": "Why this gap matters for this specific role"
    }
  ],
  "overall_assessment": "string",
  "transferable_skills": [
    {
      "from": "Candidate's skill",
      "to": "Required skill",
      "adaptability": "How transferable is this skill"
    }
  ]
}

RULES:
1. Priority scoring:
   - 5: Required skill, completely missing, role is impossible without it
   - 4: Required skill, partially present (e.g., knows React but role needs Next.js)
   - 3: Required skill, present but at lower level than requested
   - 2: Nice-to-have skill, completely missing
   - 1: Nice-to-have skill, present but could be stronger
2. Be SPECIFIC in recommendations. "Learn JavaScript" is bad. "Complete 'JavaScript: The Complete Guide' on Udemy, then build a portfolio project using TypeScript and Node.js" is good.
3. Identify transferable skills: a Python developer can learn Java faster than a non-programmer.
4. Do not be discouraging. Frame gaps as opportunities.
5. If a gap is about years of experience, acknowledge that years are an imperfect proxy.
```

### Step 6: Feedback Generation

**Purpose:** Generate comprehensive, actionable feedback combining all prior analysis steps.

| Field | Value |
|---|---|
| **Model** | GPT-4o (requires high-quality, personalized writing) |
| **Input** | All prior steps: parsed resume, extracted skills, JD parsing, match score, gap analysis |
| **Output** | `{ strengths: string[], improvements: string[], summary: string, ats_score: number, formatting_score: number }` |
| **Error Handling** | Generation timeout → return partial feedback with "processing incomplete" flag |
| **Cost** | ~$0.01 per analysis (input: ~4K tokens, output: ~2K tokens) |

**Prompt template:**

```
You are a senior career coach and resume expert. Provide comprehensive feedback on this resume's fit for the target role.

CANDIDATE RESUME:
{resume_structured_json}

EXTRACTED SKILLS:
{candidate_skills_json}

TARGET JOB DESCRIPTION:
{jd_parsed_json}

MATCH ANALYSIS:
- Combined Score: {combined_score}/100
- Semantic Score: {semantic_score}
- Skills Score: {skills_score}

GAP ANALYSIS:
{gap_analysis_json}

OUTPUT JSON:
{
  "summary": "2-3 sentence overall assessment of the candidate's fit for this role",
  "overall_score": 0-100,
  "ats_score": {
    "score": 0-100,
    "issues": ["string"],
    "suggestions": ["string"]
  },
  "formatting_score": {
    "score": 0-100,
    "issues": ["string"],
    "suggestions": ["string"]
  },
  "strengths": [
    {
      "point": "string",
      "evidence": "Specific example from the resume",
      "impact": "Why this matters for this role"
    }
  ],
  "improvements": [
    {
      "area": "string",
      "current_issue": "What is wrong or weak",
      "suggestion": "Specific fix",
      "priority": "high | medium | low"
    }
  ],
  "keywords_to_add": [
    {
      "keyword": "string",
      "reason": "Why this keyword matters for ATS or the role"
    }
  ],
  "section_specific_feedback": {
    "summary": "Feedback on the professional summary",
    "experience": "Feedback on work experience section",
    "skills": "Feedback on skills section",
    "education": "Feedback on education section"
  },
  "action_items": [
    {
      "action": "string",
      "effort": "5min | 30min | 2hrs | half_day",
      "impact": "high | medium | low"
    }
  ]
}

RULES:
1. Be honest but constructive. Acknowledge strengths before suggesting improvements.
2. Action items should be ordered by impact-to-effort ratio (highest first).
3. ATS score should focus on: keyword density, section structure, formatting compatibility.
4. Include at least 3 keywords the candidate should add to their resume.
5. Feedback should be specific to THIS resume and THIS job, not generic advice.
6. Use the "XYZ + S" formula when suggesting impact statements:
   "Accomplished [X] as measured by [Y] by doing [Z] - Situation"
```

### Step 7: Resume Rewrite Suggestions

**Purpose:** Generate before/after text snippets showing how to improve specific resume sections.

| Field | Value |
|---|---|
| **Model** | GPT-4o (requires high-quality, contextually aware rewriting) |
| **Input** | Resume JSON + feedback from Step 6 + JD requirements |
| **Output** | `{ rewrites: [{ section, original, rewritten, reasoning }] }` |
| **Error Handling** | Empty input → return suggestion to fill section; over-rewrite → validate against original (max 3x length) |
| **Cost** | ~$0.02 per section rewrite (input: ~5K tokens, output: ~3K tokens); full rewrite: ~$0.04 |

**Prompt template:**

```
You are an expert resume writer. Rewrite the specified sections of this resume to better match the target job description.

ORIGINAL RESUME:
{resume_structured_json}

TARGET JOB:
{jd_parsed_json}

FEEDBACK:
{feedback_json}

REWRITE SECTIONS: {sections_to_rewrite}  // e.g., ["summary", "experience.bullets", "skills"]

OUTPUT JSON:
{
  "rewrites": [
    {
      "section": "string (e.g., 'summary', 'experience[0].bullets[2]', 'skills')",
      "original": "string",
      "rewritten": "string",
      "reasoning": "Why this change improves the resume for this specific role",
      "keywords_added": ["string"],
      "impact_improvement": "Estimated improvement description"
    }
  ],
  "full_rewritten_resume": {
    "summary": "string | null",
    "experience": [
      {
        "company": "string",
        "title": "string",
        "bullets": ["string"]
      }
    ],
    "skills": ["string"]
  }
}

RULES:
1. PRESERVE TRUTH. Never fabricate experience, skills, or achievements that are not in the original resume.
2. Enhance language and impact, don't change facts.
3. Use the STAR method for bullet points: Situation, Task, Action, Result.
4. Quantify achievements wherever possible (numbers, percentages, dollar amounts).
5. Mirror the language from the job description naturally — don't keyword-stuff.
6. Each rewritten section should be no more than 3x the original length.
7. The "full_rewritten_resume" should compile all rewrites into a complete, ready-to-use format.
8. Maintain the candidate's authentic voice — don't make it sound like a different person.
```

### Pipeline Orchestration

```typescript
// src/lib/ai-pipeline.ts — Orchestration wrapper

interface PipelineResult {
  resume_id: string;
  steps: {
    parse: StepResult<ParseOutput>;
    extract_skills: StepResult<SkillExtractionOutput>;
    jd_parse: StepResult<JDParseOutput>;
    match: StepResult<MatchScore>;
    gap_analysis: StepResult<GapAnalysisOutput>;
    feedback: StepResult<FeedbackOutput>;
    rewrite: StepResult<RewriteOutput>;
  };
  total_cost_cents: number;
  total_time_ms: number;
}

interface StepResult<T> {
  status: 'success' | 'error' | 'skipped';
  data: T | null;
  error: string | null;
  time_ms: number;
  cost_cents: number;
}

async function runAnalysisPipeline(
  resumeId: string,
  jobDescriptionText: string
): Promise<PipelineResult> {
  const startTime = Date.now();
  const results: Partial<PipelineResult['steps']> = {};

  try {
    // Step 1: Parse resume (local processing)
    results.parse = await executeStep('parse', async () => {
      const resume = await db.query('SELECT * FROM resumes WHERE id = $1', [resumeId]);
      const rawText = resume.raw_text;
      return parseResume(rawText);  // local text processing
    });

    // Step 2: Extract skills from resume
    results.extract_skills = await executeStep('extract_skills', async () => {
      return extractSkills(results.parse!.data!);
    });

    // Step 3: Parse job description
    results.jd_parse = await executeStep('jd_parse', async () => {
      return parseJobDescription(jobDescriptionText);
    });

    // Generate embeddings
    const [resumeEmbedding, jdEmbedding] = await Promise.all([
      generateEmbedding(results.parse!.data!.raw_text),
      generateEmbedding(jobDescriptionText),
    ]);

    // Store embeddings
    await db.query('UPDATE resumes SET embedding_vector = $1 WHERE id = $2',
      [resumeEmbedding, resumeId]);
    await db.query('UPDATE job_descriptions SET embedding_vector = $1 WHERE id = $2',
      [jdEmbedding, jobDescriptionId]);

    // Step 4: Semantic matching (pgvector + skill scoring)
    results.match = await executeStep('match', async () => {
      return calculateMatchScore(
        resumeEmbedding,
        jdEmbedding,
        results.extract_skills!.data!.skills,
        results.jd_parse!.data!.required_skills,
        results.jd_parse!.data!.nice_to_have_skills
      );
    });

    // Step 5: Gap analysis
    results.gap_analysis = await executeStep('gap_analysis', async () => {
      return analyzeGaps(
        results.extract_skills!.data!,
        results.jd_parse!.data!,
        results.match!.data!
      );
    });

    // Step 6: Feedback generation
    results.feedback = await executeStep('feedback', async () => {
      return generateFeedback(
        results.parse!.data!,
        results.extract_skills!.data!,
        results.jd_parse!.data!,
        results.match!.data!,
        results.gap_analysis!.data!
      );
    });

    // Step 7: Rewrite suggestions (optional, triggered by user)
    // results.rewrite = await executeStep('rewrite', async () => { ... });

    return {
      resume_id: resumeId,
      steps: results as PipelineResult['steps'],
      total_cost_cents: Object.values(results).reduce(
        (sum, s) => sum + (s?.cost_cents ?? 0), 0
      ),
      total_time_ms: Date.now() - startTime,
    };

  } catch (error) {
    // Graceful degradation: return partial results
    return buildPartialResult(resumeId, results, error, startTime);
  }
}

async function executeStep<T>(
  name: string,
  fn: () => Promise<T>
): Promise<StepResult<T>> {
  const start = Date.now();
  try {
    const data = await fn();
    return {
      status: 'success',
      data,
      error: null,
      time_ms: Date.now() - start,
      cost_cents: estimateCostForStep(name),
    };
  } catch (error) {
    return {
      status: 'error',
      data: null,
      error: error instanceof Error ? error.message : String(error),
      time_ms: Date.now() - start,
      cost_cents: 0,
    };
  }
}
```

---

## 4. API Design

### Authentication

All endpoints except `/api/auth/*` require a valid session token (via Clerk or NextAuth.js).

```typescript
// Middleware (applies to all API routes under /api/)
// src/middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const session = await auth();
  if (!session && req.nextUrl.pathname.startsWith('/api/') && 
      !req.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}
```

### TypeScript Interfaces

```typescript
// src/types/api.ts

// ============================================================
// SHARED TYPES
// ============================================================
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// AUTH
// ============================================================
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  career_stage?: 'student' | 'early_career' | 'mid_career' | 'senior' | 'executive' | 'career_change';
  target_role?: string;
}

interface RegisterResponse {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  session_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    career_stage: string | null;
    target_role: string | null;
  };
}

// ============================================================
// RESUMES
// ============================================================
interface UploadResumeResponse {
  resume_id: string;
  status: 'uploaded' | 'processing';
  file_name: string;
  created_at: string;
}

interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  raw_text: string;
  parsed_json: ParsedResume;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  error_message: string | null;
  created_at: string;
}

interface ParsedResume {
  contact: {
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    website: string | null;
  };
  summary: string | null;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: string[];
}

interface Experience {
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  description: string;
  bullets: string[];
}

interface Education {
  degree: string;
  institution: string;
  year: string | null;
}

// ============================================================
// ANALYSIS
// ============================================================
interface AnalyzeRequest {
  resume_id: string;
  jd_text: string;
  jd_title?: string;
  jd_company?: string;
}

interface AnalysisResponse {
  analysis_id: string;
  resume_id: string;
  match_score: number;
  skills_match: {
    matched: SkillMatch[];
    missing: SkillMatch[];
    extra: SkillMatch[];
  };
  feedback: {
    summary: string;
    overall_score: number;
    strengths: FeedbackItem[];
    improvements: FeedbackItem[];
    action_items: ActionItem[];
    keywords_to_add: string[];
    ats_score: { score: number; issues: string[] };
  };
  gaps: SkillGap[];
  processing_time_ms: number;
  created_at: string;
}

interface SkillMatch {
  skill_name: string;
  proficiency_level: number;
  evidence: string;
}

interface FeedbackItem {
  point: string;
  evidence?: string;
  impact?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface ActionItem {
  action: string;
  effort: '5min' | '30min' | '2hrs' | 'half_day';
  impact: 'high' | 'medium' | 'low';
}

interface SkillGap {
  skill_name: string;
  gap_type: 'missing' | 'partial' | 'outdated' | 'emerging';
  required_level: number;
  current_level: number;
  recommendation: string;
  priority: number;
  learning_resources: LearningResource[];
}

interface LearningResource {
  type: 'course' | 'book' | 'project' | 'certification';
  name: string;
  estimated_time: string;
}

// ============================================================
// MATCHES
// ============================================================
interface Match {
  id: string;
  user_id: string;
  job_id: string;
  score: number;
  semantic_score: number;
  skills_score: number;
  explanation: string;
  explanation_json: {
    strong_matches: string[];
    gaps: string[];
    verdict: string;
    recommendation: string;
  };
  status: 'new' | 'viewed' | 'applied' | 'dismissed';
  created_at: string;
  job_description: {
    title: string;
    company: string;
    location: string;
    remote_policy: string;
  };
}

interface GetMatchesQuery extends PaginatedRequest {
  min_score?: number;
  status?: string;
  search?: string;
}

// ============================================================
// REWRITE
// ============================================================
interface RewriteRequest {
  resume_id: string;
  sections?: ('summary' | 'experience' | 'skills' | 'education')[];
  tone?: 'professional' | 'concise' | 'detailed';
  focus?: string;  // specific aspect to emphasize
}

interface RewriteResponse {
  rewrites: RewriteSection[];
  full_rewritten_resume: object;
}

interface RewriteSection {
  section: string;
  original: string;
  rewritten: string;
  reasoning: string;
  keywords_added: string[];
}
```

### API Endpoints

#### Auth

```typescript
// POST /api/auth/register
// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import { RegisterRequest } from '@/types/api';

export async function POST(req: NextRequest) {
  const body: RegisterRequest = await req.json();

  // Validate
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json(
      { success: false, data: null, error: 'Email, password, and name are required' },
      { status: 400 }
    );
  }

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [body.email]);
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { success: false, data: null, error: 'Email already registered' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(body.password);
  const result = await db.query(
    `INSERT INTO users (email, name, password_hash, career_stage, target_role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, created_at`,
    [body.email, body.name, passwordHash, body.career_stage ?? null, body.target_role ?? null]
  );

  return NextResponse.json({
    success: true,
    data: result.rows[0],
    error: null,
  }, { status: 201 });
}
```

#### Resumes

```typescript
// POST /api/resumes/upload
// src/app/api/resumes/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadToBlob } from '@/lib/storage';
import { parseDocument } from '@/lib/file-parser';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, data: null, error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, data: null, error: 'Only PDF and DOCX files are accepted' },
      { status: 400 }
    );
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, data: null, error: 'File size must be under 5MB' },
      { status: 400 }
    );
  }

  // Upload to storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = await uploadToBlob(buffer, file.name, file.type);

  // Parse immediately to extract text
  let rawText: string;
  try {
    rawText = await parseDocument(buffer, file.type);
  } catch (err) {
    rawText = '';
    // Store resume with 'failed' status but still upload the file
  }

  // Insert into database
  const result = await db.query(
    `INSERT INTO resumes (user_id, file_url, file_name, file_size_bytes, mime_type, raw_text, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, file_name, status, created_at`,
    [
      session.user.id,
      fileUrl,
      file.name,
      file.size,
      file.type,
      rawText,
      rawText ? 'uploaded' : 'failed',
    ]
  );

  return NextResponse.json({
    success: true,
    data: {
      resume_id: result.rows[0].id,
      status: result.rows[0].status,
      file_name: result.rows[0].file_name,
      created_at: result.rows[0].created_at,
    },
    error: rawText ? null : 'Failed to parse document. Please try a different file.',
  }, { status: 201 });
}

// GET /api/resumes/:id
// src/app/api/resumes/[id]/route.ts

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db.query(
    `SELECT * FROM resumes WHERE id = $1 AND user_id = $2`,
    [params.id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ success: false, data: null, error: 'Resume not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: result.rows[0], error: null });
}
```

#### Analysis

```typescript
// POST /api/analyze
// src/app/api/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { runAnalysisPipeline } from '@/lib/ai-pipeline';
import { AnalyzeRequest } from '@/types/api';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body: AnalyzeRequest = await req.json();

  if (!body.resume_id || !body.jd_text) {
    return NextResponse.json(
      { success: false, data: null, error: 'resume_id and jd_text are required' },
      { status: 400 }
    );
  }

  // Verify resume ownership
  const resumeResult = await db.query(
    'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
    [body.resume_id, session.user.id]
  );
  if (resumeResult.rows.length === 0) {
    return NextResponse.json({ success: false, data: null, error: 'Resume not found' }, { status: 404 });
  }

  if (resumeResult.rows[0].status !== 'uploaded' && resumeResult.rows[0].status !== 'processed') {
    return NextResponse.json(
      { success: false, data: null, error: 'Resume is still processing or has failed' },
      { status: 409 }
    );
  }

  // Create job description record
  const jdResult = await db.query(
    `INSERT INTO job_descriptions (title, company, raw_text, source)
     VALUES ($1, $2, $3, 'user_paste')
     RETURNING id`,
    [body.jd_title ?? 'Untitled', body.jd_company ?? null, body.jd_text]
  );

  const jobDescriptionId = jdResult.rows[0].id;

  // Run full analysis pipeline
  const analysis = await runAnalysisPipeline(body.resume_id, body.jd_text);

  // Store analysis results
  const analysisResult = await db.query(
    `INSERT INTO resume_analyses
       (resume_id, job_description_id, match_score, skills_match, feedback_json, processing_time_ms, model_used, cost_cents)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      body.resume_id,
      jobDescriptionId,
      analysis.steps.match?.data?.combined_score ?? null,
      JSON.stringify(analysis.steps.extract_skills?.data ?? {}),
      JSON.stringify(analysis.steps.feedback?.data ?? {}),
      analysis.total_time_ms,
      'gpt-4o-mini + gpt-4o',
      analysis.total_cost_cents,
    ]
  );

  // Store gaps
  if (analysis.steps.gap_analysis?.data?.gaps) {
    for (const gap of analysis.steps.gap_analysis.data.gaps) {
      await db.query(
        `INSERT INTO skill_gaps (analysis_id, skill_id, gap_type, required_level, current_level, recommendation, priority)
         VALUES ($1, (SELECT id FROM skills WHERE name = $2 LIMIT 1), $3, $4, $5, $6, $7)`,
        [analysisResult.rows[0].id, gap.skill_name, gap.gap_type, gap.required_level, gap.current_level, gap.recommendation, gap.priority]
      );
    }
  }

  // Create match record
  await db.query(
    `INSERT INTO matches (user_id, job_id, score, semantic_score, skills_score, explanation)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      session.user.id,
      jobDescriptionId,
      analysis.steps.match?.data?.combined_score ?? null,
      analysis.steps.match?.data?.semantic_score ?? null,
      analysis.steps.match?.data?.skills_score ?? null,
      analysis.steps.feedback?.data?.summary ?? null,
    ]
  );

  return NextResponse.json({
    success: true,
    data: {
      analysis_id: analysisResult.rows[0].id,
      ...analysis.steps,
      total_cost_cents: analysis.total_cost_cents,
      total_time_ms: analysis.total_time_ms,
    },
    error: null,
  });
}
```

#### Matches

```typescript
// GET /api/matches
// src/app/api/matches/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { GetMatchesQuery } from '@/types/api';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '20');
  const minScore = parseFloat(url.searchParams.get('min_score') ?? '0');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      m.id, m.user_id, m.job_id, m.score, m.semantic_score, m.skills_score,
      m.explanation, m.explanation_json, m.status, m.created_at,
      jd.title as job_title, jd.company as job_company, jd.location as job_location,
      jd.remote_policy, jd.salary_min, jd.salary_max
    FROM matches m
    JOIN job_descriptions jd ON m.job_id = jd.id
    WHERE m.user_id = $1 AND m.score >= $2
  `;
  const params: any[] = [session.user.id, minScore];
  let paramIndex = 3;

  if (status) {
    query += ` AND m.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (search) {
    query += ` AND (jd.title ILIKE $${paramIndex} OR jd.company ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  query += ` ORDER BY m.score DESC, m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Count total
  const countQuery = `SELECT COUNT(*) FROM matches WHERE user_id = $1 AND score >= $2`;
  const countResult = await db.query(countQuery, [session.user.id, minScore]);
  const total = parseInt(countResult.rows[0].count);

  return NextResponse.json({
    success: true,
    data: result.rows,
    error: null,
    meta: {
      page,
      limit,
      total,
      hasMore: offset + limit < total,
    },
  });
}

// GET /api/matches/:id
// src/app/api/matches/[id]/route.ts

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db.query(
    `SELECT
       m.*, jd.title, jd.company, jd.location, jd.remote_policy,
       jd.raw_text as jd_raw_text, jd.parsed_json as jd_parsed_json,
       ra.skills_match, ra.feedback_json, ra.match_score
     FROM matches m
     JOIN job_descriptions jd ON m.job_id = jd.id
     LEFT JOIN resume_analyses ra ON ra.job_description_id = jd.id AND ra.resume_id = m.user_id
     WHERE m.id = $1 AND m.user_id = $2`,
    [params.id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ success: false, data: null, error: 'Match not found' }, { status: 404 });
  }

  // Mark as viewed
  await db.query(`UPDATE matches SET status = 'viewed' WHERE id = $1`, [params.id]);

  return NextResponse.json({ success: true, data: result.rows[0], error: null });
}
```

#### Resume Rewrite

```typescript
// POST /api/resumes/:id/rewrite
// src/app/api/resumes/[id]/rewrite/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateRewrites } from '@/lib/ai-pipeline';
import { RewriteRequest } from '@/types/api';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body: RewriteRequest = await req.json();

  // Verify resume ownership
  const resumeResult = await db.query(
    'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
    [params.id, session.user.id]
  );
  if (resumeResult.rows.length === 0) {
    return NextResponse.json({ success: false, data: null, error: 'Resume not found' }, { status: 404 });
  }

  // Get the most recent analysis for this resume
  const analysisResult = await db.query(
    `SELECT ra.*, jd.parsed_json as jd_parsed
     FROM resume_analyses ra
     JOIN job_descriptions jd ON ra.job_description_id = jd.id
     WHERE ra.resume_id = $1
     ORDER BY ra.created_at DESC LIMIT 1`,
    [params.id]
  );

  if (analysisResult.rows.length === 0) {
    return NextResponse.json(
      { success: false, data: null, error: 'No analysis found. Run analysis first.' },
      { status: 400 }
    );
  }

  const rewrites = await generateRewrites(
    resumeResult.rows[0],
    analysisResult.rows[0].jd_parsed,
    analysisResult.rows[0].feedback_json,
    body.sections ?? ['summary', 'experience', 'skills'],
    body.tone ?? 'professional'
  );

  return NextResponse.json({ success: true, data: rewrites, error: null });
}
```

---

## 5. File Processing Pipeline

### Architecture

```
File Upload (PDF/DOCX)
      │
      ▼
┌─────────────────────┐
│  1. Type Detection   │──► MIME type check (reject non-PDF/DOCX)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Buffer Read     │──► Convert to Node.js Buffer
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
┌──────────┐ ┌──────────┐
│ pdf-parse│ │ mammoth  │
│ (PDF)    │ │ (DOCX)   │
└────┬─────┘ └────┬─────┘
     │            │
     └─────┬──────┘
           │
           ▼
┌─────────────────────┐
│  3. Text Cleaning   │──► Normalize whitespace, remove artifacts
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. Section Detect  │──► Identify resume sections
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  5. Quality Check   │──► Validate extracted text quality
└──────────┬──────────┘
           │
           ▼
      Structured Text
```

### Implementation

```typescript
// src/lib/file-parser.ts

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

interface ParseResult {
  raw_text: string;
  sections: Record<string, string>;
  metadata: {
    word_count: number;
    character_count: number;
    page_count: number | null;
    parsing_method: 'pdf-parse' | 'mammoth' | 'fallback';
    confidence: number;  // 0.0 to 1.0
  };
  warnings: string[];
}

/**
 * Parse a PDF or DOCX file buffer into structured text.
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<ParseResult> {
  const warnings: string[] = [];

  let rawText: string;
  let pageCount: number | null = null;
  let method: 'pdf-parse' | 'mammoth' | 'fallback';

  if (mimeType === 'application/pdf') {
    const result = await parsePDF(buffer);
    rawText = result.text;
    pageCount = result.numpages;
    method = 'pdf-parse';
    warnings.push(...result.warnings);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    rawText = await parseDOCX(buffer);
    method = 'mammoth';
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  // Clean text
  const cleanedText = cleanText(rawText);

  // Quality check
  const confidence = assessQuality(cleanedText);
  if (confidence < 0.3) {
    warnings.push('Low-quality extraction. File may be scanned PDF or contain images.');
  }

  const sections = detectSections(cleanedText);

  return {
    raw_text: cleanedText,
    sections,
    metadata: {
      word_count: cleanedText.split(/\s+/).filter(Boolean).length,
      character_count: cleanedText.length,
      page_count: pageCount,
      parsing_method: method,
      confidence,
    },
    warnings,
  };
}

/**
 * Parse PDF using pdf-parse with error handling for common failure modes.
 */
async function parsePDF(buffer: Buffer): Promise<{
  text: string;
  numpages: number | null;
  warnings: string[];
}> {
  const warnings: string[] = [];

  try {
    const data = await pdfParse(buffer, {
      // Custom renderer to preserve whitespace in bullet points
      renderer: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          return textContent.items
            .map((item) => item.str)
            .join(' ');
        });
      },
    });

    // Detect potential OCR / scanned PDF
    if (data.text.trim().length < 50 && data.numpages > 0) {
      warnings.push(
        'PDF appears to contain mostly images. ' +
        'Consider converting to text-based PDF or uploading DOCX.'
      );
    }

    return {
      text: data.text,
      numpages: data.numpages,
      warnings,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    // Handle encrypted PDFs
    if (msg.includes('encrypted') || msg.includes('password')) {
      throw new Error('PDF is password-protected. Please upload an unprotected version.');
    }

    throw new Error(`Failed to parse PDF: ${msg}`);
  }
}

/**
 * Parse DOCX using mammoth for clean text extraction.
 */
async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    if (result.messages.length > 0) {
      const errors = result.messages.filter((m) => m.type === 'error');
      if (errors.length > 0) {
        console.warn('DOCX warnings:', errors);
      }
    }

    return result.value;
  } catch (error) {
    throw new Error(
      'Failed to parse DOCX file. The file may be corrupted or not a valid DOCX.'
    );
  }
}

/**
 * Clean extracted text: normalize whitespace, remove control characters.
 */
function cleanText(text: string): string {
  return text
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize multiple spaces to single space
    .replace(/ {2,}/g, ' ')
    // Normalize multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace from each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Remove trailing whitespace
    .trim();
}

/**
 * Assess extraction quality based on text characteristics.
 */
function assessQuality(text: string): number {
  let score = 0.5; // baseline

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Length check
  if (wordCount > 200) score += 0.15;
  if (wordCount > 500) score += 0.1;
  if (wordCount < 50) score -= 0.3;

  // Section-like patterns (common resume sections)
  const sectionPatterns = [
    /experience|employment|work history/i,
    /education/i,
    /skills?|technologies|competencies/i,
    /summary|objective|profile/i,
    /projects?/i,
    /certifications?|licenses/i,
  ];

  const matchesFound = sectionPatterns.filter((p) => p.test(text)).length;
  score += matchesFound * 0.05;

  // Email pattern suggests contact info extracted
  if (/@[\w.-]+\.\w{2,}/.test(text)) score += 0.1;

  // Phone pattern
  if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) score += 0.05;

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Detect resume sections using heuristic pattern matching.
 */
function detectSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Common section headers with multiple variations
  const sectionPatterns: Record<string, RegExp[]> = {
    contact: [/^(contact|personal)\s*(info|information)?\s*$/im],
    summary: [
      /^(summary|professional\s+summary|profile|objective|about\s+me)\s*$/im,
    ],
    experience: [
      /^(experience|work\s+experience|employment|work\s+history|professional\s+experience)\s*$/im,
    ],
    education: [/^(education|academic)\s*$/im],
    skills: [
      /^(skills?|technical\s+skills?|technologies|competencies|proficiencies)\s*$/im,
    ],
    projects: [/^(projects?|portfolio|side\s+projects?)\s*$/im],
    certifications: [
      /^(certifications?|licenses?|credentials?|awards?)\s*$/im,
    ],
    languages: [/^(languages?|foreign\s+languages?)\s*$/im],
  };

  const lines = text.split('\n');

  for (const [sectionName, patterns] of Object.entries(sectionPatterns)) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isMatch = patterns.some((p) => p.test(line));

      if (isMatch) {
        // Collect text from this section until next section header
        const sectionLines: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          // Stop if we hit another known section header
          const isNextHeader = Object.values(sectionPatterns).some((ps) =>
            ps.some((p) => p.test(nextLine))
          );
          if (isNextHeader && nextLine.length > 0) break;
          sectionLines.push(lines[j]);
          j++;
        }
        sections[sectionName] = sectionLines.join('\n').trim();
        break; // Found this section, move on
      }
    }
  }

  return sections;
}
```

### Error Handling Matrix

| Error Type | Detection | User Message | Action |
|---|---|---|---|
| Password-protected PDF | `pdf-parse` throws encrypted error | "PDF is password-protected. Please upload an unprotected version." | Return 400 |
| Scanned/image PDF | Text < 50 chars, `numpages > 0` | "This appears to be a scanned PDF. Text extraction may be incomplete." | Process with warning |
| Corrupted file | `pdf-parse` / `mammoth` throws | "File appears to be corrupted. Please re-export and try again." | Return 400 |
| Non-resume content | Quality score < 0.3 | "The document does not appear to be a resume. Please upload a resume file." | Process with warning |
| Oversized file | `file.size > 5MB` | "File size must be under 5MB." | Return 400 |
| Wrong file type | MIME type check | "Only PDF and DOCX files are accepted." | Return 400 |
| Empty document | `wordCount < 10` | "The document appears to be empty." | Return 400 |
| Unsupported encoding | `mammoth` error | "Could not read the DOCX file. Try saving it again from your word processor." | Return 400 |

---

## 6. Cost Model

### Per-User Cost Breakdown

| Operation | Model | Input Tokens | Output Tokens | Cost per Call | Notes |
|---|---|---|---|---|---|
| Resume parse (local) | None | N/A | N/A | $0.000 | pdf-parse/mammoth are free |
| Resume parse (fallback) | GPT-4o-mini | 2,000 | 500 | $0.0005 | Only on heuristic failure |
| Skill extraction | GPT-4o-mini | 2,000 | 1,000 | $0.0017 | $0.15/1M input, $0.60/1M output |
| JD parsing | GPT-4o-mini | 1,500 | 1,000 | $0.0008 | |
| Embedding (resume) | text-embedding-3-small | 1,000 | N/A | $0.00002 | |
| Embedding (JD) | text-embedding-3-small | 500 | N/A | $0.00001 | |
| Gap analysis | GPT-4o | 3,000 | 1,500 | $0.015 | $2.50/1M input, $10/1M output |
| Feedback generation | GPT-4o | 4,000 | 2,000 | $0.03 | |
| Rewrite suggestions | GPT-4o | 5,000 | 3,000 | $0.043 | Per section; full = ~$0.043 |
| pgvector match scoring | None | N/A | N/A | $0.000 | Local computation |

**Total per full analysis (Steps 1-6):** ~$0.048  
**Total per full analysis + rewrites (Steps 1-7):** ~$0.091

### Monthly Cost Projections

Assumptions:
- Average analyses per user per month: **3** (uploads 1 resume, compares to ~3 JDs)
- Average rewrite requests per user per month: **1** (tuned resume after analysis)
- Mix: 60% GPT-4o-mini extraction, 40% GPT-4o analysis steps

| User Count | Analyses/Month | Embeddings | GPT-4o-mini Calls | GPT-4o Calls | AI API Cost/mo | Infrastructure Cost/mo | Total/mo |
|---|---|---|---|---|---|---|---|
| **1,000** | 3,000 | $0.10 | $76 | $450 | ~$527 | ~$50 (Vercel + Supabase free tier) | **~$577** |
| **10,000** | 30,000 | $1.00 | $760 | $4,500 | ~$5,261 | ~$200 (Vercel Pro + Supabase Pro) | **~$5,461** |
| **100,000** | 300,000 | $10.00 | $7,600 | $45,000 | ~$52,610 | ~$1,500 (Vercel Enterprise + Supabase Scale) | **~$54,110** |

### Cost Optimization Strategies

1. **Cache skill extraction results.** If the same resume is analyzed against multiple JDs, skill extraction runs once and is reused. This reduces cost by ~30% for repeat analyses.

2. **Batch embedding requests.** When a user uploads a resume and provides a JD, send both texts in a single `embeddings.create` call (batch API). Reduces per-call overhead by ~20%.

3. **Use GPT-4o-mini for gap analysis on simple cases.** If the skill overlap is >80%, gap analysis can run on GPT-4o-mini instead of GPT-4o, saving ~$0.012 per analysis.

4. **Prompt caching.** OpenAI supports prompt caching for system prompts that appear at the start of requests. For prompts > 1024 tokens, this reduces input costs by 50% on cache hits.

5. **Tiered pricing.** Free tier: 1 analysis/month. Pro tier ($9/mo): 50 analyses/month. Enterprise: unlimited. This aligns revenue with API costs.

---

## 7. Development Environment Setup

### Prerequisites

| Tool | Version | Purpose | Install |
|---|---|---|---|
| Node.js | 20.x LTS | Runtime | `nvm install 20 && nvm use 20` |
| npm | 10.x | Package manager | Comes with Node.js |
| PostgreSQL | 15.x | Database | `brew install postgresql@15` (macOS) or Docker |
| Docker | 24.x | Database container (alternative) | Docker Desktop |
| Git | 2.40+ | Version control | `brew install git` |
| pnpm | 8.x | Package manager (preferred over npm) | `npm install -g pnpm` |

### Step-by-Step Setup

**1. Clone and install dependencies**

```bash
git clone https://github.com/your-org/talentos.git
cd talentos
pnpm install
```

**2. Set up PostgreSQL**

Option A: Docker (recommended for cross-platform consistency)

```bash
docker run -d \
  --name talentos-db \
  -e POSTGRES_USER=talentos \
  -e POSTGRES_PASSWORD=talentos_dev_password \
  -e POSTGRES_DB=talentos_dev \
  -p 5432:5432 \
  pgvector/pgvector:pg15
```

Option B: Local PostgreSQL

```bash
# macOS
brew services start postgresql@15
createdb talentos_dev
createuser talentos -P  # password: talentos_dev_password
```

**3. Enable pgvector extension**

```bash
psql -U talentos -d talentos_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -U talentos -d talentos_dev -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

**4. Environment variables**

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# .env.local — Environment Variables

# ============================================================
# DATABASE
# ============================================================
DATABASE_URL="postgresql://talentos:talentos_dev_password@localhost:5432/talentos_dev?schema=public"

# ============================================================
# AUTH (choose one)
# ============================================================

# Option A: Clerk (recommended)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Option B: NextAuth.js
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="your-random-secret-here"
# GOOGLE_CLIENT_ID="..."
# GOOGLE_CLIENT_SECRET="..."

# ============================================================
# AI / OPENAI
# ============================================================
OPENAI_API_KEY="sk-..."
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
OPENAI_FAST_MODEL="gpt-4o-mini"          # for extraction, parsing
OPENAI_REASONING_MODEL="gpt-4o"          # for analysis, feedback

# Claude backup (optional)
ANTHROPIC_API_KEY="sk-ant-..."

# ============================================================
# FILE STORAGE
# ============================================================

# Option A: Vercel Blob (dev)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Option B: S3 (production)
# AWS_ACCESS_KEY_ID="..."
# AWS_SECRET_ACCESS_KEY="..."
# AWS_REGION="us-east-1"
# S3_BUCKET_NAME="talentos-prod"

# ============================================================
# APP
# ============================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**5. Run database migrations**

```bash
# If using Prisma (recommended):
npx prisma migrate dev --name init
npx prisma generate

# If using raw SQL:
psql -U talentos -d talentos_dev -f ./migrations/001_initial_schema.sql
psql -U talentos -d talentos_dev -f ./migrations/002_add_indexes.sql
```

**6. Seed development data**

```bash
# Prisma
npx prisma db seed

# Or run the seed script directly
pnpm run db:seed
```

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed skills
  const skills = [
    { name: 'JavaScript', category: 'technical', aliases: ['JS', 'ECMAScript'] },
    { name: 'TypeScript', category: 'technical', aliases: ['TS'] },
    { name: 'Python', category: 'technical', aliases: ['Python3'] },
    { name: 'React', category: 'framework', aliases: ['ReactJS', 'React.js'] },
    { name: 'Next.js', category: 'framework', aliases: ['NextJS', 'Next'] },
    { name: 'Node.js', category: 'framework', aliases: ['NodeJS', 'Node'] },
    { name: 'PostgreSQL', category: 'tool', aliases: ['Postgres', 'psql'] },
    { name: 'Docker', category: 'tool', aliases: ['Containers'] },
    { name: 'AWS', category: 'tool', aliases: ['Amazon Web Services'] },
    { name: 'Git', category: 'tool', aliases: ['GitHub', 'GitLab'] },
    { name: 'REST API', category: 'methodology', aliases: ['RESTful', 'REST APIs'] },
    { name: 'GraphQL', category: 'technical', aliases: ['GQL'] },
    { name: 'Tailwind CSS', category: 'framework', aliases: ['Tailwind', 'TailwindCSS'] },
    { name: 'SQL', category: 'technical', aliases: ['SQL Queries'] },
    { name: 'Agile', category: 'methodology', aliases: ['Scrum', 'Sprint'] },
    { name: 'Team Leadership', category: 'soft_skill', aliases: ['Leading teams', 'Management'] },
    { name: 'Communication', category: 'soft_skill', aliases: ['Verbal communication', 'Written communication'] },
    { name: 'Problem Solving', category: 'soft_skill', aliases: ['Critical thinking', 'Analytical thinking'] },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { aliases: skill.aliases },
      create: skill,
    });
  }

  // Seed a test user
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      career_stage: 'mid_career',
      target_role: 'Senior Frontend Engineer',
    },
  });

  console.log('Seed data inserted successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**7. Run locally**

```bash
# Start the dev server
pnpm dev

# The app will be available at:
# http://localhost:3000

# In a separate terminal, if using Prisma Studio for data inspection:
npx prisma studio
```

**8. Verify everything works**

```bash
# Check database connection
pnpm exec prisma db push

# Run type checking
pnpm exec tsc --noEmit

# Run linting
pnpm exec next lint

# Run tests (if configured)
pnpm test
```

### Project Structure

```
talentos/
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Template for env vars (committed)
├── docker-compose.yml            # Local dev services (PostgreSQL, Redis)
├── package.json
├── prisma/
│   ├── schema.prisma             # Prisma schema (mirrors SQL schema above)
│   └── seed.ts                   # Seed script
├── migrations/
│   └── 001_initial_schema.sql    # Raw SQL migration (alternative to Prisma)
├── public/
│   └── ...
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing page
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── resumes/
│   │   │   │   ├── page.tsx      # List resumes
│   │   │   │   └── [id]/page.tsx # Resume detail + analysis
│   │   │   ├── analyze/
│   │   │   │   └── page.tsx      # JD paste + analysis flow
│   │   │   └── matches/
│   │   │       ├── page.tsx      # Match list
│   │   │       └── [id]/page.tsx # Match detail
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   └── login/route.ts
│   │       ├── resumes/
│   │       │   ├── upload/route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── rewrite/route.ts
│   │       ├── analyze/route.ts
│   │       └── matches/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── ResumeUploader.tsx
│   │   ├── AnalysisResults.tsx
│   │   ├── MatchCard.tsx
│   │   ├── SkillGapList.tsx
│   │   └── RewritePreview.tsx
│   ├── lib/
│   │   ├── db.ts                 # Database client (Prisma or pg)
│   │   ├── auth.ts               # Auth helper
│   │   ├── storage.ts            # S3/Blob upload helper
│   │   ├── file-parser.ts        # PDF/DOCX parsing (Section 5)
│   │   ├── ai-pipeline.ts        # AI orchestration (Section 3)
│   │   ├── ai-clients.ts         # OpenAI + Anthropic client setup
│   │   └── prompts/
│   │       ├── parse-resume.ts   # Step 1 prompt
│   │       ├── extract-skills.ts # Step 2 prompt
│   │       ├── parse-jd.ts       # Step 3 prompt
│   │       ├── gap-analysis.ts   # Step 5 prompt
│   │       ├── feedback.ts       # Step 6 prompt
│   │       └── rewrite.ts        # Step 7 prompt
│   ├── types/
│   │   └── api.ts                # All TypeScript interfaces (Section 4)
│   └── hooks/
│       ├── useAnalysis.ts
│       ├── useResumeUpload.ts
│       └── useMatches.ts
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

### Database Migration Commands (Quick Reference)

```bash
# Create a new migration
pnpm exec prisma migrate dev --name <migration_name>

# Apply pending migrations (production)
pnpm exec prisma migrate deploy

# Reset database (dev only — destroys all data)
pnpm exec prisma migrate reset

# Generate Prisma client after schema changes
pnpm exec prisma generate

# Push schema changes without creating a migration (prototyping)
pnpm exec prisma db push

# Open Prisma Studio (visual database browser)
pnpm exec prisma studio
```

### Useful Development Scripts

```jsonc
// package.json — scripts section
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "analyze:dev": "tsx src/scripts/dev-analyze.ts"
  }
}
```

---

## Appendix A: Environment Variable Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/talentos_dev` |
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-...` |
| `OPENAI_FAST_MODEL` | Yes | Model for extraction/parsing | `gpt-4o-mini` |
| `OPENAI_REASONING_MODEL` | Yes | Model for analysis/feedback | `gpt-4o` |
| `ANTHROPIC_API_KEY` | No | Claude API key (backup) | `sk-ant-...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes* | Clerk publishable key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Yes* | Clerk secret key | `sk_test_...` |
| `BLOB_READ_WRITE_TOKEN` | Yes** | Vercel Blob token | `vercel_blob_...` |
| `AWS_ACCESS_KEY_ID` | Yes** | AWS access key (prod storage) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Yes** | AWS secret key (prod storage) | `wJal...` |
| `AWS_REGION` | Yes** | AWS region | `us-east-1` |
| `S3_BUCKET_NAME` | Yes** | S3 bucket name | `talentos-prod` |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL | `http://localhost:3000` |
| `NODE_ENV` | Yes | Environment | `development` or `production` |

\* Required if using Clerk for auth  
\** Required if using S3 for file storage (Vercel Blob is default for dev)

## Appendix B: Key Library Versions

```json
{
  "next": "14.2.x",
  "react": "18.3.x",
  "tailwindcss": "3.4.x",
  "@prisma/client": "5.x",
  "openai": "4.x",
  "@anthropic-ai/sdk": "0.x",
  "pdf-parse": "1.1.x",
  "mammoth": "1.6.x",
  "@clerk/nextjs": "5.x",
  "zod": "3.23.x",
  "tRPC": "11.x",
  "vitest": "1.x"
}
```
