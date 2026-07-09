# TalentOS Metrics Framework

**Date**: 2026-07-10
**Phase**: Pre-MVP / Discovery

---

## Section 1: Discovery Experiment Metrics

### A1-1: Fake Door Resume Upload

| Element | Specification |
|---|---|
| **Primary Metric** | Resume Upload Click-Through Rate (CTR) — % of visitors who click the upload CTA |
| **Secondary Metrics** | Time on page before click; scroll depth; bounce rate on landing page |
| **Tracking Method** | PostHog/Mixpanel event: `resume_upload_cta_clicked`; session recording; Google Analytics 4 |
| **Pass** | CTR >= 12% of unique landing page visitors |
| **Marginal** | CTR 7-11% |
| **Fail** | CTR < 7% |
| **Sample Size Target** | 500 unique visitors per variant (minimum), collected over 14 days |
| **Confidence Level** | 90% |

### A1-2: Trust Signal A/B

| Element | Specification |
|---|---|
| **Primary Metric** | Resume Upload Conversion Rate (upload attempts / unique visitors) |
| **Secondary Metrics** | Trust-related micro-interactions (hover over privacy badge); form abandonment rate; support question rate |
| **Tracking Method** | A/B test via PostHog feature flags; funnel tracking; events: `privacy_badge_hovered`, `upload_form_abandoned` |
| **Pass** | Variant B outperforms A by >= 25% relative lift with p < 0.10 |
| **Marginal** | Variant B outperforms A by 10-24% relative lift |
| **Fail** | No statistically significant difference or B underperforms A |
| **Sample Size Target** | 400 visitors per variant |

### A2-1: Wizard-of-Oz Side-by-Side

| Element | Specification |
|---|---|
| **Primary Metric** | Preference Rate — % of users who rate TalentOS output as more actionable and specific |
| **Secondary Metrics** | Perceived specificity score (1-7 Likert); perceived credibility score (1-7); time spent reading; "I would follow this advice" rate |
| **Tracking Method** | In-app survey (Typeform); events: `output_rated`, `preference_selected`; randomize left/right order |
| **Pass** | >= 60% prefer TalentOS output (binomial test, p < 0.10) |
| **Marginal** | 50-59% prefer TalentOS output |
| **Fail** | < 50% prefer TalentOS output |
| **Sample Size Target** | 80 users who complete both ratings |

### A2-2: Fake Door Career Report

| Element | Specification |
|---|---|
| **Primary Metric** | Email Capture Rate — % of users who enter email to unlock the report |
| **Secondary Metrics** | Scroll depth on blurred preview; click attempts on blurred sections; return visit rate |
| **Tracking Method** | Funnel events: `report_preview_viewed`, `report_scroll_depth`, `blurred_section_clicked`, `email_submitted` |
| **Pass** | Email capture rate >= 30% of users who see the preview |
| **Marginal** | Email capture rate 20-29% |
| **Fail** | Email capture rate < 20% |
| **Sample Size Target** | 300 users who reach the preview page |

### A3-1: Specificity Ladder

| Element | Specification |
|---|---|
| **Primary Metric** | Advice Actionability Score — user-rated likelihood to follow advice (1-7 scale, target mean >= 5.0 for Level 3) |
| **Secondary Metrics** | Perceived value score (1-7); time spent reading; sharing intent; comprehension score |
| **Tracking Method** | Survey instrument embedded in output page; events: `advice_viewed`, `specificity_level_shown`, `actionability_rated` |
| **Pass** | Level 3 mean actionability score >= 5.0 AND statistically significant improvement over Level 1 (p < 0.10) |
| **Marginal** | Level 3 mean 4.0-4.9, showing directional improvement |
| **Fail** | No significant difference, or Level 3 scores < Level 1 |
| **Sample Size Target** | 40 users per level (120 total) |

### A3-2: Specificity A/B Landing Page

| Element | Specification |
|---|---|
| **Primary Metric** | Sign-up / CTA completion rate |
| **Secondary Metrics** | Time on page; scroll depth; bounce rate; qualitative feedback on "clarity of value" |
| **Tracking Method** | A/B test via PostHog; funnel events: `landing_page_viewed`, `cta_clicked`, `signup_completed` |
| **Pass** | Variant B converts >= 30% higher relative to A (p < 0.10) |
| **Marginal** | Variant B converts 15-29% higher |
| **Fail** | No significant difference or B underperforms |
| **Sample Size Target** | 500 visitors per variant |

