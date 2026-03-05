---
title: "runbooks and the power of diagnostic tools"
date: 2026-03-05
state: "debugging"
tags: [runbooks, debugging, diagnostics, tarottalks, systems-thinking]
next_experiment: "where else do we need runbooks now"
---

# the admin portal lag

yesterday, during a long sprint on the [TarotTALKS](https://tarottalks.app/) project, my admin portal started lagging hard. 11 of 12 API routes were silently timing out (10s+ limits), leaving the dashboard virtually non-functional. 

when we actually dug into it, it wasn't just a single issue. the problem had layers:
1. **Drizzle ORM Date Bugs**: passing JavaScript `Date` objects directly to Drizzle queries was causing silent, infinite hangs. no errors, no logs, just a hung serverless function.
2. **Vercel Function Limits**: our admin routes were exceeding Vercel's default 10-second timeout on the Hobby plan.
3. **Stale Builds**: even after deploying fixes, Vercel was sometimes caching and serving old function code. 

fixing one layer wouldn't have solved the problem. we had to build explicit diagnostic tools to isolate and verify each layer independently. the tools providing database health check endpoint, per-query behavior debug route, and in-browser admin diagnostics script. fixing issues blind is frustrating, but having the right tools makes it a superpower. and its what my systems thinking brains love! the process solidified for me that diagnosing and debugging tools are vibing magic!!

# capturing the knowledge: runbooks

after finally resolving the performance issues (bringing the average API response time from 4,500ms+ down to 149ms and getting 25/26 endpoints passing), i realized something important. i gave this prompt:

> "i want us to better understand why this happened in the first place... and as my focus and needs from this project come and go i want to be able to leverage the tools we built and understand what to check again in the future!"

when you aren't working on a project every single day, context degrades rapidly. when things break six months from now, i wouldn't remember the exact intricacies of Drizzle object serialization or Vercel's caching behaviors. 

that led to the creation of **runbooks**.

i followed up with another prompt:

> "ok, now please organize this runbook in a logical place where you can find it in the future. plus please look back at the rest of this project history and let's identify any other runbooks that should be made for future reference."

# building for the future

we ended up auditing the entire project history and creating a centralized suite of 6 operational runbooks (`devnotes/runbooks/`):
- **admin-performance.md**: tracking the "three traps" of timeouts, stale builds, and db health.
- **database-safety.md**: safe seeding workflows and recovery options (based on a data loss incident from last december).
- **cost-control.md**: weekly audit checklists and spike diagnosis guides.
- **security-checklist.md**: baseline vulnerabilities and secret rotation procedures.
- **social-share-images.md**: satori/supabase diagnosis flowcharts.
- **deployment-vercel.md**: stale build detection and maxDuration limits.

each runbook is structured uniformly: quick diagnosis steps at the top, deeper context below, and exact file references at the bottom. 

it feels like a super strong win to learn this. i'm starting to better understand runbooks, how to use them, and when to use them. they bridge the gap between "i fixed this complicated issue once" and "i can effortlessly check system health and fix this again a year from now."
