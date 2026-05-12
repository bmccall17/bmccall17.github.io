---
title: "The repo is the bottleneck now"
seoTitle: "The repo is the bottleneck now"
seoDescription: "i keep coming back to the same pattern.  AI has made it much easier to produce code. that part is obvious now. the less obvious part is what gets expo"
datePublished: 2026-05-11T23:48:41.140Z
cuid: cmp1urtir000102ky1sx14sg8
slug: 2026-05-11-the-repo-is-the-bottleneck-now
canonical: https://bmccall17.github.io/darketype/weblog/2026-05-11_the_repo_is_the_bottleneck_now.html
cover: https://bmccall17.github.io/assets/social/og/2026-05-11_the_repo_is_the_bottleneck_now.png
ogImage: https://bmccall17.github.io/assets/social/og/2026-05-11_the_repo_is_the_bottleneck_now.png
tags: research, repoptics, agent828, repo-health

---

# The repo is the bottleneck now

I keep coming back to the same pattern. 

AI has made it much easier to produce code. That part is obvious now. The less obvious part is what gets exposed after the code exists.

The bottleneck moves.

It moves from "can i build this?" to "can i trust this repo enough to keep going?"

That question matters more than it sounds. A repo is not just a place where files live. It is where the product leaves evidence about what it is, how it changes, what it depends on, what is risky, and what the next person should be careful about.

When a human team writes slowly, repo health problems can hide for a while. When an AI-assisted team moves fast, those problems show up earlier. The code arrives before the context catches up.

## AI made code faster. It did not make repos healthier.

That is what this week's [repOptics](https://github.com/bmccall17/repOptics) research run made hard to ignore. 

The current lake covers 5,771 scans across 2,907 repositories. Across those scans:

- 80% Failed the duplicates check
- 58% Failed the large-files check
- 45% Failed the README rationale check
- 40% Failed the lead-time check
- 32% Failed the structure check

These are scans, not unique repos, so i would not treat them as a universal benchmark. But the pattern is useful. Those are not all the same kind of problem. A missing rationale is not the same as a giant committed asset. But together, they point at a real failure mode for AI-native development:

Repo drag is the residue of speed. We can create code faster than we create confidence.

## The next AI coding problem is repo drag

This matters because AI coding is moving from autocomplete into agentic workflow. Agents like [agent828](/agent828-build-arc) and others are starting to pick up issues, create branches, and operate inside the same systems humans use. GitHub is explicitly moving toward "Agent HQ", and Stack Overflow's 2025 survey notes that 46% of developers distrust AI tool accuracy.

That means the repo is no longer just storage. It is the operating environment for humans and agents together. If the repo cannot explain itself, the agent has less to stand on, and the human has less reason to trust what changed.

Agent instructions are becoming part of repo infrastructure. One of the more interesting signals this week: visible AI-agent governance files appeared in 26% of scans. Agent tools now expect repo-level guidance like AGENTS.md or CLAUDE.md.

Not every score movement is meaningful. The research showed that 85% of re-scan deltas stayed within plus or minus one point. The point is not drama. The point is signal quality.

Trust requires distinguishing missing evidence from actual failure. Absence of evidence should not always equal evidence of absence. AI-native teams do not need more generic repo shame. They need better optics.

They need to know what is dangerous, what is drag, and what is merely unfinished. They need a way to turn a pile of files into a clearer decision about whether to ship, clean up, document, or slow down.

If you are building with agents, shipping solo, maintaining open source, or trying to get a small team to launch with less guesswork, try running a scan with repOptics on a repo you care about. I would love for you to tell Brett A McCall where the scanner feels useful, unfair, too harsh, or not sharp enough yet.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-05-11_the_repo_is_the_bottleneck_now.html).*