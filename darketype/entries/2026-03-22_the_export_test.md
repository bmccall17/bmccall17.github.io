---
title: "the export test"
date: 2026-03-22T08:00:00
state: "shipped"
tags: [repoptics, ai, report-quality, export, shipped]
series: "darketype-devlog"
next_experiment: "pentest phase 2 — dynamic agent selection and cross-agent correlation"
---

# the export test

## the problem

i built repOptics to scan GitHub repos and score them across five categories. it generates reports, runs AI analysis, even has a pentest lab. all very pretty in the browser. but then i exported a report as JSON and asked myself the question that actually matters:

*can a dev team hand this to an engineer and build a remediation plan from it?*

the answer was no.

the AI commentary — the most valuable part of the analysis — wasn't in the export at all. the guardrails section was a wall of `false` values with no guidance on how to flip them to `true`. the recommendations engine generated one recommendation for a repo with five failing checks. and both AI features (report commentary and pentest summary) were auto-firing on every page load, burning Vertex AI quota whether the user wanted them or not.

## what i shipped

two changes, one theme: **give the user control, and make the output actually useful.**

**AI is now opt-in.** both the report page and pentest page load with rule-based data only. no Gemini round-trip blocking the render. a button says "Generate AI Analysis" and the user decides when to spend that inference call. the report page went from server-blocking-on-AI to instant-load. the pentest summary shows a severity counts table immediately, with AI available on demand.

**the export got teeth.** every disabled guardrail now has inline remediation steps — not just "Branch Protection: false" but "Enable: Settings > Branches > Add rule." the recommendations engine covers all failing checks, not just a lucky subset. recommendations are sorted by priority (critical guardrails first, then governance gaps, then dependency updates). and if you generated AI commentary before exporting, it's included as a full section in both JSON and Markdown output.

## the mess

the interesting architectural decision was how to get AI commentary from a client component (the panel) into another client component (the export dialog) without prop drilling through the server component. the answer was a `CustomEvent`. when the AI panel gets its response, it dispatches `repoptics:ai-commentary` on `window`. the export dialog listens for it. no shared state, no context provider, no prop threading. just two components talking through the DOM event bus.

is it elegant? debatable. does it work without touching the server component's props? yes. and since the AI commentary is ephemeral (generated on demand, not persisted), an event-driven approach felt right. the data flows from user action to panel to event to export. if you never click the button, the export dialog simply disables the AI checkbox with "(generate AI analysis first)."

## glimmers

the moment that validated it: i exported the same repo as Markdown after the changes. the guardrails section went from seven lines of "Not detected" to seven lines of "Not detected" followed by *exactly how to fix each one*. the recommendations section went from one entry to twelve, sorted with the critical stuff at the top. and the AI analysis section — which previously didn't exist in exports — was right there at the bottom.

a junior engineer could read that Markdown file top to bottom and know exactly what to do on Monday morning. that's the bar.

## distillation

the browser is a demo. the export is the product. if the thing you ship to someone's inbox doesn't stand on its own, you haven't shipped anything — you've built a screenshot.
