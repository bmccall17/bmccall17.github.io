success_microsite.md
You are Antigravity. Goal: create a new Customer Success microsite at /success on bmccall17.github.io by duplicating the existing site located at /portfolio and then rewriting copy to align with my Technical CSM/TAM positioning.

Context:
- I want Option 1: a parallel entry point under /success.
- Copy and content changes are specified in ICSMupdate.md (use it as the source of truth for what to change).
- This is a copy-first pass: do not redesign the visual system unless necessary to support routing or new pages. Keep layout + styling consistent with the main site.

Repository + constraints:
1) Determine the current site stack (Jekyll, Next.js, plain HTML, etc.) and the safest way to add a /success route in GitHub Pages.
2) Implement /success so it serves without breaking the main site.
3) Minimize duplication if possible, but prioritize shipping a working /success path quickly.
4) Preserve existing content at the root path unchanged.
5) Output should be a PR-ready set of changes with a clear summary of what changed and how to preview locally.

Work plan:
Phase 0: Discovery
- Inspect repo structure and identify where pages, templates, and content live.
- Identify how routing works today (pages folder, Jekyll collections, build output, etc.).
- Identify how to create /success path for GitHub Pages based on current stack.

Phase 1: Create /success scaffold (duplicate)
- Duplicate the current homepage + any required assets so /success loads and looks the same as root.
- Ensure internal links within /success correctly point to /success equivalents (or temporarily point back to root if not yet duplicated).
- Confirm no broken links/assets when visiting /success.

Phase 2: Copy-only revamp per ICSMupdate.md
Apply the following copy changes to the /success version (ONLY /success; do not touch root):

A) Top nav + first impression
- Rename “Portfolio” to “Customer Work” or “Case Studies”
- Add header CTAs: “Book a 15-min chat” + “Download resume”
- Add one-line subhead under my name: “Technical CSM/TAM for AI + developer tools: implementation success, adoption, renewal outcomes.”

B) Hero copy
- Replace the “thriving in roles…” sentence with a two-sentence value proposition:
  Sentence 1: lifecycle + technical ownership
  Sentence 2: impact on adoption/GRR/time-to-value/escalation calm
- Add a micro-proof line: “Known for de-risking onboarding, building health signals, and running QBRs that drive expansion.”
- Keep my headline: “Technical Customer Success Manager | Adoption + GRR | Health Scoring + QBRs”

C) Current Focus -> Candidate-Market Fit
- Convert paragraph into 5 bullets:
  - Target roles: Technical CSM / TAM (Commercial CSM secondary)
  - Target companies: mission-driven SaaS, 25–500, AI platforms, devtools/observability, analytics
  - Location: relocate-ready; Vancouver, Seattle/Bellevue, SF Bay, NYC (plus open to remote if true)
  - Signature: implementation quality + behavior change + product feedback loop
  - Ownership: onboarding/implementation, adoption plan, health + risk, QBR cadence, escalations, renewal/expansion motion
- Add line: “I’m strongest in the messy middle between humans and systems: readiness workflows, remote troubleshooting, and champion enablement.”

D) Add 30/60/90 mini-block
- Insert a new section with 3 bullets each for 30/60/90:
  30: implementation readiness, success plan, instrumentation/health baseline, stakeholder map
  60: adoption campaigns, QBR cadence, risk playbooks, exec comms
  90: expansion signals, repeatable enablement, VOC loop with Product/Eng, measurable GRR impact

E) Key Achievements box
- Rewrite bullets to map to CS signals: implementation/time-to-value, adoption lift, retention/renewal influence, escalation leadership.
- Remove “creative highlight reel” phrasing unless framed as customer outcomes.

F) Professional Values box
- Anchor values to CS operating behaviors:
  Calm escalation leadership; clarity and follow-through; customer outcomes over activity; strong POV + low ego collaboration.

G) Tooling + technical fluency strip
- Add single line: “Fluent in APIs, logs/traces, dashboards, SQL-adjacent thinking, integrations, and debugging workflows with Eng.”

H) Portfolio grid -> Customer Outcomes and Systems
- Rename section
- Update each card title and description to be outcome-based (2 lines max) + add CS tags list (Implementation, Adoption, Health, QBR, Renewal, Expansion, Escalations, VOC, Enablement)
- If exact outcomes/metrics aren’t available, draft honest “operational outcomes” phrasing (e.g., “reduced onboarding friction,” “established QBR cadence,” “improved stakeholder alignment”).

I) Case Studies pages (copy-first)
- Create 3 simple pages under /success (or a /success/case-studies folder) with placeholders I can fill:
  Case Study A: Implementation rescue / complex onboarding
  Case Study B: Adoption + enablement program
  Case Study C: Health scoring + QBR cadence driving renewals/expansion
Each page template must include: Situation, Obstacles, Actions, Results, What I’d repeat, Artifacts.

J) About section
- Lead with: “I help technical products land well with real humans.”
- Then 3 bullets: lifecycle ownership; calm escalation leadership; cross-functional partner to Product/Eng/RevOps
- Keep any “weirdness/creativity” line but subordinate to outcomes.

K) Contact section
- Replace with 3 specific asks:
  Hiring Technical CSM/TAM; Introductions to CS leaders in AI/devtools/observability; Customers who need onboarding/adoption rescue (consulting)
- Add a 2-sentence “forwardable pitch” block.

L) Site-wide keyword alignment sweep
- Ensure these phrases appear naturally across /success: implementation/onboarding, success plan/MAP, adoption/enablement, health scoring/usage signals, QBR/exec storytelling, renewal/GRR/churn risk, escalation management, cross-functional partners, AI/devtools/observability.

Phase 3: QA + preview instructions
- Validate /success works on GitHub Pages routing.
- Provide local preview steps (command(s)) and a checklist to verify links, CTAs, and navigation.
- Summarize files changed and any follow-up tasks for me (like filling case study details).

Deliverables:
- A single PR with /success live and the copy updates applied per ICSMupdate.md.
- A brief change log + preview steps + verification checklist.

Use ICSMupdate.md as the authoritative spec for what to change. Do not modify root site copy.
