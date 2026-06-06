# repOptics Recalibration: From Community Pain to Calibrated Scoring

**Author:** Brett McCall (bmccall17)
**Date:** 2026-04-06
**Status:** Shipped to production

---

## The Problem We Started With

repOptics scored every GitHub repository against the same universal rubric. A specification repo, a prototype, and the most popular UI framework on earth all got judged by the same rules. The results were fast and opinionated — but they were also tone-deaf.

On April 5, 2026, production scans showed:

| Repo | Score | Grade | Verdict |
|------|-------|-------|---------|
| xenomorphtech/aeon | 33 | F | "Burn it down." |
| CycloneDX/specification | 52 | C | "Technical Debt Factory." |
| facebook/react | 35 | F | "Burn it down." |

All three received nearly identical quick wins: *"Create package.json via npm init," "Enable branch protection," "Require PR reviews."* Recommending `npm init` to a specification repo. Telling React to burn it down. The scoring engine had a sophisticated context-aware system already built — intent-based weight profiles, relevance matrices, severity capping — but intent was never auto-detected. Every instant scan defaulted to a production-app rubric with all 28 checks at full weight.

The tool was technically correct on its own terms. It was also useless to anyone who scanned a repo that wasn't a standard production web app.

---

## Finding the Real Pain

The recalibration didn't start with a scoring model redesign. It started with research.

### Listening to the developer community

Through the Leuchtturm project — a parallel effort building a lightweight operating layer for solo and small-team AI builders — we had been conducting structured market discovery across developer communities: Reddit (r/cursor, r/ChatGPTCoding, r/LLMDevs), Hacker News, Claude Discord, GitHub Issues, and Windsurf/Bolt community reports.

Two waves of research (deep-research-report.md and supplemental-research-report.md) surfaced five pain clusters from solo and small-team builders:

1. **Context drift and session decay** — AI sessions get messy, decisions get forgotten, models suggest contradictory changes. Builders invent manual handover rituals. Context limits silently cause wrong-repo commits and lost rules.

2. **Cost spikes and opaque attribution** — AI tool bills spike unexpectedly. Builders cannot attribute spend to project, tool, or session. One user hit $127 in 7 days from a loop bug. Another burned $5,500 on a single refactor.

3. **Post-ship security void** — 53% of developers who shipped AI-generated code later discovered security issues. The same four gaps appeared in every audited repo: no auth on admin routes, API keys in client JS, CORS wide open, debug endpoints live in production.

4. **Vendor lock-in and platform betrayal** — The OpenClaw ban blocked third-party harnesses overnight, affecting 135K+ active instances. Every AI editor uses a proprietary context format.

5. **Destructive agent actions** — Agents execute `rm -rf`, push to wrong repos, lock users out after permission denials. No circuit breakers on token-consuming loops.

The common thread across all five clusters: **builders ship fast, then discover they have no visibility into what they actually shipped.**

### Developer feedback on repOptics specifically

Community developers who tested repOptics gave direct feedback on the scoring:

- The results felt "opinionated" in a way that didn't match what the repo actually was
- The same governance recommendations appeared for every repo regardless of context
- Scores were clustered in the 60-67 range for repos that should have felt healthy
- Missing artifacts (like ADRs) acted as permanent scoring taxes even when they were irrelevant
- Security scores didn't distinguish between "actually vulnerable" and "we don't have enough evidence to tell"

One developer suggested the most valuable thing repOptics could do was **find the greatest pain in the developer community and surface it immediately** — not just audit governance artifacts, but make the first scan genuinely insightful and actionable.

### Synthesizing the research into product direction

The Leuchtturm synthesis (synthesis-actionable-directions.md) ranked eight actionable directions by pain intensity, frequency, fit, underserved gap, and buildability. The #1 ranked direction — post-ship security scanning (24/25) — aligned directly with what repOptics already did, just not well enough.

The quick-win brief (repOptics_quickwin_brief.md) then applied Leuchtturm's "quick win on first touch" thinking directly to repOptics. Six transferable activation principles emerged:

1. **The user's repo IS the input** — no setup, no configuration. The repo is the data.
2. **Show value before asking for depth** — a health score before asking for integrations, pentests, or AI generation.
3. **Convert existing data into immediate insight** — the insight is already in the repo structure, governance artifacts, dependency health, and security posture. It just needs to be surfaced correctly.
4. **One-click first improvement** — after showing the score, show the single highest-leverage thing to fix.
5. **Score before explain** — a number lands faster than a paragraph. "47/100" creates curiosity. The breakdown earns the click.
6. **Public repos need no auth** — repOptics can scan public repos with zero authentication. This is a massive activation unlock.

