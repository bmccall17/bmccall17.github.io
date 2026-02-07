---
title: "leaking pixels: cross-site data vapor"
date: 2026-02-07
state: "shipped"
tags: [cslp, localStorage, glitch]
next_experiment: "deep metrics"
---

# the problem
my portfolio needs to be professional, but my soul is chaotic. how do i bridge the gap without scaring off recruiters?

# the solution
CSLP (Cross-Site Leakage Protocol). a `localStorage` handshake.

if you play long enough on the portfolio, you get "infected". the infection creates "vapor" (particles) that mutate from binary to "darketype" text. eventually, physical pixels accumulate on the edges of your screen.

# the glitch
when you move your mouse near these accumulated pixels, your cursor starts to disintegrate. it's a subtle warning: *you are too close to the edge.*

# code note
doubled the proximity check to `300px` for a wider "danger zone" and slowed the jitter transition to `0.3s` to make it feel like the pixels are breathing rather than seizing.
