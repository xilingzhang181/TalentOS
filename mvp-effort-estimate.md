# TalentOS MVP: User Stories, Spikes, Sprint Plan & Effort Estimate

**Date**: 2026-07-10
**Product Stage**: Post-discovery, pre-development
**Scope**: P0 MVP features (6 features, 4 two-week sprints)
**Team**: 2-4 engineers, 1 designer, 1 PM

---

## 1. User Stories by Epic

---

### Epic 1: Resume Upload & Parse

**Epic Description**: Enable users to upload PDF/DOCX resume files and automatically extract structured content (name, contact, experience, education, skills) from unstructured documents using LLM-powered extraction.

---

**Story 1.1: Upload Resume File**

> As a job seeker, I want to upload my resume as a PDF or DOCX file, so that the platform can analyze my experience without manual data entry.

**Acceptance Criteria**:

- **Given** I am on the resume upload page, **when** I drag-and-drop or click to select a PDF or DOCX file under 10 MB, **then** the file uploads successfully and I see a progress indicator.
- **Given** I upload a file that is not PDF or DOCX, **when** the system validates the file type, **then** I see a clear error message: "Please upload a PDF or DOCX file."
- **Given** I upload a file larger than 10 MB, **when** the system validates file size, **then** I see an error: "File too large. Please upload a file under 10 MB."
- **Given** my upload is in progress, **when** the network connection drops, **then** I see a retry option and no partial data is persisted.

**Priority**: P0
**Points**: 3

---

**Story 1.2: Extract Resume Sections**

> As a job seeker, I want my resume's sections (experience, education, skills, etc.) to be automatically identified and extracted, so that I don't have to manually categorize my own resume content.

**Acceptance Criteria**:

- **Given** a PDF resume is uploaded, **when** parsing completes successfully, **then** the system extracts: full name, email, phone, work history (company, title, dates, description bullets), education (institution, degree, dates), skills, and certifications as typed structured fields stored as JSON.
- **Given** a DOCX resume is uploaded, **when** parsing completes, **then** the same structured fields are extracted with equal or higher accuracy than PDF.
- **Given** a resume with non-standard formatting (tables, multi-column layouts, graphics), **when** parsing completes, **then** the system extracts at least the core sections (name, experience, education) and flags any low-confidence extractions with a confidence score per field below 0.7.
- **Given** parsing fails entirely, **when** the error is caught, **then** the user sees a message: "We couldn't parse your resume. Try re-uploading or pasting your resume text instead." with a visible text-paste fallback.
- **Given** a resume in a language other than English, **when** parsing completes, **then** structured fields are extracted with best-effort results and the system notes the detected language for downstream processing.

**Priority**: P0
**Points**: 8

---

**Story 1.3: Review & Edit Parsed Resume**

> As a job seeker, I want to review the extracted content from my resume and correct any parsing errors, so that the analysis I receive is based on accurate data.

**Acceptance Criteria**:

- **Given** my resume has been parsed, **when** I reach the review screen, **then** I see all extracted fields in an editable form organized by section (Contact, Experience, Education, Skills).
- **Given** I edit an extracted field (e.g., fix a misspelled company name), **when** I save the change, **then** the update is persisted in the database and reflected in all subsequent analysis runs.
- **Given** the system flagged a low-confidence extraction, **when** I view the review screen, **then** that field is visually highlighted with a prompt to verify the content.
- **Given** I finish reviewing my parsed resume, **when** I click "Continue to Analysis," **then** the finalized structured resume is submitted and the user is navigated to the analysis results view.

**Priority**: P0
**Points**: 5

---

**Story 1.4: Store Resume for Reuse**

> As a job seeker, I want my parsed resume saved to my account, so that I don't need to re-upload it every time I return.

**Acceptance Criteria**:

- **Given** I have an account and a parsed resume, **when** I return to the platform and navigate to my dashboard, **then** my most recent active resume is displayed with its parse status and upload date.
- **Given** I upload a new resume, **when** the new parse completes, **then** the previous version is archived (not deleted) and the new version becomes the active resume.
- **Given** I want to delete a resume, **when** I confirm the deletion action, **then** the resume data and all associated analyses are permanently removed from my account within the session.

**Priority**: P0
**Points**: 3

---

### Epic 2: AI Resume Analysis

**Epic Description**: Provide LLM-powered, section-by-section resume feedback with numerical scores and actionable improvement suggestions, using a dual-model architecture (lightweight model for extraction/routing, heavyweight model for diagnosis/recommendations).

---

**Story 2.1: Generate Resume Score**

> As a job seeker, I want an overall score (0-100) for my resume with a breakdown by dimension, so that I can quickly assess my resume's quality at a glance.

**Acceptance Criteria**:

- **Given** a parsed resume is submitted for analysis, **when** analysis completes, **then** I see an overall score (0-100) and individual scores for five dimensions: Experience Alignment, Skills Coverage, Education Fit, Industry Relevance, and Growth Potential.
- **Given** scores are generated, **when** I view the breakdown, **then** each dimension includes a 1-2 sentence rationale explaining the score and a confidence indicator (High / Medium / Low).
- **Given** the LLM call fails or times out (>20 s), **when** the error is caught, **then** the user sees "Analysis temporarily unavailable. Please try again in a moment." and no partial or placeholder scores are shown.
- **Given** the total analysis cost is computed, **when** the request completes, **then** the cost is logged server-side and does not exceed $0.05 per analysis.

