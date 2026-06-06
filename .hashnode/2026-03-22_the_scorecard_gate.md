---
title: "The scorecard gate: enforcing deployment readiness"
slug: 2026-03-22-the-scorecard-gate
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-03-22_the_scorecard_gate.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-03-22_the_scorecard_gate.png"
seo_title: "The scorecard gate: enforcing deployment readiness"
seo_description: "i'm building a demo environment to illustrate how managed services can be governed within an Internal Developer Portal (IDP). the scenario: three Spor"
og_image: "https://bmccall17.github.io/assets/social/og/2026-03-22_the_scorecard_gate.png"
tags: devops, developer-experience, api, ai-tools, scorecards
seriesSlug: darketype-devlog
---

# The setup

I'm building a demo environment to illustrate how managed services can be governed within an Internal Developer Portal (IDP). The scenario: three Sportradar microservices — `feed-normalization`, `match-events-ingest`, `odds-calculation-engine` — modeled in a software catalog with a Game-Day Readiness scorecard. The demo moment: a "Deploy to Production" action that's *gated* on scorecard tier. Only Gold services can deploy during live events. Silver services see the action blocked. The audience sees why scorecards matter — not as vanity metrics, but as operational guardrails.

To build the proof-of-concept, i used port.io as the IDP. 

The blueprints went in clean. Three entities with properties (tribe, criticality, on-call contact, SLO targets, language). The scorecard created fine — 8 rules across CI/CD pipeline, documentation, SLO availability, dependency scanning. `Match-events-ingest` hit Gold. The other two landed at Silver. The differentiation was visible and real. 91.67% Rules passed across the board.

