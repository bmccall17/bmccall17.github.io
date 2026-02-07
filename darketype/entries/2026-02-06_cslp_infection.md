---
title: "cross-site leakage protocol (cslp)"
date: "2026-02-06T16:00:00"
state: "shipped" 
tags: [cslp, infection, glitch, localStorage]
next_experiment: "deep metrics (phase 3)"
---

# the problem
i have two distinct identities: the polished professional (`brettamccall.com`) and the messy experimenter (`darketype`). keeping them completely separate feels dishonest. hiding the mess implies shame.

# the learning
the web is permeable. browsers have memory (`localStorage`). if i treat the user's journey as a continuous state, i can carry "infection" from one site to another without backend databases.

# the mess
- i designed a "virus" (`leak_core.js`) that tracks how deep you go into the darketype.
- i infected my own portfolio (`binary-leak.js`) to read this state.
- the result: if you stare too long into the abyss (darketype), the abyss blinks back at you on the professional site.
- specifically: binary text glitches into `d a r k e t y p e`, and a portal button assembles itself if infection > 80%.

# glimmers (code snippets)
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

# distillation
consistency is overrated. allow your contexts to bleed into each other. it makes the whole system feel alive.