### A4-1: Monopoly Money Choice Test

| Element | Specification |
|---|---|
| **Primary Metric** | Mean coin allocation per feature (which feature gets the most investment) |
| **Secondary Metrics** | Number of distinct features funded; distribution shape; qualitative reasoning |
| **Tracking Method** | In-app allocation UI; events: `coins_allocated` with feature and amount |
| **Pass** | Clear winner emerges with >= 30% of total coins allocated |
| **Marginal** | Top feature gets 20-29% of coins |
| **Fail** | No feature exceeds 20% |
| **Sample Size Target** | 100 users completing the allocation |

### A4-2: Explanation Format Showdown

| Element | Specification |
|---|---|
| **Primary Metric** | Trust in Recommendation score (1-7 Likert) |
| **Secondary Metrics** | Perceived understanding score; time spent on explanation; click-through to job posting; "would you apply?" intent |
| **Tracking Method** | In-app survey after viewing; events: `explanation_viewed`, `format_shown`, `trust_rated`, `job_link_clicked` |
| **Pass** | One format achieves mean trust score >= 5.5 with significant lead over lowest format (p < 0.10) |
| **Marginal** | Top format scores 4.5-5.4 |
| **Fail** | No meaningful difference between formats (all within 0.5 points) |
| **Sample Size Target** | 50 users per format (150 total) |

### A5-1: Career Pulse Concept Test

| Element | Specification |
|---|---|
| **Primary Metric** | Concept Appeal Score (1-7 Likert) AND stated willingness to pay |
| **Secondary Metrics** | Preferred frequency; preferred delivery channel; "would this change how you job search?"; predicted usage frequency |
| **Tracking Method** | Concept test survey; events: `concept_viewed`, `appeal_rated`, `wtp_response`, `frequency_preferred` |
| **Pass** | Mean appeal >= 5.0 AND >= 40% express willingness to pay (even $1/month) |
| **Marginal** | Mean appeal 4.0-4.9 OR 25-39% express WTP |
| **Fail** | Mean appeal < 4.0 OR < 25% express WTP |
| **Sample Size Target** | 150 users from target segment |

### A5-2: Peer Signal Injection

| Element | Specification |
|---|---|
| **Primary Metric** | Application Completion Rate — % of users who click through to apply to a recommended job |
| **Secondary Metrics** | Job save/bookmark rate; time spent on results page; return visit within 7 days; stated confidence |
| **Tracking Method** | A/B test via feature flags; events: `results_viewed`, `peer_signal_shown`, `job_saved`, `apply_button_clicked`, `return_visit` |
| **Pass** | Variant B shows >= 20% relative lift in application click-through (p < 0.10) |
| **Marginal** | 10-19% relative lift |
| **Fail** | No significant difference, or B underperforms |
| **Sample Size Target** | 300 users per variant |

### Discovery Experiment Summary Table

| Experiment | Primary Metric | Pass Threshold | Sample Size | Duration |
|---|---|---|---|---|
| A1-1: Fake Door Upload | Upload CTR | >= 12% | 500 visitors | 14 days |
| A1-2: Trust Signal A/B | Upload Conversion | +25% relative lift | 800 visitors | 14 days |
| A2-1: Wizard-of-Oz | Preference Rate | >= 60% prefer TO | 80 users | 10 days |
| A2-2: Fake Door Report | Email Capture Rate | >= 30% | 300 users | 14 days |
| A3-1: Specificity Ladder | Actionability Score | Mean >= 5.0 (L3) | 120 users | 10 days |
| A3-2: Specificity Landing | Sign-up Rate | +30% relative lift | 1000 visitors | 14 days |
| A4-1: Monopoly Money | Coin Allocation | Clear winner >= 30% | 100 users | 7 days |
| A4-2: Explanation Format | Trust Score | One format >= 5.5 | 150 users | 10 days |
| A5-1: Career Pulse | Concept Appeal | Mean >= 5.0 + 40% WTP | 150 users | 10 days |
| A5-2: Peer Signal | Application CTR | +20% relative lift | 600 users | 14 days |

---

## Section 2: MVP Product Metrics

### North Star Metric

**Metric: Weekly Resume-to-Match Active Users (RMAU)**

**Definition:** The number of unique users per week who complete at least one end-to-end cycle of (a) uploading or updating a resume, (b) receiving job matches with explainability, and (c) engaging with at least one recommendation (saving, clicking through to apply, or sharing).

