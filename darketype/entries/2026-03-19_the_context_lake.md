---
title: "the context lake"
date: 2026-03-19T08:00:00
state: "shipped"
tags: [port-io, context-lake, interview-prep, ai-iteration, agentic, claude-code, shipped]
---

# the context lake

## the problem

i'm interviewing for a technical success manager role at a company whose product i genuinely love. port.io — an agentic internal developer portal. the kind of tool i would have killed for at BTU when i was stitching together usage dashboards from six different systems with duct tape and optimism.

but there's a gap. my background is VR, not devops. i know what kubernetes *is*. i've never deployed a cluster. i understand terraform conceptually. i've never written an HCL file. the job description says "strong technical background in DevOps, platform engineering, cloud-native" and i felt that line in my chest the first time i read it.

so the question became: how do you close a knowledge gap fast enough to be credible in a high-stakes interview process — without faking it?

## what i built

a **context lake**. three layers:

- **knowledge/** — factual reference docs about port, organized by domain (product, business, customers, people, technical). facts only. no framing.
- **playbook/** — interview prep, SOAR stories, objection handling, tactical coaching. the framing layer. how to talk about the facts.
- **sources/** — raw transcripts from every call, PDFs, data files. the receipts.

twelve knowledge documents. eight playbook documents. seven call transcripts. a manifest tracking freshness. a changelog tracking what was learned and when.

then i built an operating system on top of it — four slash commands in claude code:

- `/ingest` — drop a transcript or paste notes, it extracts facts into the right knowledge docs, updates the manifest, appends the changelog, flags playbook impacts
- `/briefme` — status report. what's fresh, what's stale, what to focus on next
- `/query` — ask a question, get a cited answer from the knowledge layer. inline citations, cross-references, honest about gaps
- `/review` — deep health check. staleness, inconsistencies, duplication, missing coverage

the whole thing lives in a project directory with a `.claude/CLAUDE.md` that teaches claude how to navigate it. maintenance protocols baked in: auto-cite sources, flag stale data, suggest `/ingest` when new intel appears, keep the manifest current, respect the layer boundaries.

## the mess

it started as a google doc. then three google docs. then a sprawl of notes across notion, obsidian, and my desktop. the problem with interview prep is that it's accretive — every call adds context, every research session adds facts, and if you don't have a system, the most recent thing you learned overwrites everything that came before it.

i was also doing something unusual: i had an internal champion. sam, a current TSM at port, took three calls with me over three weeks. each call was dense — product deep dives, interview coaching, competitive intel, role details. without extraction, those transcripts were just walls of text. with extraction, they became the foundation of everything i knew.

the first version of the knowledge layer was just me copying and pasting. then i realized: this is exactly what port's context lake does for engineering organizations. aggregate data from multiple sources into a single governed layer so that AI agents (in this case, claude) can make grounded decisions instead of hallucinating.

so i built mine the same way.

## glimmers

the moment it clicked: i ran `/briefme` for the first time and it told me three playbook docs were stale, that i had no profiles for the panelists i'd be meeting, and that my preparation plan still referenced the hiring manager round as "NEXT" even though i'd already completed it. it caught things i would have missed.

then this morning — an email from zoë. i'm advancing. but the format changed. it's not a panel chat anymore. it's a take-home assignment with a demo environment and a 45-60 minute presentation to two TSMs and a solutions architect. i pasted the email, ran `/ingest`, and within seconds it had updated the interview status, captured the demo credentials, flagged the missing assignment PDF, and noted that my panel game-day reminders needed supplementing for a presentation format.

the system is doing what i designed it to do: keeping the lake alive so i can focus on the work instead of the bookkeeping.

## the al interview

al sharma. head of technical success, americas. snyk, harness, hashicorp background. direct. the kind of person who tells you exactly where you stand.

i asked him about my gap — the devops tools i haven't touched. his answer surprised me:

> "knowing the platform itself is the key, everything else i don't bother too much about. terraform is a legacy SDLC tool that was relevant for devops ten years ago. we don't know if it's going to be relevant two years from now."

he called my take on agentic engineering "the best, most base take i've heard in a while." he valued the founder story, the product instinct, the fact that i was already using port and writing about it. his one concern: enterprise ambiguity at scale — managing federated customers, politics, personas. i addressed it with founder experience. he moved me forward.

the thing he said that stuck: "you check a lot of those boxes. as a person 101, i have no concern."

## distillation

what i'm learning is that interview prep is an information management problem. the same one port solves for engineering orgs. the same one every CSM faces when onboarding a new enterprise customer: how do you take a firehose of context from multiple sources and turn it into something you can actually act on?

the answer, it turns out, is layers. facts in one place. framing in another. raw materials preserved. a system that tells you when things go stale. and an AI that can navigate the whole thing because you taught it the structure.

the gap isn't closed yet. kubernetes is still conceptual for me. but the context lake means i know exactly what i know, exactly what i don't, and exactly where to look when i need to close the distance.

next up: the assignment PDF. a demo environment to build in. a presentation to design. and maybe a prep call with al before i start.

the lake is ready for it.
