---
title: "testing The mcp trust registry and lake stability"
datePublished: 2026-06-15T18:12:22.543Z
cuid: cmqfj64xo00000chve7j3cnv6
slug: testing-the-mcp-trust-registry-and-lake-stability
cover: https://cdn.hashnode.com/uploads/covers/69e0387df95c47e87f7727ca/f333db2e-7664-48d7-b483-13b0bd86f100.png

---

blah blah blah
It has been almost a month since the last major research update for [repOptics](https://rep-optics.onrender.com/). The context lake has grown and we have been busy wiring up new capabilities to measure repo trust and drag.

The big headline this week is our integration with the BlueRock MCP Trust Registry. If you are building agentic systems, you need a trust signal before you wire an external server into your context window. We now display a registry risk badge right beside the repo name on reports. We pull a batch registry snapshot and run a trust classification engine over it. It gives agents a concrete signal of what they are about to execute.

Our scan capabilities also got a major refactor over the last week. We shipped an IaC agent that now covers Terraform, CloudFormation, and serverless.yml. We also rolled out three-valued permission-gated guardrails—meaning a null result is explicitly marked as unverifiable rather than failing or passing silently. We also did a deep pass on claim hygiene, establishing pitfall norm ceilings and stable rates for the same engine versions.

Here is what the lake data said this week:
- Lake size: 12,838 scans
- Repositories: 4,311 repos
- Deltas: 8,529 scan deltas

The notable movement is our re-scan stability. 61% Of re-scans are stable within a +/-1 point margin. The average re-scan delta is hovering at -0.6 points. This means the scoring engine is holding steady even as the underlying codebases evolve. 

We also found visible AI-agent guidance files in 27% of scans. This is a solid chunk of the ecosystem explicitly telling agents how to behave in their repos. It proves visible evidence of AI integration is climbing.

A quick check on the pitfalls: duplicates failed in 68% of scans and governance failed in 57%. The ecosystem still struggles with the basics of keeping the repo clean.

This matters because the repo is the bottleneck. If your agents cannot trust the context or cannot read the infrastructure definitions, they will hallucinate or fail. By pulling in the BlueRock trust signals and hardening our own scan capabilities, we are giving AI a clearer map of what to trust.

If you want to see [how your repo scores](https://rep-optics.onrender.com/), run a scan and let me know what you think. You can reach out [here](https://bmccall17.github.io/book). RepOptics is a free forever project, if it brings value to your work and you'd like to support it, please [consider buying me a coffee](https://buymeacoffee.com/bmccall17) every little bit makes a difference.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-06-15_the_mcp_trust_registry_and_lake_stability.html).*