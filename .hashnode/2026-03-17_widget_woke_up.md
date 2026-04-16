---
title: "The widget that finally learned where it was"
slug: 2026-03-17_widget_woke_up
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-03-17_widget_woke_up.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-03-17_widget_woke_up.png"
tags: repoptics, port-io, context-awareness, shipped, building
---

# The widget that finally learned where it was

RepOptics has had a Port.io floating widget for a while. Little violet button, bottom-right corner. Click it and you get the global view — repo count, aggregate vulns, scorecard distributions across everything. Same data on every page. Didn't matter if you were staring at a specific repo's report or the landing. The widget didn't care. It showed you the same spreadsheet-energy summary regardless.

Meanwhile, the AI chatbot — bottom-left — already knew where you were. Navigate to a report page and it shifts context, knows the repo, knows the score, tailors its suggestions. That worked because of a `ReportContextBridge` component that fires a `CustomEvent` whenever you land on a report. The chatbot listens. The Port widget didn't. The architecture was already there. The wiring just stopped one component short.

### The gap

You're looking at `bmccall17/repOptics`, score 76, grade B. The AI chatbot says "ask me about this repo's scores." the Port widget says "you have 4 repos and 9 critical vulns across all of them." completely different energy. One is a lens. The other is a billboard.

What i actually wanted: when i'm on a report, show me *that repo's* Port entity. Its scorecard rules — which ones pass, which ones fail. Its Snyk posture. What services own it. And most importantly — how does the score i'm looking at right now compare to what Port has stored? Is it drifting?

### Score drift

This is the part that made the whole thing worth building. Port stores a `repOpticsScore` on each entity. The report page calculates a fresh score from the live scan. Put them side by side and you get drift — a delta between what the catalog thinks and what's actually true right now.

```
Current: 76 (B)  ←→  Port: 72 (B)
         ▲ +4 improved
```

Green trending arrow if the repo got better since last sync. Red if it got worse. Flat line if they match. And if Port has no score at all — "no previous score recorded" in italic zinc. No drama. The static fallback values are intentionally wrong so the drift is visible even without Port API credentials.

### The plumbing

One new API route: `/api/port/entity/{owner%2Frepo}`. URL-decode the identifier, try the live Port API for both `githubRepository` and `service` blueprints, fall back to static data if no credentials. Five-minute cache so you're not hammering Port on every page transition.

The widget subscribes to `repoptics:report-data` — same event, same pattern as the chatbot. Twelve lines of `useEffect`, almost verbatim. When the event fires with data, the widget transforms. When it fires with `null` (you navigated away), it reverts to the global summary. `AbortController` handles clicking through repos faster than the API can respond.

### What you actually see

Navigate to a report and the widget title bar changes from "Port.io" to "Port.io · bmccall17/repOptics". The body swaps to four sections: score drift with trend indicators, snyk vulns in a crit/high/med/low grid, scorecards with per-rule pass/fail, and services that claim this repo. Leave the report page — widget snaps back to global summary. No stale state. No flash of wrong data.

### The pattern

This is the third component using the `ReportContextBridge` event system (the bridge, the chatbot, the Port widget). Fire a `CustomEvent` with context on mount, fire `null` on unmount, let consumers decide. No prop drilling, no global state library, no context providers wrapping the app. Just DOM events. Sometimes the boring thing is the right thing.

The drift indicator is read-only right now. The obvious next step is a "sync to Port" action — push the current score back to the entity. That turns the widget from a mirror into a control surface. But that's a different ADR.

*ADR-0015. The widget woke up.*