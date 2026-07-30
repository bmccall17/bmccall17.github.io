---
title: "only 2.2% of repositories earn an a"
date: 2026-07-30
state: "shipped"
tags: [repoptics, agent828, research, repo-health, ai-native]
series: "agent828-build-arc"
hashnodeSlug: "only-2-2-percent-of-repositories-earn-an-a"
seoDescription: "i scored 5,364 public repositories across 15,336 scans. only 2.2% earned an a, and security was the single worst dimension."
---

for the last several months, [repOptics](https://rep-optics.onrender.com/) has been quietly doing one thing: scanning public repositories and grading them on how ready they actually are — measuring decisions, architecture, governance, delivery, dependencies, security, and file tidiness.

it has now scored 5,364 repositories across 15,336 scans. 

i want to share the distribution, because the headline is blunt: only 2.2% of repositories earn an a. the single worst dimension across the whole population is security.

before anything else, one correction. earlier versions of this work quoted "4% grade a" and "64% fail governance." those numbers are stale. the current, latest-scan-per-repo figures are 2.2% grade a and 38% governance red. i'd rather correct my own numbers in the first paragraph than have you find the drift yourself.

## the distribution

using each repository's most recent scan (so a repo scanned twenty times counts once):

- a: 2.2%
- b: 26.1%
- c: 43.2%
- d: 20.2%
- f: 8.2%

the median repository is a c. over 70% grade c or below. this is not a story about a few bad repos dragging down an otherwise healthy population. the debt is the default.

## security is the worst dimension

here's where it gets specific. by category, the share of repositories scoring red:

- dependencies: 84.7%
- security: 73.1%
- decisions: 41.4%
- governance: 38.0%
- delivery: 12.3%
- file tidiness: 5.1%
- architecture: 0.9%

architecture and delivery are broadly fine. people know how to structure a project and wire up CI. where it falls apart is security and dependencies.

and the specific gaps are boring, which is the point. they aren't exotic vulnerabilities. they're missing hygiene:

- 84.5% of repositories (where i could observe it, n=5,320, unknowns excluded) have no code scanning configured.
- 67.9% have no security policy (n=5,325).
- 67.0% have no automated dependency updates (n=5,325).

let me be precise about that phrase "where i could observe it," because it's the difference between an honest number and a scary one. i only count a control as failing over repositories where i could actually check it. two controls — secret scanning and branch protection — require privileged access i don't have on a public scan, so i exclude them entirely rather than reporting them as passes. that's a blind spot, and i'd rather name it than paper over it.

## the largest cohort is production code

broken out by what the repository appears to be for, the worst average scores belong to prototypes (47.9) and internal tools — expected. nobody hardens a prototype.

but the more uncomfortable finding is volume. the largest cohort is production code — 2,395 repositories — and a third of it grades d or f. prototypes score worse individually, but production carries the largest absolute mass of security and dependency debt, precisely because there's so much of it.

## does it get better over time?

repOptics has re-scanned repositories 9,973 times, so i can watch posture move.

it mostly doesn't move — 54% of re-scans are unchanged. but of the ones that do move, more decay than improve: 24.1% regressed versus 21.7% that improved, for a small net-negative drift. 932 repositories dropped a full letter grade between scans.

i want to be careful here. this is a correlational signal, not a causal one. i am not claiming to know *why* a repository's posture fell, and i'm not claiming AI commits caused it. what i can say is directional and, i think, useful: left alone, repositories drift down slightly more often than they drift up. that makes "which repos are decaying fastest" a real, rankable question — and a good place to spend attention.

## why i'm publishing the denominators

if there's a through-line to how i build repOptics, it's this: a score is only worth as much as the honesty of the claim behind it.

so every number above ships with its denominator. latest-scan-per-repo, not raw scans. fail rates over observable repositories, not the whole population. engine versions blended, and flagged as blended.

that restraint isn't bureaucracy. in a moment when AI code is generated faster than ever, the expensive mistake isn't a slow scanner — it's a confident, sloppy claim that sends people chasing the wrong thing. 

the ecosystem's security posture, measured rather than asserted, is not marginal. it's the default state. if you maintain a repository, the highest-leverage things you can do are also the most boring: turn on code scanning, turn on automated dependency updates, write a security policy. most repositories haven't.

if you want to see where a specific repo lands, run it through [repOptics](https://rep-optics.onrender.com/) and read past the grade — look at which evidence is actually visible, and which claims come with their denominator attached. (repOptics is a free forever project, if it brings value to your work and you'd like to support it, please [consider buying me a coffee](https://buymeacoffee.com/bmccall17) every little bit makes a difference.)
