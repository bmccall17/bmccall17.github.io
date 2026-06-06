---
title: "The crm that drafts its own follow-ups"
seoTitle: "The crm that drafts its own follow-ups"
seoDescription: "three weeks. one sales team of one person (me). and now the CRM writes first drafts, remembers every meeting, and will not send a single email without"
datePublished: Sat May 09 2026 19:45:39 GMT+0000 (Coordinated Universal Time)
cuid: cmoyr7lae000202js9gfye26y
slug: 2026-04-30-the-crm-that-drafts-its-own-followups
canonical: https://bmccall17.github.io/darketype/weblog/2026-04-30_the_crm_that_drafts_its_own_followups.html
cover: https://bmccall17.github.io/assets/social/og/2026-04-30_the_crm_that_drafts_its_own_followups.png
ogImage: https://bmccall17.github.io/assets/social/og/2026-04-30_the_crm_that_drafts_its_own_followups.png
tags: meetings, crm, agent828, sales-tooling, ae-brief, context-puddle, draft-revisions, approval-gate, activity-log

---

# The crm that drafts its own follow-ups

Three weeks. One sales team of one person (me). And now the CRM writes first drafts, remembers every meeting, and will not send a single email without a human saying yes.

Here is what that arc actually looked like.

## The problem with meeting transcripts

Before this, a meeting happened and the transcript lived in a google doc that nobody opened again. The lead record had a status and a next_action date and a note that said "good call - following up." the CRM had no idea the call happened. The AE brief had no idea what was said. The next outreach was written from scratch.

This is not a tooling problem. It is an architecture problem. The transcript never became a first-class artifact.

**Phase I.1** fixed that. Every meeting transcript now ingests into a `meeting_transcripts` table with a SHA-256 hash for dedup, a participant list, an analysis status, and a foreign key back to the account. Pasting the same transcript twice no-ops. The same transcript on a different account is a different row. The record now knows the meeting happened.

## The analysis worker

Ingesting a transcript is table stakes. The value is what you extract from it.

**Phase I.2** shipped the analysis worker. After ingest, it fires asynchronously and produces three things:

1. A **client-facing recap** — concise, under 500 chars, the kind of thing you'd send if you had to brief someone in 30 seconds. Decisions made. Action items with owners and due dates. Next step.
2. A **team-facing full analysis** — tone, stakeholder reactions keyed by name, concerns surfaced, categorized signals with quotes. The stuff you'd write in the margin of a call notes doc if you were honest.
3. **Scope proposals** — when the transcript clearly changes something we thought we knew (objective, budget, timeline), the worker surfaces a before→after pair with rationale. It does not just apply the change. It queues it for review.

That last part matters. The system proposes. The operator decides. Nothing changes in the lead record without a human clicking ACCEPT.

