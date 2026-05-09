---
title: "The backlog is a feature"
datePublished: 2026-05-09T19:45:41.132Z
cuid: cmoyr7m6k000202jog1ax3qcr
slug: 2026-05-09-the-backlog-is-a-feature
canonical: https://bmccall17.github.io/darketype/weblog/2026-05-09_the_backlog_is_a_feature.html
cover: https://bmccall17.github.io/assets/social/og/2026-05-09_the_backlog_is_a_feature.png
tags: methodology, operating-system, workflow, backlog, orchestrator, agent828, outcomes-over-solutions

---

# The backlog is a feature

I do not have a roadmap.

I have a `docs/BACKLOG.md` file with a specific operating philosophy baked into its format, and it works better than any roadmap i have ever maintained.

Here is how it works and why the design decisions matter.

## The format

Every entry in the backlog follows this pattern:

> **Outcome** — what success looks like. _Added: YYYY-MM-DD. Revisit when: \<trigger\>._

Three required fields. No more.

- **The outcome**, not the solution
- **The date it was added**
- **The trigger that should fire it**

That's it. No priority numbers. No sprint assignments. No story points. No estimate of effort. No field for "who owns this." no "depends on" chain.

Deliberately stripped down.

## Why outcomes, not solutions

When you write a backlog entry as a solution, you're encoding an assumption: that you understand the problem well enough today to know how to solve it. And you might. But six weeks from now, the codebase may have solved the outcome a different way, or the problem may have changed shape, or the approach you wrote down may have been overtaken by a dependency you didn't know existed.

Outcomes age better.

"**`Leads.follow_up_date` stays honest on its own**" — that is the outcome. The column is accurate. The solution in 2026-04-22 might have been "add a trigger on activity insert." the solution in 2026-05-03 turned out to be `recomputeFollowUpDate` fired from the Lead Action Engine. The outcome stayed true the whole time. The solution was allowed to be whatever was right when we got there.

If the entry had said "add an ON INSERT trigger to update follow_up_date" we would have built the wrong thing.

## Why dated triggers

"Revisit when" is the load-bearing phrase.

> Revisit when: more than one account with no upcoming meeting drifts visibly stale in the Accounts list before anyone notices

That trigger fired on 2026-04-22 when Lauren's account showed "5d overdue" despite a meeting happening that day. The backlog entry had been added that same day. Trigger fired immediately.

> Revisit when: the AdminPanel chunk grows above the 500kB warning threshold, or a dedicated hardening window opens

That trigger hasn't fired. The entry sits. It will wait until the condition is met.

The trigger replaces priority. You don't have to decide "is this high priority or medium priority?" you decide "what has to be true in the world before this is worth picking up?" that is a harder question to answer, but it is the right question.

## The header instruction

The file opens with:

> Each entry is older than a few months, re-read it with fresh eyes before acting — the codebase may have already solved the outcome another way.

This is not boilerplate. It is an active instruction.

Two examples from the may 3 session: the dead-letter admin routes (`server/admin-leads.ts`, `server/admin-contacts.ts`) had been deprecated by the proxy migration. The backlog had a note. Before acting on it, we checked — both files still existed, still weren't imported anywhere. The note was still valid. But if we had just executed the backlog entry without re-reading, we might have deleted something that had been given a new purpose we didn't know about.

Re-reading with fresh eyes is not a courtesy. It's how you avoid doing work that the system already did differently.

## The operating levels

The BACKLOG is one of three operational artifacts:

**Level 1 — daily work**: what are we actually shipping right now? Tasks, PRs, current sprint items.

**Level 2 — near horizon**: what is coming up in the next 1-3 sessions? The BACKLOG entries with fired triggers.

**Level 3 — far horizon**: everything else in the BACKLOG. Waiting for its trigger. Not competing for attention.

Most planning tools conflate these three levels. Everything goes in the same list, sorted by some combination of priority and estimate that starts decaying the moment it's written.

The BACKLOG stays at level 3 until a trigger fires. Then it jumps to level 2. Then we schedule it into level 1.

## The /orchestrator workflow

The slash-command `/orchestrator` is how we run the level-3 → level-2 promotion formally.

Before a new sprint starts, `/orchestrator` does a structured sweep: reads the BACKLOG, reads the recent SHIP_LOG, identifies what has shipped, identifies what triggers have fired, surfaces the entries that are now actionable, and proposes an ordering for the session.

The output is not a roadmap. It is a prioritized snapshot of what is most alive right now, derived from what has actually happened.

![/Orchestrator terminal output showing 3 fired triggers and 3 dormant entries with trigger conditions](https://bmccall17.github.io/darketype/entries/media/2026-05-09_backlog_feature/orchestrator_output.png)

As of today's session, `/orchestrator` surfaced: the AdminPanel chunk warning (not yet triggered), the dead-code admin routes (triggered, scheduled), the `follow_up_date` honesty fix (triggered, shipped). Each one earned its way into the session.

## What this is not

It is not a kanban board. Tickets don't move through columns.

It is not a sprint board. There are no sprints.

It is not a roadmap. There is no date attached to any entry.

It is a file with outcomes, dates, and triggers. It is checked before every session and updated at the end of every session when new deferrals are recorded.

The administrative overhead is about 10 minutes per session. The payoff is that three months of deferred work can be resurface in a single read without any context-loading ceremony.

## Worked example: this session

Today's session started with a `/orchestrator` sweep. The triggers that had fired:

1. **Entity dedup** — the may 3 audit surfaced cases of Asheville as both `neighborhood` and `organization`. Trigger: "a duplicate causes visible weirdness in a draft / brief / topic-cluster." fired: yes, during the anti-repetition sprint.

2. **AdminPanel chunk** — at 501.39kB, 1.4kB over the 500kB warning threshold. Trigger: "warning fires." fired: yes, in v0.3.64. Backlog entry added.

3. **Dead-code admin routes** — `server/admin-leads.ts` and `server/admin-contacts.ts` confirmed dead. Trigger: "audit window opens." fired: today. Scheduled for removal.

None of these were on a roadmap. All of them earned their way into the session because reality created the condition that the backlog entry named.

## We don't have a roadmap. We have a backlog with triggers.

The roadmap tells you what you plan to do. The backlog tells you what you're waiting to be allowed to do.

The roadmap requires you to estimate now. The backlog lets you decide later, when you know more.

The roadmap gets stale. The backlog gets better — because every session that passes without a trigger firing is a session that correctly deferred the work.

If your backlog is a list of things you feel guilty about not doing, it's the wrong kind of backlog.

If it's a list of outcomes with conditions for action, it is a feature.

---

*Screenshots to add: BACKLOG.md open in editor with "revisit when" trigger highlights, /orchestrator output showing fired vs dormant triggers, SHIP_LOG table of contents showing the shipped arc*

## Distillation

A backlog is not a to-do list. It is a set of promises that fire when the world is ready. The trigger replaces the priority score. The outcome replaces the solution. The date is not a deadline — it's a timestamp that tells you how long you've been waiting.

* * *

Currently operating: `docs/BACKLOG.md` with 8 entries across 4 categories (reliability, pipeline quality, code quality, operator control). `/Orchestrator` workflow in `.claude/commands/`. Today's session: 2 triggered entries shipped (follow_up_date + entity dedup planning), 1 new entry added (AdminPanel chunk budget). Active as of 2026-05-09.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-05-09_the_backlog_is_a_feature.html).*