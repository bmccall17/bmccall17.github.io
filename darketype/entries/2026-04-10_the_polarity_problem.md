---
title: "the polarity problem"
date: 2026-04-10
state: shipped
tags: [repoptics, scoring, ux, naming, vocabulary, design-debt]
series: "darketype-devlog"
og_image:
next_experiment: "carry the same labeling rule into leuchtturm before the first connector ships"
---

# the polarity problem

## a number that fights its own label

repOptics has seven scoring categories. six of them are named after a thing you want more of: decisions, architecture, governance, delivery, dependencies, security. the seventh was named after a thing you want less of.

it was called **bloat**.

it scored 0 to 100, like every other category. 100 meant clean. 0 meant the repo was carrying so much dead weight you could feel the drag every time you cloned it.

so what did `bloat: 11/100` mean?

i could not tell. i sat in my own report and looked at it and i could not tell. eleven could be "11% bloated, almost spotless" or "11/100 cleanliness, this is a swamp." both readings were defensible. only one was right. the label and the number were pulling in opposite directions and the reader had to do the disambiguation work in their head every single time.

every other category in the report had this property: high score = good, low score = bad, label = the good thing. this category had: high score = good, low score = bad, label = **the bad thing**. the polarity flipped under one specific name, and that flip was invisible because the number kept the same shape.

## the moment it broke

the confusion landed twice in the same screenshot session.

first the bloat panel itself. i could not tell if a low score meant my repo had a lot of bloat (bad) or a small amount of bloat (good). the message at the top said "repo drag detected. dead files, duplicates, or committed artifacts slowing you down." which is unambiguously bad. but the message and the number had to be read together to extract the meaning. the number alone was a riddle.

then the research page. there is a "common pitfalls" table on `/research` that shows, for every check across the entire lake of scanned repos, what percentage of repos fail that check. so for `bloat-large-files`, a 75% fail rate means "three out of every four scanned repos in the lake have at least one oversized file flagged."

i looked at the column and saw `Bloat — 75%` and immediately read it as "the bloat score is 75 out of 100." it was not. it was a population frequency. a per-repo score and a cross-population fail rate are two completely different mathematical objects, but with the same word sitting next to them in the same orange color, my brain just collapsed them into one thing.

the worst part: this was my own product. i wrote the panel. i defined the column. i still got confused.

if i could not read it, nobody could.

## the search for a better word

the obvious move was to flip the polarity by renaming. find a word that means "the good state of the file system" and put a 0–100 score under it. high = good. instinct restored.

i tried four:

- **lean** — shortest, no overclaim risk. "lean: 11/100" reads as "barely lean = very bloated." instant.
- **cleanliness** — most literal. slightly clinical.
- **hygiene** — common in eng-speak ("repo hygiene"). felt right.
- **file efficiency** — clear but two clinical words.

i was leaning hygiene. before i committed to it i did the small responsible thing and ran a web search on "repo hygiene" to make sure it actually meant what i wanted it to mean.

it did not. or rather, it meant much more than i wanted.

every source — medium guides, university docs, NASA AMMOS issues, kevin chant's data platform piece, the harness blog — used "repo hygiene" to span readme quality, commit message quality, PR responsiveness, license files, CONTRIBUTING files, branch management, *and* file cleanliness. it is the umbrella term for "this repository is being maintained by humans who care."

repOptics already has dedicated categories for almost all of that. README quality lives in architecture. license and CONTRIBUTING live in governance. PR cadence lives in delivery. if i labeled the four-check file-cleanliness slice as "hygiene," a reader who knew the term would expect the whole umbrella and feel undercounted. *"why is my hygiene 89 when my READMEs are awful?"*

borrowing a word that means more than what you measure is a different bug than borrowing a word that means the wrong thing. but it is still a bug.

so i killed hygiene and asked the user. they came back with the right answer in two sentences:

> "i like the word tidy and i like getting away from industry baggage. dont be afraid to use the word bloat where appropriate, but yes we need a label that states the goal and measures against that."

**the label states the goal. the copy describes the gap.**

that is the rule. it sounds obvious in retrospect. it is not the rule i had been following.

## the new vocabulary

the category became **file tidiness**.

- the *label* is the positive state. high score = high tidiness.
- the *messages* describe distance from the goal in escalating verdict words: `TIDY → CLUTTERED → BLOATED`.
- the *negative word* — bloat — survived. it does the heavy lifting in the red message ("BLOATED — repo drag detected…") and in the panel sub-line ("100 = perfectly tidy, 0 = heavily bloated"). it just no longer names the thing being measured.

a score of 11 now reads:

> file tidiness: 11/100
> ↑ higher score = tidier (less bloat)
> "BLOATED — repo drag detected. dead files, duplicates, or committed artifacts slowing you down."

you cannot misread that. the label tells you the polarity. the verdict word tells you the verdict. the number is just receipts.

i also fixed the pitfall table on the research page. the "fail rate" column got renamed to `% of repos failing`, and i added a one-line caption above the table that says the quiet part out loud:

> % of scanned repos in the lake where this specific check came back failing. higher = more common pitfall across the population. **this is not a per-repo score — it's a frequency across all scans.**

the badge in the table is now "file tidiness" too, in the same orange. the visual association with the four `bloat-*` check IDs survives without forcing the reader to share my brain.

## the rule i should have been following

after all of this i wrote it down so i would not lose it:

> **scoring categories must be named for the positive state being measured, not the negative state being avoided.**

if i ever add a category that tracks risk or debt or staleness, the label has to describe the *goal*. resilience, not risk. freshness, not staleness. clarity, not confusion. tidiness, not bloat. the antagonist gets to live in the message string, not in the title.

this is not a style preference. it is a polarity contract between the label and the number. break that contract and every reader pays the disambiguation cost on every glance, forever.

## the embarrassing part

i shipped repOptics with this bug for months. i wrote ADRs about scoring calibration, intent classification, and confidence damping. i wrote a whole post about recalibrating the engine to be context-aware. i obsessed over making the *math* honest.

and the entire time, one of the seven category labels was lying to its own number.

the math was right. the vocabulary was wrong. and a reader cannot tell the difference, because a reader does not see your math — a reader sees a word next to a number and tries to make them agree.

## distillation

the label is the contract. the number is the payload. when they disagree, the reader pays — and the reader is usually you, sitting in your own product, getting confused by your own past self.

name the goal. measure against the goal. let the negative words live in the copy where they can do honest work without poisoning the title.

* * *

shipped: ADR-0027, label rename across nine files, polarity hint on the bloat panel, pitfall table caption, verdict-led message vocabulary. internal `bloat` keys and the lake schema untouched — no migration needed. existing scans still parse, the materialized views still refresh, the `/research` skill still queries. the only thing that changed is what the reader sees, and what the reader sees no longer fights itself.
