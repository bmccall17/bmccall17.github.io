---
title: "Only 2.2% of repositories earn an A"
datePublished: 2026-07-30T17:44:07.177Z
cuid: cms7sz4sa00000ajbeasf6dei
slug: only-2-2-of-repositories-earn-an-a

---

For the last several months, [repOptics](https://rep-optics.onrender.com/) has been quietly doing one thing: scanning public repositories and grading them on how ready they actually are — measuring decisions, architecture, governance, delivery, dependencies, security, and file tidiness.

It has now scored 5,364 repositories across 15,336 scans.

I want to share the distribution, because the headline is blunt: only 2.2% of repositories earn an a. The single worst dimension across the whole population is security.

Before anything else, one correction. Earlier versions of this work quoted "4% grade a" and "64% fail governance." those numbers are stale. The current, latest-scan-per-repo figures are 2.2% grade a and 38% governance red. I'd rather correct my own numbers in the first paragraph than have you find the drift yourself.

## The distribution

Using each repository's most recent scan (so a repo scanned twenty times counts once):

*   A: 2.2%
    
*   B: 26.1%
    
*   C: 43.2%
    
*   D: 20.2%
    
*   F: 8.2%
    

The median repository is a c. Over 70% grade c or below. This is not a story about a few bad repos dragging down an otherwise healthy population. The debt is the default.

## Security is the worst dimension

Here's where it gets specific. By category, the share of repositories scoring red:

*   Dependencies: 84.7%
    
*   Security: 73.1%
    
*   Decisions: 41.4%
    
*   Governance: 38.0%
    
*   Delivery: 12.3%
    
*   File tidiness: 5.1%
    
*   Architecture: 0.9%
    

Architecture and delivery are broadly fine. People know how to structure a project and wire up CI. Where it falls apart is security and dependencies.

And the specific gaps are boring, which is the point. They aren't exotic vulnerabilities. They're missing hygiene:

*   84.5% Of repositories (where i could observe it, n=5,320, unknowns excluded) have no code scanning configured.
    
*   67.9% Have no security policy (n=5,325).
    
*   67.0% Have no automated dependency updates (n=5,325).
    

Let me be precise about that phrase "where i could observe it," because it's the difference between an honest number and a scary one. I only count a control as failing over repositories where i could actually check it. Two controls — secret scanning and branch protection — require privileged access i don't have on a public scan, so i exclude them entirely rather than reporting them as passes. That's a blind spot, and i'd rather name it than paper over it.

## The largest cohort is production code

Broken out by what the repository appears to be for, the worst average scores belong to prototypes (47.9) and internal tools — expected. Nobody hardens a prototype.

But the more uncomfortable finding is volume. The largest cohort is production code — 2,395 repositories — and a third of it grades d or f. Prototypes score worse individually, but production carries the largest absolute mass of security and dependency debt, precisely because there's so much of it.

## Does it get better over time?

RepOptics has re-scanned repositories 9,973 times, so i can watch posture move.

It mostly doesn't move — 54% of re-scans are unchanged. But of the ones that do move, more decay than improve: 24.1% regressed versus 21.7% that improved, for a small net-negative drift. 932 Repositories dropped a full letter grade between scans.

I want to be careful here. This is a correlational signal, not a causal one. I am not claiming to know *why* a repository's posture fell, and i'm not claiming AI commits caused it. What i can say is directional and, i think, useful: left alone, repositories drift down slightly more often than they drift up. That makes "which repos are decaying fastest" a real, rankable question — and a good place to spend attention.

## Why i'm publishing the denominators

If there's a through-line to how i build repOptics, it's this: a score is only worth as much as the honesty of the claim behind it.

So every number above ships with its denominator. Latest-scan-per-repo, not raw scans. Fail rates over observable repositories, not the whole population. Engine versions blended, and flagged as blended.

That restraint isn't bureaucracy. In a moment when AI code is generated faster than ever, the expensive mistake isn't a slow scanner — it's a confident, sloppy claim that sends people chasing the wrong thing.

The ecosystem's security posture, measured rather than asserted, is not marginal. It's the default state. If you maintain a repository, the highest-leverage things you can do are also the most boring: turn on code scanning, turn on automated dependency updates, write a security policy. Most repositories haven't.

If you want to see where a specific repo lands, run it through [repOptics](https://rep-optics.onrender.com/) and read past the grade — look at which evidence is actually visible, and which claims come with their denominator attached. (RepOptics is a free forever project, if it brings value to your work and you'd like to support it, please [consider buying me a coffee](https://buymeacoffee.com/bmccall17) every little bit makes a difference.)

* * *

*View this post with the full interactive/glitchy experience on* [*darketype*](https://bmccall17.github.io/darketype/weblog/2026-07-30_only_2_2_percent_of_repositories_earn_an_a.html)*.*