![Game-day readiness scorecard — 91.67%, 24 rules, 22 passed](https://bmccall17.github.io/darketype/entries/media/2026-03-22_scorecard_gate/no_scorecard_widget.png)

Then i tried to add the actual gate.

# The mess

## The deprecated endpoint dance

First attempt: making an API call to create the action endpoint that the tool's own documentation and AI assistant both suggest.

```json
{
  "ok": false,
  "message": "This endpoint is deprecated. Please use '/actions' instead."
}
```

No warning in the docs. No deprecation notice on the API reference page. Just a flat rejection at runtime. Fine — switch to the new endpoint. But the new endpoint has a different schema contract: if you include a `condition`, you now *must* include the identifier implicitly inside the `trigger` object. The old endpoint inferred it from the URL path. The new one doesn't.

```json
{
  "ok": false,
  "message": "\"trigger\" must have property blueprintIdentifier when property condition is present"
}
```

Two errors deep and i haven't even gotten to the actual condition yet.

## The condition schema lottery

Here's the condition i wanted — a JQ expression that checks if the entity's scorecard level is Gold:

```json
"condition": {
  "type": "JQ",
  "expressions": [
    ".entity.scorecards.game_day_readiness.level == \"Gold\""
  ],
  "combinator": "and"
}
```

This is what the tool's documentation showed. `Expressions` array, `combinator`, `type: "JQ"`. Clean, readable, makes sense.

The API disagrees:

```json
{
  "ok": false,
  "message": "\"trigger/condition\" must have required property 'rules'"
}
```

`Expressions` is rejected. The API wants `rules`. So i restructure:

```json
"condition": {
  "type": "JQ",
  "combinator": "and",
  "rules": [
    {
      "operator": "JQ",
      "value": ".entity.scorecards.game_day_readiness.level == \"Gold\""
    }
  ]
}
```

Gave up on the API at this point and tried the UI. Pasted the JSON into the condition editor. Red squiggle: **"Value must be SEARCH."** the UI workflow wouldn't accept `JQ` as a condition type. The API wouldn't accept `expressions`. The docs showed `expressions`. Three different schemas for the exact same concept depending on where you're configuring it.

I finally tried the `SEARCH` type in the UI. It accepted the condition — but instead of showing "Deploy to Production" as visually blocked for Silver services, the action disappeared entirely using that logic. The gating didn't show a locked door. It removed the door from the hallway. The exact demo moment i needed — "see, this service *can't* deploy because it's Silver" — was impossible. The action just vanished from the portal.

## AI assistants: from hero to liability

When setting this up initially, the IDP's native AI assistant was the redeeming moment. After hours of fighting wizards and grayed-out buttons, i asked the AI for help and it just *worked*. Built a scorecard table view in under a minute. I thought: "if they leaned harder into this as the onboarding path, the entire evening of pain could have been 10 minutes."

A few days later, i asked the same AI for help creating the deploy action. It generated a bash script. Here's what the script contained:

```bash
PORT_CLIENT_SECRET="_API_URL="https://api..."
```

The secret and the API URL smashed into one variable assignment. It gets worse:

```bash
TOKENPORT_API_URL}/auth/access_token" \
```

The token curl command with the variable name eaten by the URL. And:

```bash
curl -s -X POST "${PORT_API_URLrints/sportradar_service/actions" \
  "identifier": "deploy_": "Deploy to Production",
```

The URL mangled (`URLrints` instead of `URL}/blueprints`), the identifier and title smashed together (`"deploy_": "Deploy"`), and at the bottom of the bash script — literal markdown:

```
**What I changed:**
**Run this now** and it should work!
```

Markdown. In a bash script. With emoji.

This isn't a hallucination in the interesting sense. The AI didn't make up a plausible-sounding wrong answer. It generated text that wouldn't pass a syntax check. Truncated variable names, mangled URLs, mixed format languages. The thing that saved me earlier is now generating code that would fail `bash -n`.

The AI also kept referring to `sportradar_service` as if it were an entity name rather than a blueprint identifier. The UI displays the blueprint *title* ("Service") not its *identifier* (`sportradar_service`), so even the AI gets confused about what things are called inside its own platform context.

![The UI shows "Service" — the identifier is sportradar_service](https://bmccall17.github.io/darketype/entries/media/2026-03-22_scorecard_gate/no_sportradar_service.png)

# The fix

I eventually gave up on the hard gate. Created the Deploy to Production action without a condition. Plan to describe the gating verbally in the demo: "and we can gate deployment actions on scorecard tier — only Gold services deploy to production during live events. That's what would have prevented the Tribe 3 incident." the panel will see the scorecard tiers and logically put it together.

The things that *did* work in the POC are genuinely good. Three services with real properties, tribes, criticality tiers, on-call contacts. A scorecard that differentiates meaningfully — `match-events-ingest` at Gold, the other two at Silver. A dashboard with a scorecard tier donut chart, a services-by-criticality bar chart, and a full entity table. A working Request Security Review action. The builder view showing the full entity graph.

![The dashboard — pie charts, bar chart, entity table, all working](https://bmccall17.github.io/darketype/entries/media/2026-03-22_scorecard_gate/dashboard.png)

![The builder view — entity graph with services, tribes, and relations](https://bmccall17.github.io/darketype/entries/media/2026-03-22_scorecard_gate/builder_view.png)

![Match-events-ingest — Gold tier, 100% scorecard rules passed](https://bmccall17.github.io/darketype/entries/media/2026-03-22_scorecard_gate/service_match_events_ingest.png)

The catalog works. The scorecards work. The dashboard works. The thing that broke down was the one nuanced feature that ties them together into an active governance story.

# The learning

A previous lesson i held sacred: "when a vendor's easy path is broken, go straight to the API." that lesson expired tonight. Tonight the API itself was the problem — not because it doesn't work, but because its schema is a moving target. Deprecated endpoints that the docs still reference. Field names that changed (`expressions` → `rules`) without the error messages telling you what they changed *to*. Condition types that differ between the API (`JQ`) and the UI (`SEARCH`).

The new lessons:

1. **Ai can't be the onboarding crutch if it doesn't know the current api schema.** an AI assistant is powerful when working inside its own UI, building views and tables from an existing catalog. It breaks down the moment it has to generate API calls against its own evolving backend. The AI knows the product concepts but not the current implementation details. That's the worst kind of knowledge gap — it sounds right and fails silently.

2. **Developer tools need error messages that teach, not just reject.** `"must have required property 'rules'"` is a rejection. `"The 'expressions' format was replaced by 'rules' in v2 — see the docs for the current schema"` is teaching. Every round-trip guess i made tonight could have been eliminated by an error message that pointed to the right answer.

3. **The product underneath is still genuinely powerful — and that makes the gaps more frustrating, not less.** i'm not frustrated because the IDP is bad. I'm frustrated because i can see exactly how good it *should* be. The scorecard differentiation is real. The dashboard visualization is real. The entity model is flexible and expressive. But adding a condition to gate an action on a scorecard — the feature that connects all of these pieces into a governance narrative — took 30+ minutes of schema guessing and ultimately failed. The closer you get to a powerful feature, the more the rough edges hurt.

# Distillation

The scorecard gate is a perfect metaphor for the current state of developer experience (DX) specifically around internal portals. The feature exists. The value is real. A platform that can say "this service can't deploy because it hasn't met its readiness criteria" is exactly what engineering orgs need in 2026. But the path to configuring it — deprecated endpoints, schema drift, AI that generates broken scripts, three different condition formats depending on whether you're in the API, the UI, or the docs — is blocked by the very friction the platform is supposed to eliminate for its customers.

The best developer tools have a property: the first 5 minutes feel like magic. But later, the magic wears off and the rough edges are all that's left. The scorecard gate never opened — not because the feature doesn't work, but because finding the right incantation to configure it was harder than building everything else combined.

Despite the configuration friction, mapping our architecture into [port.io](https://getport.io) definitively proved the operational potential of a governed software catalog. The experiment isn't over. Next up: we're spinning up Port's recently released MCP (Model Context Protocol) Server for Claude Code to see if an autonomous agentic workflow can navigate their API schema better than we did.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-03-22_the_scorecard_gate.html).*