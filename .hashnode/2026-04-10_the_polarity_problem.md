---
title: "The polarity problem"
slug: 2026-04-10-the-polarity-problem
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-04-10_the_polarity_problem.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-04-10_the_polarity_problem.png"
seo_title: "The polarity problem"
seo_description: "repOptics has seven scoring categories. six of them are named after a thing you want more of: decisions, architecture, governance, delivery,..."
og_image: "https://bmccall17.github.io/assets/social/og/2026-04-10_the_polarity_problem.png"
tags: repoptics, scoring, ux, naming, vocabulary, design-debt
seriesSlug: darketype-devlog
---

# The polarity problem

## A number that fights its own label

RepOptics has seven scoring categories. Six of them are named after a thing you want more of: decisions, architecture, governance, delivery, dependencies, security. The seventh was named after a thing you want less of.

It was called **bloat**.

It scored 0 to 100, like every other category. 100 Meant clean. 0 Meant the repo was carrying so much dead weight you could feel the drag every time you cloned it.

So what did `bloat: 11/100` mean?

I could not tell. I sat in my own report and looked at it and i could not tell. Eleven could be "11% bloated, almost spotless" or "11/100 cleanliness, this is a swamp." both readings were defensible. Only one was right. The label and the number were pulling in opposite directions and the reader had to do the disambiguation work in their head every single time.

Every other category in the report had this property: high score = good, low score = bad, label = the good thing. This category had: high score = good, low score = bad, label = **the bad thing**. The polarity flipped under one specific name, and that flip was invisible because the number kept the same shape.

## The moment it broke

The confusion landed twice in the same screenshot session.

First the bloat panel itself. I could not tell if a low score meant my repo had a lot of bloat (bad) or a small amount of bloat (good). The message at the top said "repo drag detected. Dead files, duplicates, or committed artifacts slowing you down." which is unambiguously bad. But the message and the number had to be read together to extract the meaning. The number alone was a riddle.

Then the research page. There is a "common pitfalls" table on `/research` that shows, for every check across the entire lake of scanned repos, what percentage of repos fail that check. So for `bloat-large-files`, a 75% fail rate means "three out of every four scanned repos in the lake have at least one oversized file flagged."

I looked at the column and saw `Bloat — 75%` and immediately read it as "the bloat score is 75 out of 100." it was not. It was a population frequency. A per-repo score and a cross-population fail rate are two completely different mathematical objects, but with the same word sitting next to them in the same orange color, my brain just collapsed them into one thing.

The worst part: this was my own product. I wrote the panel. I defined the column. I still got confused.

If i could not read it, nobody could.

## The search for a better word

The obvious move was to flip the polarity by renaming. Find a word that means "the good state of the file system" and put a 0–100 score under it. High = good. Instinct restored.

I tried four:

- **Lean** — shortest, no overclaim risk. "Lean: 11/100" reads as "barely lean = very bloated." instant.
- **Cleanliness** — most literal. Slightly clinical.
- **Hygiene** — common in eng-speak ("repo hygiene"). Felt right.
- **File efficiency** — clear but two clinical words.

I was leaning hygiene. Before i committed to it i did the small responsible thing and ran a web search on "repo hygiene" to make sure it actually meant what i wanted it to mean.

It did not. Or rather, it meant much more than i wanted.

Every source — medium guides, university docs, NASA AMMOS issues, kevin chant's data platform piece, the harness blog — used "repo hygiene" to span readme quality, commit message quality, PR responsiveness, license files, CONTRIBUTING files, branch management, *and* file cleanliness. It is the umbrella term for "this repository is being maintained by humans who care."

RepOptics already has dedicated categories for almost all of that. README quality lives in architecture. License and CONTRIBUTING live in governance. PR cadence lives in delivery. If i labeled the four-check file-cleanliness slice as "hygiene," a reader who knew the term would expect the whole umbrella and feel undercounted. *"Why is my hygiene 89 when my READMEs are awful?"*

Borrowing a word that means more than what you measure is a different bug than borrowing a word that means the wrong thing. But it is still a bug.

So i killed hygiene and asked the user. They came back with the right answer in two sentences:

> "I like the word tidy and i like getting away from industry baggage. Dont be afraid to use the word bloat where appropriate, but yes we need a label that states the goal and measures against that."

**The label states the goal. The copy describes the gap.**

That is the rule. It sounds obvious in retrospect. It is not the rule i had been following.

## The new vocabulary

The category became **file tidiness**.

- The *label* is the positive state. High score = high tidiness.
- The *messages* describe distance from the goal in escalating verdict words: `TIDY → CLUTTERED → BLOATED`.
- The *negative word* — bloat — survived. It does the heavy lifting in the red message ("BLOATED — repo drag detected…") and in the panel sub-line ("100 = perfectly tidy, 0 = heavily bloated"). It just no longer names the thing being measured.

A score of 11 now reads:

> File tidiness: 11/100
> ↑ Higher score = tidier (less bloat)
> "BLOATED — repo drag detected. Dead files, duplicates, or committed artifacts slowing you down."

You cannot misread that. The label tells you the polarity. The verdict word tells you the verdict. The number is just receipts.

I also fixed the pitfall table on the research page. The "fail rate" column got renamed to `% of repos failing`, and i added a one-line caption above the table that says the quiet part out loud:

> % Of scanned repos in the lake where this specific check came back failing. Higher = more common pitfall across the population. **This is not a per-repo score — it's a frequency across all scans.**

The badge in the table is now "file tidiness" too, in the same orange. The visual association with the four `bloat-*` check IDs survives without forcing the reader to share my brain.

## The rule i should have been following

After all of this i wrote it down so i would not lose it:

> **Scoring categories must be named for the positive state being measured, not the negative state being avoided.**

If i ever add a category that tracks risk or debt or staleness, the label has to describe the *goal*. Resilience, not risk. Freshness, not staleness. Clarity, not confusion. Tidiness, not bloat. The antagonist gets to live in the message string, not in the title.

This is not a style preference. It is a polarity contract between the label and the number. Break that contract and every reader pays the disambiguation cost on every glance, forever.

## The embarrassing part

I shipped repOptics with this bug for months. I wrote ADRs about scoring calibration, intent classification, and confidence damping. I wrote a whole post about recalibrating the engine to be context-aware. I obsessed over making the *math* honest.

And the entire time, one of the seven category labels was lying to its own number.

The math was right. The vocabulary was wrong. And a reader cannot tell the difference, because a reader does not see your math — a reader sees a word next to a number and tries to make them agree.

## Distillation

The label is the contract. The number is the payload. When they disagree, the reader pays — and the reader is usually you, sitting in your own product, getting confused by your own past self.

Name the goal. Measure against the goal. Let the negative words live in the copy where they can do honest work without poisoning the title.

* * *

Shipped: ADR-0027, label rename across nine files, polarity hint on the bloat panel, pitfall table caption, verdict-led message vocabulary. Internal `bloat` keys and the lake schema untouched — no migration needed. Existing scans still parse, the materialized views still refresh, the `/research` skill still queries. The only thing that changed is what the reader sees, and what the reader sees no longer fights itself.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-04-10_the_polarity_problem.html).*