**Priority**: P0
**Points**: 5

---

**Story 2.2: Get Section-by-Section Feedback**

> As a job seeker, I want detailed, actionable feedback for each section of my resume (summary, experience, education, skills), so that I know exactly what to improve and where.

**Acceptance Criteria**:

- **Given** my resume analysis is complete, **when** I expand the Experience section, **then** I see: (a) current content assessment, (b) at least 2 specific improvement suggestions, and (c) an example of a stronger version referencing my actual company names, roles, and skills.
- **Given** feedback references my actual resume content, **when** I read it, **then** every suggestion is specific to my resume (mentions my actual companies, roles, skills, and dates) and not generic advice.
- **Given** a suggestion is generated, **when** I review it, **then** it is actionable -- it tells me what to change, not just that something is wrong (e.g., "Rewrite this bullet to quantify team size" instead of "Improve your bullet points").
- **Given** the system detects a resume section is missing (e.g., no summary statement), **when** analysis completes, **then** the feedback includes: "Consider adding a professional summary" with a suggested template tailored to my industry.
- **Given** the fact-consistency gate runs after generation, **when** any suggestion contains claims not grounded in the original resume, **then** that suggestion is flagged with low confidence or removed before display.

**Priority**: P0
**Points**: 8

---

**Story 2.3: View Analysis History**

> As a job seeker, I want to see a history of my resume analyses with scores, so that I can track my improvement over time.

**Acceptance Criteria**:

- **Given** I have multiple resume versions analyzed, **when** I view my dashboard, **then** I see a chronological list showing: date, resume version label, overall score, and top improvement category for each analysis.
- **Given** I click on a historical analysis entry, **when** the detail view loads, **then** I see the full analysis as it appeared at the time it was generated, including all scores and feedback.
- **Given** I have analyzed the same resume against two different JDs, **when** I view the history list, **then** I can see the score delta between the two analyses and which JD produced the higher match.

**Priority**: P0
**Points**: 5

---

### Epic 3: Job Matching

**Epic Description**: Use semantic embeddings stored in pgvector to match a user's parsed resume against a corpus of real job postings, returning ranked results with match scores based on skill alignment, experience relevance, and role fit.

---

**Story 3.1: Ingest Job Postings**

> As the platform, I need an automated pipeline to ingest real job postings with structured data, so that users can be matched against actual open positions.

**Acceptance Criteria**:

- **Given** the job ingestion pipeline runs, **when** it processes a batch of job listings from the configured API source, **then** each job is stored with: title, company, location, salary range (if available), full description text, required skills, preferred skills, and posting date.
- **Given** a job posting is ingested, **when** the embedding is computed using the selected model, **then** the job has a vector representation stored in pgvector with an HNSW index for efficient similarity search.
- **Given** the ingestion job runs on its daily schedule, **when** new postings are added and postings older than 90 days are processed, **then** stale jobs are soft-deleted (excluded from matching but retained in the database).
- **Given** a job posting fails to parse or embed, **when** the error is logged, **then** the job is quarantined and excluded from matching results, and the failure is surfaced in an admin alert.
- **Given** the pipeline has processed at least 500 jobs, **when** the minimum corpus threshold is met, **then** the matching feature is enabled for end users.

**Priority**: P0
**Points**: 8

---

**Story 3.2: Match Resume to Jobs**

> As a job seeker, I want to see the top job matches ranked by relevance to my resume, so that I can focus my application efforts on roles where I have the strongest fit.

**Acceptance Criteria**:

- **Given** my parsed resume is ready and embeddings have been computed, **when** I request job matches, **then** I see up to 20 ranked results returned within 10 seconds.
- **Given** match results are returned, **when** I view the list, **then** each result shows: job title, company, location, match score (0-100), and a one-line summary of the match rationale.
- **Given** I apply a filter (location, industry, or minimum match score), **when** the filter is applied, **then** the results update to show only matching jobs that meet the filter criteria.
- **Given** there are fewer than 20 jobs above the minimum match threshold (score >= 30), **when** results are returned, **then** all qualifying jobs are displayed with a note: "Showing all matches above threshold."

**Priority**: P0
**Points**: 5

---

**Story 3.3: View Match Details**

> As a job seeker, I want to see detailed information about a specific job match, including the full job description and my overlap, so that I can decide whether to apply.

**Acceptance Criteria**:

- **Given** I click on a job match from the results list, **when** the detail view loads, **then** I see: the full job description, a match score breakdown (skill match %, experience match %, education match %), and a categorized list of matched versus missing skills.
- **Given** the detail view displays skill overlap, **when** I review the skill lists, **then** each skill is categorized as: Strong Match, Partial Match, or Gap.
- **Given** I decide to apply to the job, **when** I click "Apply to Job," **then** I am redirected to the original job posting URL in a new browser tab.

**Priority**: P0
**Points**: 5

---

### Epic 4: Match Explainability

**Epic Description**: Provide transparent, specific reasoning for why each job matches the user's profile, going beyond scores to explain the actual evidence behind the match using LLM-generated explanation chains.

---

**Story 4.1: Generate Match Explanation**

> As a job seeker, I want to understand WHY a specific job matches my profile with specific evidence from my resume, so that I can make informed decisions about which roles to pursue.

**Acceptance Criteria**:

