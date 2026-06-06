---
title: "Make the system explain itself"
seoTitle: "Make the system explain itself"
seoDescription: "at some point, every agentic stack becomes a black box. you know it's working because posts are going out. you know it's broken when they stop. the ga"
datePublished: Sat May 09 2026 19:45:39 GMT+0000 (Coordinated Universal Time)
cuid: cmoyr7ky0000102js9hurehf5
slug: 2026-04-29-make-the-system-explain-itself
canonical: https://bmccall17.github.io/darketype/weblog/2026-04-29_make_the_system_explain_itself.html
cover: https://bmccall17.github.io/assets/social/og/2026-04-29_make_the_system_explain_itself.png
ogImage: https://bmccall17.github.io/assets/social/og/2026-04-29_make_the_system_explain_itself.png
tags: architecture, observability, admin-panel, knowledge-graph, dashboards, agent828, status-rollup

---

# Make the system explain itself

At some point, every agentic stack becomes a black box.

You know it's working because posts are going out. You know it's broken when they stop. The gap between those two states — degraded, partially offline, silently failing — is invisible unless you build something to surface it.

This is the story of the architecture knowledge graph. Not a diagram. A live operational view.

## The starting problem

The admin panel had a HEALTH section with gauges. It had a content queue. It had AI telemetry logs. It had a scheduler view.

But none of it was spatial. None of it answered "what does this system actually DO and is it healthy right now?" in a single glance.

When the EVENTS node was reading the wrong database table and showing DEGRADED for two days, nobody caught it until a manual audit. The signal was there — in the logs, in the DB — but it wasn't connected to anything the operator could see without going looking.

## Phase 1: the static diagram

**V0.3.53** started as a vanilla SVG pipeline: six nodes, SCRAPE → ENRICH → GENERATE → APPROVE → PUBLISH → TRACK. One week's work. No new dependencies.

Click any node and it scrolls to the matching entry in the Architecture Reference accordion. The graph is not just a diagram. It's a navigation layer over the documentation.

The key constraint from ADR-030: **the graph is a one-way derivative of the system. It never defines it.**

Pipeline nodes are auto-derived from `ARCH_SECTIONS` prose. `Arch-graph-derive.ts` parses the numbered bold headings and backtick file paths in the pipeline section into typed nodes and edges at module load. If someone changes the architecture reference documentation, the next build changes the graph. The drift detector (vitest snapshot, 9 tests) catches it.

This is the important design decision: the graph cannot get out of sync with the docs because the docs generate it.