**Why this metric:** Captures the full value delivery loop — not just sign-ups, not just resume uploads, but users who experience the complete "upload, understand, act" cycle.

| Milestone | RMAU | Timeframe |
|---|---|---|
| MVP Launch | 100 | Month 1 |
| Product-Market Signal | 500 | Month 3 |
| Growth Threshold | 2,000 | Month 6 |

### Acquisition Metrics

| Metric | Definition | Target | Tracking |
|---|---|---|---|
| **Unique Visitors** | Total new + returning visitors | >= 5,000/month by Month 2 | Google Analytics / PostHog |
| **Visitor-to-Signup Rate** | % of visitors who create an account | >= 8% | Funnel: `page_viewed` -> `signup_completed` |
| **Signup-to-Upload Rate** | % of signups who upload a resume | >= 60% | Funnel: `signup_completed` -> `resume_uploaded` |
| **Channel Distribution** | Breakdown by acquisition channel | Organic >= 40% by Month 3 | UTM tracking |
| **Cost Per Acquisition** | Total spend / paid signups | <= $3.00 per signup | Ad platform + analytics |
| **Referral Rate** | % of users who refer at least one other | >= 10% of activated users | Referral link tracking |

### Activation Metrics

The "aha moment": **user sees their first job match and understands why it was recommended.**

| Metric | Definition | Target | Tracking |
|---|---|---|---|
| **Time to First Match** | Minutes from signup to first match view | <= 5 minutes (median) | Timestamp delta |
| **First Match Engagement** | % who engage with first match (scroll, click, save) | >= 50% | `first_match_viewed` -> `match_engaged` |
| **Explanation Comprehension** | % who spend >= 30s on explanation section | >= 60% | `match_explanation_time >= 30s` |
| **Onboarding Completion** | % completing full flow (upload -> preferences -> first match) | >= 45% | 4-step funnel |
| **Drop-off Points** | % abandoning at each step | Identify step with >30% drop | Step-level funnel |

### Engagement Metrics

| Metric | Definition | Target | Tracking |
|---|---|---|---|
| **Sessions Per User/Week** | Average sessions per active user per week | >= 2.5 | PostHog session tracking |
| **Session Duration** | Median time per session | >= 8 minutes | Session events |
| **Matches Viewed/Session** | Average job matches viewed per session | >= 3 | `match_viewed` count |
| **Resume Update Frequency** | Average days between updates | <= 14 days | `resume_updated` delta |
| **Feature Adoption Rate** | % using each core feature | >= 40% among active users | Feature-level events |
| **Depth of Engagement** | Composite: matches(0.3) + saves(0.3) + applies(0.25) + updates(0.15) | Mean >= 5.0 per weekly active | Custom metric |

### Retention Metrics

| Metric | Definition | Target | Tracking |
|---|---|---|---|
| **Day 1 Retention** | % returning within 24 hours | >= 30% | Cohort analysis |
| **Day 7 Retention** | % returning within 7 days | >= 18% | Cohort analysis |
| **Day 30 Retention** | % returning within 30 days | >= 10% | Cohort analysis |
| **Week-over-Week** | % of Week N users active in Week N+1 | >= 35% (steady state) | Cohort heatmap |
| **Resurrection Rate** | % of dormant (14+ days) users returning | >= 8% | Re-engagement tracking |
| **Feature-Level Retention** | Retention of Feature X users vs non-users | Feature users show >= 2x retention | Cohort split |

### Revenue Metrics (Monetization Signals)

| Metric | Definition | Target (if freemium) | Tracking |
|---|---|---|---|
| **Free-to-Paid Conversion** | % of free users upgrading | >= 5% within 30 days | `plan_upgraded` event |
| **WTP Signal** | % clicking pricing page or viewing premium features | Track baseline, target 20%+ | `pricing_viewed`, `feature_gated_clicked` |
| **Revenue Per Active User** | Monthly revenue / MAU | >= $2.00 by Month 6 | Stripe + analytics |
| **Lifetime Value** | Predicted revenue per user over job search lifecycle | >= $15 per user | Cohort revenue |
| **Payback Period** | Months to recover CAC | <= 3 months | LTV / CPA |
| **Expansion Revenue** | % of paid users upgrading tier or purchasing add-ons | >= 15% of paid base | Plan change tracking |

---

## Section 3: AI Quality Metrics

### Resume Analysis Quality

