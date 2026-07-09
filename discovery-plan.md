# Discovery Plan: TalentOS

**Date**: 2026-07-10
**Product Stage**: New product (brand new, no users, no prior research)
**Discovery Question**: Can we build an AI-first career platform for individual talent that meaningfully outperforms existing tools (LinkedIn, Boss直聘, ChatGPT) in resume evaluation, job matching, and skill discovery?

---

## Product Context

- **Product Name**: TalentOS
- **Core Problem**: Job seekers struggle with resume evaluation, job matching, and understanding their own skills/capabilities
- **Target Users**: Individual talent (job seekers, career changers, freelancers) — not companies
- **Differentiator**: AI-first approach with transparency/explainability
- **Key Decision**: What to build for MVP

---

## Ideas Explored

15 ideas were generated across Product, Design, and Engineering perspectives, consolidated into 10:

| # | Idea | Source | One-Liner |
|---|------|--------|-----------|
| 1 | AI Resume X-Ray | PM + Design + Eng | Upload resume + JD → structured feedback + rewrite suggestions |
| 2 | Semantic Job Matching | PM + Design + Eng | Meaning-based matching with plain-language explanations of "why" |
| 3 | Skill Graph / Career DNA | PM + Design + Eng | Auto-built living map of your skills from your history |
| 4 | Conversational Career Advisor | PM + Design + Eng | Chat-based career discovery and personalized insights |
| 5 | Skill Gap + Learning Paths | PM + Design + Eng | Here's what's missing + how to close the gap |
| 6 | Interview Prep Simulator | PM | Personalized questions + rehearsal mode |
| 7 | Resume Auto-Rewriter | PM + Design | AI rewrites resume sections for target roles |
| 8 | Career Trajectory Modeling | PM | Forward-looking career path scenarios |
| 9 | Skill Decay Monitor | PM | Alerts when skills are aging out of demand |
| 10 | Multi-Source Aggregator | Engineering | Pull profile from GitHub, LinkedIn, portfolios |

### Strategic Notes
- **Ideas 1-3** are natural MVP foundations — immediate value, zero network effects
- **Ideas 4-5** create engagement loops for retention
- **Ideas 6-10** are stronger as v1.1+ features after core validation
- **Common thread**: Transparency as UX strategy — making AI reasoning visible and trustworthy

---

## Selected Ideas for Validation

All 10 ideas carried forward. The assumption analysis will determine which survive contact with reality.

---

## Critical Assumptions

### 🔴 Leap of Faith (High Impact + High Uncertainty) — Must validate first