- **Given** a job match score is generated, **when** the explanation is produced, **then** it includes at least 3 specific reasons with supporting evidence from the user's resume (e.g., "Your 4 years of React experience matches their 3+ year requirement" -- not "your skills match well").
- **Given** an explanation references resume content, **when** I read it, **then** every claim is traceable to a specific section or bullet point in my original resume, with the source section labeled.
- **Given** an explanation identifies a skill gap, **when** it does so, **then** the gap is categorized by criticality: Deal-breaker (required, missing) / Nice-to-have (preferred, missing) / Can-learn (missing, but trainable).
- **Given** the LLM generates an explanation, **when** I view it, **then** each reasoning point includes a confidence indicator (High / Medium / Low) reflecting the system's certainty about that claim.
- **Given** the hallucination gate runs post-generation, **when** any explanation contains fabricated claims not grounded in the resume, **then** that claim is removed or rewritten before display.

**Priority**: P0
**Points**: 8

---

**Story 4.2: View Skill-Level Match Evidence**

> As a job seeker, I want to see exactly which of my skills map to which job requirements and how strongly, so that I can identify my competitive advantages and gaps for a specific role.

**Acceptance Criteria**:

- **Given** I view a job match detail page, **when** I expand the skill evidence section, **then** I see a two-column layout: "Your Skills" on the left mapped to "Job Requirements" on the right, with connection strength labeled as Strong / Moderate / Weak for each pair.
- **Given** a skill gap is identified, **when** I view it, **then** the gap is labeled by priority: Required (must-have in the JD) vs. Preferred (nice-to-have in the JD).
- **Given** I have a transferable skill the system recognizes, **when** the mapping is displayed, **then** the explanation notes: "Your [X] experience is transferable to [Y] because [reason]."
- **Given** there are more than 15 skills to display, **when** the list renders, **then** skills are grouped by category (Technical, Soft Skills, Domain) and the list is scrollable without breaking the layout.

**Priority**: P0
**Points**: 5

---

### Epic 5: Before/After Resume Diff

**Epic Description**: Enable users to compare their original resume against an AI-optimized version with annotated changes, grounded in the analysis feedback and constrained to prevent fact fabrication.

---

**Story 5.1: Generate Optimized Resume Version**

> As a job seeker, I want the platform to generate an improved version of my resume based on the analysis feedback, so that I can see concrete improvements rather than just reading abstract advice.

**Acceptance Criteria**:

- **Given** my resume analysis is complete, **when** I click "Generate Optimized Version," **then** an improved resume is generated within 30 seconds, with changes applied to the summary, experience bullet points, and skills section.
- **Given** the optimized version is generated, **when** I review it, **then** every change from the original is tracked as a discrete modification with a source-annotation explaining what changed and why (referencing the JD requirement).
- **Given** a section of the resume is already optimal, **when** generation runs, **then** that section is left unchanged with an inline note: "This section is already strong."
- **Given** the generation fails or times out, **when** the error is caught, **then** the user sees a clear error message and can retry without losing their original parsed resume data.
- **Given** the fact-consistency gate runs on the generated resume, **when** any rewritten bullet introduces claims not present in the original, **then** that bullet is either reverted to the original or flagged with a warning before the user sees it.

**Priority**: P0
**Points**: 8

---

**Story 5.2: View Side-by-Side Diff**

> As a job seeker, I want to see my original and optimized resume side-by-side with highlighted changes, so that I can evaluate each suggestion and decide what to adopt.

**Acceptance Criteria**:

- **Given** both original and optimized versions exist, **when** I enter the diff view, **then** I see a split-screen layout: original on the left, optimized on the right, with changed sections visually highlighted.
- **Given** a change is highlighted, **when** I hover over the highlighted region, **then** I see: what changed, why it changed (with reference to the analysis feedback or JD requirement), and the AI's confidence in the improvement.
- **Given** I disagree with a specific change, **when** I click "Keep Original" on that section or line, **then** the optimized version reverts to the original text for that specific change only.
- **Given** I want to accept all changes at once, **when** I click "Accept All Changes," **then** the optimized version becomes my active resume and is stored in my account.

**Priority**: P0
**Points**: 8

---

**Story 5.3: Export Optimized Resume**

> As a job seeker, I want to export my final resume (original or optimized) as a PDF, so that I can use it for job applications.

**Acceptance Criteria**:

- **Given** I have a finalized resume (original or optimized), **when** I click "Export PDF," **then** a clean, professionally formatted PDF is downloaded within 5 seconds.
- **Given** the PDF is generated from the optimized version, **when** I open the file, **then** the formatting follows standard resume conventions: clear section headers, consistent fonts, ATS-friendly single-column layout.
- **Given** my resume contains special characters or non-English text, **when** the PDF renders, **then** all characters display correctly with no encoding artifacts.

**Priority**: P0
**Points**: 5

---

### Epic 6: Basic User Profile

**Epic Description**: Provide account creation, authentication, and basic profile management so users can save resumes, track analysis history, and maintain state across sessions using NextAuth.js.

---

**Story 6.1: Create Account**

> As a job seeker, I want to create an account using email or OAuth (Google), so that I can save my resume and analysis history across sessions.

**Acceptance Criteria**:

- **Given** I am a new user, **when** I click "Sign Up," **then** I can register via email + password or Google OAuth.
- **Given** I register via email, **when** I submit the form, **then** I receive a verification email and cannot use account features until I verify my email address.
- **Given** I register via Google OAuth, **when** I complete the OAuth flow, **then** my account is created immediately without a separate verification step.
- **Given** I try to register with an email that already has an account, **when** the system checks against the database, **then** I see: "An account already exists with this email. Please sign in." and I am offered a sign-in link.