| Metric | Definition | Target | Measurement Method |
|---|---|---|---|
| **Skill Extraction Accuracy** | % of skills correctly identified vs. human annotation | >= 90% precision, >= 85% recall | Quarterly audit: 100 resumes, human double-coded |
| **Experience Parsing Accuracy** | % of titles, companies, dates correctly extracted | >= 95% | Same audit methodology |
| **Completeness Detection** | % of cases where AI correctly identifies missing sections | >= 80% agreement with experts | Expert review of 50 samples |
| **False Positive Rate** | % of skills incorrectly identified as present | <= 5% | Track user corrections |

### Job Match Quality

| Metric | Definition | Target | Measurement Method |
|---|---|---|---|
| **Match Relevance** | User-rated relevance of top 3 matches (1-7) | Mean >= 5.0 | Post-match survey (20% sample) |
| **Match Precision@5** | % of top 5 matches rated relevant (>= 5) | >= 60% | Survey-based |
| **Match Recall** | % of jobs user would consider that appear in results | >= 40% | Periodic self-report survey |
| **Explainability Satisfaction** | Satisfaction with "why this match" explanation (1-7) | Mean >= 5.5 | Micro-survey |
| **Explanation Accuracy** | % of reasons users agree are factually correct | >= 85% | "Was this accurate?" toggle |

### AI Output Quality & Reliability

| Metric | Definition | Target | Measurement Method |
|---|---|---|---|
| **Hallucination Rate** | % of outputs with fabricated facts or incorrect claims | <= 2% | Monthly audit: 200 outputs by domain expert |
| **Actionability Rate** | % of outputs with specific, actionable advice | >= 80% | Expert annotation rubric (specificity >= 5/7) |
| **Consistency Score** | Same resume produces similar quality across runs | >= 90% consistency | Re-run 50 resumes, cosine similarity >= 0.85 |
| **Latency (P95)** | 95th percentile response time | <= 15s resume analysis; <= 8s match explanation | Backend monitoring |
| **Error Rate** | % of requests producing no output or error | <= 1% | Error logging + alerting |
| **Safety Filtering** | % of outputs correctly filtered for bias/discrimination | 100% catch rate on known failures | Quarterly red-team testing |

### AI Quality Scoring Rubric (for Human Evaluation)

| Dimension | 1 (Poor) | 3 (Adequate) | 5 (Good) | 7 (Excellent) |
|---|---|---|---|---|
| **Accuracy** | Contains factual errors | Mostly accurate, minor issues | Accurate with appropriate caveats | Precise, verifiable, well-sourced |
| **Specificity** | Generic advice anyone could give | Somewhat tailored | Clearly tied to user's profile | Hyper-personalized, market-specific |
| **Actionability** | Abstract, no clear next step | Vague direction given | Clear 2-3 step action plan | Detailed plan with timeline and resources |
| **Explainability** | No reasoning provided | Basic reasoning | Clear logic chain | Transparent, auditable reasoning |

### User Satisfaction with AI

| Metric | Definition | Target | Measurement Method |
|---|---|---|---|
| **Net Promoter Score** | "How likely to recommend TalentOS?" | >= 40 at Month 3 | Monthly in-app survey |
| **AI Quality CSAT** | "Satisfied with career analysis quality?" | >= 4.2/5.0 | Post-analysis micro-survey |
| **"Better Than" Score** | "Better than ChatGPT/career coach?" | >= 60% say "better" | Monthly survey |
| **Complaint Rate** | % of sessions with quality complaint | <= 3% | `quality_complaint_submitted` tracking |
| **Correction Rate** | % of times users override AI-extracted info | <= 10% | `user_correction_made` events |

---

## Section 4: Dashboard Specification

### View 1: Daily Operational Dashboard (Real-time)

Audience: Product team, AI engineers.

| Section | Metrics | Visualization | Alert Threshold |
|---|---|---|---|
| **Daily Active Users** | DAU, DAU/WAU ratio | Line chart (7-day rolling) | DAU drops >25% below 7-day avg |
| **New Signups** | Daily signups, funnel conversion | Stacked bar (by channel) | Signups drop >30% day-over-day |
| **Resume Uploads** | Daily uploads, success rate | Line chart + gauge | Success rate < 90% |
| **AI Response Health** | Latency P50/P95, error rate | Time-series + error log | P95 >20s or error rate >2% |
| **Real-Time User Flow** | Active sessions, funnel position | Sankey diagram | Bottleneck >40% drop at any step |

### View 2: Weekly Product Dashboard (Every Monday)

