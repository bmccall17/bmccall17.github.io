---
title: "When the port.io pattern meets vertex ai"
slug: 2026-03-09-repoptics-meets-vertex
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-03-09_repoptics_meets_vertex.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-03-09_repoptics_meets_vertex.png"
seo_title: "When the port.io pattern meets vertex ai"
seo_description: "a friend suggested, "get repOptics into Vertex AI." what followed was exactly the kind of deep dive we engineered the port.io sprint for: look at..."
og_image: "https://bmccall17.github.io/assets/social/og/2026-03-09_repoptics_meets_vertex.png"
tags: repoptics, vertex-ai, gemini, learning, integration
seriesSlug: darketype-devlog
---

# When the port.io pattern meets vertex ai

A friend suggested, "get repOptics into Vertex AI." what followed was exactly the kind of deep dive we engineered the `port.io` sprint for: look at the existing codebase, map the tool's strengths, and find the high-leverage integration points before writing code. 

### The discovery 
RepOptics is great at heuristics. It can tell you if a `README.md` is longer than 1000 characters, or if an ADR exists. What it *can't* do is tell you if that README is actually useful, or if the ADR makes logical sense given the dependencies. 

Enter Gemini 2.5 Pro via Vertex AI. 

By wiring Gemini up as a post-heuristic layer, we aren't replacing the speed of our static checks—we're interpreting them. The AI is an additive intelligence overlay. 

### The billing reality check
A major lesson learned during planning: a Google One AI Premium ($19.99/mo) subscription does **not** grant access to developer API tokens for Vertex. It gives you Gemini Advanced on the consumer side (Docs, Gmail, etc). 

Fortunately, we already had $299.95 sitting dormant in a GCP project (`gen-lang-client-0261269167`) from the TarotTALKS build. So we committed fully to the Vertex AI backend. At ~$0.05 a scan with 2.5 Pro, we can afford thousands of deep-dive analyses before those credits run dry. 

### What's next
The plan is locked, and we've already started wiring the `@google/genai` unified SDK into `lib/gemini.ts`. Our initial tier focuses purely on context-aware reporting:
- Category-by-category narrative breakdowns
- True README quality analysis 
- Specific, actionable architectural recommendations instead of template strings

The pattern works. Understand the platform, map the strengths, wire it up. Let's see what happens when the first AI analysis report rolls in.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-03-09_repoptics_meets_vertex.html).*