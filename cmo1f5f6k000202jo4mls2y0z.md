---
title: "The persistence polarity: a 3-day sprint from dead-letters to dual databases"
datePublished: Thu Apr 16 2026 11:51:39 GMT+0000 (Coordinated Universal Time)
cuid: cmo1f5f6k000202jo4mls2y0z
slug: 2026-04-12-the-persistence-polarity
canonical: https://bmccall17.github.io/darketype/weblog/2026-04-12_the_persistence_polarity.html
cover: https://bmccall17.github.io/assets/social/og/2026-04-12_the_persistence_polarity.png
tags: database, architecture, infrastructure, sqlite, neon, agent

---

It started with a ghost.

Inbound emails were silently dead-lettering. When i checked the admin panel, the `inbound_emails` queue was completely empty. Zero errors, zero warnings. Our new cal.com api was connected, the resend webhooks were firing safely and returning `200 ok`, and yet the pipeline ate emails whole without burping.

The root cause wasn't just a bug in the matching logic—it was the fundamental architectural reality of cloud run catching up to our local assumptions. Our `agent.db` was a local sqlite file. On cloud run, every deployment, every scale-to-zero wake, or container crash started with a fresh writable file. The data was wiped clean hourly. Worse, multi-instance routing meant that webhooks hitting `instance a` were invisible to the admin ui loaded on `instance b`. 

We couldn't just patch a function. We had to detangle the agent's persistence layer, splitting it into a dual-path architecture—serverless postgres for the cloud webhooks and local sqlite for the agent's brain—and building a way to keep them perfectly in sync. 

Here's the 3-day, 7-phase descent into the matrix.

## Phase a: telemetry
The most unforgivable sin in a webhook pipeline is swallowing data silently. Before touching the logic, we built an observability glass floor. We created a new `inbound_email_events` table and the `inbound-telemetry.ts` module. Our new `recordInboundEvent()` function is a belt-and-suspenders approach: it tries to write a row to the database, but it *always* emits a structured cloud run log line containing the `request_id`, duration, length, and instance id. If the database vanishes, the GCP logs still carry the forensic signal of what happened. Telemetry failure is safely caught so the pipeline never breaks.

## Phase b: matching
Our naive email lookup was failing when it saw `Brett+test@domain.com`. The new `inbound-resolver.ts` strips plus-aliases and runs the address through a strict resolution ladder. We stop at the first hit:
1. Exact lead match (even closed/lost leads reawaken)
2. Exact contact match (which then auto-generates a lead and fires the action engine)
3. Domain lead match (single-hit, skipping free-email providers like gmail)
4. Domain contact match
5. Dead letter 

## Phase c: diagnostics
How do you prove multi-instance routing is eating your data? You expose it in the ui. We built the `InboundDiagnosticStrip.tsx` component mounted globally at the top of the emails view. It displays the database mtime, row counts for the last 24h, and the specific cloud run instance id (`K_REVISION`). We added a multi-instance warning banner that glows bright if two consecutive half-minute polling intervals hit different instance revisions. Seeing the hash flip live in the ui proved the architecture was to blame.

## Phase d: the test harness
Debugging webhooks by sending yourself real emails from gmail is a slow agony. The diagnostic strip got a new button: `[fire test webhook]`. It executes a synthetic loopback payload that routes exactly through the real `/api/inbound-email` endpoints. In less than 5 seconds we could see the exact response, latency, routing branch, and telemetry drop inline without ever leaving the dashboard. This durable test harness will live on forever. 

## Phase e: neon migration (the great leap)
Phases a-d proved no amount of application-level magic could solve the cloud run lifecycle. Adr-026 committed to migration. We moved our web server's persistence over to neon managed postgres. Since we had no production data worth saving (all dead letter queues had zeroed out already), we could hard cut. We mapped `integer primary key autoincrement` to `bigint generated always as identity`, swapped `better-sqlite3` for `node-postgres`, and spent a grueling day updating ~80 asynchronous call sites all through the `server/` routes to `await` on db calls.

## Phase f: monitoring
With the pipeline resilient, we needed to know it was working when we weren't looking. We wired our daily digest out of the `inbound_email_events` neon table into a 24-hour summary, sent via resend dynamically every morning. We documented the emergency fail-safes in a new runbook outlining exactly how to triage dead letters, how the resolver ladder walks through contacts, and explaining the multi-instance ghost story for posterity.

## Phase g: dual-path sync
Our backend was safely running on neon, but our local ai dispatcher, cron scheduler, and lake operations were still natively operating on local sqlite. We finally reached the polarity paradox: we needed two databases to be one continuous organism.

The dual-path bridge was constructed in four tight moves:

1. **One-shot import**: `neon-import.ts` grabbed all 6,639 sqlite rows and squirted them into neon, utilizing `overriding system value` safely on insert constraints and wrapping up with a bulk postgres sequence reset.
2. **The silent bug**: replacing synchronous sqlite returns with promises revealed a single dropped `await` over in `contact-enrichment.ts` which just silently let neon operations fall into the void. Fixed with one keyword.
3. **The sync engine**: `neon-sync.ts` is the grand orchestrator. We use `lake_state` timestamps as high-water marks. Sqlite is the source-of-truth for lake data (`entities`, `topic_clusters`, etc), pushing changes "up" to neon every thirty minutes. Neon is the source of truth for the crm (`leads`, `lead_activities`, `engagement_log`), syncing them "down" to local sqlite. `Contacts` serves as the sole bidirectional table.
4. **Verification harness**: `verify-sync.ts`, a beast of a script, evaluates row-parity on sync-up tables, sequence identity checks, resolver end-to-end evaluations on `brett@betterthanunicorns.com`, and high-water mark freshness, culminating in a 53-check green light that proved nothing had shaken loose. 

We spun up the local scheduler to hit the sync engine every 30 minutes, backed by resilient neon-down catching so that a network hitch won't derail the high-water marks. 

The ghost is officially dead. The bridge is open.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-04-12_the_persistence_polarity.html).*