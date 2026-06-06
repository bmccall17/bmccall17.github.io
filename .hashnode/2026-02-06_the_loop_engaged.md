---
title: "The loop engaged: v0.1.1"
slug: 2026-02-06-the-loop-engaged
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-02-06_the_loop_engaged.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-02-06_the_loop_engaged.png"
seo_title: "The loop engaged: v0.1.1"
seo_description: "the portfolio was static HTML soup. the darketype was a ghost town. we needed to connect them.   building a "universal reader" (entry.html) that fe"
og_image: "https://bmccall17.github.io/assets/social/og/2026-02-06_the_loop_engaged.png"
tags: release, loop, github
seriesSlug: darketype-devlog
---

# The problem
The portfolio was static HTML soup. The darketype was a ghost town. We needed to connect them.

# The learning
Building a "universal reader" (`entry.html`) that fetches markdown via JS is way faster than building a complex SSG for now. It feels delightfully hacky.

Also, migrating content from `brettamccall.com` made me realize how much "stuff" i've actually done. Listing it out in the new grid layout felt... Substantial.

# The mess
- `Index.html` is now fully transformed into a github-profile-alike.
- `Scripts/build_weblog.js` is a tiny node script that does the heavy lifting of indexing.
- The "leak" is live: the contribution graph is a static visual for now, but it *looks* like data.

# Glimmers
```javascript
// the "leak" reader logic
async function loadEntry() {
    const params = new URLSearchParams(window.location.search);
    // ... magic happens
}
```

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-02-06_the_loop_engaged.html).*