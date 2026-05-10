---
title: "Runbooks and the power of diagnostic tools"
seoTitle: "Runbooks and the power of diagnostic tools"
seoDescription: "yesterday, during a long sprint on the TarotTALKS project, my admin portal started lagging hard. 11 of 12 API routes were silently timing out (10s+ li"
datePublished: Sun May 10 2026 01:37:40 GMT+0000 (Coordinated Universal Time)
cuid: cmoz3sa8t000202jtg6hae45i
slug: 2026-03-05-runbooks-tarottalks
canonical: https://bmccall17.github.io/darketype/weblog/2026-03-05_runbooks_tarottalks.html
cover: https://bmccall17.github.io/assets/social/og/2026-03-05_runbooks_tarottalks.png
ogImage: https://bmccall17.github.io/assets/social/og/2026-03-05_runbooks_tarottalks.png
tags: debugging, diagnostics, runbooks, systems-thinking, tarottalks

---

# The admin portal lag

Yesterday, during a long sprint on the [TarotTALKS](https://tarottalks.app/) project, my admin portal started lagging hard. 11 Of 12 API routes were silently timing out (10s+ limits), leaving the dashboard virtually non-functional. 

When we actually dug into it, it wasn't just a single issue. The problem had layers:
1. **Drizzle ORM Date Bugs**: passing JavaScript `Date` objects directly to Drizzle queries was causing silent, infinite hangs. No errors, no logs, just a hung serverless function.
2. **Vercel Function Limits**: our admin routes were exceeding Vercel's default 10-second timeout on the Hobby plan.
3. **Stale Builds**: even after deploying fixes, Vercel was sometimes caching and serving old function code. 

Fixing one layer wouldn't have solved the problem. We had to build explicit diagnostic tools to isolate and verify each layer independently. The tools providing database health check endpoint, per-query behavior debug route, and in-browser admin diagnostics script. Fixing issues blind is frustrating, but having the right tools makes it a superpower. And its what my systems thinking brains love! The process solidified for me that diagnosing and debugging tools are vibing magic!!

# Capturing the knowledge: runbooks

After finally resolving the performance issues (bringing the average API response time from 4,500ms+ down to 149ms and getting 25/26 endpoints passing), i realized something important. I gave this prompt:

> "I want us to better understand why this happened in the first place... And as my focus and needs from this project come and go i want to be able to leverage the tools we built and understand what to check again in the future!"

When you aren't working on a project every single day, context degrades rapidly. When things break six months from now, i wouldn't remember the exact intricacies of Drizzle object serialization or Vercel's caching behaviors. 

That led to the creation of **runbooks**.

I followed up with another prompt:

> "Ok, now please organize this runbook in a logical place where you can find it in the future. Plus please look back at the rest of this project history and let's identify any other runbooks that should be made for future reference."

# Building for the future

We ended up auditing the entire project history and creating a centralized suite of 6 operational runbooks (`devnotes/runbooks/`):
- **Admin-performance.md**: tracking the "three traps" of timeouts, stale builds, and db health.
- **Database-safety.md**: safe seeding workflows and recovery options (based on a data loss incident from last december).
- **Cost-control.md**: weekly audit checklists and spike diagnosis guides.
- **Security-checklist.md**: baseline vulnerabilities and secret rotation procedures.
- **Social-share-images.md**: satori/supabase diagnosis flowcharts.
- **Deployment-vercel.md**: stale build detection and maxDuration limits.

Each runbook is structured uniformly: quick diagnosis steps at the top, deeper context below, and exact file references at the bottom. 

It feels like a super strong win to learn this. I'm starting to better understand runbooks, how to use them, and when to use them. They bridge the gap between "i fixed this complicated issue once" and "i can effortlessly check system health and fix this again a year from now."

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-03-05_runbooks_tarottalks.html).*