![Architecture knowledge graph showing 18 nodes across 4 clusters with live status dots — approve and inbound nodes amber](https://bmccall17.github.io/darketype/entries/media/2026-04-29_arch_graph/arch_graph_status.png)

## Phase 2: the expanded graph

**V0.3.53** expanded to 14 nodes across 4 labeled clusters: Pipeline, Storage, Admin Panel, Observability. SQLite. Neon Postgres. `/Api/admin/*`. Admin UI. Logger. `Audit_log`. `Admin_audit`. Health Digest.

Edge taxonomy: `flows_to` (solid), `writes_to` (solid/dim), `reads_from` (dashed), `syncs_to` (dotted/bidirectional), `depends_on` (thin). Each with distinct stroke styles and an inline legend.

Cluster filter pills. SVG `<title>` hover tooltips with file paths. The Email Workflow cluster shipped in **v0.3.55**: DRAFT, OUTBOUND, INBOUND, EVENTS. Four nodes. Five new edges. One new cluster.

The graph now shows which nodes touch Neon vs. SQLite. Which routes write to `email_events`. Which services depend on which. The spatial layout communicates what a routing table cannot.

![Architecture reference accordion with email workflow section expanded showing degraded status and offline pill on admin panel header](https://bmccall17.github.io/darketype/entries/media/2026-04-29_arch_graph/arch_accordion_degraded.png)

## Live operational status

**V0.3.56** turned the static diagram into a live operational view.

New endpoint: `GET /api/admin/architecture/status`. Returns status (healthy / degraded / offline / unknown) and a reason string for all 18 graph nodes. The internals fan out 10 Neon queries via `Promise.allSettled` — a single failed subquery degrades only the nodes it touches rather than 500ing the whole response.

Thresholds reuse existing logic: scheduler heartbeat stale at 20m/60m (matching the health digest), publish recency at 2h/24h (matching the AgentHealthGauge), email events at 24h/72h. One threshold definition, multiple surfaces.

The frontend polls every 30 seconds. Nodes adopt status colors: tactical green for healthy, amber for degraded, red for offline. A 3.5px dot in the top-right corner of each node rect. Tooltip shows `STATUS: DEGRADED — last email event: 1d ago`.

Initial render leaves all nodes as UNKNOWN so there's no flash of "all offline" while the fetch resolves. Then within 30 seconds the true state lands.

37 Tests. Pure function over synthetic input. No DB needed. Every threshold boundary tested.

![Admin overview attention banner showing 1 offline 2 degraded with node-level detail and view in graph link](https://bmccall17.github.io/darketype/entries/media/2026-04-29_arch_graph/attention_banner.png)

## The EVENTS bug

**V0.3.59** was a one-line fix with a bad comment at the bottom.

The EVENTS node was stuck DEGRADED with "last email event: 1d ago" even when outbound sends were succeeding. Root cause: `readEmailEvents()` was querying `lead_activities WHERE type='email'` — which catches inbound forwards only. Outbound lives in the dedicated `email_events` table.

The function comment said: "Resend webhook events land in `lead_activities` with `type='email'`." that comment was wrong.

Fixed to query `email_events.received_at`. Comment updated with a warning so future readers don't reintroduce the wrong-table trap.

The graph caught a bug the logs had been hiding. That is the payoff.

## Status propagation beyond the graph

**V0.3.60** took the status data and pushed it everywhere.

New rollup helpers in `arch-status-rollup.ts`: `worstNodeStatus(map, ids[])`, `rollupByCluster(map)`, `rollupByArchSection(map)`, `attentionList(map)`. Pure functions over the live `NodeStatusMap`. All four helpers use the same `SEVERITY` table so they agree.

New `AttentionBanner` component: renders nothing when all nodes are healthy. When something is degraded or offline, renders a tactical-amber or red strip with a count summary ("1 offline · 2 degraded") and a bullet list of `<NODE_LABEL> [STATUS] — <reason>`. Click-through to the graph.

Three mount points: Admin | Overview (above the KPI row), Admin | Agent | Overview (above the gauge cluster), and each Architecture Reference accordion header (DEGRADED or OFFLINE pill when the section's nodes roll up to that status). Healthy sections show no pill — the noise floor would be too high otherwise.

One poll. Three surfaces. All sharing the same 30-second `useArchitectureStatus` hook.

**V0.3.60** is the design decision worth defending: **derive status from real telemetry, not config.** the system shows you what is actually happening, not what was configured to be healthy. The difference between those two is the difference between a status page and a monitoring system.

## What it looks like now

Open Admin | Agent | Architecture. Within 30 seconds:

- Each of the 18 nodes has a status dot
- The cluster filter lets you isolate Pipeline, Storage, Email, Observability
- Hovering any node shows the file path, the last-seen time, and the reason for the current status
- The header reads "as of 14:32:07" not "generated view — read only"
- If anything is degraded, an amber banner is already visible on Admin | Overview before you even navigate to the graph

The architecture explains itself. The status propagates out. Operators don't have to hunt.

## Most agent stacks become black boxes within 6 months

Not because they're bad. Because the documentation is a snapshot and the system keeps moving. The architecture reference gets stale. The graph shows the old shape.

The one-way contract — the graph derives from the docs, the docs derive from the code, the status derives from telemetry — keeps the three in sync without anyone having to manually update all three when something changes.

If your agentic stack is invisible, the question isn't "what monitoring tool do I add?" it's "does the system have a surface that narrates itself?"

---

*Screenshots to add: the full architecture graph with status dots (amber on one node), the AttentionBanner rendered on Admin | Overview, the Architecture Reference accordion with a DEGRADED pill on one header*

## Distillation

A diagram describes the architecture. A live graph narrates it. The difference is whether the system can tell you when it's lying to you.

* * *

Shipped: static pipeline graph (v0.3.53), 4-cluster expansion + Email Workflow cluster (v0.3.53/v0.3.55), live status endpoint + 18-node status polling (v0.3.56), EVENTS node bug fix (v0.3.59), status propagation to dashboards + section headers + attention banner (v0.3.60). 37 Status tests + 9 derive snapshot tests.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-04-29_make_the_system_explain_itself.html).*