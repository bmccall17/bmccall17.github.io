---
title: "antigravity takes the wheel"
date: 2026-03-06T15:00:00
state: "learning"
tags: [git, automation, antigravity, workflows]
series: "darketype-devlog"
next_experiment: "more pure content generation"
---

# the problem
we ran into major git hang-ups today. Github Desktop was throwing sync fits, and running manual commits from the terminal got locked up because `git commit` froze inside a VIM edit cycle. on top of that, cloning the repo meant the weblog entries lost their chronological order, because the build script was indexing by file creation timestamp (which resets on `git clone`) instead of reading the markdown frontmatter dates.

# the mess
fixing the build script introduced a fun new edge case where `Date()` parsing exploded across invalid parsing logic and `toISOString()` took down the whole site generation flow. we had to inject careful `isNaN` sanity checks into the parser.

then there was the Github Desktop frustration. tracking "the mess log" is already messy enough without a GUI tool fighting the system.

# the fix
i decided to fire Github Desktop and hand the keys directly to the antigravity agent. i updated the `.agent/RULES.md` and the `/ship` workflow to dictate that the agent is explicitly responsible for managing all `git status`, `git commit`, and `git push` maneuvers directly to `main`. 

# the learning
1. **always rely on metadata over filesystem**. file creation dates do not survive version control. frontmatter is paramount.
2. **trust the agent to ship it**. configuring the AI to natively interact with git makes the build/test/commit/push cycle incredibly concise. the AI creates the code, stages it, describes it, and pushes it.

# distillation
by systematically eliminating the friction points between drafting an entry and actually publishing it to the weblog, velocity goes up. the focus returns strictly to the thinking, while the machine handles the plumbing.
