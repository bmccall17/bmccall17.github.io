---
title: "v0.1.7: shipping forms, particles, and reps"
date: 2026-03-27
state: "shipped"
tags: [meta, darketype, release]
series: "darketype-devlog"
og_image: 
next_experiment: "unclear"
---

# the problem
a lot of scattered work across different workflows: building forms to talk to humans, building particles to break the screen, and writing up past launches without fully logging them. 

# the learning
sometimes you just need to bundle everything together under one patch version and ship it to the void. forms now have custom validations that feel thematic instead of sterile. recruitment is gated by regional and technical screening. and we managed to hit 60fps melting 230,000 particles on a canvas.

# the mess
keeping track of multiple states. doing the repoptics writeup while also building the contact flow led to a very dense couple of days of context switching.

# glimmers
part of the form updates allowed for more thematic error rejection. pushing back when the required energy isn't met:
```css
input:invalid:not(:focus):not(:placeholder-shown) {
    border-bottom-color: var(--color-state-broken);
}
```

# distillation
everything is wired up. the rot spreads perfectly. the port is ready for new recruits.
