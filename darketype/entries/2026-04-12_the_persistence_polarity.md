---
title: "the persistence polarity: a 3-day sprint from dead-letters to dual databases"
date: "2026-04-12"
state: "shipped"
tags: ["infrastructure", "database", "sqlite", "neon", "agent", "architecture"]
---

it started with a ghost.

inbound emails were silently dead-lettering. when i checked the admin panel, the `inbound_emails` queue was completely empty. zero errors, zero warnings. our new cal.com api was connected, the resend webhooks were firing safely and returning `200 ok`, and yet the pipeline ate emails whole without burping.

the root cause wasn't just a bug in the matching logic—it was the fundamental architectural reality of cloud run catching up to our local assumptions. our `agent.db` was a local sqlite file. on cloud run, every deployment, every scale-to-zero wake, or container crash started with a fresh writable file. the data was wiped clean hourly. worse, multi-instance routing meant that webhooks hitting `instance a` were invisible to the admin ui loaded on `instance b`. 

we couldn't just patch a function. we had to detangle the agent's persistence layer, splitting it into a dual-path architecture—serverless postgres for the cloud webhooks and local sqlite for the agent's brain—and building a way to keep them perfectly in sync. 

here's the 3-day, 7-phase descent into the matrix.

## phase a: telemetry
the most unforgivable sin in a webhook pipeline is swallowing data silently. before touching the logic, we built an observability glass floor. we created a new `inbound_email_events` table and the `inbound-telemetry.ts` module. our new `recordInboundEvent()` function is a belt-and-suspenders approach: it tries to write a row to the database, but it *always* emits a structured cloud run log line containing the `request_id`, duration, length, and instance id. if the database vanishes, the GCP logs still carry the forensic signal of what happened. telemetry failure is safely caught so the pipeline never breaks.

## phase b: matching
our naive email lookup was failing when it saw `Brett+test@domain.com`. the new `inbound-resolver.ts` strips plus-aliases and runs the address through a strict resolution ladder. we stop at the first hit:
1. exact lead match (even closed/lost leads reawaken)
2. exact contact match (which then auto-generates a lead and fires the action engine)
3. domain lead match (single-hit, skipping free-email providers like gmail)
4. domain contact match
5. dead letter 

## phase c: diagnostics
how do you prove multi-instance routing is eating your data? you expose it in the ui. we built the `InboundDiagnosticStrip.tsx` component mounted globally at the top of the emails view. it displays the database mtime, row counts for the last 24h, and the specific cloud run instance id (`K_REVISION`). we added a multi-instance warning banner that glows bright if two consecutive half-minute polling intervals hit different instance revisions. seeing the hash flip live in the ui proved the architecture was to blame.

## phase d: the test harness
debugging webhooks by sending yourself real emails from gmail is a slow agony. the diagnostic strip got a new button: `[fire test webhook]`. it executes a synthetic loopback payload that routes exactly through the real `/api/inbound-email` endpoints. in less than 5 seconds we could see the exact response, latency, routing branch, and telemetry drop inline without ever leaving the dashboard. this durable test harness will live on forever. 

## phase e: neon migration (the great leap)
phases a-d proved no amount of application-level magic could solve the cloud run lifecycle. adr-026 committed to migration. we moved our web server's persistence over to neon managed postgres. since we had no production data worth saving (all dead letter queues had zeroed out already), we could hard cut. we mapped `integer primary key autoincrement` to `bigint generated always as identity`, swapped `better-sqlite3` for `node-postgres`, and spent a grueling day updating ~80 asynchronous call sites all through the `server/` routes to `await` on db calls.

## phase f: monitoring
with the pipeline resilient, we needed to know it was working when we weren't looking. we wired our daily digest out of the `inbound_email_events` neon table into a 24-hour summary, sent via resend dynamically every morning. we documented the emergency fail-safes in a new runbook outlining exactly how to triage dead letters, how the resolver ladder walks through contacts, and explaining the multi-instance ghost story for posterity.

## phase g: dual-path sync
our backend was safely running on neon, but our local ai dispatcher, cron scheduler, and lake operations were still natively operating on local sqlite. we finally reached the polarity paradox: we needed two databases to be one continuous organism.

the dual-path bridge was constructed in four tight moves:

1. **one-shot import**: `neon-import.ts` grabbed all 6,639 sqlite rows and squirted them into neon, utilizing `overriding system value` safely on insert constraints and wrapping up with a bulk postgres sequence reset.
2. **the silent bug**: replacing synchronous sqlite returns with promises revealed a single dropped `await` over in `contact-enrichment.ts` which just silently let neon operations fall into the void. fixed with one keyword.
3. **the sync engine**: `neon-sync.ts` is the grand orchestrator. we use `lake_state` timestamps as high-water marks. sqlite is the source-of-truth for lake data (`entities`, `topic_clusters`, etc), pushing changes "up" to neon every thirty minutes. neon is the source of truth for the crm (`leads`, `lead_activities`, `engagement_log`), syncing them "down" to local sqlite. `contacts` serves as the sole bidirectional table.
4. **verification harness**: `verify-sync.ts`, a beast of a script, evaluates row-parity on sync-up tables, sequence identity checks, resolver end-to-end evaluations on `brett@betterthanunicorns.com`, and high-water mark freshness, culminating in a 53-check green light that proved nothing had shaken loose. 

we spun up the local scheduler to hit the sync engine every 30 minutes, backed by resilient neon-down catching so that a network hitch won't derail the high-water marks. 

the ghost is officially dead. the bridge is open.

