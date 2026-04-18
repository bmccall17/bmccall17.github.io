---
title: "Repoptics in the wild: building the tools to build the tools"
slug: 2026-03-26_repoptics_in_the_wild
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-03-26_repoptics_in_the_wild.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-03-26_repoptics_in_the_wild.png"
tags: repoptics, security, idp, naval, building, agents
---

# The problem
I met with my friend julio last night and we talked about the current market of ai builders. Everyone is building agents and wrappers, but how many of them are actually testing their products for vulnerabilities? How many get tangled in the "rat's nest" that is so common from agentic building, especially by people who don't know code but just have a vision of what they want?

Too many leaders are trying to have an opinion about ai without the intimacy of actually making with it. As diana nolan pointed out on linkedin recently, the proximity piece is everything — you can't think your way into understanding these tools. You have to make with them. Learning by building changes the conversation. Building turns abstraction into intimate contact, and failing at building heightens discernment and taste.

# The inspiration
Naval said it best seven years ago: "learn to sell, learn to build. Learn both and you will be unstoppable. It's easier for a builder to learn sales than for a seller to learn building."

I built repoptics because i needed to better qa, troubleshoot, and debug my own applications as i built them. I needed a mirror that didn't just tell me my code was messy, but showed me *where* the gaps were in my architecture, governance, and security.

# The solution
Repoptics is now officially in the wild. It's an automated pentesting and ai-powered vulnerability analysis tool that orchestrates security agents against your repositories.

Here is what the engine under the hood looks like now:

- **Phase 2 pentest agents:** we shipped dynamic application security testing (dast) to probe security headers and endpoints, api security analysis for live endpoint probing and swagger/openapi static analysis, container audits for dockerfiles, and a comprehensive config audit agent. It scans everything from `.env.example` placeholder leaks to github actions anti-patterns.
- **Security as a core metric:** security is no longer just a display item hidden in governance. It is the 6th scoring category alongside decisions, architecture, governance, delivery, and dependencies. If your branch protections and secret scanning aren't configured, your overall health grade drops. The grade should reflect reality.
- **Port.io write-back:** i was introduced to internal developer portals (idps), specifically port.io ([which was a painful ocean integration at first](2026-03-05_port_ocean_pain.html), but [we pushed through](2026-03-06_port_pushes_back.html)), and it opened up a whole new layer. Repoptics now has a context-aware floating widget ([that finally learned where it was](2026-03-17_widget_woke_up.html)) that allows users to push their live scan results directly back to their port.io entity. It turns the tool from a read-only mirror into a bidirectional control surface for organizational health.

# The distillation
The builders are going to see sooner, fail better, and translate with greater accuracy what is actually happening. If you aren't translating between the builders and the decision-makers, you aren't leading the change—you are just reacting to it.

Repoptics is down to its essentials. Time to ship, and time to ask people to push all the buttons.

* * *

Here is the live link. Go break things: **[https://rep-optics.onrender.com/](https://rep-optics.onrender.com/)**

*(Be patient when you click — it's hosted on a free render instance right now, so it might need 30 to 60 seconds to wake up and rub the sleep out of its eyes if it hasn't been hit recently. Don't refresh, just let the spinny wheel do its thing.)*

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-03-26_repoptics_in_the_wild.html).*