**Priority**: P0
**Points**: 5

---

**Story 6.2: Sign In / Sign Out**

> As a registered user, I want to sign in to access my saved data and sign out when I'm done, so that my career data stays private and persistent.

**Acceptance Criteria**:

- **Given** I have a verified account, **when** I enter valid credentials and submit, **then** I am authenticated, a session is created, and I am redirected to my dashboard.
- **Given** I enter invalid credentials, **when** the system validates against the database, **then** I see: "Invalid email or password." (without revealing which field is incorrect).
- **Given** I am signed in, **when** I click "Sign Out" in the header, **then** my session is terminated and I am redirected to the public landing page.
- **Given** my session expires after 30 days of inactivity, **when** I return to the platform, **then** I am redirected to the sign-in page with a message: "Your session has expired. Please sign in again."

**Priority**: P0
**Points**: 3

---

**Story 6.3: View Dashboard**

> As a signed-in user, I want a dashboard showing my resumes, recent analyses, and job matches, so that I can quickly resume where I left off.

**Acceptance Criteria**:

- **Given** I am signed in, **when** the dashboard loads, **then** I see: my active resume (with parse status and upload date), the last 5 analyses (with overall scores and dates), and the top 3 job matches (if any exist).
- **Given** I have no data yet (new account), **when** the dashboard loads, **then** I see an onboarding prompt: "Upload your first resume to get started" with a prominent upload button.
- **Given** I click on any item in the dashboard (a resume, an analysis, or a job match), **when** the navigation completes, **then** I am taken to the relevant detail view with all data loaded.

**Priority**: P0
**Points**: 3

---

## 2. User Stories Summary Table

| Story ID | Story Title | Epic | Points | Priority | Sprint |
|----------|-------------|------|--------|----------|--------|
| 1.1 | Upload Resume File | Resume Upload & Parse | 3 | P0 | 1 |
| 1.2 | Extract Resume Sections | Resume Upload & Parse | 8 | P0 | 1 |
| 1.3 | Review & Edit Parsed Resume | Resume Upload & Parse | 5 | P0 | 2 |
| 1.4 | Store Resume for Reuse | Resume Upload & Parse | 3 | P0 | 2 |
| 2.1 | Generate Resume Score | AI Resume Analysis | 5 | P0 | 2 |
| 2.2 | Get Section-by-Section Feedback | AI Resume Analysis | 8 | P0 | 2 |
| 2.3 | View Analysis History | AI Resume Analysis | 5 | P0 | 2 |
| 3.1 | Ingest Job Postings | Job Matching | 8 | P0 | 3 |
| 3.2 | Match Resume to Jobs | Job Matching | 5 | P0 | 3 |
| 3.3 | View Match Details | Job Matching | 5 | P0 | 3 |
| 4.1 | Generate Match Explanation | Match Explainability | 8 | P0 | 4 |
| 4.2 | View Skill-Level Match Evidence | Match Explainability | 5 | P0 | 4 |
| 5.1 | Generate Optimized Resume Version | Before/After Diff | 8 | P0 | 4 |
| 5.2 | View Side-by-Side Diff | Before/After Diff | 8 | P0 | 4 |
| 5.3 | Export Optimized Resume | Before/After Diff | 5 | P0 | 4 |
| 6.1 | Create Account | Basic User Profile | 5 | P0 | 1 |
| 6.2 | Sign In / Sign Out | Basic User Profile | 3 | P0 | 1 |
| 6.3 | View Dashboard | Basic User Profile | 3 | P0 | 2 |
| | | | **103** | | |

---

## 3. Technical Spikes

These are time-boxed investigations (2-5 days each) that should run before or during Sprint 1 to reduce build uncertainty. All spike work uses the production stack: Next.js frontend, Node.js API routes (or Python microservice for LLM-heavy workloads), PostgreSQL + pgvector, and the selected LLM provider.

---

### Spike 1: AI Prompt Engineering for Resume Analysis

**Unknown**: Can we produce reliable, structured resume feedback (scores + section-level suggestions) via LLM without hallucinated advice or generic output?

**Approach**:
1. Build 5 test prompts with different structures (few-shot, chain-of-thought, structured JSON output)
2. Test against 10 diverse resumes (different industries, formats, quality levels)
3. Evaluate: output consistency, specificity (does it reference actual resume content?), hallucination rate, cost per analysis
4. Compare GPT-4o-mini (extraction/routing) vs. Claude 3.5 Sonnet vs. GPT-4o (diagnosis/recommendations) for quality-cost tradeoff
5. Test structured JSON output reliability for programmatic UI rendering in Next.js

**Duration**: 3 days
**Owner**: Senior Engineer
**Outputs**: Recommended model routing (light vs. heavy tasks), prompt template library, validated output JSON schema, per-analysis cost estimate

**Key Questions to Answer**:
- What is the minimum viable prompt that produces specific (not generic) feedback?
- Can we reliably get structured JSON output from the LLM for programmatic rendering in the React frontend?
- What is the per-analysis token cost at each model tier, and does it stay under the $0.05 target?
- How should we handle resume sections the model fails to parse or gives low-confidence outputs?

---

