---
title: "Dynamic chaos: v0.1.4"
seoTitle: "Dynamic chaos: v0.1.4"
seoDescription: "the weblog was static. adding an entry required manual HTML rebuilds or waiting on potential CI. felt slow. felt rigid. refactored the engine to load"
datePublished: Sun May 10 2026 01:37:39 GMT+0000 (Coordinated Universal Time)
cuid: cmoz3s9cg000502ic1lp9f30m
slug: 2026-02-13-dynamic-chaos
canonical: https://bmccall17.github.io/darketype/weblog/2026-02-13_dynamic_chaos.html
cover: https://bmccall17.github.io/assets/social/og/2026-02-13_dynamic_chaos.png
ogImage: https://bmccall17.github.io/assets/social/og/2026-02-13_dynamic_chaos.png
tags: interaction, weblog, build-system

---

# The problem
The weblog was static. Adding an entry required manual HTML rebuilds or waiting on potential CI. Felt slow. Felt rigid.

# The shift
Refactored the engine to load entries dynamically via `entries.json`. 
Added a filesystem watcher to regenerate the manifest instantly on save.
Inverted the binary cypher: text first, chaos on hover. Clearer intent, same aesthetic.

# The details
- `Scripts/build_weblog.js` now uses file creation time for true timestamps.
- Hovering a title reveals the binary underlying reality.
- Hovering the timestamp reveals the epoch.

# Glimmers
```javascript
// dynamic epoch swap
link.addEventListener('mouseenter', () => {
    link.innerText = cipher(originalTitle);
    if (epoch) timestampSpan.innerText = `[${epoch}]`;
});
```

# Distillation
Systems should be fluid. Let the machine handle the updates.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-02-13_dynamic_chaos.html).*