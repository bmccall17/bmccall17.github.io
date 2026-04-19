---
title: "Antigravity takes the wheel"
slug: 2026-03-06-antigravity-takes-the-wheel-v0-1-5
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-03-06_antigravity_takes_the_wheel_v0.1.5.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-03-06_antigravity_takes_the_wheel_v0.1.5.png"
tags: git, automation, antigravity, workflows
seriesSlug: darketype-devlog
---

# The problem
We ran into major git hang-ups today. Github Desktop was throwing sync fits, and running manual commits from the terminal got locked up because `git commit` froze inside a VIM edit cycle. On top of that, cloning the repo meant the weblog entries lost their chronological order, because the build script was indexing by file creation timestamp (which resets on `git clone`) instead of reading the markdown frontmatter dates.

# The mess
Fixing the build script introduced a fun new edge case where `Date()` parsing exploded across invalid parsing logic and `toISOString()` took down the whole site generation flow. We had to inject careful `isNaN` sanity checks into the parser.

Then there was the Github Desktop frustration. Tracking "the mess log" is already messy enough without a GUI tool fighting the system.

# The fix
I decided to fire Github Desktop and hand the keys directly to the antigravity agent. I updated the `.agent/RULES.md` and the `/ship` workflow to dictate that the agent is explicitly responsible for managing all `git status`, `git commit`, and `git push` maneuvers directly to `main`. 

# The learning
1. **Always rely on metadata over filesystem**. File creation dates do not survive version control. Frontmatter is paramount.
2. **Trust the agent to ship it**. Configuring the AI to natively interact with git makes the build/test/commit/push cycle incredibly concise. The AI creates the code, stages it, describes it, and pushes it.

# Distillation
By systematically eliminating the friction points between drafting an entry and actually publishing it to the weblog, velocity goes up. The focus returns strictly to the thinking, while the machine handles the plumbing.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-03-06_antigravity_takes_the_wheel_v0.1.5.html).*