### Spike 2: Embedding Model Selection for Job Matching

**Unknown**: Which embedding model produces the best semantic match quality for resume-to-job matching, and what latency/accuracy tradeoffs are acceptable with pgvector?

**Approach**:
1. Compare: OpenAI `text-embedding-3-small`, `text-embedding-3-large`, Cohere `embed-v3`, and `bge-large-en-v1.5` (self-hosted option)
2. Build a test set of 50 resume-JD pairs with human-labeled match relevance (1-5 scale)
3. Compute cosine similarity using pgvector and evaluate rank quality (NDCG@10, MRR)
4. Measure: embedding latency per document, pgvector query latency at scale (1K, 10K, 50K jobs), index build time
5. Test HNSW vs. IVFFlat index configurations for the expected corpus size

**Duration**: 4 days
**Owner**: Backend Engineer
**Outputs**: Selected embedding model, optimal pgvector index configuration, similarity threshold for "match," benchmark latency results at projected corpus size

**Key Questions to Answer**:
- Which model best captures semantic equivalence between paraphrased requirements (e.g., "managed a team" vs. "led cross-functional teams")?
- What is the end-to-end latency for a 50K-job corpus embedding search in pgvector?
- Can we use `text-embedding-3-small` (cheaper) for fast pre-filtering + a heavier model for final reranking?
- How often do embeddings need to be recomputed as jobs are added or removed from the corpus?

---

### Spike 3: PDF/DOCX Parsing Reliability

**Unknown**: What is the actual accuracy of automated resume parsing across the diversity of real-world resume formats?

**Approach**:
1. Collect 30 real resumes from diverse sources (different tools: Word, LaTeX, Canva, Google Docs, scanned PDFs, Chinese-language resumes)
2. Test parsers: `pdfplumber`, `python-docx`, `unstructured.io`, `PyMuPDF`, and LLM-assisted extraction (GPT-4o-mini with vision for image-based PDFs)
3. Manually label ground truth for all 30 resumes
4. Measure: field extraction F1 score, section detection accuracy, handling of multi-column layouts, tables, and embedded graphics
5. Determine the fallback chain: code-based parser first, LLM-assisted extraction for failures

**Duration**: 3 days
**Owner**: Backend Engineer
**Outputs**: Recommended parser stack with fallback chain, accuracy baseline across resume types, known failure modes catalog, text-paste fallback specification

**Key Questions to Answer**:
- What percentage of real resumes can we parse with >90% field accuracy using pure code extraction?
- When does code-based parsing fail, and does LLM-assisted extraction fill the gap reliably?
- How should we handle scanned PDFs (image-only, no embedded text)?
- Is there a meaningful accuracy gap between PDF and DOCX parsing that requires different code paths?

---

### Spike 4: Job Data Sourcing Strategy

**Unknown**: How do we acquire a sufficient corpus of real job postings for matching without running into legal/ToS issues or excessive cost?

**Approach**:
1. Evaluate job data sources: JSearch (RapidAPI), Adzuna API, Indeed Publisher API, government labor databases (O\*NET, EURES), public job board RSS feeds
2. Assess: data freshness, structured field availability, rate limits, cost per 1K postings, ToS compliance for commercial use
3. Evaluate a "manual curation" MVP approach: 500-1,000 hand-curated postings across key PM/HR/engineering roles
4. Prototype a Node.js ingestion script that pulls from the top 2 sources, normalizes schema, and pushes to PostgreSQL

**Duration**: 4 days
**Owner**: Backend Engineer + PM
**Outputs**: Recommended data source(s), ingestion pipeline prototype, normalized job schema for PostgreSQL, cost model, legal compliance notes

**Key Questions to Answer**:
- Can we get 10,000+ job postings with structured skills and descriptions legally and affordably?
- Which API provides the cleanest structured data (title, company, required skills, full description)?
- What is the update cadence -- do we need daily refresh, or is weekly sufficient for an MVP?
- Should we start with a curated set of 500 jobs to validate the matching algorithm before investing in automated ingestion?

---

### Spike 5: LLM-Based Resume Rewrite Quality

**Unknown**: Can an LLM produce an improved resume version that is measurably better without fabricating experience or losing the user's authentic voice?

**Approach**:
1. Take 5 resumes + their analysis feedback from Spike 1
2. Test 3 rewriting approaches: (a) direct rewrite, (b) rewrite with strict fact-grounding constraint (only rephrase, never add facts), (c) rewrite with a "change list" that the user approves before applying
3. Have 3 human reviewers blind-evaluate original vs. optimized on: readability, impact, accuracy, authenticity
4. Measure hallucination rate (fact invention per rewrite) and cost per generation
5. Validate output against the fact-consistency NLI check gate

**Duration**: 3 days
**Owner**: Senior Engineer
**Outputs**: Recommended rewrite approach, validated prompt template with fact-grounding constraints, hallucination guardrails, user approval flow design recommendation

**Key Questions to Answer**:
- What is the hallucination rate when asking an LLM to "improve" resume bullets?
- Does constraining the LLM to only modify phrasing (never add/remove facts) reduce hallucination to an acceptable level (<2%)?
- How should the approval flow work: approve all changes at once, or section-by-section with individual accept/reject?
- What is the latency and cost for generating an optimized resume versus the analysis itself?

---

## 4. Sprint Plan

### Sprint 1: Foundation (Weeks 1-2)

