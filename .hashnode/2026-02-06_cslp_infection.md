---
title: "Cross-site leakage protocol (cslp)"
slug: 2026-02-06-cslp-infection
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-02-06_cslp_infection.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-02-06_cslp_infection.png"
tags: cslp, infection, glitch, localStorage
seriesSlug: darketype-devlog
---

# The problem
I have two distinct identities: the polished professional (`brettamccall.com`) and the messy experimenter (`darketype`). Keeping them completely separate feels dishonest. Hiding the mess implies shame.

# The learning
The web is permeable. Browsers have memory (`localStorage`). If i treat the user's journey as a continuous state, i can carry "infection" from one site to another without backend databases.

# The mess
- I designed a "virus" (`leak_core.js`) that tracks how deep you go into the darketype.
- I infected my own portfolio (`binary-leak.js`) to read this state.
- The result: if you stare too long into the abyss (darketype), the abyss blinks back at you on the professional site.
- Specifically: binary text glitches into `d a r k e t y p e`, and a portal button assembles itself if infection > 80%.

# Glimmers (code snippets)
```javascript
// the symptom (portfolio)
if (infectionLevel >= 0.8) {
    spawnSingularityButton(); // physical manifestation
}

// mutation logic
const glitchChance = Math.max(0, (infectionLevel - 0.2) * 0.1); 
if (Math.random() < glitchChance) {
    this.char = "d a r k e t y p e"[Math.floor(Math.random() * 9)];
    this.color = '#00ff41'; // radioactive green
}
```

# Distillation
Consistency is overrated. Allow your contexts to bleed into each other. It makes the whole system feel alive.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-02-06_cslp_infection.html).*