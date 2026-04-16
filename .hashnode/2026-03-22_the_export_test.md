---
title: "The export test"
slug: 2026-03-22_the_export_test
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-03-22_the_export_test.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-03-22_the_export_test.png"
tags: repoptics, ai, report-quality, export, shipped
---

# The export test

## The problem

I built repOptics to scan GitHub repos and score them across five categories. It generates reports, runs AI analysis, even has a pentest lab. All very pretty in the browser. But then i exported a report as JSON and asked myself the question that actually matters:

*Can a dev team hand this to an engineer and build a remediation plan from it?*

The answer was no.

The AI commentary — the most valuable part of the analysis — wasn't in the export at all. The guardrails section was a wall of `false` values with no guidance on how to flip them to `true`. The recommendations engine generated one recommendation for a repo with five failing checks. And both AI features (report commentary and pentest summary) were auto-firing on every page load, burning Vertex AI quota whether the user wanted them or not.

## What i shipped

Two changes, one theme: **give the user control, and make the output actually useful.**

**AI is now opt-in.** both the report page and pentest page load with rule-based data only. No Gemini round-trip blocking the render. A button says "Generate AI Analysis" and the user decides when to spend that inference call. The report page went from server-blocking-on-AI to instant-load. The pentest summary shows a severity counts table immediately, with AI available on demand.

**The export got teeth.** every disabled guardrail now has inline remediation steps — not just "Branch Protection: false" but "Enable: Settings > Branches > Add rule." the recommendations engine covers all failing checks, not just a lucky subset. Recommendations are sorted by priority (critical guardrails first, then governance gaps, then dependency updates). And if you generated AI commentary before exporting, it's included as a full section in both JSON and Markdown output.

## The mess

The interesting architectural decision was how to get AI commentary from a client component (the panel) into another client component (the export dialog) without prop drilling through the server component. The answer was a `CustomEvent`. When the AI panel gets its response, it dispatches `repoptics:ai-commentary` on `window`. The export dialog listens for it. No shared state, no context provider, no prop threading. Just two components talking through the DOM event bus.

Is it elegant? Debatable. Does it work without touching the server component's props? Yes. And since the AI commentary is ephemeral (generated on demand, not persisted), an event-driven approach felt right. The data flows from user action to panel to event to export. If you never click the button, the export dialog simply disables the AI checkbox with "(generate AI analysis first)."

## Glimmers

The moment that validated it: i exported the same repo as Markdown after the changes. The guardrails section went from seven lines of "Not detected" to seven lines of "Not detected" followed by *exactly how to fix each one*. The recommendations section went from one entry to twelve, sorted with the critical stuff at the top. And the AI analysis section — which previously didn't exist in exports — was right there at the bottom.

A junior engineer could read that Markdown file top to bottom and know exactly what to do on Monday morning. That's the bar.

## Distillation

The browser is a demo. The export is the product. If the thing you ship to someone's inbox doesn't stand on its own, you haven't shipped anything — you've built a screenshot.