**Goal**: Users can sign up, upload a resume, and see parsed structured output.

**Sprint Capacity**: 38 points (assuming 2 engineers at ~19 pts/sprint each, accounting for ramp-up)

| Story | Title | Points | Assignee | Dependencies |
|-------|-------|--------|----------|--------------|
| 6.1 | Create Account | 5 | Eng 1 | -- |
| 6.2 | Sign In / Sign Out | 3 | Eng 1 | Story 6.1 |
| 1.1 | Upload Resume File | 3 | Eng 2 | -- |
| 1.2 | Extract Resume Sections | 8 | Eng 2 | Story 1.1 |
| -- | **Spike 3**: PDF/DOCX Parsing Reliability | -- | Eng 2 | -- |
| -- | Project scaffolding (Next.js frontend + Node.js API routes + PostgreSQL schema) | 5 | Eng 1 | -- |
| -- | Database schema design (users, resumes, analyses, jobs tables + pgvector extension) | 3 | Eng 1 | -- |
| **Sprint 1 Total** | | **27 pts** | | |

**Sprint 1 Notes**:
- Spike 3 (Parsing Reliability) runs in parallel with scaffolding and feeds directly into Story 1.2 implementation decisions
- Designer: Set up design system tokens, wireframe upload flow, parsing review screen, and dashboard layout
- PM: Begin Spike 4 (Job Data Sourcing) research in parallel; start curating an initial 500-job dataset if API access is delayed
- Risk: Parsing complexity may be underestimated. Story 1.2 (8 pts) is the highest-risk story in this sprint. If parsing is harder than expected, Story 1.3 should be descoped to a simpler "confirm or re-upload" flow rather than a full edit form

**Sprint 1 Deliverable**: A user can create an account, upload a PDF or DOCX, see parsed resume data with section extractions, and the parsed data is stored in PostgreSQL.

---

### Sprint 2: AI Analysis (Weeks 3-4)

**Goal**: Users receive structured, section-by-section resume feedback with scores.

**Sprint Capacity**: 42 points (team is now ramped up, infrastructure is in place)

| Story | Title | Points | Assignee | Dependencies |
|-------|-------|--------|----------|--------------|
| 1.3 | Review & Edit Parsed Resume | 5 | Eng 1 | Story 1.2 |
| 1.4 | Store Resume for Reuse | 3 | Eng 1 | Story 6.1 |
| 6.3 | View Dashboard | 3 | Eng 1 | Stories 6.1, 1.4 |
| 2.1 | Generate Resume Score | 5 | Eng 2 | Story 1.2 |
| 2.2 | Get Section-by-Section Feedback | 8 | Eng 2 | Story 2.1 |
| 2.3 | View Analysis History | 5 | Eng 2 | Story 2.1 |
| -- | **Spike 1**: Prompt Engineering for Analysis | -- | Eng 1 | -- |
| -- | **Spike 5**: Resume Rewrite Quality | -- | Eng 2 | -- |
| **Sprint 2 Total** | | **29 pts** (+ 2 spikes) | | |

**Sprint 2 Notes**:
- Spike 1 (Prompt Engineering) must complete by end of Week 3 -- it is a gating dependency for Stories 2.1 and 2.2. If prompts produce generic advice, the team pivots to investing more iteration time before building the UI.
- Spike 5 (Rewrite Quality) feeds directly into Sprint 4's Before/After Diff feature. Results should be available by end of Sprint 2.
- Designer: Dashboard layout, analysis results page, score visualizations (radar or bar chart for 5 dimensions), feedback cards
- PM: Define the scoring rubric (what constitutes a 70 vs. a 90 in each dimension), validate prompt outputs against 10 sample resumes, write UX copy for feedback screens
- Risk: LLM output quality and consistency is the single biggest risk in this sprint. If prompts produce generic, non-specific advice, the entire value proposition weakens. Spike 1 results serve as a go/no-go gate for continuing down the current prompt approach.

**Sprint 2 Deliverable**: A user can upload a resume, see a scored analysis with section-by-section feedback, review and edit parsed fields, and view their analysis history on a dashboard.

---

### Sprint 3: Matching (Weeks 5-6)

**Goal**: Users see ranked job matches with match scores based on semantic similarity.

**Sprint Capacity**: 42 points

| Story | Title | Points | Assignee | Dependencies |
|-------|-------|--------|----------|--------------|
| 3.1 | Ingest Job Postings | 8 | Eng 1 | Spike 2, Spike 4 |
| 3.2 | Match Resume to Jobs | 5 | Eng 1 | Stories 3.1, 1.2 |
| 3.3 | View Match Details | 5 | Eng 1 | Story 3.2 |
| -- | **Spike 2**: Embedding Model Selection | -- | Eng 2 | -- |
| -- | Job ingestion pipeline (API integration + scheduled ingestion job on Node.js) | 5 | Eng 2 | Spike 4 |
| -- | pgvector setup + HNSW embedding index on PostgreSQL | 3 | Eng 1 | Spike 2 |
| -- | Match filtering UI (location, industry, minimum score) | 3 | Eng 2 | Story 3.2 |
| **Sprint 3 Total** | | **29 pts** (+ 1 spike) | | |

