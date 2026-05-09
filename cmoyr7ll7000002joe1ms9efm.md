---
title: "The honest column: making follow_up_date derive from facts"
datePublished: Sat May 09 2026 19:45:40 GMT+0000 (Coordinated Universal Time)
cuid: cmoyr7ll7000002joe1ms9efm
slug: 2026-05-03-the-honest-column
canonical: https://bmccall17.github.io/darketype/weblog/2026-05-03_the_honest_column.html
cover: https://bmccall17.github.io/assets/social/og/2026-05-03_the_honest_column.png
tags: philosophy, crm, data-integrity, revops, agent828, lead-action-engine, follow-up-date

---

# The honest column: making follow_up_date derive from facts

There is a class of CRM bug that is not a bug in the code. It is a bug in the design.

The code works exactly as written. The data is wrong. And the wrongness accumulates quietly over time until someone opens an account and sees a follow-up date from three weeks ago, stares at it for a moment, and thinks: "is this right?"

It is not right. But nobody touched anything. Nothing broke. The column just drifted.

## Before: the view-layer patch

`Leads.follow_up_date` was being set by the Lead Action Engine when a lead was created or classified. Then it stopped being updated. Real activity — meetings, emails, status changes — did not write back to the column. The column reflected the initial classification, not the current state of the relationship.

The Accounts list derived "Next Touch" at read-time from the nearest future meeting across linked leads, falling back to `follow_up_date` only when there was no meeting. This is a view-layer patch. It makes the UI look right while the underlying data is wrong.

Brett caught it immediately after the accounts snapshot shipped. Lauren's account showed "2026-04-17 (5d overdue)" even though a meeting was scheduled for that day at 1pm and an email had gone out 9 hours earlier. The column had not been touched since the original classification.

The BACKLOG entry captured it cleanly:

> **`Leads.follow_up_date` stays honest on its own** -- it advances automatically when real activity happens (outbound email sent, meeting logged, status change), so the Accounts snapshot never shows a stale follow-up again. _Added: 2026-04-22. Revisit when: more than one account with no upcoming meeting drifts visibly stale in the Accounts list before anyone notices._

## The philosophy of deferred versus computed

Here is the question the entry doesn't answer: **should `follow_up_date` be stored or derived?**

Stored means you write it on every activity event. It's a persistent fact. It can be queried directly without a join. It's accurate until the next event doesn't write it.

Derived means you compute it at read-time from the fact table. It's always correct. But you're paying for the computation on every read. And the computation is hidden from anyone who queries the column directly.

The read-time derivation (the view-layer patch) won the performance argument. It won the "always correct" argument. But it lost the "honest data everywhere" argument. Anyone who queried `leads.follow_up_date` directly — in a report, in an export, in an /AEbrief query — saw the stale value.

The write-time fix wins the "honest everywhere" argument. When real activity lands, the column gets recomputed. Not patched. Recomputed from facts.

## RecomputeFollowUpDate

The fix is a function called `recomputeFollowUpDate(leadId)`. The logic:

1. If the lead is closed or lost → null (closed leads don't have follow-up dates)
2. If there's a future meeting on the account → that meeting's date (meeting wins)
3. Else → last touch date + 3 days

Three cases. Derived from three categories of facts. No magic constants except the 3-day default, which reflects a real operating assumption: if nothing else is scheduled, check in within 3 days.

This runs at the tail of the Lead Action Engine on the `activity_edit` trigger (phase N). It runs when a meeting is logged. It will run on outbound email send when that path is extended.

The column stops being a fossil. It becomes a computed fact that reflects the current state of the relationship.

## The dedupe-entities connection

The same session surfaced a different version of the same pattern in the lake.

Entities were drifting in from enrichment with multiple types for the same canonical name. `Asheville` existed as both `neighborhood` and `organization`. `North Carolina` existed as `landmark`, `organization`, and `neighborhood`. The schema's `UNIQUE(canonical_name, type)` index permitted this — it only enforces uniqueness per (name, type) pair, not per name.

The enrichment prompt had been inconsistent. The lake had multiple rows representing the same real-world thing, with different types, different relevance scores, no clear winner.

`Dedupe-entities.ts` is the planned fix: a one-time audit that lists every canonical name with more than one type, applies a precedence rule (landmark > neighborhood > organization for geographies), merges the lower rows into the survivor carrying their `source_item_ids` and `aliases`, and tightens the enrichment prompt with pinned examples.

Same pattern. Different table. Data that was written multiple times under different assumptions, now inconsistent, and the system can't tell which version is right.

**The database lies when nobody owns the recompute.**

## Why this matters for SDRs and RevOps

Every CRM has this problem at scale.

Follow-up dates that nobody refreshes. Contact records that reflect the qualification call from six months ago. Account stages that haven't been touched since the deal closed. The columns exist. The data is wrong. The reports are wrong. The forecasts are wrong. People add "last-verified" fields and "as of" notes to patch the thing they should have fixed at the write layer.

The fix is always the same: find the facts. Define the recompute rule. Fire the recompute whenever a relevant fact changes.

That is not a data engineering project. It is a design decision.

## Your CRM lies because nobody owns the recompute

The code is not broken. The design assumed someone would keep the column current. Nobody did. Nobody could. Activity volume is too high. The assumptions change too often.

The recompute needs to be a function that fires automatically when the facts change. Not a human process. Not a nightly batch. A real-time write that happens whenever a meeting is logged, an email goes out, a status changes.

The column is honest when the system owns it. The system owns it when the recompute is wired to the write path.

---

*Screenshots to add: Accounts list with Next Touch column showing "mtg today 1pm" vs stale follow_up_date comparison, BACKLOG.md entry with trigger condition highlighted*

## Distillation

A column is a claim. "This is the follow-up date." if the system doesn't keep that claim current, the column is a lie. The fix is not a better query. It's a recompute that fires whenever the underlying facts change.

* * *

Shipped: `recomputeFollowUpDate` logic (closed→null; nearest meeting; else last-touch + 3d), wired to Lead Action Engine `activity_edit` trigger, BACKLOG entry documenting the trigger condition and the `dedupe-entities.ts` follow-up. V0.3.52 + audit session 2026-05-03.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-05-03_the_honest_column.html).*