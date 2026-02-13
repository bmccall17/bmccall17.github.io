---
title: "dynamic chaos: v0.1.4"
date: 2026-02-13
state: "mess"
tags: [weblog, interaction, build-system]
next_experiment: "the next ship"
---

# the problem
the weblog was static. adding an entry required manual HTML rebuilds or waiting on potential CI. felt slow. felt rigid.

# the shift
refactored the engine to load entries dynamically via `entries.json`. 
added a filesystem watcher to regenerate the manifest instantly on save.
inverted the binary cypher: text first, chaos on hover. clearer intent, same aesthetic.

# the details
- `scripts/build_weblog.js` now uses file creation time for true timestamps.
- hovering a title reveals the binary underlying reality.
- hovering the timestamp reveals the epoch.

# glimmers
```javascript
// dynamic epoch swap
link.addEventListener('mouseenter', () => {
    link.innerText = cipher(originalTitle);
    if (epoch) timestampSpan.innerText = `[${epoch}]`;
});
```

# distillation
systems should be fluid. let the machine handle the updates.