**Sprint 3 Notes**:
- Spike 2 (Embedding Selection) must complete by end of Week 5, Day 3 -- it is a critical dependency for the ingestion pipeline and matching query. If it runs late, Stories 3.1 and 3.2 slip.
- Spike 4 (Job Data Sourcing) should have been researched in parallel during Sprint 1-2 by PM + Eng. Its output (recommended API, normalized schema) feeds directly into the ingestion pipeline.
- Designer: Job match cards, match results list page, filtering sidebar/toolbar, match detail view
- PM: Curate initial 500-1,000 job corpus if API access is delayed; validate match quality with 10 test resumes across different career levels; define minimum acceptable match quality threshold
- Risk: Job data sourcing is a major external dependency. If no clean, affordable API is available, we fall back to a manually curated dataset, which limits the breadth of matching results. This is a value-reduction risk, not a blocking risk.

**Sprint 3 Deliverable**: A user can upload a resume and see a ranked list of job matches with scores, detailed match breakdowns, and skill-level match evidence.

---

### Sprint 4: Polish (Weeks 7-8)

**Goal**: Match explainability, before/after diff, and retention hooks are complete. The MVP is ready for closed beta.

**Sprint Capacity**: 42 points

| Story | Title | Points | Assignee | Dependencies |
|-------|-------|--------|----------|--------------|
| 4.1 | Generate Match Explanation | 8 | Eng 1 | Stories 3.2, Spike 1 |
| 4.2 | View Skill-Level Match Evidence | 5 | Eng 1 | Story 4.1 |
| 5.1 | Generate Optimized Resume Version | 8 | Eng 2 | Stories 2.2, Spike 5 |
| 5.2 | View Side-by-Side Diff | 8 | Eng 2 | Story 5.1 |
| 5.3 | Export Optimized Resume | 5 | Eng 2 | Story 5.2 |
| -- | Bug fixes + end-to-end integration testing across all 4 sprints | 5 | Eng 1 | All stories |
| -- | Error handling, edge cases, and loading-state polish | 3 | Eng 2 | All stories |
| **Sprint 4 Total** | | **42 pts** | | |

**Sprint 4 Notes**:
- This sprint carries the highest AI complexity: explainability generation, resume rewriting, and the diff UI all land here. If Sprint 2-3 deliverables are solid, this sprint is straightforward. If earlier sprints slipped, this sprint is at high risk.
- Spike 5 (Rewrite Quality) results from Sprint 2 are required before Story 5.1 implementation begins.
- Designer: Diff view component, explainability cards, PDF export template, "Try Another JD" retention prompt, shareable analysis link page
- PM: Finalize all UX copy, prepare beta launch checklist (landing page, onboarding flow, error states), define beta success metrics, draft outreach plan for 20-50 beta users
- Risk: Before/After Diff (Story 5.2, 8 pts) is the most complex UI component in the MVP. If behind schedule, this is the first candidate for simplification -- see Scope Flexibility section.

**Sprint 4 Deliverable**: Full MVP with all 6 P0 epics functional. Ready for closed beta with 20-50 users. All critical paths tested end-to-end.

---

## 5. Effort Summary

### 5.1 Total Story Points

| Category | Points |
|----------|--------|
| Epic 1: Resume Upload & Parse | 19 |
| Epic 2: AI Resume Analysis | 18 |
| Epic 3: Job Matching | 18 |
| Epic 4: Match Explainability | 13 |
| Epic 5: Before/After Diff | 21 |
| Epic 6: Basic User Profile | 11 |
| **Subtotal: User Stories** | **100** |
| Infrastructure (scaffolding, DB, pgvector, deployment) | 8 |
| Bug fixes + integration testing | 5 |
| **Total** | **113 points** |

### 5.2 Team Velocity Assumption

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Team size | 2 engineers (core), 1 designer, 1 PM | Assumes 2 dedicated full-stack/backend engineers |
| Velocity per engineer | 19-21 pts/sprint | Conservative for a small, focused team on a greenfield project |
| Sprint velocity (team) | ~38-42 pts/sprint | After accounting for meetings, code review, CI/CD overhead |
| AI integration overhead | +15-20% | LLM debugging, prompt iteration cycles, non-deterministic output handling |
| **Adjusted velocity** | **~35 pts/sprint** | After applying AI overhead discount |

### 5.3 Timeline to MVP Delivery

| Scenario | Points/Sprint | Sprints Needed | Calendar Weeks |
|----------|---------------|----------------|----------------|
| **Optimistic** | 40 pts | 3 sprints | 6 weeks |
| **Realistic** | 35 pts | 3.2 sprints (~3.5) | 7 weeks |
| **Conservative** | 30 pts | 3.8 sprints (~4) | 8 weeks |

**Recommended commitment: 8 weeks (4 sprints)** -- this provides buffer for AI integration complexity, prompt iteration cycles, and the unknowns identified in the technical spikes.

