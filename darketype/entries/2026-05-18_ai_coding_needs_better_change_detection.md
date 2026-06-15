---
title: "ai coding needs better change detection, not louder scorecards"
date: 2026-05-18
state: "shipped"
tags: [repoptics, agent828, research, repo-health, ai-native]
series: "reporesearch"
---

# the biggest number is not always the story

one thing i keep learning from running repOptics every week: the loudest finding is not always the useful one.

this week the research lake grew to 6,642 scans across 3,130 repositories, with 3,515 re-scan deltas. that is enough volume to see recurring patterns — but it also creates a trap. it becomes easy to just repeat the biggest numbers. duplicates are still high. large files are still common. README rationale is still weaker than it should be.

those signals matter. but week to week, the more useful question is different:

*what actually changed?*

## what the data said this week

coverage increased by 871 scans, 223 repositories, and 648 re-scan deltas since the previous run. no new high-confidence finding crossed into publishable territory. the durable patterns held mostly steady:

- 80% of scans failed the duplicates check
- 57% failed the large-files check
- 46% failed the README rationale check
- 38% failed the lead-time check
- 32% failed the structure check

those are scans, not unique repos — so i would not treat them as universal benchmarks. they are better read as a research-lake signal: these are the kinds of repo issues that keep showing up.

the more interesting weekly movement was quieter.

the "package manifest exists" quick-win recommendation barely changed by raw count: 2,418 last week, 2,422 this week. but as a share of all scans, it declined by about 5.4 points. that does not prove package-manifest health improved across the ecosystem. it may be cohort composition. it may reflect which repos were added. it may be real improvement somewhere.

the important part: the tool should make that distinction visible.

## 83% of deltas stayed stable

re-scan stability was notable this week. 83% of deltas stayed within plus or minus one point. week-over-week, most repo signals do not dramatically shift — which is exactly why tooling needs to distinguish movement from repetition.

a scorecard that only repeats "this is bad" eventually becomes background noise. a useful repo-health system should tell you which signals are durable, which ones moved, and which ones need review before anyone turns them into a claim.

that is especially true when coding agents are involved.

## why this matters for AI-native development

agents can generate scaffolding, tests, scripts, docs, and refactors quickly. they can also leave residue: duplicate logic, unused files, unclear decisions, half-finished setup, dependency drift, and instructions that help agents but not humans.

so the next bottleneck is not just repo health. it is repo-health *interpretation*.

what is actually risky? what is ordinary mess? what changed this week? what stayed stable? what should a maintainer inspect before trusting the number?

this is why i keep coming back to "repo optics" instead of repo grading. the goal is not to shame a project because it has duplicate code or a messy README. the goal is to help a builder, maintainer, or technical PM see what kind of evidence the repo has, what kind of evidence is missing, and whether the signal is strong enough to act on.

one boundary worth naming: visible AI-agent governance appeared in 27% of scans this week. that is interesting, but it is not proof those repos were built by AI. it only means agent-oriented guidance was visible in the scan evidence. the tooling has to be more precise than the hype cycle around it.

## the practical takeaway

AI coding does not need louder scorecards. it needs better change detection.

not just "your repo is a B." more like:

- this issue has been stable for weeks
- this recommendation is newly common
- this score movement may be scanner noise
- this signal is underpowered
- this claim is safe to publish only with caveats
- this repo is easier or harder to trust than it was last week

that is the direction i am pushing repOptics.

if you are using agents, shipping solo, maintaining open source, or trying to make launch decisions from a fast-moving repo — try running a scan to see [how your repo scores](https://rep-optics.onrender.com/) on a repo you care about. i would love for you to tell me where the signal feels useful, unfair, too harsh, or still too vague. you can reach out [here](https://bmccall17.github.io/book). repOptics is a free forever project, if it brings value to your work and you'd like to support it, please [consider buying me a coffee](https://buymeacoffee.com/bmccall17) every little bit makes a difference.