The recommended quick win was clear: **"Paste a repo URL, get a health score in 60 seconds. No signup. No auth. No configuration."**

But that quick win would be worthless if the score was wrong. A 60-second scan that tells React to burn itself down is worse than no scan at all.

---

## The Recalibration Sprint

The research output directly informed the product requirements document for recalibration (recalibraterepOptics.md) and the README-aware scoring PRD (prd-readme-aware-scoring.md). These weren't theoretical exercises — they were engineering specs driven by observed community pain.

### Nine problems to fix

The recalibration PRD identified nine specific scoring problems:

1. Score ceiling too low — healthy repos clustering in the 60-67 range
2. Decisions behaving as a dead category and permanent tax
3. Architecture too flat, not enough nuance
4. Security under-explained — low scores don't tell users whether the issue is absence of evidence, explicit gaps, or actual exposure
5. Quick wins converging on the same governance recommendations regardless of repo type
6. Verdict copy improving faster than scoring math — sentences and numbers disagree
7. Repo intent detected but not reshaping the math enough
8. Missing evidence still acting too much like failure
9. Grades too sticky — meaningful fixes don't move perceived outcomes

### Ten product decisions locked

The sprint locked ten design decisions before writing any code:

1. **Replace the single top score with three headline scores**: Repo Health, Launch Readiness, Maintainer Maturity
2. **Strongly separate unknown from bad**: five check states (PASS / PARTIAL / FAIL / UNKNOWN / N/A) instead of three
3. **Grade and score relative to repo type**: no universal rubric for all nine intent categories
4. **Visible evidence only**: no reward or penalty based on popularity, stars, or reputation
5. **ADRs are optional, not mandatory**: a repo must be able to earn a strong score without ADRs
6. **Priorities for calibration**: optimize for optics and motivation first, then clear gaps, then actionable details, then raw truth
7. **Governance penalties must be intent-aware**: branch protection only hurts when the repo type suggests collaborative protected flow
8. **Quick wins selected by repo intent**: three labeled picks — best next move, fastest improvement, biggest trust gap
9. **New grade bands**: A >= 85, B >= 70, C >= 55, D >= 40, F < 40
10. **README and intent clarity matter**: weak README lowers confidence and softens verdicts rather than penalizing the score directly

### Building the calibration engine

The implementation took a deliberate architectural approach: build a new `lib/calibration-engine.ts` alongside the existing `lib/heuristics.ts` rather than gutting it. The old engine stayed intact for backward compatibility while the new one powered the instant scan and a new `/calibration` debug page.

Key engineering decisions in the build:

**Confidence-damped scoring.** The formula `displayed_score = raw_score * (0.85 + 0.15 * confidence)` ensures that unknown checks lower certainty without behaving like failures. A category where 3 of 5 checks are UNKNOWN doesn't score zero — it scores what's known, dampened by the uncertainty. This directly solved problems #4 and #8.

**Intent-relative weighting.** A contribution matrix maps each of the seven categories to each of the three headline scores with different weights. Intent multipliers then adjust those weights per repo type. A specification repo weights governance at 1.15x and delivery at 0.90x. A product app weights delivery at 1.15x and security at 1.10x. This solved problems #5 and #7.

