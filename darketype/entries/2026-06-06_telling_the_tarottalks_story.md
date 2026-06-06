---
title: "telling the TarotTALKS story"
date: "2026-06-06"
state: "shipped"
tags: [portfolio, shipping, tarottalks, design]
seo_description: "a reflection on the origin story, design iterations, and shifting from lookup tool to living ritual while building TarotTALKS."
series: "darketype-devlog"
next_experiment: "more iterations on the ritual"
---

# reflecting on the journey

the origin story of [TarotTALKS](https://tarottalks.app/) is entirely rooted in personal insight. i had been studying and working with tarot since 1993, and during a recent profoundly difficult season, i returned to a simple daily practice: draw one card, sit with the symbols... but this time i decided to add a layer: find a TED talk that spoke to the archetype of each respective archetype represented by the card i drew. day by day, the pattern grew clearer. constraint, liberation, vulnerability, reinvention. i mapped it intentionally until i had a complete framework: all 78 cards paired with curated talks.

![TarotTALKS story](../entries/media/2026-06-06_telling_the_tarottalks_story/cover.png)

# from insight to production

the speed of the build was something i hadn't fully appreciated until i wrote it down for this application.

on december 5, 2025, i gave a [pecha kucha talk](https://tarottalks.app/talks/brett-a-mccall-connecting-tarot-cards-to-ted-talks) in asheville about the framework. that was the first live audience test of the concept. six days later, TarotTALKS was in production.

but the real product design lesson came after launch.

the first version was built around browsing and search. a standard catalog. but sitting with it, something felt off. the practice had always been about exploring with unseen forces... drawing a single card to reveal the WAH (what's actually happening), and then looking for that archetype to show up in the physical world. within three weeks of launch, i redesigned the entire home experience around a ritual: three cards cascade onto the screen face down, and you reveal them one by one. the invocation text above the cards pulls dynamically from the journaling prompts of whichever cards you drew, so the question itself feels like it emerged directly from the spread.

that shift from lookup tool to living ritual was the design north star. the app needed to feel like the practice.

# the artifact of the build

looking back, i've shipped 47+ versioned releases since then. i iterated on everything from pwa home-screen support and sound design, to a social content ops tool i called Signal Deck built into the admin, to an AI-powered "read my spread" feature that synthesizes a three-card draw into a single recommended talk. this provided infinite possible talks to be revealed depending on the seeker's spread and question.

the rationale for those AI readings comes back written in second person, in the voice of a trusted friend who happens to know tarot.

putting this application together was a reminder: the best products we build are often the ones we build to save ourselves, which then become things we can offer to others.

---

i wrote about some of this publicly: on [runbooks and systems thinking](https://darketype.hashnode.dev/2026-03-05-runbooks-tarottalks), and on [how a bug became a design decision](https://darketype.hashnode.dev/2026-04-14-fibonacci-magic), using a TarotTALKS-referenced talk as the framing.
