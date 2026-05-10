---
title: "How we stopped our content engine from repeating itself"
slug: 2026-05-08-how-we-stopped-our-content-engine-from-repeating-itself
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-05-08_how_we_stopped_our_content_engine_from_repeating_itself.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-05-08_how_we_stopped_our_content_engine_from_repeating_itself.png"
seo_title: "How we stopped our content engine from repeating itself"
seo_description: "there is a specific failure mode in AI content pipelines that nobody talks about enough. it is not hallucination. it is not tone. it is entity fixatio"
og_image: "https://bmccall17.github.io/assets/social/og/2026-05-08_how_we_stopped_our_content_engine_from_repeating_itself.png"
tags: agent828, content-pipeline, anti-repetition, entity-cooldown, topic-momentum, vip-tier, domain-routing
seriesSlug: agent828-build-arc
---

# How we stopped our content engine from repeating itself

There is a specific failure mode in AI content pipelines that nobody talks about enough.

It is not hallucination. It is not tone. It is **entity fixation** — where the model latches onto the same three companies, the same four names, the same two topics, and just keeps going back to them.

We hit it. Optimist Ventures showed up in 10 of 15 consecutive INTEL_BRIEFs. The same organization, same framing, slightly different angle, post after post. It was technically correct. It was also useless. Nobody reads a content feed to see the same name rotated.

Here is the four-guardrail system that killed the pattern.

## Guardrail 1: domain-routed scraper retrieval

The root cause of the repetition was not the model. It was the retrieval. Every template was pulling from the same undifferentiated pool of scraped content, and some sources just had more volume than others.

The fix: `getUnusedScrapedItemsByDomain(domain, limit)`. Scraped items now carry a `content_domain` — wisdom (thought leadership, frameworks, research) or regional (local tech, AVL, meetups, community). Templates declare a `domainAffinity` — wisdom-only, regional-only, or hybrid (3 wisdom + 2 regional).

The ordering is `COALESCE(published_at, created_at) DESC` so manual research items with null `published_at` don't get sunk by SQLite's null-last semantics. Small detail. Real fix.

Templates that should pull from the AI thought-leader corpus now can't accidentally pull a Mountain Xpress local letter to the editor. Templates that should root in the community can't get displaced by Anthropic blog posts.

![Content queue showing alternating wisdom and regional entries across 8 posts — no entity repeats, cooldown active on 3 entities](https://bmccall17.github.io/darketype/entries/media/2026-05-08_content_engine/content_queue_diverse.png)

## Guardrail 2: recent-posts dampener

This was the strongest single fix.

`GetRecentPublishedContent(platform, sinceHours, limit)` returns the last 12 posts on the same platform inside a 72-hour window. `BuildPrompt` renders them as a `<recent_posts>` block with the instruction:

> "Do not echo their entities, named subjects, headlines, hashtags, or framings — find a different angle."

The model sees its own recent output and is explicitly instructed to route around it. This is a prompt-level constraint, not a retrieval filter, which means it works even when the repetition would come from within-session context that a pure database filter can't see.

If you have one guardrail to add to your content pipeline, it is this one.

## Guardrail 3: entity cooldown

On the lake side, `getRelevantEntities` and `getTopEntities` now consult `getRecentlyMentionedEntityIds(72)` before returning candidates. That function joins `content_queue` published in the last 72 hours against entity canonical names and aliases, and demotes any matched entity from the candidate set.

Backfill protection: if the cooldown filter would drop the result below 3 entities, it relaxes and backfills from the cooled-down set. The engine never gets stuck with zero context.

The effect: an entity that just appeared in a published post is a weak candidate for the next one. It has to earn its way back into rotation.

![Pipeline log showing entity cooldown filter in action — 4 entities suppressed, Yoshua Bengio selected as VIP clear candidate](https://bmccall17.github.io/darketype/entries/media/2026-05-08_content_engine/entity_cooldown_log.png)

## Guardrail 4: recency-weighted topic momentum

This one is subtle but compounding.

Topic clusters were being ranked by raw momentum score. A regional cluster that had been active for months could reliably outrank a fresh wisdom cluster just seeded from new research. The wisdom cluster would never surface.

`GetTopicsByMomentum` now re-ranks by `momentum × exp(-hoursSinceLastActivity / 168 × ln 2)`. One-week half-life. A freshly-seeded wisdom cluster at momentum 0.5 outranks an older regional cluster at momentum 1.0 with stale `last_activity`.

Recency wins. The pipeline surfaces what is actually alive, not what was alive once and coasted.

## The counterweight: VIP tier

Four guardrails designed to suppress repetition. One mechanism designed to allow it when it matters.

Some entities you want to surface repeatedly. AI safety researchers. Documentary subjects. Named thought leaders with active publishing. These are not sources of repetition — they are the signal.

`Metadata.vip = true` makes an entity exempt from both the weekly relevance-decay sweep and the 90-day prune. VIP entities carry queryable structure: `metadata.tier`, `metadata.camp`, `metadata.ai_doc_2026`, `metadata.podcast_guest`. The lake knows the difference between a source worth returning to and a source the engine got stuck on.

As of v0.3.64, 42 VIP entities are marked — 37 from The AI Doc (2026) cast, 5 from Sinead Bovell's IGQ podcast cohort. Demis Hassabis, Yoshua Bengio, Joy Buolamwini, Renée DiResta, Mustafa Suleyman. These names should appear in the feed. The cooldown mechanics don't apply to them.

## The defunct gate

One more: `isDefunct()`. Entities with `relevance_score ≤ 0` or `metadata.status = 'defunct'` are filtered out of every candidate set, regardless of text matching.

Silicon Dojo AVL was the precipitating case. It shut down on May 6, 2026. Within one session: `relevance_score = 0`, description prefixed with `[DEFUNCT 2026-05-06]`, keyword scrubbed from topic seeds, removed from the knowledge base. The engine now can't recommend a defunct organization because it literally can't see it.

The operator path: set score to zero, add the defunct marker, done. No migration needed.

## What this costs

Four guardrails. One VIP tier. One defunct gate.

The test suite covers: domain routing with COALESCE ordering, recent-posts window filtering, cooldown filter with backfill, min-3 protection. 440/440 Green.

The change that matters most operationally is the recent-posts dampener. It costs one extra DB read per generation. It prevents the pipeline from humiliating itself by saying the same thing twice in the same week.

## If your content keeps writing about the same 5 things

This is why.

The model is not broken. The retrieval is. The pool is biased toward high-volume sources. There's no memory of what was just published. The topics that rank highest rank that way because they ranked highest last time.

The fix is not a better prompt. The fix is a pipeline that actively routes around its own recent outputs.

---

*Screenshots to add: admin content queue showing diverse entities across recent posts, entity cooldown debug log showing demoted candidates, topic momentum re-ranking before/after comparison*

## Distillation

An AI content engine with no memory of what it just published will repeat itself until someone fixes the retrieval. Fix the retrieval before you blame the model.

* * *

Shipped: `getUnusedScrapedItemsByDomain` domain routing, recent-posts dampener, entity cooldown with backfill, recency-weighted topic momentum (one-week half-life), VIP entity tier (42 entities marked), defunct gate, SECURITY_BRIEF wisdom template, 42 VIPs seeded with verified handles. 440/440 Tests. V0.3.64.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-05-08_how_we_stopped_our_content_engine_from_repeating_itself.html).*