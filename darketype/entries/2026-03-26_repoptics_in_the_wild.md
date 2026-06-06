---
title: "repoptics in the wild: building the tools to build the tools"
date: 2026-03-26
state: "shipped"
tags: [repoptics, security, idp, naval, building, agents]
series: "darketype-devlog"
next_experiment: "gathering user feedback and iterating"
---

# the problem
i met with my friend julio last night and we talked about the current market of ai builders. everyone is building agents and wrappers, but how many of them are actually testing their products for vulnerabilities? how many get tangled in the "rat's nest" that is so common from agentic building, especially by people who don't know code but just have a vision of what they want?

too many leaders are trying to have an opinion about ai without the intimacy of actually making with it. as diana nolan pointed out on linkedin recently, the proximity piece is everything — you can't think your way into understanding these tools. you have to make with them. learning by building changes the conversation. building turns abstraction into intimate contact, and failing at building heightens discernment and taste.

# the inspiration
naval said it best seven years ago: "learn to sell, learn to build. learn both and you will be unstoppable. it's easier for a builder to learn sales than for a seller to learn building."

i built repoptics because i needed to better qa, troubleshoot, and debug my own applications as i built them. i needed a mirror that didn't just tell me my code was messy, but showed me *where* the gaps were in my architecture, governance, and security.

# the solution
repoptics is now officially in the wild. it's an automated pentesting and ai-powered vulnerability analysis tool that orchestrates security agents against your repositories.

here is what the engine under the hood looks like now:

- **phase 2 pentest agents:** we shipped dynamic application security testing (dast) to probe security headers and endpoints, api security analysis for live endpoint probing and swagger/openapi static analysis, container audits for dockerfiles, and a comprehensive config audit agent. it scans everything from `.env.example` placeholder leaks to github actions anti-patterns.
- **security as a core metric:** security is no longer just a display item hidden in governance. it is the 6th scoring category alongside decisions, architecture, governance, delivery, and dependencies. if your branch protections and secret scanning aren't configured, your overall health grade drops. the grade should reflect reality.
- **port.io write-back:** i was introduced to internal developer portals (idps), specifically port.io ([which was a painful ocean integration at first](2026-03-05_port_ocean_pain.html), but [we pushed through](2026-03-06_port_pushes_back.html)), and it opened up a whole new layer. repoptics now has a context-aware floating widget ([that finally learned where it was](2026-03-17_widget_woke_up.html)) that allows users to push their live scan results directly back to their port.io entity. it turns the tool from a read-only mirror into a bidirectional control surface for organizational health.

# the distillation
the builders are going to see sooner, fail better, and translate with greater accuracy what is actually happening. if you aren't translating between the builders and the decision-makers, you aren't leading the change—you are just reacting to it.

repoptics is down to its essentials. time to ship, and time to ask people to push all the buttons.

* * *

here is the live link. go break things: **[https://rep-optics.onrender.com/](https://rep-optics.onrender.com/)**

*(be patient when you click — it's hosted on a free render instance right now, so it might need 30 to 60 seconds to wake up and rub the sleep out of its eyes if it hasn't been hit recently. don't refresh, just let the spinny wheel do its thing.)*
