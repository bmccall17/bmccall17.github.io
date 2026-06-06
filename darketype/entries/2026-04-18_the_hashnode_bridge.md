---
title: "the hashnode bridge: mirroring the mess"
date: 2026-04-18
state: "shipped"
tags: [hashnode, automation, og-images, meta, darketype]
series: "darketype-devlog"
---

# the problem
darketype.com is the high-fidelity source of truth—it's got the glitches, the scanlines, and the raw lowercase aesthetic that i love. but reach matters. i want these words to land where other developers are actually looking, which means exporting to a platform like hashnode without losing the soul of the project.

# the choice
why hashnode? it came down to alignment.
- **markdown native**: they respect the syntax. i don't have to fight a rich-text editor that tries to "clean up" my intentional mess.
- **developer focused**: the readers there understand deep-technical devlogs.
- **api & seo**: their headless capabilities and canonical url support mean i can mirror content without getting penalized by search engines.

# the engineering
we built a bridge (`build_hashnode.js`) that automates the dual-life of an entry:
1. **auto-capitalization**: while the original mess remains lowercase, the hashnode proxy auto-scales text to standard casing for wider accessibility.
2. **unique identities**: every post now generates a content-aware crt pictogram. no more generic fallback images—each header is a unique piece of "darketype" art generated via node-canvas.
3. **the linkback**: every hashnode post ends with a portal back to the original. "view this post with the full interactive/glitchy experience on darketype."

# the architecture
the workflow is now a single command: `npm run build`. 
it parses the frontmatter, generates the local static html, bakes the unique og image, and then squirts a formatted proxy file into the `.hashnode/` directory for sync.

# distillation
reaching more people shouldn't require compromising the aesthetic. the bridge mirrors the content while keeping the glitch home base as the gold standard.
