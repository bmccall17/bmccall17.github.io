---
title: "The context lake"
datePublished: Thu Apr 16 2026 11:51:36 GMT+0000 (Coordinated Universal Time)
cuid: cmo1f5ckb000702l8edqo3cy0
slug: 2026-03-19-the-context-lake
canonical: https://bmccall17.github.io/darketype/weblog/2026-03-19_the_context_lake.html

---

# The context lake

## The problem

I've been building the context lake for the team at agent828 — a tactical AI services team of devloper mercenaries who are building agents and tools for better development. The core application of this context lake is an autonomous marketing agent that scrapes RSS feeds, checks weather, looks at trends, and generates social posts spanning bluesky and x (twitter), routing them through a discord approval queue before publishing.

But there's a gap. LLMs are inherently stateless amnesiacs. You can give them a massive system prompt about "tone" and "brand", but if you want the agent to actually feel *alive*, it needs to remember what it's talked about recently. It needs to know what topics have momentum, what entities it just mentioned yesterday, what post templates are performing best, and what words i told it never to use again.

So the question became: how do you give an autonomous agent an evolving memory without bloating the context window or hallucinating?

## What i built

A **context lake**. Backed by a local SQLite database (`agent.db`) and a typescript ingestion engine. It has five distinct currents:

- **Entities** — proper nouns, people, tools, concepts. Things extracted from scrapers. They get upserted and track how many times they've been mentioned.
- **Topic clusters** — grouped themes. They have *momentum*. A topic that gets hit multiple times rises in relevance. If it isn't touched for days, a decay function drops it. Stale topics get actively archived.
- **Preferences** — the operator override. *Boosts* (things to lean into), *blocks* (words to never say), and *style notes*. A living style guide.
- **Performance** — the feedback loop. The lake tracks every post generated, approved, or rejected. It calculates approval rates per template type.
- **Identity** — point-in-time snapshots of the agent's current dual persona ("Grey" civilian vs "Green" tactical).

Then i built an internal `context-builder.ts` that acts as the query layer. Before the LLM generates a post, the builder queries the lake: give me 8 relevant entities, 10 high-momentum topics, the active boosts/blocks, and the performance hints for this specific template.

## The mess

It started as hardcoded prompts. A massive string of instructions. The problem with hardcoded prompts is that they are brittle and static. If a post does well, the prompt doesn't know. If the agent overuses the word "synergy," the only way to stop it is to manually edit code.

I was also doing something unusual: trying to run this entirely within a "red-green-refactor loop" using claude code, pushing directly to `main` to trigger cloud build deployments to cloud run. The context for the *codebase* was handled by `.claude/CLAUDE.md`, but the context for the *data* was nowhere.

The first version of the agent was just reading raw RSS feeds and blasting them to gemini. It was generating repetitive, soulless content. Then i realized: an agent without a governed data layer isn't an agent. It's just a text spinner. It needed an aggregation layer where data from multiple sources is distilled into grounded context.

So i built the lake.

## Glimmers

The moment it clicked: i looked at the generation logs after seeding the lake. The builder pulled in a high-momentum topic, matched it against a fresh scraped item, avoided two blocked terms, and appended a performance hint telling the LLM that its current template had a 40% rejection rate so it needed to try a different angle.

It generated a post that didn't just summarize an article — it synthesized it with what the agent had "been thinking about" lately.

The system is doing what i designed it to do: keeping the lake alive so the agent can focus on generation instead of relying on me to update its worldview.

## The decay mechanism

The most important part of a lake isn't what flows in; it's what flows out.

I asked claude to implement a `decayEntityRelevance` function. The answer was beautiful in its simplicity:

> A cron job that runs every 24 hours. It touches every entity and topic, multiplying its relevance or momentum score by a decay factor (e.g., 0.9). If a score drops below a threshold, it gets archived.

Without decay, a context lake becomes a context swamp. Filled with everything you've ever mentioned, competing equally for the LLM's attention. With decay, only the most relevant, recent, and highly-reinforced concepts survive to be passed into the context window.

## Distillation

What i'm learning is that autonomous agents are fundamentally an information management problem.

The answer, it turns out, is layers. Raw scraped facts in one place. Momentum tracking in another. Manual operator boundaries overriding them both. A system that automatically ages out stale data. And a dynamic context builder that pulls just what is needed for the prompt.

The agent isn't perfect yet. Tuning the decay rates is still an art. But the context lake means the agent knows exactly what it knows, exactly what it shouldn't say, and exactly what's working.

Next up: migrating the agent from local docker compose to google cloud run so the lake can flow 24/7.

The lake is ready for it.