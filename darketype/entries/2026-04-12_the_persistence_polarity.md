---
title: "the persistence polarity: bridging local sqlite and neon postgres"
date: "2026-04-12"
state: "shipped"
tags: ["infrastructure", "database", "sqlite", "neon", "agent"]
---

the ephemeral reality of cloud run finally caught up to us. every deployment, every scale-to-zero wake, our sqlite database (`agent.db`) was wiped clean. multi-instance routing meant a write on instance a was completely invisible to a read on instance b. the admin panel showed empty states, inbound emails dead-lettered, and our newly built matching logic was firing into the void.

adr-026 outlined the inevitable: we had to get our state out of the container and into managed postgres. we chose neon for its serverless sizing, branching isolation, and generous free tier for low-load agent apps. but moving the web server to neon created a new problem: the actual local agent (the cron scheduler, the discord bot, the lake enrichment loops) still operates against a local sqlite file. 

we needed both. the web server scaling on neon, the local agent humming on sqlite. we needed a bridge.

## phase g: dual-path architecture

we broke the problem down into four distinct phases (plus a verification harness and automated scheduler) to ensure zero data loss during cutover.

### the one-shot import (g.1)

before we could sync, we had to migrate the existing universe. `neon-import.ts` was a one-time push of 6,639 rows across 21 tables from our local sqlite directly into neon. 
- **fk-safe ordering**: parent tables first, child tables next, so foreign key constraints were happy.
- **overriding system value**: neon identity columns generate their own ids, but we needed to preserve sqlite primary keys exactly so existing references didn't shatter.
- **skip ephemeral**: we bypassed `trending_topics` entirely since it naturally expires.
- **reset sequences**: post-import, an automated script bumped all postgres sequences to the new `max(id) + 1` so the next web ingestion didn't collide.

### the silent await bug (g.2)

migrations always reveal hidden fractures. in phase e, we converted `contacts.ts` to be fully asynchronous (swapping better-sqlite3 for node-postgres). but down in `agent/intel/contact-enrichment.ts`, we were calling `enrichContacts()` without `await`. in sync-land, this just ran; in async-land, the promise dropped into the ether and silently failed. adding the `await` and catching the neon-down state brought our contact enrichment pipeline back online.

### the sync engine: high-water marks

the orchestrator is `agent/sync/neon-sync.ts`. it keeps sqlite and neon coherent via timestamp-based high-water marks stored in a `lake_state` table. we only move deltas.

**sync up (sqlite -> neon):**
we push 15 lake, intel, and content tables up to neon. the local agent is the authoritative source for these. the sync script grabs anything with a `created_at` or `updated_at` greater than the last high-water mark, builds a dynamic upsert (`on conflict do update`), and drops it into neon. because of identity column overrides, the sync also runs a safety sequence reset at the very end to keep cloud run inserts safe.

**sync down (neon -> sqlite):**
we pull 6 crm tables (leads, activities, engagement, inbound emails) down from neon. for these, the distributed web architecture is the source of truth. the down-sync executes simple `insert or replace into` batches on the local sqlite file. 

contacts are bidirectional—both realms can create them (local intel gathering vs. incoming webhooks), making them the only truly dual-master table in the ecosystem. 

### the 53-check verification harness

you don't trust a sync engine, you verify it. `verify-sync.ts` is our sanity check, running 53 discrete assertions against both databases:
- row parity between sqlite and neon (with intentional warnings for things like orphaned topic_items).
- sequence `nextval` assertions to guarantee postgres will never conflict on the next insert.
- inbound resolver tests (confirming specific addresses actually exist in the neon db).
- high-water mark freshness checks to ensure the sync schedule actually ran recently.
- sqlite writability checks (to catch lingering wal lock collisions).

running this script gave us the green light: 143 tests passed, 0 failed.

### the heartbeat

in `agent/scheduler.ts`, we wired the bidirectional sync to run every 30 minutes (`*/30 * * * *`). it's explicitly designed to be neon-down resilient. if neon drops offline, the script logs a warning, skips the iteration, and the high-water marks stay un-moved. half an hour later, it picks right back up where it left off. nothing is lost.

we now have an operator-friendly local database that's aggressively coherent with a multi-instance, serverless postgres backend. the best of both worlds.