Audience: Product lead, growth team.

| Section | Metrics | Visualization | Alert Threshold |
|---|---|---|---|
| **North Star** | Weekly RMAU trend (4-wk and 12-wk) | Line chart with target line | RMAU <80% of target for 2 weeks |
| **Activation Funnel** | Signup -> Upload -> First Match -> Engagement | Conversion funnel | Any step drops >10% week-over-week |
| **Retention Cohorts** | D1, D7, D30 by weekly cohort | Cohort heatmap | D7 retention < 15% |
| **Feature Adoption** | Usage of each core feature (% of WAU) | Horizontal bar chart | Any core feature < 30% adoption |
| **AI Quality Pulse** | Match relevance, hallucination flags, correction rate | Scorecards with trends | Relevance < 4.5 or correction >12% |
| **Channel Performance** | Visitors, signups, CPA, activation by channel | Multi-metric table | CPA >$4.00 on any paid channel |

### View 3: Monthly Strategic Dashboard (First Monday)

Audience: Leadership, investors, advisors.

| Section | Metrics | Visualization | Alert Threshold |
|---|---|---|---|
| **North Star & Growth** | RMAU, MoM growth, projections | Line chart with forecast cone | Growth <10% MoM for 2 months |
| **Key Business Metrics** | MAU, activation, D30, NPS, revenue | Scorecard grid with MoM deltas | Negative trend for 2+ months |
| **User Segments** | By career stage, urgency, channel, resume quality | Treemap or stacked bar | Segment diverges >50% from avg |
| **AI Performance** | Quality audit, hallucination, latency, safety | Radar chart + trends | Quality dimension below target |
| **Experiment Results** | Active experiments, results, decisions | Traffic light table | Experiment >14 days without sample |
| **Revenue & Unit Economics** | MRR, LTV, CAC, LTV:CAC, payback | Line charts + KPI cards | LTV:CAC < 3:1 |

### Segmentation Dimensions

| Dimension | Values | Why It Matters |
|---|---|---|
| **Career Stage** | Student, Early (0-3yr), Mid (3-10yr), Senior (10yr+), Career Changer | Different value props and retention patterns |
| **Job Search Urgency** | Active, Passive, Urgent (laid off/contract ending) | Urgency drives activation and retention |
| **Acquisition Channel** | Organic, Paid, Social, Referral, Direct, Content | Channel quality varies dramatically |
| **Resume Quality** | Low (<3/10), Medium (4-6/10), High (7-10/10) | Quality affects match quality and satisfaction |
| **Target Role** | Tech, Marketing, Finance, Healthcare, General | Match accuracy varies by domain |
| **Geography** | US, EU, APAC, Other | Job market dynamics differ |
| **Device** | Desktop, Mobile, Tablet | Mobile may have different activation patterns |

### Alert Escalation Protocol

| Severity | Trigger | Response | Owner |
|---|---|---|---|
| **Critical (Red)** | AI error rate >5% for 30 min; hallucination in prod; data breach | Immediate page to on-call. Halt affected feature. | AI Lead + Engineering |
| **Warning (Yellow)** | Core metric drops >15% day-over-day; latency P95 >25s; funnel step drops >10% WoW | Investigate within 4 hours | Product Lead |
| **Observation (Blue)** | Metric trending unexpectedly for 7+ days; experiment over planned duration | Review in weekly meeting | Product Analyst |
| **Success (Green)** | Metric exceeds target by >20% for 2+ weeks | Document what drove success | Growth Lead |

### Implementation Notes

- **Event Taxonomy**: `[object]_[verb]` format (e.g., `resume_uploaded`, `match_viewed`). Maintain central event dictionary.
- **User Properties**: Set on signup: `career_stage`, `target_role`, `acquisition_channel`, `geography`. Dynamic: `resume_quality_score`, `total_sessions`, `features_used`.
- **Cohort Definitions**: Default by signup week. Additional by: first feature used, resume quality tier, career stage.
- **Data Retention**: Granular events: 90 days. Aggregated metrics: indefinitely.
- **Privacy Compliance**: GDPR-compliant. Consent management before event firing. Anonymize PII.
- **A/B Test Infrastructure**: PostHog feature flags. Log: variant assignment, primary metric, secondary metrics.
- **Tooling**: Start with PostHog (free tier) + GA4. Scale to Amplitude + BigQuery as volume grows.

---

*This framework is a living document — update thresholds based on actual data after launch.*
