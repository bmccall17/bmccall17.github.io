---
title: "messy release v0.1.8: the system that publishes itself"
date: 2026-05-09
state: shipped
tags: [darketype, agent828, hashnode, series, seo, weblog, ship-log]
series: "darketype-devlog"
og_image:
next_experiment: "build the repoptics and leuchtturm series pages to match the CRM arc depth"
---

# messy release v0.1.8: the system that publishes itself

there's a kind of recursive satisfaction that only happens when the tool you built is the tool that explains the tool you built.

this sprint was ostensibly about documenting the agent828 build arc. five technical posts. dates backfilled to match when the actual work happened. screenshots fabricated where real ones couldn't be used. the usual.

but somewhere in the middle of wiring up hashnode series, automating SEO metadata, and building a clickable series filter on the weblog index — i realized: the publishing system had become a product. not a side project. not glue code. a product with a clear interface, a deployment pipeline, and enough self-knowledge to push its own SEO descriptions without asking anyone what to write.

## what shipped

five posts in the agent828 build arc:

1. **make the system explain itself** — the architecture knowledge graph that narrates its own health in real time
2. **the CRM that drafts its own follow-ups** — three weeks, one AE, meeting transcripts as first-class artifacts
3. **the honest column** — why `follow_up_date` should be derived from facts, not stored as a guess
4. **how we stopped our content engine from repeating itself** — four guardrails, one entity cooldown log
5. **the backlog is a feature** — BACKLOG.md as trigger-based methodology, not a priority queue

nine custom UI mockups to illustrate the posts. all fabricated, all technically accurate. no client data exposed.

## the infrastructure that grew around it

- **hashnode series** — three of them. `crm-agent828`, `agent828-build-arc`, `darketype-devlog`. each post assigned. each series has a description and a meta description ready to paste.
- **seo automation** — `seo_title`, `seo_description`, and `og_image` now write themselves from the entry content and push to hashnode on every `npm run hashnode:sync`. zero dashboard work.
- **series filter on the index** — clicking `[crm]` or `[agent828]` filters the weblog list in place. `?series=crm` in the URL bookmarks the view. `[× clear]` resets it.
- **series tag on individual posts** — after the `hashnode ↗` link, a pill shows which series the post belongs to. clicking it opens the hashnode series page.
- **expanded publishable states** — `mess`, `frustrated`, `optimistic`, `seed`, `debugging`, `broken` all publish to hashnode now. eleven previously-missing posts went live.
- **`/entry` workflow rewrite** — full documentation of states, series slugs, image paths, and SEO automation. the workflow now tells you everything the system knows.

## the thing i didn't expect

the series filter was a five-minute idea. "tag should be clickable." it turned into: URL params, re-render persistence, active state glow, a filter bar with dismiss. not because anyone asked. because once you start pulling the thread, the right answer is obvious.

that's the real pattern from this sprint. every feature revealed the next one. the system wanted to be coherent. i just followed it.