**Expanded category checks.** The Decisions category went from 3 ADR-only checks to 6 checks including README rationale and changelog, fixing the "permanent zero" problem (#2). Architecture expanded to 6 checks including structural clarity and obvious entrypoints (#3). Security now distinguishes actual vulnerabilities (hard FAIL) from missing evidence like branch protection (UNKNOWN — not penalized without admin token) (#4).

**Quick win engine.** Three labeled picks replace severity-based selection: best next move (highest leverage), fastest improvement (easiest visible win), biggest trust gap (most blocking confidence). These vary by repo type and reference actual observed evidence. This solved #5.

**Verdict pattern.** Every verdict follows a four-part structure: what it is, what's strong, what's the main limiting factor, confidence note if necessary. No more "Burn it down." No more "Technical Debt Factory" for specification repos. This solved #6.

**Assessment confidence.** A separate signal computed from intent confidence, average category confidence, and README clarity. Displayed as High / Medium / Low. When confidence is low, verdicts are softened rather than assertive. This solved #8 and #9.

### The calibration UI

The sprint also built a `/calibration` page — a 7-panel inspection UI where anyone can audit exactly why a score happened: which evidence produced it, what was unknown vs bad, how intent changed the math, and what would move the score up. This was a direct response to the research finding that developers distrust opaque scoring. Transparency is how a scoring tool earns the right to be opinionated.

---

## The Migration

With the calibration engine built and validated, the migration sprint replaced the entire scoring pipeline across the application:

**Phase 1: Landing page replacement.** The old landing page (context picker, route to full report) was replaced with the instant-scan flow: paste a URL, get a score in ~60 seconds, see three headline scores and labeled quick wins inline. Auth-aware for private repos. No signup required for public repos.

**Phase 2: Full report migration.** The report page switched from `scoreRepo()` to `calibratedScoreRepo()`. The three top cards changed from Overall / Hygiene / Risk to Repo Health / Launch Readiness / Maintainer Maturity. All downstream components were updated: health check panel (5 check states, confidence indicators, score contribution per check), priority summary (labeled quick wins), category cards (displayed scores with confidence), security panel, bloat panel, export dialog, report export, AI analysis prompt, and the Gemini analysis route.

**Phase 3: Tone audit.** Every report tab was reviewed for language alignment with the recalibrated model. "Decision Optics" became "Decision Records." "Recommendations Engine" became "Recommendations." "Incredible. Nothing to recommend. Are you sure this is a real repo?" became "No recommendations at this time." Grade F's "Burn it down" became "Significant gaps. Start with the top 3 quick wins to build momentum." Dependency strategy strings were expanded from 5 to 10 intent types with softer, more descriptive language.

**Phase 4: Verification.** TypeScript: 0 errors. Snyk: 0 real issues. All 97 tests passing (after fixing a pre-existing test failure that had been blocking CI since April 2nd).

---

## What Changed in Practice

The recalibration produces fundamentally different results from the same repos:

- **Specification repos** no longer get told to run `npm init`. Dependencies checks are marked N/A. Governance and decisions are weighted heavily. Quick wins focus on contribution clarity and process transparency.

- **Frameworks** are no longer told to burn it down. Security and governance get higher weight for their scale. Quick wins focus on the gaps that matter at community scale.

- **Prototypes** get softer governance expectations. Branch protection is advisory, not a penalty. Quick wins focus on clarifying intent and fixing obvious risks.

- **All repos** benefit from the unknown/bad distinction. A missing branch protection setting (which requires admin API access we may not have) shows as UNKNOWN with no penalty, not as a hard failure dragging the score down.

- **The first scan is immediately insightful.** Three headline scores tell you different things about the same repo. Labeled quick wins give you the next move, the easiest win, and the biggest trust gap — specific to what your repo appears to be, referencing actual evidence from the scan.

---

## The Cycle

The process that produced this recalibration was not "identify scoring bugs, fix scoring bugs." It was:

1. **Listen to the community** — structured market research across developer communities, surfacing real pain from real builders
2. **Identify the deepest pain** — "I shipped it, but I don't trust it" / "I can't tell if my repo is healthy for what it's trying to be"
3. **Let the pain inform the product** — the recalibration spec was written directly from research findings, not from abstract scoring theory
4. **Build for the first touch** — the quick-win research demanded that the first 60 seconds of using repOptics produce genuine insight, which forced the scoring to be contextually accurate
5. **Make the math inspectable** — if the tool is going to be opinionated, users need to be able to audit the opinion

The feedback loop was: community pain surfaced the requirement that scores must be intent-aware. Intent-awareness required auto-detection. Auto-detection required README parsing and structural analysis. Structural analysis revealed that missing evidence was being treated as failure. Fixing that required a new scoring model. The new scoring model needed transparency. Transparency needed a calibration UI.

Each step was forced by the one before it. The result is a tool that doesn't just scan repos — it understands what kind of repo it's looking at, scores it relative to what it's trying to be, explains its reasoning, and tells the maintainer exactly what to do next.

---

## Source Documents

| Document | Location | Role |
|----------|----------|------|
| Deep Research Report (Wave 1) | `Leuchtturm/docs/deep-research-report.md` | Market discovery: pain clusters, user segments, community map |
| Supplemental Research (Wave 2) | `Leuchtturm/docs/supplemental-research-report.md` | OpenClaw ban, token drain crisis, post-ship security void |
| Synthesis: Actionable Directions | `Leuchtturm/docs/synthesis-actionable-directions.md` | Ranked build plan from research findings |
| Quick Win Brief | `Leuchtturm/docs/repOptics_quickwin_brief.md` | Activation principles applied to repOptics |
| Quick Win Research Prompt | `Leuchtturm/docs/quickwinresearch_repOptics.md` | Research framing for quick-win analysis |
| Dev Feedback: Live Site Audit | `Leuchtturm/docs/dev-feedback-leuchtturm-audit-2026-04-05.md` | Audit of Leuchtturm deployment, bugs and patterns |
| README-Aware Scoring PRD | `repOptics/docs/prd-readme-aware-scoring.md` | V1/V2/V3 implementation plan for intent classification |
| Recalibration Sprint Spec | `repOptics/docs/recalibraterepOptics.md` | Full scoring model redesign specification |
