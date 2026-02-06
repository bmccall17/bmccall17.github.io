---
title: "the art of making a mess"
date: 2026-02-06
state: "mess" # options: mess, learning, shipped, broken
tags: [meta, darketype, chaos]
next_experiment: "building the index"
---

# the problem
i needed a schema that was flexible enough to handle chaos but structured enough to parse later.

# the learning
markdown frontmatter is the perfect bridge. it's readable by humans (me) and machines (static site generators or php scripts).

# the mess
- i tried to make it pure json, but that killed the "writing flow".
- i considered a database first, but that violates the "mess" principle (too much friction).

# glimmers (code snippets)
```css
.mess {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
```

# distillation (optional)
start with structure, fill with chaos.
