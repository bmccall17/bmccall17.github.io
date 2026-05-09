---
title: "make the system explain itself"
date: 2026-04-29
state: shipped
tags: [agent828, architecture, observability, knowledge-graph, dashboards, status-rollup, admin-panel]
series: "agent828-build-arc"
og_image:
next_experiment: "phase 3: react flow + dagre auto-layout when node count exceeds 20"
---

# make the system explain itself

at some point, every agentic stack becomes a black box.

you know it's working because posts are going out. you know it's broken when they stop. the gap between those two states — degraded, partially offline, silently failing — is invisible unless you build something to surface it.

this is the story of the architecture knowledge graph. not a diagram. a live operational view.

## the starting problem

the admin panel had a HEALTH section with gauges. it had a content queue. it had AI telemetry logs. it had a scheduler view.

but none of it was spatial. none of it answered "what does this system actually DO and is it healthy right now?" in a single glance.

when the EVENTS node was reading the wrong database table and showing DEGRADED for two days, nobody caught it until a manual audit. the signal was there — in the logs, in the DB — but it wasn't connected to anything the operator could see without going looking.

## phase 1: the static diagram

**v0.3.53** started as a vanilla SVG pipeline: six nodes, SCRAPE → ENRICH → GENERATE → APPROVE → PUBLISH → TRACK. one week's work. no new dependencies.

click any node and it scrolls to the matching entry in the Architecture Reference accordion. the graph is not just a diagram. it's a navigation layer over the documentation.

the key constraint from ADR-030: **the graph is a one-way derivative of the system. it never defines it.**

pipeline nodes are auto-derived from `ARCH_SECTIONS` prose. `arch-graph-derive.ts` parses the numbered bold headings and backtick file paths in the pipeline section into typed nodes and edges at module load. if someone changes the architecture reference documentation, the next build changes the graph. the drift detector (vitest snapshot, 9 tests) catches it.

this is the important design decision: the graph cannot get out of sync with the docs because the docs generate it.

## phase 2: the expanded graph

**v0.3.53** expanded to 14 nodes across 4 labeled clusters: Pipeline, Storage, Admin Panel, Observability. SQLite. Neon Postgres. `/api/admin/*`. Admin UI. Logger. `audit_log`. `admin_audit`. Health Digest.

edge taxonomy: `flows_to` (solid), `writes_to` (solid/dim), `reads_from` (dashed), `syncs_to` (dotted/bidirectional), `depends_on` (thin). each with distinct stroke styles and an inline legend.

cluster filter pills. SVG `<title>` hover tooltips with file paths. the Email Workflow cluster shipped in **v0.3.55**: DRAFT, OUTBOUND, INBOUND, EVENTS. four nodes. five new edges. one new cluster.

the graph now shows which nodes touch Neon vs. SQLite. which routes write to `email_events`. which services depend on which. the spatial layout communicates what a routing table cannot.

## live operational status

**v0.3.56** turned the static diagram into a live operational view.

new endpoint: `GET /api/admin/architecture/status`. returns status (healthy / degraded / offline / unknown) and a reason string for all 18 graph nodes. the internals fan out 10 Neon queries via `Promise.allSettled` — a single failed subquery degrades only the nodes it touches rather than 500ing the whole response.

thresholds reuse existing logic: scheduler heartbeat stale at 20m/60m (matching the health digest), publish recency at 2h/24h (matching the AgentHealthGauge), email events at 24h/72h. one threshold definition, multiple surfaces.

the frontend polls every 30 seconds. nodes adopt status colors: tactical green for healthy, amber for degraded, red for offline. a 3.5px dot in the top-right corner of each node rect. tooltip shows `STATUS: DEGRADED — last email event: 1d ago`.

initial render leaves all nodes as UNKNOWN so there's no flash of "all offline" while the fetch resolves. then within 30 seconds the true state lands.

37 tests. pure function over synthetic input. no DB needed. every threshold boundary tested.

## the EVENTS bug

**v0.3.59** was a one-line fix with a bad comment at the bottom.

the EVENTS node was stuck DEGRADED with "last email event: 1d ago" even when outbound sends were succeeding. root cause: `readEmailEvents()` was querying `lead_activities WHERE type='email'` — which catches inbound forwards only. outbound lives in the dedicated `email_events` table.

the function comment said: "Resend webhook events land in `lead_activities` with `type='email'`." that comment was wrong.

fixed to query `email_events.received_at`. comment updated with a warning so future readers don't reintroduce the wrong-table trap.

the graph caught a bug the logs had been hiding. that is the payoff.

## status propagation beyond the graph

**v0.3.60** took the status data and pushed it everywhere.

new rollup helpers in `arch-status-rollup.ts`: `worstNodeStatus(map, ids[])`, `rollupByCluster(map)`, `rollupByArchSection(map)`, `attentionList(map)`. pure functions over the live `NodeStatusMap`. all four helpers use the same `SEVERITY` table so they agree.

new `AttentionBanner` component: renders nothing when all nodes are healthy. when something is degraded or offline, renders a tactical-amber or red strip with a count summary ("1 offline · 2 degraded") and a bullet list of `<NODE_LABEL> [STATUS] — <reason>`. click-through to the graph.

three mount points: Admin | Overview (above the KPI row), Admin | Agent | Overview (above the gauge cluster), and each Architecture Reference accordion header (DEGRADED or OFFLINE pill when the section's nodes roll up to that status). healthy sections show no pill — the noise floor would be too high otherwise.

one poll. three surfaces. all sharing the same 30-second `useArchitectureStatus` hook.

**v0.3.60** is the design decision worth defending: **derive status from real telemetry, not config.** the system shows you what is actually happening, not what was configured to be healthy. the difference between those two is the difference between a status page and a monitoring system.

## what it looks like now

open Admin | Agent | Architecture. within 30 seconds:

- each of the 18 nodes has a status dot
- the cluster filter lets you isolate Pipeline, Storage, Email, Observability
- hovering any node shows the file path, the last-seen time, and the reason for the current status
- the header reads "as of 14:32:07" not "generated view — read only"
- if anything is degraded, an amber banner is already visible on Admin | Overview before you even navigate to the graph

the architecture explains itself. the status propagates out. operators don't have to hunt.

## most agent stacks become black boxes within 6 months

not because they're bad. because the documentation is a snapshot and the system keeps moving. the architecture reference gets stale. the graph shows the old shape.

the one-way contract — the graph derives from the docs, the docs derive from the code, the status derives from telemetry — keeps the three in sync without anyone having to manually update all three when something changes.

if your agentic stack is invisible, the question isn't "what monitoring tool do I add?" it's "does the system have a surface that narrates itself?"

---

*screenshots to add: the full architecture graph with status dots (amber on one node), the AttentionBanner rendered on Admin | Overview, the Architecture Reference accordion with a DEGRADED pill on one header*

## distillation

a diagram describes the architecture. a live graph narrates it. the difference is whether the system can tell you when it's lying to you.

* * *

shipped: static pipeline graph (v0.3.53), 4-cluster expansion + Email Workflow cluster (v0.3.53/v0.3.55), live status endpoint + 18-node status polling (v0.3.56), EVENTS node bug fix (v0.3.59), status propagation to dashboards + section headers + attention banner (v0.3.60). 37 status tests + 9 derive snapshot tests.
