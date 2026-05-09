---
title: "the backlog is a feature"
date: 2026-05-09
state: shipped
tags: [agent828, methodology, backlog, orchestrator, operating-system, workflow, outcomes-over-solutions]
series: "agent828-build-arc"
og_image:
next_experiment: "run /orchestrator at the start of every new session to resurface the right priority"
---

# the backlog is a feature

i do not have a roadmap.

i have a `docs/BACKLOG.md` file with a specific operating philosophy baked into its format, and it works better than any roadmap i have ever maintained.

here is how it works and why the design decisions matter.

## the format

every entry in the backlog follows this pattern:

> **Outcome** — what success looks like. _Added: YYYY-MM-DD. Revisit when: \<trigger\>._

three required fields. no more.

- **the outcome**, not the solution
- **the date it was added**
- **the trigger that should fire it**

that's it. no priority numbers. no sprint assignments. no story points. no estimate of effort. no field for "who owns this." no "depends on" chain.

deliberately stripped down.

## why outcomes, not solutions

when you write a backlog entry as a solution, you're encoding an assumption: that you understand the problem well enough today to know how to solve it. and you might. but six weeks from now, the codebase may have solved the outcome a different way, or the problem may have changed shape, or the approach you wrote down may have been overtaken by a dependency you didn't know existed.

outcomes age better.

"**`leads.follow_up_date` stays honest on its own**" — that is the outcome. the column is accurate. the solution in 2026-04-22 might have been "add a trigger on activity insert." the solution in 2026-05-03 turned out to be `recomputeFollowUpDate` fired from the Lead Action Engine. the outcome stayed true the whole time. the solution was allowed to be whatever was right when we got there.

if the entry had said "add an ON INSERT trigger to update follow_up_date" we would have built the wrong thing.

## why dated triggers

"revisit when" is the load-bearing phrase.

> Revisit when: more than one account with no upcoming meeting drifts visibly stale in the Accounts list before anyone notices

that trigger fired on 2026-04-22 when Lauren's account showed "5d overdue" despite a meeting happening that day. the backlog entry had been added that same day. trigger fired immediately.

> Revisit when: the AdminPanel chunk grows above the 500kB warning threshold, or a dedicated hardening window opens

that trigger hasn't fired. the entry sits. it will wait until the condition is met.

the trigger replaces priority. you don't have to decide "is this high priority or medium priority?" you decide "what has to be true in the world before this is worth picking up?" that is a harder question to answer, but it is the right question.

## the header instruction

the file opens with:

> each entry is older than a few months, re-read it with fresh eyes before acting — the codebase may have already solved the outcome another way.

this is not boilerplate. it is an active instruction.

two examples from the may 3 session: the dead-letter admin routes (`server/admin-leads.ts`, `server/admin-contacts.ts`) had been deprecated by the proxy migration. the backlog had a note. before acting on it, we checked — both files still existed, still weren't imported anywhere. the note was still valid. but if we had just executed the backlog entry without re-reading, we might have deleted something that had been given a new purpose we didn't know about.

re-reading with fresh eyes is not a courtesy. it's how you avoid doing work that the system already did differently.

## the operating levels

the BACKLOG is one of three operational artifacts:

**level 1 — daily work**: what are we actually shipping right now? tasks, PRs, current sprint items.

**level 2 — near horizon**: what is coming up in the next 1-3 sessions? the BACKLOG entries with fired triggers.

**level 3 — far horizon**: everything else in the BACKLOG. waiting for its trigger. not competing for attention.

most planning tools conflate these three levels. everything goes in the same list, sorted by some combination of priority and estimate that starts decaying the moment it's written.

the BACKLOG stays at level 3 until a trigger fires. then it jumps to level 2. then we schedule it into level 1.

## the /orchestrator workflow

the slash-command `/orchestrator` is how we run the level-3 → level-2 promotion formally.

before a new sprint starts, `/orchestrator` does a structured sweep: reads the BACKLOG, reads the recent SHIP_LOG, identifies what has shipped, identifies what triggers have fired, surfaces the entries that are now actionable, and proposes an ordering for the session.

the output is not a roadmap. it is a prioritized snapshot of what is most alive right now, derived from what has actually happened.

as of today's session, `/orchestrator` surfaced: the AdminPanel chunk warning (not yet triggered), the dead-code admin routes (triggered, scheduled), the `follow_up_date` honesty fix (triggered, shipped). each one earned its way into the session.

## what this is not

it is not a kanban board. tickets don't move through columns.

it is not a sprint board. there are no sprints.

it is not a roadmap. there is no date attached to any entry.

it is a file with outcomes, dates, and triggers. it is checked before every session and updated at the end of every session when new deferrals are recorded.

the administrative overhead is about 10 minutes per session. the payoff is that three months of deferred work can be resurface in a single read without any context-loading ceremony.

## worked example: this session

today's session started with a `/orchestrator` sweep. the triggers that had fired:

1. **entity dedup** — the may 3 audit surfaced cases of Asheville as both `neighborhood` and `organization`. trigger: "a duplicate causes visible weirdness in a draft / brief / topic-cluster." fired: yes, during the anti-repetition sprint.

2. **AdminPanel chunk** — at 501.39kB, 1.4kB over the 500kB warning threshold. trigger: "warning fires." fired: yes, in v0.3.64. backlog entry added.

3. **dead-code admin routes** — `server/admin-leads.ts` and `server/admin-contacts.ts` confirmed dead. trigger: "audit window opens." fired: today. scheduled for removal.

none of these were on a roadmap. all of them earned their way into the session because reality created the condition that the backlog entry named.

## we don't have a roadmap. we have a backlog with triggers.

the roadmap tells you what you plan to do. the backlog tells you what you're waiting to be allowed to do.

the roadmap requires you to estimate now. the backlog lets you decide later, when you know more.

the roadmap gets stale. the backlog gets better — because every session that passes without a trigger firing is a session that correctly deferred the work.

if your backlog is a list of things you feel guilty about not doing, it's the wrong kind of backlog.

if it's a list of outcomes with conditions for action, it is a feature.

---

*screenshots to add: BACKLOG.md open in editor with "revisit when" trigger highlights, /orchestrator output showing fired vs dormant triggers, SHIP_LOG table of contents showing the shipped arc*

## distillation

a backlog is not a to-do list. it is a set of promises that fire when the world is ready. the trigger replaces the priority score. the outcome replaces the solution. the date is not a deadline — it's a timestamp that tells you how long you've been waiting.

* * *

currently operating: `docs/BACKLOG.md` with 8 entries across 4 categories (reliability, pipeline quality, code quality, operator control). `/orchestrator` workflow in `.claude/commands/`. today's session: 2 triggered entries shipped (follow_up_date + entity dedup planning), 1 new entry added (AdminPanel chunk budget). active as of 2026-05-09.
