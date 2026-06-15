---
title: "the mcp trust registry and lake stability"
date: 2026-06-15
state: "shipped"
tags: [repoptics, research, mcp, trust-registry, repo-health]
series: "reporesearch"
seoDescription: "repOptics integrates the BlueRock MCP Trust Registry for agentic trust signals. We also shipped an IaC agent and achieved 61% re-scan stability."
hashnodeSlug: the-mcp-trust-registry-and-lake-stability
hashnodeCover: "assets/2026-06-15_the_mcp_trust_registry_and_lake_stability.png"
---

it has been almost a month since the last major research update for [repOptics](https://rep-optics.onrender.com/). the context lake has grown and we have been busy wiring up new capabilities to measure repo trust and drag.

the big headline this week is our integration with the BlueRock MCP Trust Registry. if you are building agentic systems, you need a trust signal before you wire an external server into your context window. we now display a registry risk badge right beside the repo name on reports. we pull a batch registry snapshot and run a trust classification engine over it. it gives agents a concrete signal of what they are about to execute.

our scan capabilities also got a major refactor over the last week. we shipped an IaC agent that now covers Terraform, CloudFormation, and serverless.yml. we also rolled out three-valued permission-gated guardrails—meaning a null result is explicitly marked as unverifiable rather than failing or passing silently. we also did a deep pass on claim hygiene, establishing pitfall norm ceilings and stable rates for the same engine versions.

here is what the lake data said this week:
- lake size: 12,838 scans
- repositories: 4,311 repos
- deltas: 8,529 scan deltas

the notable movement is our re-scan stability. 61% of re-scans are stable within a +/-1 point margin. the average re-scan delta is hovering at -0.6 points. this means the scoring engine is holding steady even as the underlying codebases evolve. 

we also found visible AI-agent guidance files in 27% of scans. this is a solid chunk of the ecosystem explicitly telling agents how to behave in their repos. it proves visible evidence of AI integration is climbing.

a quick check on the pitfalls: duplicates failed in 68% of scans and governance failed in 57%. the ecosystem still struggles with the basics of keeping the repo clean.

this matters because the repo is the bottleneck. if your agents cannot trust the context or cannot read the infrastructure definitions, they will hallucinate or fail. by pulling in the BlueRock trust signals and hardening our own scan capabilities, we are giving AI a clearer map of what to trust.

if you want to see [how your repo scores](https://rep-optics.onrender.com/), run a scan and let me know what you think. you can reach out [here](https://bmccall17.github.io/book). repOptics is a free forever project, if it brings value to your work and you'd like to support it, please [consider buying me a coffee](https://buymeacoffee.com/bmccall17) every little bit makes a difference.
