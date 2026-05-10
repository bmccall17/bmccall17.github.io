---
title: "the context lake"
date: 2026-03-19T08:00:00
state: "shipped"
tags: [agent828, context-lake, ai-iteration, agentic, claude-code, shipped]
series: "agent828-build-arc"
next_experiment: "per-entry OG images with content-specific pictograms → shipped as ADR-0018"
---

# the context lake

## the problem

i've been building the context lake for the team at agent828 — a tactical AI services team of devloper mercenaries who are building agents and tools for better development. the core application of this context lake is an autonomous marketing agent that scrapes RSS feeds, checks weather, looks at trends, and generates social posts spanning bluesky and x (twitter), routing them through a discord approval queue before publishing.

but there's a gap. LLMs are inherently stateless amnesiacs. you can give them a massive system prompt about "tone" and "brand", but if you want the agent to actually feel *alive*, it needs to remember what it's talked about recently. it needs to know what topics have momentum, what entities it just mentioned yesterday, what post templates are performing best, and what words i told it never to use again.

so the question became: how do you give an autonomous agent an evolving memory without bloating the context window or hallucinating?

## what i built

a **context lake**. backed by a local SQLite database (`agent.db`) and a typescript ingestion engine. it has five distinct currents:

- **entities** — proper nouns, people, tools, concepts. things extracted from scrapers. they get upserted and track how many times they've been mentioned.
- **topic clusters** — grouped themes. they have *momentum*. a topic that gets hit multiple times rises in relevance. if it isn't touched for days, a decay function drops it. stale topics get actively archived.
- **preferences** — the operator override. *boosts* (things to lean into), *blocks* (words to never say), and *style notes*. a living style guide.
- **performance** — the feedback loop. the lake tracks every post generated, approved, or rejected. it calculates approval rates per template type.
- **identity** — point-in-time snapshots of the agent's current dual persona ("Grey" civilian vs "Green" tactical).

then i built an internal `context-builder.ts` that acts as the query layer. before the LLM generates a post, the builder queries the lake: give me 8 relevant entities, 10 high-momentum topics, the active boosts/blocks, and the performance hints for this specific template.

## the mess

it started as hardcoded prompts. a massive string of instructions. the problem with hardcoded prompts is that they are brittle and static. if a post does well, the prompt doesn't know. if the agent overuses the word "synergy," the only way to stop it is to manually edit code.

i was also doing something unusual: trying to run this entirely within a "red-green-refactor loop" using claude code, pushing directly to `main` to trigger cloud build deployments to cloud run. the context for the *codebase* was handled by `.claude/CLAUDE.md`, but the context for the *data* was nowhere.

the first version of the agent was just reading raw RSS feeds and blasting them to gemini. it was generating repetitive, soulless content. then i realized: an agent without a governed data layer isn't an agent. it's just a text spinner. it needed an aggregation layer where data from multiple sources is distilled into grounded context.

so i built the lake.

## glimmers

the moment it clicked: i looked at the generation logs after seeding the lake. the builder pulled in a high-momentum topic, matched it against a fresh scraped item, avoided two blocked terms, and appended a performance hint telling the LLM that its current template had a 40% rejection rate so it needed to try a different angle.

it generated a post that didn't just summarize an article — it synthesized it with what the agent had "been thinking about" lately.

the system is doing what i designed it to do: keeping the lake alive so the agent can focus on generation instead of relying on me to update its worldview.

## the decay mechanism

the most important part of a lake isn't what flows in; it's what flows out.

i asked claude to implement a `decayEntityRelevance` function. the answer was beautiful in its simplicity:

> a cron job that runs every 24 hours. it touches every entity and topic, multiplying its relevance or momentum score by a decay factor (e.g., 0.9). if a score drops below a threshold, it gets archived.

without decay, a context lake becomes a context swamp. filled with everything you've ever mentioned, competing equally for the LLM's attention. with decay, only the most relevant, recent, and highly-reinforced concepts survive to be passed into the context window.

## distillation

what i'm learning is that autonomous agents are fundamentally an information management problem.

the answer, it turns out, is layers. raw scraped facts in one place. momentum tracking in another. manual operator boundaries overriding them both. a system that automatically ages out stale data. and a dynamic context builder that pulls just what is needed for the prompt.

the agent isn't perfect yet. tuning the decay rates is still an art. but the context lake means the agent knows exactly what it knows, exactly what it shouldn't say, and exactly what's working.

next up: migrating the agent from local docker compose to google cloud run so the lake can flow 24/7.

the lake is ready for it.