### 5.4 Key Risks to Timeline

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| R1 | **PDF/DOCX parsing accuracy is lower than expected** -- real-world resumes are messy (tables, columns, images, mixed languages) | High | High (delays Sprint 1-2) | Spike 3 runs first; implement LLM-assisted fallback parser; allow text-paste as backup input; budget 2-3 days for parser iteration |
| R2 | **LLM output quality is generic/unreliable** -- prompts produce ChatGPT-generic advice, not specific-to-user insight | Medium | Critical (undermines entire value prop) | Spike 1 validates before Sprint 2 begins; invest in few-shot examples and structured output schemas; budget for 2-3 prompt iteration cycles per feature |
| R3 | **Job data sourcing is harder than expected** -- APIs are expensive, rate-limited, or ToS-restricted | High | Medium (delays Sprint 3) | Start with curated 500-job dataset; build a source-abstraction layer so we can swap APIs later without rewriting ingestion; evaluate government data (O*NET) |
| R4 | **LLM costs exceed $0.05/analysis budget** -- token usage makes unit economics unviable | Medium | Medium | Use GPT-4o-mini for extraction/routing; reserve heavyweight models for analysis/rewriting only; implement per-request token budgets with hard caps; monitor daily cost dashboard |
| R5 | **Before/After Diff UI is over-engineered** -- complex diff rendering takes longer than estimated | Medium | Low-Medium | Implement section-level diff first (not character-level); use a battle-tested diff library (e.g., `diff2html`) rather than building from scratch |
| R6 | **Team bandwidth loss** -- illness, competing priorities, hiring delays | Medium | High | Keep critical-path stories (1.1-1.2, 2.1-2.2, 3.1-3.2) on the most experienced engineer; avoid deep parallel dependencies that create single-point-of-failure bottlenecks |

---

## 6. Scope Flexibility: What to Cut If Behind Schedule

### First to Cut (if 1 week behind -- detected end of Sprint 2)

| Feature | Story | Points Saved | Impact |
|---------|-------|-------------|--------|
| Analysis History timeline | 2.3 | 5 pts | Users lose "improvement tracking" but core analysis still works. History can be added in P1. |
| Match filtering UI | (Sprint 3 scope) | 3 pts | Users see all matches unfiltered; results are still ranked by relevance, so this is cosmetic, not functional. |
| Resume export to PDF | 5.3 | 5 pts | Users can screenshot or copy-paste from the optimized view; removes PDF generation complexity entirely. |
| **Total saved** | | **13 pts** | |

### Second to Cut (if 2 weeks behind -- detected end of Sprint 3)

| Feature | Story | Points Saved | Impact |
|---------|-------|-------------|--------|
| Before/After Diff (full visual) | 5.2 | 8 pts | Replace with a simple "here are the suggested changes" text list instead of side-by-side visual diff. Functionally equivalent, dramatically simpler UI. |
| Skill-Level Match Evidence (detailed) | 4.2 | 5 pts | Simplify to just "matched skills" and "missing skills" flat lists without strength indicators or transferable-skill detection. |
| Dashboard with history | 6.3 | 3 pts | Replace with a simple "go to analysis" CTA after upload; remove the full dashboard page. |
| **Total saved** | | **16 pts** | |

### Third to Cut (if 3 weeks behind -- emergency scope reduction)

| Feature | Story | Points Saved | Impact |
|---------|-------|-------------|--------|
| Optimized Resume Generation | 5.1 | 8 pts | Remove "AI rewrites your resume" entirely; focus on analysis + matching as core MVP value. This is the most aggressive cut and changes the product thesis. |
| Match Explainability (detailed) | 4.1 (simplify) | 4 pts | Keep basic "why this matches" bullet list but remove confidence indicators, transferable skill detection, and criticality categorization. |
| **Total saved** | | **12 pts** | |

### MVP Minimum Viable Scope (absolute floor)

If everything goes wrong, ship with:
1. Auth + Upload + Parse (Epic 1 -- 19 pts)
2. Resume Score + Feedback (Epic 2 -- 18 pts, minus analysis history)
3. Job Matching with basic scores (Epic 3 -- 13 pts, minus detailed match view)

**Minimum viable scope: ~50 points** -- achievable in 2 sprints by 2 engineers. This produces a "resume analysis tool with job matching" but not the full platform vision. It validates the core thesis (AI analysis is better than ChatGPT) without the differentiators (explainability, diff).

---

## 7. Sprint Dependency Map

```
Sprint 1 (Foundation)
  6.1 Create Account ──────────────────────────┐
  6.2 Sign In ─────────────────────────────────┤
  1.1 Upload File ──> 1.2 Parse ───────────────┤
  [Spike 3: Parsing] ──> 1.2 ─────────────────┤
  Project Scaffolding (Next.js + API + DB) ────┤
  DB Schema (PostgreSQL + pgvector) ───────────┤
                                               v
Sprint 2 (AI Analysis)
  1.3 Review/Edit <── 1.2 ──> 1.4 Store ──> 6.3 Dashboard
  [Spike 1: Prompts] ──> 2.1 Score ──> 2.2 Feedback ──> 2.3 History
  [Spike 5: Rewrite] ──────────────────────────────────┐
                                                        v
Sprint 3 (Matching)
  [Spike 2: Embeddings] ──> 3.1 Ingest Jobs ──> 3.2 Match ──> 3.3 Details
  [Spike 4: Data Sourcing] ──> 3.1
  pgvector Setup <── Spike 2 ──> 3.2
  Job Ingestion Pipeline ──> 3.1
                                                        │
                                                        v
Sprint 4 (Polish)
  3.2 + Spike 1 ──> 4.1 Explain ──> 4.2 Skill Evidence
  2.2 + Spike 5 ──> 5.1 Optimize ──> 5.2 Diff ──> 5.3 Export
  All Stories ──> Bug Fixes + Integration Testing
```

---

*This document is a living estimate. Update story point estimates after each sprint retrospective based on actual velocity data. Revisit spike outputs as they complete -- if a spike reveals a fundamental blocker, escalate immediately rather than waiting for the next sprint planning session.*
