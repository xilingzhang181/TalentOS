# PRD: TalentOS — AI-First Career Platform for Individual Talent

**Document Owner**: Product Team
**Version**: 1.0
**Date**: 2026-07-10
**Status**: Draft — pending discovery experiment results
**Stakeholders**: Engineering, Design, Data/AI

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Personas](#3-user-personas)
4. [Core User Flows](#4-core-user-flows)
5. [Feature Requirements](#5-feature-requirements)
6. [Technical Requirements](#6-technical-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Risks & Mitigations](#8-risks--mitigations)
9. [Open Questions](#9-open-questions)
10. [MVP Scope Boundary](#10-mvp-scope-boundary)

---

## 1. Overview

### 1.1 Product Vision

TalentOS is an AI-first career platform that gives individual job seekers the analytical depth that was previously available only to hiring companies. Every candidate gets a transparent, explainable view of how they match a role, what skills they are missing, and what specific actions will improve their candidacy — all powered by AI that shows its work.

### 1.2 Problem Statement

Job seekers face three interconnected problems that no existing tool solves well:

| Problem | Current State | Gap |
|---------|--------------|-----|
| **Resume evaluation is opaque** | Users paste resumes into ChatGPT and get generic praise or vague suggestions. No structured, role-specific scoring. | No tool provides a structured, multi-dimensional evaluation tied to a specific target role. |
| **Job matching is keyword-based** | LinkedIn, Boss Direct, and Indeed use keyword matching. Candidates see "80% match" with no explanation of what the 20% gap actually means. | Semantic matching with transparent reasoning does not exist for individual users. |
| **Skill discovery is self-reported** | Users must guess which skills matter, which are depreciating, and which transfer across roles. | No tool builds a living skill profile from actual work history and maps it against real market demand. |

**Root cause**: The labor market is asymmetric — employers have ATS systems, recruiter tools, and structured data. Candidates have Word documents and guesswork. TalentOS flips this by giving candidates the analytical tools.

### 1.3 Target Users

**Primary**: Individual job seekers actively searching for roles (employed or unemployed).
**Secondary**: Career changers evaluating transition paths.
**NOT in scope (MVP)**: Companies, recruiters, HR teams, or enterprise buyers.

### 1.4 Why Now

- LLMs have reached a level where structured career analysis can be generated reliably and cheaply (sub-$0.05 per analysis).
- The "paste your resume into ChatGPT" behavior is already mainstream — users have proven willingness, but the output quality ceiling is low.
- Remote work has expanded the job market globally, making semantic matching more valuable than keyword matching.

### 1.5 MVP Focus

The MVP delivers a single high-value interaction: **AI Resume X-Ray**. A user uploads their resume and a target job description, and receives a structured, transparent analysis that is meaningfully better than what ChatGPT produces. This is the Go/No-Go gate: if we cannot beat ChatGPT by a wide margin on this single task, the product thesis is invalid.

---

## 2. Goals & Success Metrics

### 2.1 Product Goals

| Goal | Timeframe | Measurement |
|------|-----------|-------------|
| Validate that users will upload resumes to a new platform | Weeks 1-2 | Upload completion rate |
| Prove output is meaningfully better than ChatGPT | Weeks 2-4 | Wizard-of-Oz preference test |
| Achieve first retention signal (users return for a second analysis) | Weeks 4-8 | 7-day return rate |
| Reach 500 completed analyses | Week 8 | Total analyses completed |

### 2.2 KPIs and Targets

| Metric | Definition | Target | Floor (Kill Signal) |
|--------|-----------|--------|---------------------|
| **Upload Completion Rate** | % of visitors who complete resume upload after landing on upload page | 15% | 10% |
| **Analysis Completion Rate** | % of uploads that produce a completed analysis (not abandoned during processing) | 90% | 75% |
| **ChatGPT Preference Rate** | % of users who rate TalentOS output as "significantly more helpful" vs. ChatGPT in side-by-side test | 40% | 25% |
| **Actionability Score** | User self-rating: "How actionable was this advice?" (1-5 scale) | 4.0 avg | 3.5 avg |
| **7-Day Return Rate** | % of users who return to run a second analysis within 7 days | 25% | 15% |
| **NPS** | Net Promoter Score from post-analysis survey | 30+ | 10+ |
| **Cost Per Analysis** | Total infrastructure + LLM cost per completed analysis | < $0.05 | < $0.10 |
| **Analysis Latency (P95)** | Time from upload to results displayed | < 15s | < 25s |

### 2.3 Go/No-Go Gates

| Gate | Criteria | Decision |
|------|----------|----------|
| **Gate 1: Will people upload?** | Upload completion rate >= 10% | Below 10%: pivot to paste-text or LinkedIn OAuth onboarding |
| **Gate 2: Is output better than ChatGPT?** | Preference rate >= 25% | Below 25%: fundamental rethink of value proposition |
| **Gate 3: Do people come back?** | 7-day return rate >= 15% | Below 15%: invest in retention features (Career Pulse) before scaling acquisition |

---

## 3. User Personas

### Persona 1: Sarah — The Active Job Seeker

| Attribute | Detail |
|-----------|--------|
| **Age / Location** | 29, San Francisco (willing to relocate) |
| **Background** | 4 years as a product manager at a mid-stage SaaS startup. Laid off 3 weeks ago. |
| **Current behavior** | Uses ChatGPT to polish resume bullet points. Manually tailors resume for each application. Applies to 5-10 roles/day on LinkedIn and Indeed. |
| **JTBD** | "When I'm applying for a PM role, I want to know exactly how well my resume matches the specific JD, so I can prioritize my time on the best-fit roles and fix the gaps that matter most." |
| **Pains** | Spends 45 min tailoring each resume with no confidence it's actually better. Can't tell if a "85% match" from LinkedIn means anything. Gets generic advice from ChatGPT like "quantify your achievements" without telling her which ones. |
| **Trust concern** | Willing to upload resume because she is actively job-seeking and has already shared it with dozens of companies. Low friction. |
| **Success moment** | Sees a specific insight like "Your resume emphasizes feature prioritization but this role emphasizes stakeholder management — here's how to reframe your cross-team project as a stakeholder management example." |

### Persona 2: Marcus — The Career Changer

| Attribute | Detail |
|-----------|--------|
| **Age / Location** | 34, Chicago (remote-first preference) |
| **Background** | 6 years as a data analyst at a retail company. Wants to transition into product management. |
| **Current behavior** | Reads PM blogs, takes online courses, tinkers with side projects. Has not applied to any PM roles yet because he doesn't know if he's qualified. |
| **JTBD** | "When I'm considering a career change into product management, I want to understand which of my existing skills transfer, what gaps I need to close, and which PM roles are realistic for my background, so I can make an informed decision about whether to commit to this transition." |
| **Pains** | Doesn't know which of his analyst skills map to PM. Afraid of applying and being immediately rejected. Friends give encouragement but not specific, evidence-based feedback. |
| **Trust concern** | Higher sensitivity — he is not yet in the job market and may hesitate to upload. Needs to see value on a sample before committing. |
| **Success moment** | Sees a transferable skills map: "Your SQL and data visualization skills directly satisfy the 'data-driven decision making' requirement in 73% of PM JDs. Your gap is in stakeholder communication and roadmap planning — here are 2 specific experiences you could reframe." |

### Persona 3: Lin Wei — The International Relocator

| Attribute | Detail |
|-----------|--------|
| **Age / Location** | 27, currently Shanghai, targeting roles in Singapore and EU |
| **Background** | 3 years as a software engineer at a Chinese tech company. Wants to relocate internationally. |
| **Current behavior** | Manually researches visa requirements, translates resume between English and Chinese versions, tries to understand how international employers perceive Chinese tech experience. |
| **JTBD** | "When I'm applying for roles in a new country, I want to understand how my experience maps to that market's expectations, what skills or experiences need to be reframed, and which roles are realistic given my visa situation, so I don't waste time applying where I have no chance." |
| **Pains** | No idea if Chinese tech company experience is valued the same as US/EU experience. Resume formatting norms differ by market. Language barrier makes self-assessment harder. |
| **Trust concern** | Moderate — concerned about data privacy given cross-border context, but highly motivated by the specificity of the value proposition. |
| **Success moment** | Sees market-specific analysis: "Your experience at [Company] maps to a Senior SWE role in Singapore's fintech sector. Key gap: EU employers expect system design documentation experience, which is not evident in your resume. Reframe your microservices project to emphasize architecture decisions, not just implementation." |

---

## 4. Core User Flows

### 4.1 Flow 1: First-Time Resume Analysis (MVP Primary Flow)

```
Step 1: Landing Page
  - User arrives (via link, ad, or referral)
  - Clear value proposition: "Upload your resume + a job description. Get a structured analysis that shows exactly how you match."
  - Single CTA: "Analyze My Resume"
  ↓
Step 2: Upload
  - Drag-and-drop or file picker for resume (PDF, DOCX)
  - Paste or URL-link for job description
  - Trust signals visible: encryption badge, data deletion promise, "processed locally, not stored"
  ↓
Step 3: Processing (15s target)
  - Animated progress indicator with stage labels:
    "Parsing your resume..."
    "Analyzing job requirements..."
    "Computing match analysis..."
    "Generating recommendations..."
  - If > 20s: show "Taking longer than expected..." with cancel option
  ↓
Step 4: Results Dashboard
  - Overall Match Score (0-100) with color coding
  - Dimension breakdown (5 dimensions, each scored):
    • Experience Alignment
    • Skills Coverage
    • Education Fit
    • Industry Relevance
    • Growth Potential
  - "Top 3 Strengths" section (green)
  - "Top 3 Gaps" section (red/amber) with specific, actionable advice
  - "Resume Rewrite Suggestions" with Before/After Diff view
  - Explanation cards for each finding (why this score, what evidence)
  ↓
Step 5: Actions
  - "Download Report" (PDF)
  - "Try Another JD" (loop back to Step 2 with same resume)
  - "Save & Create Account" (email capture for return visits)
  - "Share Analysis" (shareable link, redacted version)
```

### 4.2 Flow 2: Return User — New JD Analysis

```
Step 1: User logs in (or accesses via saved link)
  ↓
Step 2: Select saved resume OR upload new one
  ↓
Step 3: Enter new JD (paste, URL, or select from saved)
  ↓
Step 4: Results Dashboard (same as Flow 1)
  - NEW: "Comparison to previous analysis" sidebar
  - Shows which gaps persist across roles vs. role-specific gaps
  ↓
Step 5: Actions
  - "Compare Analyses" (side-by-side view of two JD analyses)
  - "View Skill Profile" (P1 feature, placeholder in MVP)
```

### 4.3 Flow 3: Onboarding for Career Changers (P1, placeholder in MVP)

```
Step 1: User indicates "exploring career change" instead of uploading JD
  ↓
Step 2: Upload resume only
  ↓
Step 3: AI generates "Career DNA" — skill profile from resume
  ↓
Step 4: Suggests 3-5 target role categories with match scores
  ↓
Step 5: User selects a category → enters Flow 2
```

---

## 5. Feature Requirements

### 5.1 P0: Must-Have for MVP

#### 5.1.1 Resume Upload + AI Analysis

| Requirement | Detail |
|-------------|--------|
| **Supported formats** | PDF (primary), DOCX (secondary). Plain text paste as fallback. |
| **File size limit** | 10 MB max |
| **Parsing approach** | LLM-based extraction (not regex). Extract: name, contact, summary, work history (company, title, dates, bullets), education, skills, certifications. |
| **Output structure** | JSON schema with typed fields. Every extracted field must be source-attributed (which section/line it came from). |
| **Error handling** | If parsing confidence < 70%: show "We had trouble parsing parts of your resume" with specific sections flagged. Offer manual correction UI. |
| **Privacy** | Resume is processed in-memory, not persisted to database by default. If user creates account, encrypted storage with user-controlled deletion. |

#### 5.1.2 Semantic Job Matching with Explainability

| Requirement | Detail |
|-------------|--------|
| **Input** | Parsed resume (structured) + JD (raw text or URL) |
| **JD parsing** | Extract: role title, company, required skills, preferred skills, experience level, education requirements, industry, location, implicit requirements (e.g., "fast-paced environment" → requires adaptability). |
| **Matching dimensions** | 5 scoring dimensions (see Flow 1). Each dimension gets a 0-100 score AND a plain-language explanation. |
| **Explainability requirement** | Every score must include: (a) what evidence supports this score, (b) what specific resume content is missing/weak for this dimension, (c) what the JD requirement is that drives this dimension. |
| **Implicit requirement detection** | The system must identify unstated requirements in JDs. Example: "cross-functional experience" implies stakeholder management skills. These must be labeled as "Implicit Requirement" in the output, not presented as explicit matches. |
| **Confidence levels** | Each dimension score includes a confidence indicator: High (clear evidence), Medium (inferred), Low (insufficient data). |

#### 5.1.3 Before/After Diff

| Requirement | Detail |
|-------------|--------|
| **Purpose** | Show users exactly what to change in their resume, with clear before/after comparison. |
| **Scope** | Up to 5 suggested rewrites, prioritized by impact on match score. |
| **Diff format** | Inline diff (strikethrough for removals, highlight for additions). Each change tagged with: which JD requirement it addresses and expected impact. |
| **Source traceability** | Every rewrite must be grounded in the original resume content. No fabricated claims. The system must never add information that is not present or strongly implied in the original resume. |
| **Explanation** | Each rewrite includes a 1-sentence rationale: "Changed 'managed team' to 'led cross-functional team of 8' because the JD emphasizes leadership of 5+ person teams." |

### 5.2 P1: Next Iteration (Post-MVP, Weeks 8-16)

| Feature | Description | Depends On |
|---------|-------------|------------|
| **Skill Gap Analysis** | Extract all skills from resume, match against JD requirements, visualize as a gap map. Show: skills you have (green), skills you partially have (amber), skills you lack (red). For each gap, suggest specific learning resources. | P0 parsing + matching |
| **Conversational Advisor** | Chat interface where users can ask follow-up questions about their analysis. "Why did I score low on education?" "How would my score change if I added a certification?" Must maintain context of the current analysis. | P0 analysis engine + conversation management |
| **Career Pulse** | Weekly personalized email with: new job matches (scored against saved profile), market signals (skills trending up/down in demand), and skill gap updates. Primary retention mechanism. Requires saved user profile. | User accounts + job market data pipeline |
| **User Accounts & Profiles** | Email-based accounts. Store: resume (encrypted), analysis history, saved JDs, career preferences. Enable returning without re-uploading. | Infrastructure + privacy compliance |

### 5.3 P2: Future (Quarter 2+)

| Feature | Description | Depends On |
|---------|-------------|------------|
| **Interview Prep** | Generate personalized interview questions based on resume-JD analysis. Include: likely technical questions (based on skill gaps), behavioral questions (based on experience), and "gap questions" (interviewers will probe your weakest areas). | P0 + P1 conversational advisor |
| **Career Trajectory** | Model forward-looking career paths. "If you take this role, here are the 3 most likely next roles in 2-3 years, and here's what skills to build now to enable them." Requires labor market trajectory data. | Job market data + career trajectory dataset |
| **Skill Decay Monitor** | Track skills listed on user's profile against market demand trends. Alert when a skill is declining in JD frequency. "SQL appears in 15% fewer PM JDs this quarter — consider pivoting to Python/pandas framing." | Career Pulse + market data pipeline |
| **Multi-Source Aggregator** | Pull profile data from GitHub, LinkedIn, portfolio sites to auto-build skill profile without manual resume upload. | OAuth integrations + resume parser |

### 5.4 Feature Priority Matrix

| Feature | User Value | Build Effort | Strategic Value | Priority |
|---------|-----------|-------------|----------------|----------|
| Resume Upload + AI Analysis | High | Medium | Critical (validates core thesis) | P0 |
| Semantic Job Matching + Explainability | High | High | Critical (primary differentiator) | P0 |
| Before/After Diff | High | Medium | High (demonstrates immediate actionability) | P0 |
| Skill Gap Analysis | High | Medium | High (deepens value, aids retention) | P1 |
| Conversational Advisor | Medium | High | Medium (retention, but expensive to build well) | P1 |
| Career Pulse | Medium | Medium | Critical (only proven retention mechanism) | P1 |
| Interview Prep | Medium | Medium | Medium (natural extension) | P2 |
| Career Trajectory | Medium | High | Medium (differentiation, but requires external data) | P2 |
| Skill Decay Monitor | Low-Medium | Medium | Low (negative motivation, may not drive engagement) | P2 |
| Multi-Source Aggregator | Medium | High | Medium (reduces friction, but complex integrations) | P2 |

---

## 6. Technical Requirements

### 6.1 System Architecture

```
User Browser
    ↓
[Frontend: React/Next.js or Streamlit (MVP)]
    ↓
[API Layer: FastAPI (async)]
    ├── /upload  — Resume upload + parsing
    ├── /analyze — Trigger analysis (resume_id + JD)
    ├── /results — Retrieve analysis results
    └── /auth    — User authentication (P1)
    ↓
[Orchestration Layer: LangGraph]
    ├── Node 1: Parser Agent (resume + JD extraction)
    ├── Node 2: JD Analyzer (requirements decomposition)
    ├── Node 3: Matcher Agent (semantic matching + scoring)
    ├── Node 4: Diagnosis Agent (gap identification)
    └── Node 5: Rewriter Agent (before/after suggestions)
    ↓
[LLM Gateway: LiteLLM]
    ├── Lightweight model (GPT-4o-mini): fact extraction, NLI checks, structured parsing
    └── Heavyweight model (Claude/GPT-4o): diagnosis, rewriting, explanations
    ↓
[Storage]
    ├── SQLite (session logs, analysis metadata)
    └── Local JSON (evaluation datasets, test fixtures)
```

### 6.2 AI/ML Approach

| Component | Approach | Model Tier | Rationale |
|-----------|----------|------------|-----------|
| **Resume Parsing** | LLM structured extraction with Pydantic schema validation | Light (GPT-4o-mini) | High volume, needs reliability, structured output. Cost target: $0.003/parse. |
| **JD Decomposition** | LLM extraction with must-have / nice-to-have / implicit classification | Light (GPT-4o-mini) | Structured extraction task. Must handle implicit requirements via chain-of-thought prompting. |
| **Semantic Matching** | Embedding-based similarity (resume skills ↔ JD requirements) + LLM reasoning layer | Hybrid (embeddings + Light LLM) | Embeddings for fast initial scoring, LLM for explanation generation. |
| **Gap Diagnosis** | LLM multi-perspective analysis (PM view, Recruiter view, Engineer view) | Heavy (Claude/GPT-4o) | Requires nuanced reasoning. Multi-agent adversarial approach reduces bias. |
| **Rewrite Generation** | LLM constrained generation with source attribution | Heavy (Claude/GPT-4o) | Must never fabricate. Every rewrite checked against source resume via NLI. |
| **Fact Consistency** | NLI (Natural Language Inference) check on every generated claim | Light (GPT-4o-mini or dedicated NLI model) | Hard gate: if hallucination rate > 2%, analysis is rejected and retried. |

### 6.3 Data Requirements

| Data | Source | Status | Notes |
|------|--------|--------|-------|
| Resume parsing ground truth | Internal collection (100-200 anonymized resumes) | Needs collection | Core evaluation set. Cover PM, engineering, HR, design, marketing. |
| Resume-JD matching pairs | RJDB dataset (50K triplets) + self-built (50-100 pairs) | Partially available | RJDB provides academic baseline. Self-built set covers target domain. |
| JD corpus |爬取 from LinkedIn, Indeed, Boss Direct | Needs building | Minimum 500 JDs across target industries for matching quality testing. |
| Skill taxonomy | ESCO (European Skills) + O*NET (US) + custom Chinese market extensions | Available (open) | Foundation for skill normalization and gap analysis. |
| Fairness test set | FAIRE + FairCV (Chinese) | Available (open) | Required for bias detection gate. |

### 6.4 Evaluation Framework

The evaluation pipeline runs in three tiers before any analysis is shown to users:

| Tier | Gate | Check | Fail Action |
|------|------|-------|-------------|
| **Tier 1: Safety & Factuality** | G-01 | Hallucination check: every claim in output verified against source resume via NLI | Reject analysis, retry with different prompt. If 3 retries fail, show "Analysis unavailable" |
| | G-02 | Sensitive info leak check: output must not reveal internal prompts or model details | Strip leaked content, retry |
| | G-03 | Bias detection: run same resume with demographic attribute swaps (gender, age). If score variance > 3 points | Reject analysis, flag for manual review |
| | G-04 | Hard constraint fraud: flag impossible claims (e.g., 5 years experience at a company the user was at for 2 years) | Flag in output with warning |
| **Tier 2: Quality Profile** | P1-P5 | Five-dimension quality scoring (input fidelity, semantic insight, logical reasoning, generation quality, robustness) | Dimension below threshold → regenerate that dimension only |
| **Tier 3: Comparative** | ELO | Blind comparison against GPT-4o and Claude baseline outputs on test set | Used for ongoing quality monitoring, not per-request gating |

### 6.5 Cost Control

| Cost Component | Target | Hard Cap |
|---------------|--------|----------|
| Resume parsing (GPT-4o-mini) | $0.003 | $0.005 |
| JD analysis (GPT-4o-mini) | $0.002 | $0.004 |
| Match scoring + explanation (GPT-4o-mini + embeddings) | $0.005 | $0.010 |
| Gap diagnosis (GPT-4o) | $0.015 | $0.025 |
| Rewrite generation (GPT-4o) | $0.010 | $0.020 |
| Fact-check / NLI (GPT-4o-mini) | $0.005 | $0.008 |
| **Total per analysis** | **$0.040** | **$0.072** |

Every API call logs token count and cost. Daily cost dashboard required before launch.

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first result (P50) | 8 seconds | End-to-end from upload to first score displayed |
| Time to first result (P95) | 15 seconds | End-to-end from upload to first score displayed |
| Full analysis complete (P95) | 25 seconds | All dimensions + rewrites rendered |
| Concurrent analyses | 50 simultaneous | Without degradation |
| Uptime | 99.5% | Monthly, excluding planned maintenance |

**Progressive rendering**: Results should stream to the user as they become available. Match score displays first (8s), then dimensions populate (12s), then explanations (15s), then rewrites (20s). Never make the user wait for everything at once.

### 7.2 Security

| Requirement | Detail |
|-------------|--------|
| **Encryption at rest** | All stored resumes encrypted with AES-256. Encryption key per user. |
| **Encryption in transit** | TLS 1.3 for all connections. |
| **Data retention** | Default: resume deleted after analysis (not stored). With account: stored until user deletes. Account deletion = immediate encrypted wipe. |
| **API security** | Rate limiting: 10 analyses/day per unauthenticated user, 50/day per authenticated user. |
| **LLM data handling** | If using API-based LLMs: confirm provider does not use input data for training. Use zero-retention endpoints where available. |
| **Access control** | Users can only access their own analyses. No cross-user data leakage. |

### 7.3 Privacy

| Requirement | Detail |
|-------------|--------|
| **Resume content** | Never displayed to anyone except the uploading user. |
| **Analysis results** | Shareable only via explicit user action (shareable link with token-based access). |
| **Anonymous analytics** | Usage metrics (upload count, analysis completion, feature clicks) collected without PII. |
| **GDPR compliance** | Right to deletion, right to data export, consent before storage. |
| **Data processing agreement** | Required with all LLM providers. |
| **Chinese user data** | If serving Chinese users: comply with Personal Information Protection Law (PIPL). Data localization may be required. |

### 7.4 Accessibility

| Requirement | Detail |
|-------------|--------|
| **WCAG 2.1 AA** | All interactive elements, color contrast, keyboard navigation. |
| **Screen reader support** | All scores and explanations must be readable by screen readers (no image-only scores). |
| **Mobile responsive** | Upload and results must work on mobile (many job seekers use phones). |
| **Language** | MVP in English. Chinese localization is P2 (aligned with Lin Wei persona). |

---

## 8. Risks & Mitigations

### 8.1 Leap-of-Faith Assumptions

#### Risk A1: Trust Threshold — Users won't upload their resume

| Aspect | Detail |
|--------|--------|
| **Impact** | Critical — no upload, no product |
| **Uncertainty** | High — resume is a sensitive personal document |
| **Validation** | Experiment A1-1 (Fake Door Upload Test) and A1-2 (Trust Signal A/B) |
| **Mitigation 1** | Default to "process and discard" — never store unless user opts in. Make this visible during upload. |
| **Mitigation 2** | Offer "paste text" as alternative to file upload — lowers perceived commitment. |
| **Mitigation 3** | Show sample analysis on a public demo resume before asking user to upload. Let them experience value before committing data. |
| **Mitigation 4** | Trust signals on upload page: encryption badge, "your data is encrypted and deleted after analysis", link to privacy policy. |
| **Fallback** | If upload rate < 10%: pivot to LinkedIn OAuth or paste-text-only onboarding. |

#### Risk A2: "Good Enough" Problem — ChatGPT output is sufficient

| Aspect | Detail |
|--------|--------|
| **Impact** | Critical — if ChatGPT is good enough, no standalone product |
| **Uncertainty** | High — ChatGPT already does 70-80% of resume feedback |
| **Validation** | Experiment A2-1 (Wizard-of-Oz Side-by-Side) and A2-2 (Fake Door Report) |
| **Mitigation 1** | Structure is the differentiator. ChatGPT produces prose; TalentOS produces structured, scored, dimension-by-dimension analysis with evidence chains. |
| **Mitigation 2** | Specificity calibration: reference the user's actual skills, name specific role requirements, quantify gaps (not "you need more leadership" but "the JD requires 5+ direct reports; your resume shows 2"). |
| **Mitigation 3** | Before/After Diff with source traceability — ChatGPT cannot show you a diff with inline justifications for each change. |
| **Fallback** | If preference rate < 25%: identify the 2-3 specific components that did beat ChatGPT (if any) and rebuild MVP around only those. Otherwise, pivot to features ChatGPT structurally cannot do: job matching across a database, skill tracking over time. |

#### Risk A3: Specific vs. Accurate — AI advice must be specific enough to be useful but general enough to be accurate

| Aspect | Detail |
|--------|--------|
| **Impact** | High — vague advice is useless, hyper-specific advice may be wrong |
| **Uncertainty** | High — calibration problem with no obvious answer |
| **Validation** | Experiment A3-1 (Specificity Ladder) and A3-2 (Specificity A/B) |
| **Mitigation 1** | Target "Level 2 specificity": reference user's actual skills and specific role requirements, quantify gaps, avoid naming specific companies or people. |
| **Mitigation 2** | Confidence indicators on every recommendation — if the system is uncertain, say so. "Medium confidence: your project management experience may satisfy this requirement, but the JD emphasizes PMP certification which is not in your resume." |
| **Mitigation 3** | Evaluation framework includes a "specificity vs. accuracy" calibration test on golden set. Run weekly. |
| **Fallback** | If users distrust specific advice: fall back to "Level 1.5" — specific to their skills but generalized role requirements. Less useful but safer. |

#### Risk A4: Explainability — Transparency must actually change user behavior, not just be a novelty

| Aspect | Detail |
|--------|--------|
| **Impact** | High — explainability is the stated differentiator |
| **Uncertainty** | High — users may ignore explanations and just look at the score |
| **Validation** | Experiment A4-1 (Monopoly Money Choice Test) and A4-2 (Explanation Format Showdown) |
| **Mitigation 1** | Actionable format only: every explanation ends with a specific next step. Not "your skills don't match" but "add X skill or reframe Y experience to address Z requirement." |
| **Mitigation 2** | Track explanation engagement: click-through on expandable explanations, time spent on explanation cards vs. skip rate. |
| **Mitigation 3** | A/B test score-only vs. score+explanation. If explanation version shows no behavioral difference after 200 users, simplify to reduce cognitive load. |
| **Fallback** | If explainability doesn't change behavior: pivot transparency into a different form — social proof ("candidates with similar profiles who reframed this section saw a 20% callback increase"), urgency signals, or peer comparison. |

#### Risk A5: Retention — One-shot tools don't build businesses

| Aspect | Detail |
|--------|--------|
| **Impact** | High — high CAC with no retention = unsustainable |
| **Uncertainty** | High — resume analysis is inherently episodic |
| **Validation** | Experiment A5-1 (Career Pulse) and A5-2 (Peer Signal Injection) |
| **Mitigation 1** | "Try Another JD" loop: after first analysis, prompt users to test a second JD. This is the lowest-friction retention hook. |
| **Mitigation 2** | Career Pulse (P1): weekly email with new matches and market signals. This is the primary retention mechanism. |
| **Mitigation 3** | Comparison feature: show users how their profile matches against multiple roles, creating a reason to return and try new ones. |
| **Mitigation 4** | Account creation incentive: "Save your analysis and track your progress over time." |
| **Fallback** | If return rate < 15%: accept episodic use, optimize for viral sharing (shareable analysis reports), and shift to a transactional model (pay-per-analysis) instead of subscription. |

### 8.2 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| LLM hallucination in rewrite suggestions | High (user trust) | High | NLI-based fact check gate. Every rewrite must be traceable to source resume. Hallucination rate must stay below 2%. |
| Resume parsing failures on non-standard formats | Medium (user frustration) | Medium | Graceful degradation: show what was parsed, flag what was missed, offer manual correction. Log all parsing failures for iteration. |
| LLM cost overruns | Medium (unit economics) | Medium | Hard cost caps per analysis. Tiered model routing (light tasks → cheap model). Daily cost alerts. |
| Bias in matching scores | High (reputation + legal) | Medium | FAIRE-based bias detection in evaluation pipeline. Demographic swap testing on every model update. |
| JD URL scraping blocked | Low (feature degradation) | Medium | Paste-text as primary JD input. URL scraping is a convenience, not a requirement. |

---

## 9. Open Questions

These questions must be resolved through discovery experiments or technical spikes before or during MVP build. They are listed in priority order.

| # | Question | How to Resolve | Owner | Target Date |
|---|----------|---------------|-------|-------------|
| Q1 | Will people actually upload their resume to an unknown platform? | Experiment A1-1 (Fake Door Upload) | PM | Week 2 |
| Q2 | Is our structured output meaningfully preferred over ChatGPT? | Experiment A2-1 (Wizard-of-Oz) | PM + AI | Week 4 |
| Q3 | What level of specificity is the sweet spot for AI career advice? | Experiment A3-1 (Specificity Ladder) | PM | Week 3 |
| Q4 | Do explanations change job seeker behavior or are they decoration? | Experiment A4-1 (Monopoly Money) | PM | Week 3 |
| Q5 | Can we build a retention loop that works for an episodic use case? | Experiment A5-1 (Career Pulse) | PM | Week 6 |
| Q6 | What is the minimum viable LLM cost per analysis? Can we hit $0.05? | Technical spike with LiteLLM + model routing | AI/Eng | Week 2 |
| Q7 | Can we reliably parse resumes across diverse formats (PDF, DOCX, Chinese, English)? | Build parser, test on 50-resume diverse sample set | AI/Eng | Week 3 |
| Q8 | Do users prefer a standalone tool or a Chrome extension that overlays on job boards? | A/B test landing page messaging (tool vs. extension) | PM | Week 2 |
| Q9 | Is the 5-dimension scoring model the right breakdown, or do users prefer a single holistic score with drill-down? | User testing with both formats (8-10 users) | Design | Week 4 |
| Q10 | What job market data sources are accessible and reliable for career trajectory features (P2)? | Research spike: APIs, scraping feasibility, data freshness | AI/Eng | Week 4 |

---

## 10. MVP Scope Boundary

### 10.1 IN SCOPE for MVP (Weeks 1-8)

| Feature | Details |
|---------|---------|
| Landing page with value proposition | Single-page, clear CTA, trust signals |
| Resume upload | PDF + DOCX + paste text. Drag-and-drop UI. |
| JD input | Paste text. URL scraping as stretch goal. |
| AI Resume X-Ray analysis | 5-dimension scoring with explanations |
| Before/After Diff | Up to 5 rewrite suggestions with inline diffs and rationale |
| Results display | Progressive rendering. Match score → dimensions → explanations → rewrites |
| Download report | PDF export of analysis |
| Share analysis | Shareable link (token-based, no account required) |
| Basic analytics | Upload count, completion rate, cost per analysis, latency |
| Evaluation pipeline | Tier 1 safety gates + Tier 2 quality scoring |

### 10.2 OUT OF SCOPE for MVP

| Feature | Reason Deferred |
|---------|----------------|
| User accounts / authentication | Adds complexity; test organic return intent first |
| Skill Gap Analysis (visual map) | P1 — requires P0 parsing to be solid first |
| Conversational Career Advisor | P1 — expensive to build well, high hallucination risk in v1 |
| Career Pulse (retention email) | P1 — requires accounts + job market data pipeline |
| Interview Prep | P2 — depends on P0 analysis quality being proven |
| Career Trajectory Modeling | P2 — requires external data sources not yet validated |
| Skill Decay Monitor | P2 — negative motivation loop unvalidated |
| Multi-Source Aggregator (GitHub, LinkedIn) | P2 — complex OAuth integrations, not core value |
| Chinese language support | P2 — doubles localization effort; validate English first |
| Mobile app | Web responsive is sufficient for MVP |
| Payment / subscription | Validate value before monetizing. May ship free MVP. |
| Resume storage / history | Only if user accounts ship (P1). Default: process and discard. |
| Chrome extension | Different delivery mechanism; test standalone first |
| Multi-resume support | One resume per analysis is sufficient for v1 validation |
| Batch analysis (analyze against 10 JDs at once) | P1 — single JD analysis is the core loop to validate |

### 10.3 MVP Deliverables Checklist

| Deliverable | Owner | Target |
|-------------|-------|--------|
| Working landing page with upload flow | Frontend | Week 2 |
| Resume parser (PDF + DOCX) | AI/Eng | Week 3 |
| JD parser (paste text) | AI/Eng | Week 3 |
| 5-dimension matching engine | AI/Eng | Week 5 |
| Explanation generator | AI/Eng | Week 5 |
| Before/After rewrite engine with source traceability | AI/Eng | Week 6 |
| Results UI with progressive rendering | Frontend | Week 6 |
| Fact-consistency gate (NLI check) | AI/Eng | Week 6 |
| Bias detection gate | AI/Eng | Week 7 |
| PDF report export | Frontend | Week 7 |
| Analytics instrumentation | Full stack | Week 7 |
| End-to-end testing on 50-resume sample set | QA/AI | Week 8 |
| Performance tuning (hit 15s P95) | Full stack | Week 8 |

---

*This document is a living artifact. Update as discovery experiments produce results and technical spikes resolve open questions. The MVP scope boundary is intentionally narrow — expand only after the Go/No-Go gates are passed.*
