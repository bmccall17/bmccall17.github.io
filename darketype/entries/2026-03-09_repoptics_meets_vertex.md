---
title: "when the port.io pattern meets vertex ai"
date: 2026-03-09
state: "optimistic"
tags: [repoptics, vertex-ai, gemini, learning, integration]
series: "darketype-devlog"
---

# when the port.io pattern meets vertex ai

a friend suggested, "get repOptics into Vertex AI." what followed was exactly the kind of deep dive we engineered the `port.io` sprint for: look at the existing codebase, map the tool's strengths, and find the high-leverage integration points before writing code. 

### the discovery 
repOptics is great at heuristics. it can tell you if a `README.md` is longer than 1000 characters, or if an ADR exists. what it *can't* do is tell you if that README is actually useful, or if the ADR makes logical sense given the dependencies. 

enter Gemini 2.5 Pro via Vertex AI. 

by wiring Gemini up as a post-heuristic layer, we aren't replacing the speed of our static checks—we're interpreting them. the AI is an additive intelligence overlay. 

### the billing reality check
a major lesson learned during planning: a Google One AI Premium ($19.99/mo) subscription does **not** grant access to developer API tokens for Vertex. it gives you Gemini Advanced on the consumer side (Docs, Gmail, etc). 

fortunately, we already had $299.95 sitting dormant in a GCP project (`gen-lang-client-0261269167`) from the TarotTALKS build. so we committed fully to the Vertex AI backend. at ~$0.05 a scan with 2.5 Pro, we can afford thousands of deep-dive analyses before those credits run dry. 

### what's next
the plan is locked, and we've already started wiring the `@google/genai` unified SDK into `lib/gemini.ts`. our initial tier focuses purely on context-aware reporting:
- category-by-category narrative breakdowns
- true README quality analysis 
- specific, actionable architectural recommendations instead of template strings

the pattern works. understand the platform, map the strengths, wire it up. let's see what happens when the first AI analysis report rolls in.
