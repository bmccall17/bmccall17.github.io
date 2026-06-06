---
title: "V0.1.7: shipping forms, particles, and reps"
slug: 2026-03-27-messy-release-v0-1-7
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-03-27_messy_release_v0.1.7.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-03-27_messy_release_v0.1.7.png"
seo_title: "V0.1.7: shipping forms, particles, and reps"
seo_description: "a lot of scattered work across different workflows: building forms to talk to humans, building particles to break the screen, and writing up past laun"
og_image: "https://bmccall17.github.io/assets/social/og/2026-03-27_messy_release_v0.1.7.png"
tags: meta, darketype, release
seriesSlug: darketype-devlog
---

# The problem
A lot of scattered work across different workflows: building forms to talk to humans, building particles to break the screen, and writing up past launches without fully logging them. 

# The learning
Sometimes you just need to bundle everything together under one patch version and ship it to the void. Forms now have custom validations that feel thematic instead of sterile. Recruitment is gated by regional and technical screening. And we managed to hit 60fps melting 230,000 particles on a canvas.

# The mess
Keeping track of multiple states. Doing the repoptics writeup while also building the contact flow led to a very dense couple of days of context switching.

# Glimmers
Part of the form updates allowed for more thematic error rejection. Pushing back when the required energy isn't met:
```css
input:invalid:not(:focus):not(:placeholder-shown) {
    border-bottom-color: var(--color-state-broken);
}
```

# Distillation
Everything is wired up. The rot spreads perfectly. The port is ready for new recruits.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-03-27_messy_release_v0.1.7.html).*