![Meetings panel showing analyzed discovery call with recap, action items, scope proposal, and draft follow-up button](https://bmccall17.github.io/darketype/entries/media/2026-04-30_crm_followups/meetings_panel.png)

## Drafts that know what was said

**Phase I.3** wired the puddle to the meetings. The context puddle — the structured object that assembles every known fact about a lead before any LLM call — now includes the last 3 analyzed meetings. Summary, tone, signals, concerns. Hard-capped at 2KB so the prompt doesn't balloon.

The consequence: when phase I.4 ships the `DRAFT FOLLOW-UP FROM ROWAN` button, the draft is not a generic reply. It's a draft that knows what tone the meeting ran at, what concerns came up, what the client said they needed next. The AE-voiced follow-up lands with transcript attached. Subject pre-threaded. From-address accurate.

This is the delta. It's not that the draft is better. It's that the draft is downstream of the truth.

## The AE brief

Five chips. One question. Nine seconds.

`SUMMARIZE` / `BLOCKERS` / `DRAFT REPLY` / `PREP FOR CALL` / `NEXT STEPS` — or type a free-form question. Temperature 0.4. Gemini 2.5 Flash on top of the full context puddle. The brief knows about the meeting that just happened, the emails that were sent, the scope changes that were accepted, the timeline the client named.

![Ae brief panel with suggestion chips and pre-call briefing output for acme corp](https://bmccall17.github.io/darketype/entries/media/2026-04-30_crm_followups/ae_brief_panel.png)

I can prep for a call in nine seconds. I type "what do i need to know before this call" and i get the brief. It is so much faster than re-reading the entire history that the first time it worked i sat there for a beat trying to figure out what i had broken.

## The approval gate

**Phase L** introduced the state machine: `pending_approval → approved → sent`.

AI-authored drafts — meeting follow-ups, draft replies, AE brief outputs — start in `pending_approval`. A rep cannot send them without an explicit APPROVE step. The send gate will 409 if a pending draft tries to ship without the flag.

The decision to build this now, before any fully autonomous AE goes live, was intentional. The gate costs almost nothing when it's just me clicking approve. It costs enormously if you skip it and then add autonomous agents later and have to retrofit it.

![Pending drafts amber banner on account detail showing draft awaiting approval with edit button](https://bmccall17.github.io/darketype/entries/media/2026-04-30_crm_followups/pending_drafts_banner.png)

The rule: the system writes. A human approves. We never auto-send.

## Collaborative revisions

**Phase I.5** added the revision loop. The operator reads a draft, types feedback, the AE revises. Every version is preserved. `Current_revision_id` tracks the head. `Sent_revision_id` records what actually went out. Stale-tab protection: if the compose modal has an old revision open and someone else updated the draft, the send returns 409 with both IDs so nobody sends stale content blind.

The model: non-destructive history. Approval required on the head, not a prior revision.

## The editable activity log

**Phase N** was the one i did not anticipate needing.

The activity log was read-only. You could see what happened but you couldn't fix it. If a note was wrong, it was wrong. If a meeting detail was miscaptured, it stayed miscaptured. And every AE brief and draft that ran after that was downstream of the wrong record.

Now every activity row is editable. Every edit writes a revision, preserving the original. Every save re-runs the Lead Action Engine and re-shapes account memory so future briefs and drafts reflect the corrected truth. The operator sees toast feedback: green when the AE context refresh succeeded, amber when it partially failed, explicit message when it didn't run.

![Activity timeline showing SENT, APPROVED, DRAFT badge stack with EDITED chip and revision history on draft row](https://bmccall17.github.io/darketype/entries/media/2026-04-30_crm_followups/activity_timeline.png)

A broken CRM record is not a data quality problem. It's a downstream trust problem. Every downstream output is only as honest as the record it reads.

## The /AEbrief skill

The capstone was `/AEbrief`. A slash-command for the terminal that runs a structured portfolio sweep — no AI calls, just SQL — and can optionally go per-record with Gemini.

The completeness contract: four paths. Account ownership via `account_rep_assignments`, ownership via the primary lead's `assigned_rep_id`, ownership via any linked lead, standalone unpromoted leads. The brief opens with a mandatory coverage header so any future SQL regression that silently drops a path becomes visible at the top of the output instead of quietly shrinking the brief.

Running `/AEbrief rowan` from the terminal gives a full book of business in 30 seconds. What's warm, what's stale, what's got a pending draft sitting unreviewed, what's got a possible duplicate that needs a merge decision.

## What this is

It is not a SaaS product. It is a working system, built by its own first user, using the same pipeline it's supposed to manage.

The phases: **I.1** (transcripts as artifacts) → **I.2** (analysis worker) → **I.3** (scope queue + puddle enrichment) → **I.4** (AE drafts with attachments) → **I.5** (collaborative revisions) → **L** (approval gate) → **N** (editable activity log + context refresh) → **/AEbrief** (portfolio in 30 seconds).

Three weeks. One arc. The CRM now writes its own follow-ups. It just won't send them without you.

## We can build this for your sales team

3 Weeks of agent dev = your AEs stop typing cold outreach from scratch and start approving drafts that already know what was said in the last call.

If your reps are re-reading their own notes before every follow-up, there is a better way.

## Distillation

The hardest part of building a CRM that thinks is not the AI. It's the approval gate. Build the human-in-the-loop before you need it, not after.

* * *

Shipped: meeting transcripts table (I.1), analysis worker with recap + full analysis + scope proposals (I.2), scope review queue + puddle enrichment (I.3), AE follow-up draft with transcript attachment + from-address fix (I.4), collaborative draft revisions + stale-tab 409 (I.5), draft approval state machine pending_approval→approved→sent (L), editable activity log + revision history + AE context refresh fan-out (N), /AEbrief skill with 4-path completeness contract (v0.3.61). Full arc: v0.3.41 → v0.3.61.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-04-30_the_crm_that_drafts_its_own_followups.html).*