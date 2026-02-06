---
title: "the loop engaged: v0.1.1"
date: 2026-02-06
state: "shipped"
tags: [release, loop, github]
next_experiment: "phase 2: signature visuals"
---

# the problem
the portfolio was static HTML soup. the darketype was a ghost town. we needed to connect them.

# the learning
building a "universal reader" (`entry.html`) that fetches markdown via JS is way faster than building a complex SSG for now. it feels delightfully hacky.

also, migrating content from `brettamccall.com` made me realize how much "stuff" i've actually done. listing it out in the new grid layout felt... substantial.

# the mess
- `index.html` is now fully transformed into a github-profile-alike.
- `scripts/build_weblog.js` is a tiny node script that does the heavy lifting of indexing.
- the "leak" is live: the contribution graph is a static visual for now, but it *looks* like data.

# glimmers
```javascript
// the "leak" reader logic
async function loadEntry() {
    const params = new URLSearchParams(window.location.search);
    // ... magic happens
}
```