| # | Assumption | Category | Impact | Uncertainty | Affects Ideas |
|---|-----------|----------|--------|-------------|---------------|
| A1 | Users trust a new platform enough to upload their resume (sensitive personal document) | Value / Usability | High | High | ALL |
| A2 | TalentOS delivers meaningfully better value than ChatGPT (not just a wrapper) | Value | High | High | 1,2,5,6,7,8 |
| A3 | AI can produce career advice specific enough to be useful but general enough to be accurate | Feasibility / Value | High | High | 3,4,5,6,8,9 |
| A4 | Explainability ("why this match") actually changes user behavior, not just a novelty | Value | High | High | 2,3,5 |
| A5 | Users return after getting initial value (one-shot tools don't build businesses) | Value / Viability | High | High | 1,3,5,7,8,9 |

### 🟡 High Priority (High Impact + Medium Uncertainty)

| # | Assumption | Category | Impact | Uncertainty | Affects Ideas |
|---|-----------|----------|--------|-------------|---------------|
| A6 | Sufficient, clean job market data is accessible for matching/trajectory modeling | Feasibility | High | Medium | 2,3,5,8,9 |
| A7 | Users prefer conversational UX over form-based inputs | Usability | High | Medium | 4 |
| A8 | Before/after diff UX clarifies improvement without overwhelming | Usability | Medium | Medium | 1,7 |
| A9 | Negative motivation (skill decay alerts) drives engagement, not avoidance | Value | High | Medium | 9 |

### 🟢 Important but More Testable

| # | Assumption | Category | Impact | Uncertainty |
|---|-----------|----------|--------|-------------|
| A10 | AI can reliably extract/normalize skills from unstructured histories | Feasibility | High | Lower |
| A11 | OAuth integrations with LinkedIn/GitHub are maintainable | Feasibility | High | Lower |
| A12 | Interview simulation feels empowering, not uncanny | Usability | High | Lower |

### Cross-Cutting Risks
- **The Trust Threshold Problem**: All ideas require resume upload — a gating risk for the entire portfolio
- **The "Good Enough" Problem**: ChatGPT already delivers 70-80% of resume/matching value for free
- **The "One-Shot Engagement" Problem**: Resume analysis, gap analysis, and career mapping are naturally episodic

---

## Validation Experiments

### Experiment A1-1: Fake Door Resume Upload Test
| Field | Detail |
|-------|--------|
| **Tests** | A1 — Trust Threshold |
| **Hypothesis** | At least 15% of visitors who reach a resume upload page will attempt to upload to an unknown platform |
| **Method** | Fake door landing page with real file upload widget |
| **Setup** | Single-page site (Carrd/Framer/Webflow): headline, value prop, real upload widget (Tally.so). After upload → modal asking for email. Drive 300-500 visitors via $50-100 Reddit/LinkedIn promoted posts |
| **Success Criteria** | **Pass**: 15%+ complete upload + email. **Weak pass**: 10-15% (needs trust signal testing). **Fail**: <10% (pivot to paste-text or LinkedIn OAuth) |
| **Effort** | 4-8 hours, $50-100, 1 person |
| **Timeline** | 2-3 days build + 5-7 days data collection |

### Experiment A1-2: Trust Signal A/B Test
| Field | Detail |
|-------|--------|
| **Tests** | A1 — Trust Threshold |
| **Hypothesis** | Adding trust signals (encryption badge, data deletion promise, privacy policy) increases upload rate by 30%+ |
| **Method** | A/B test on landing page from A1-1 |
| **Setup** | Control: bare page. Variant: same page + trust block ("Your resume is encrypted. We never share your data. Delete anytime.") |
| **Success Criteria** | **Pass**: Variant B achieves 30%+ higher upload rate. **Fail**: No meaningful difference (trust problem is structural, not copy) |
| **Effort** | 1-2 hours, $30-50 |
| **Timeline** | 5-7 days (parallel with A1-1) |

### Experiment A2-1: Wizard-of-Oz Side-by-Side Comparison
| Field | Detail |
|-------|--------|
| **Tests** | A2 — "Good Enough" ChatGPT Problem |
| **Hypothesis** | When users see a structured career analysis (alignment score, skills gap table, tailored talking points) next to ChatGPT output, 40%+ rate it as "significantly more helpful" |
| **Method** | Wizard-of-Oz with 15-20 real users |
| **Setup** | Recruit active job seekers ($15-25 gift cards). Collect their resume + target JD. Manually produce two analyses: (a) ChatGPT prompt, (b) structured TalentOS-style output with score, gap table, rewritten summary, talking points. Present side-by-side in Google Doc (randomize order). Ask: "Which would you actually use?" |
| **Success Criteria** | **Pass**: 40%+ rate structured output 4-5/5 AND avg usefulness ≥1.0 point higher than ChatGPT. **Fail**: <25% (ChatGPT is good enough — need dramatically different value prop) |
| **Effort** | 10-15 hours, $300-500 in gift cards |
| **Timeline** | 7-10 days |

### Experiment A2-2: Fake Door "AI Career Report" Landing Page
| Field | Detail |
|-------|--------|
| **Tests** | A2 — Value Proposition Demand |
| **Hypothesis** | At least 5% of visitors who see a detailed report mockup will click "Get My Free Report" and enter their email |
| **Method** | Fake door landing page with email capture |
| **Setup** | Landing page showing a polished mockup of the TalentOS report (alignment score, skills gap table, talking points). CTA: "Get My Free Report" → email form. Drive 200-400 visitors via paid channels |
| **Success Criteria** | **Pass**: 5%+ email capture rate. **Marginal**: 2-5% (needs messaging iteration). **Fail**: <2% (value prop doesn't differentiate from ChatGPT) |
| **Effort** | 4-6 hours, $50-100 |
| **Timeline** | 2-3 days build + 5-7 days data |

### Experiment A3-1: Specificity Ladder User Test
| Field | Detail |
|-------|--------|
| **Tests** | A3 — Specific vs. Accurate Tension |
| **Hypothesis** | Career advice rated as "specific" (mentions their skills, industry, target role) will be rated 40%+ more actionable than "general" advice, without a corresponding drop in trustworthiness |
| **Method** | User interview with controlled specificity gradient (8-10 participants) |
| **Setup** | For each participant, produce 3 levels of advice: Level 1 (generic: "develop PM skills"), Level 2 (specific: "your React maps to Senior Frontend, missing AWS in 70% of JDs"), Level 3 (hyper-specific: "apply to Stripe's team, reach out to X"). Present in random order. Rate actionability + trustworthiness |
| **Success Criteria** | **Pass**: Level 2 scores significantly higher on actionability than Level 1, with trustworthiness ≥ Level 1. Level 3 trustworthiness drops below Level 2 → sweet spot is Level 2. **Fail**: Both L2 and L3 score low on trust |
| **Effort** | 5-7 hours, $200 in gift cards |
| **Timeline** | 5-7 days |

### Experiment A3-2: Specificity A/B Landing Page
| Field | Detail |
|-------|--------|
| **Tests** | A3 — Specificity as Differentiator |
| **Hypothesis** | Showing specific job match previews (company, role, match score, "why") generates 3x higher email capture than generic career advice messaging |
| **Method** | A/B landing page test |
| **Setup** | Variant A: "AI-powered career coaching" (generic). Variant B: "We found 12 roles that match your exact experience" with a mockup match card showing specific match details. Same CTA → email capture. 200+ visitors per variant |
| **Success Criteria** | **Pass**: Variant B achieves 3x email capture rate (15% vs 5%). **Fail**: No significant difference (specificity doesn't motivate at awareness stage — need to let users experience it first) |
| **Effort** | 4-6 hours, $80-150 |
| **Timeline** | 2-3 days build + 7-10 days data |

### Experiment A4-1: Monopoly Money Choice Test
| Field | Detail |
|-------|--------|
| **Tests** | A4 — Explainability Changes Behavior |
| **Hypothesis** | Showing "why" a job matches (skill-level explanations) causes 40%+ of users to change their top-3 job picks vs. score-only |
| **Method** | Concierge MVP with controlled split (40 participants) |
| **Setup** | Google Form with 15 curated job listings. Group A: title + company + salary + Fit Score. Group B: same + 3-sentence explanation per job. Both rank top 3. Then swap (A gets explanations, B removes them) and re-rank. Track rank changes |
| **Success Criteria** | **Pass**: 40%+ change top-3 picks after seeing/not seeing explanations. **Fail**: <20% (explanations are redundant — users already know what they want) |
| **Effort** | 8-12 hours, $0 (manual curation) |
| **Timeline** | 6-8 days |

### Experiment A4-2: Explanation Format Showdown
| Field | Detail |
|-------|--------|
| **Tests** | A4 — Which Explanation Type Works |
| **Hypothesis** | Actionable explanations ("You're missing X, here's how to close it") drive higher likelihood-to-act than informational ("70% skill match") or score-only |
| **Method** | Within-subject A/B test with 3 formats (18-24 participants) |
| **Setup** | Each participant sees 6 job listings, each paired with one of 3 formats (Latin square rotation): A (score only), B (informational), C (actionable with resource link). Rate likelihood-to-act (1-5) and usefulness (1-5) per format |
| **Success Criteria** | **Pass**: Format C scores ≥1.0 higher on likelihood-to-act than A, ≥0.5 higher than B. **Partial**: B and C both beat A but C not clearly better than B. **Fail**: No difference across formats |
| **Effort** | 6-10 hours, $0 |
| **Timeline** | 5-7 days |

### Experiment A5-1: "Career Pulse" Concept Test
| Field | Detail |
|-------|--------|
| **Tests** | A5 — Retention Loop |
| **Hypothesis** | A personalized weekly "career pulse" email (new matches, market signals, skill gap updates) drives 30%+ re-engagement within 48 hours |
| **Method** | Concierge MVP — you ARE the algorithm (30 participants, 4 weeks) |
| **Setup** | Recruit 30 job seekers. Give each an initial "Career Snapshot" PDF. Then manually send personalized weekly pulse emails for 4 weeks: 2-3 job matches + 1 market signal + 1 skill gap update. Track opens, clicks, unprompted replies |
| **Success Criteria** | **Pass**: 30%+ re-engagement in 2+ of 4 pulses, engagement doesn't decay to zero. **Partial**: Good opens (40%+) but low clicks (content interesting but not action-oriented). **Fail**: <15% by pulse 2-3 (informational loops don't work) |
| **Effort** | 10-15 hours setup + 3-4 hrs/week × 4 weeks |
| **Timeline** | ~5 weeks |

### Experiment A5-2: Peer Signal Injection Test
| Field | Detail |
|-------|--------|
| **Tests** | A5 — Social Retention Hooks |
| **Hypothesis** | Anonymized peer activity signals ("7 people like you applied to similar roles this week") drive 20% higher re-engagement than market-only updates |
| **Method** | Split-test concierge running alongside A5-1 |
| **Setup** | Split A5-1 participants: Group A gets market pulse. Group B gets modified pulse with peer signals (volume stats, norming stats, aspiration stats). Compare re-engagement rates |
| **Success Criteria** | **Pass**: Group B re-engagement ≥20 percentage points higher than A. **Fail**: No difference or Group A wins (privacy concerns outweigh social proof) |
| **Effort** | 4-6 hours additional setup |
| **Timeline** | ~5 weeks (concurrent with A5-1) |

---

## Experiment Execution Summary

| Priority | Experiment | Assumption | Days to Result | Cost | Hours |
|----------|-----------|------------|---------------|------|-------|
| 1 | A1-1: Fake Door Upload | Trust Threshold | 7-10 | $50-100 | 8h |
| 1 | A2-2: Fake Door Report | Value Prop Demand | 7-10 | $50-100 | 6h |
| 1 | A4-1: Monopoly Money | Explainability | 6-8 | $0 | 12h |
| 2 | A3-2: Specificity A/B | Specific as Differentiator | 9-13 | $80-150 | 6h |
| 2 | A1-2: Trust Signal A/B | Trust via Copy | 5-7 | $30-50 | 2h |
| 2 | A4-2: Explanation Format | Which Explanation Works | 5-7 | $0 | 10h |
| 3 | A2-1: Wizard-of-Oz | Beat ChatGPT | 7-10 | $300-500 | 15h |
| 3 | A3-1: Specificity Ladder | Sweet Spot Calibration | 5-7 | $200 | 7h |
| 4 | A5-1: Career Pulse | Retention Loop | 35 | $0 | 30h |
| 4 | A5-2: Peer Signal | Social Retention | 35 | $0 | 6h |

---

## Discovery Timeline

### Week 1-2: Foundation Tests (Run in Parallel)
- **A1-1**: Fake Door Upload — will people upload at all?
- **A2-2**: Fake Door Report — does the value prop generate intent?
- **A4-1**: Monopoly Money — does explainability change behavior?
- **Setup A5-1**: Begin Career Pulse recruitment

### Week 2-3: Calibration (Based on Week 1-2 Results)
- **A3-2**: Specificity A/B — is specificity the differentiator?
- **A1-2**: Trust Signal A/B — can copy fix trust?
- **A4-2**: Explanation Format — which type of explanation works?
- **Begin A5-1 pulses**: Send first Career Pulse emails

### Week 3-4: Deep Validation (Gate before any engineering)
- **A2-1**: Wizard-of-Oz — the most decisive test: is our output actually better than ChatGPT?
- **A3-1**: Specificity Ladder — calibrate the sweet spot
- **Continue A5-1**: Weeks 2-3 of Career Pulse

### Week 4-5: Retention Validation
- **Launch A5-2**: Peer Signal split test within A5-1 cohort
- **Continue A5-1+A5-2**: Weeks 3-4 of pulses
- **Synthesize all results**: Compile findings into go/no-go decision

### Week 5-6: Decision & Planning
- Analyze all experiment results together
- Make go/no-go/pivot decision
- If go: scope MVP based on validated components
- If pivot: re-run top experiments with revised value prop

---

## Decision Framework

### If A1 (Trust) succeeds →
Resume upload is viable. Proceed to value validation.

### If A1 (Trust) fails →
Pivot onboarding: test paste-text, LinkedIn OAuth, or "preview on sample resume first" flows. Re-run.

### If A2 (Good Enough) succeeds →
TalentOS has a real value advantage. Identify the 2-3 components that drove preference → those become MVP features.

### If A2 (Good Enough) fails →
ChatGPT is good enough. Pivot to value props ChatGPT can't replicate: job matching, employer connections, community. Re-test.

### If A3 (Specific vs Accurate) succeeds →
Lock in the specificity calibration. Build AI output spec at Level 2: reference user's actual skills, name specific role titles and company stages, quantify gaps, avoid naming specific companies/people.

### If A4 (Explainability) succeeds →
Explainability is the moat. Prioritize "match card" as core UI primitive. Every interaction shows the user something specific.

### If A4 (Explainability) fails →
Transparency isn't the differentiator. Pivot toward what actually changes behavior: social proof, urgency, peer comparison.

### If A5 (Retention) succeeds →
Career Pulse is the retention backbone. Build automated pulse generation as a core feature.

### If A5 (Retention) fails →
Informational loops don't work. Explore social hooks, gamification, or event-based urgency as alternative retention mechanisms.

### Go/No-Go Gate (End of Week 5)
- **Go**: A1 + A2 + at least one of (A3/A4) validated → scope MVP
- **Conditional Go**: A1 + A2 validated but A3/A4 failed → pivot the differentiation angle, re-test
- **No-Go**: A1 or A2 failed → fundamental rethink of value proposition or target market

---

## Next Steps

After this discovery plan:
1. **Create a PRD** for the top validated idea(s)
2. **Design interview scripts** to supplement experiments
3. **Set up metrics/tracking** for experiment dashboards
4. **Estimate effort** and create user stories for the MVP

---

*This is a living document — update as experiments run and results come in.*
