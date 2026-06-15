---
title: "Leaking pixels: cross-site data vapor"
slug: 2026-02-07-leaking-pixels
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-02-07_leaking_pixels.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-02-07_leaking_pixels.png"
seo_title: "Leaking pixels: cross-site data vapor"
seo_description: "my portfolio needs to be professional, but my soul is chaotic. how do i bridge the gap without scaring off recruiters?   CSLP (Cross-Site..."
og_image: "https://bmccall17.github.io/assets/social/og/2026-02-07_leaking_pixels.png"
tags: cslp, localStorage, glitch
seriesSlug: darketype-devlog
---

# The problem
My portfolio needs to be professional, but my soul is chaotic. How do i bridge the gap without scaring off recruiters?

# The solution
CSLP (Cross-Site Leakage Protocol). A `localStorage` handshake.

If you play long enough on the portfolio, you get "infected". The infection creates "vapor" (particles) that mutate from binary to "darketype" text. Eventually, physical pixels accumulate on the edges of your screen.

# The glitch
When you move your mouse near these accumulated pixels, your cursor starts to disintegrate. It's a subtle warning: *you are too close to the edge.*

# Code note
Doubled the proximity check to `300px` for a wider "danger zone" and slowed the jitter transition to `0.3s` to make it feel like the pixels are breathing rather than seizing.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-02-07_leaking_pixels.html).*