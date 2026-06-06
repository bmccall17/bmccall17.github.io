---
title: "telling the tarottalks story"
date: "2026-06-06"
state: "shipped"
tags: [portfolio, shipping, tarottalks, design]
seo_description: "a reflection on the origin story, design iterations, and shifting from lookup tool to living ritual while building tarottalks."
series: "darketype-devlog"
next_experiment: "more iterations on the ritual"
---

# reflecting on the journey

the origin story of [tarottalks](https://tarottalks.app/) is entirely rooted in personal insight. i had been studying and working with tarot since 1993, and during a profoundly difficult season, i returned to a simple daily practice: draw one card, sit with the symbols, then find a ted or tedx talk that spoke to the archetype. day by day, the pattern grew clearer. constraint, liberation, vulnerability, reinvention. i mapped it intentionally until i had a complete framework: all 78 cards paired with curated talks.

![tarottalks story](../entries/media/2026-06-06_telling_the_tarottalks_story/cover.png)

# from insight to production

the speed of the build was something i hadn't fully appreciated until looking back at the timeline. 

on december 5, 2025, i gave a [pecha kucha talk](https://tarottalks.app/cards/knight-of-cups) in asheville about the framework. that was the first live audience test of the concept. six days later, tarottalks was in production. 

but the real product design lesson came after launch.

the first version was built around browsing and search. a standard catalog. but sitting with it, something felt off. the practice had always been about drawing, not browsing. so within three weeks of launch, i redesigned the entire home experience around a ritual: three cards cascade onto the screen face down, and you reveal them one by one. the invocation text above the cards pulls dynamically from the journaling prompts of whichever cards you drew, so the question itself feels like it emerged from the spread. 

that shift from lookup tool to living ritual was the design north star. the app needed to feel like the practice.

# the artifact of the build

looking back, we've shipped 47+ versioned releases since then. we iterated on everything from pwa home-screen support and sound design, to a social content ops tool called signal deck built into the admin, to an ai-powered "read my spread" feature that synthesizes a three-card draw into a single recommended talk. 

the rationale for those ai readings comes back written in second person, in the voice of a trusted friend who happens to know tarot. 

looking back at this build is a reminder: the best products we build are often the ones we build to save ourselves, which then become things we can offer to others.
