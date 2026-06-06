---
title: "the widget that finally learned where it was"
date: 2026-03-17
state: "shipped"
tags: [repoptics, port-io, context-awareness, shipped, building]
series: "darketype-devlog"
---

# the widget that finally learned where it was

repOptics has had a Port.io floating widget for a while. little violet button, bottom-right corner. click it and you get the global view — repo count, aggregate vulns, scorecard distributions across everything. same data on every page. didn't matter if you were staring at a specific repo's report or the landing. the widget didn't care. it showed you the same spreadsheet-energy summary regardless.

meanwhile, the AI chatbot — bottom-left — already knew where you were. navigate to a report page and it shifts context, knows the repo, knows the score, tailors its suggestions. that worked because of a `ReportContextBridge` component that fires a `CustomEvent` whenever you land on a report. the chatbot listens. the Port widget didn't. the architecture was already there. the wiring just stopped one component short.

### the gap

you're looking at `bmccall17/repOptics`, score 76, grade B. the AI chatbot says "ask me about this repo's scores." the Port widget says "you have 4 repos and 9 critical vulns across all of them." completely different energy. one is a lens. the other is a billboard.

what i actually wanted: when i'm on a report, show me *that repo's* Port entity. its scorecard rules — which ones pass, which ones fail. its Snyk posture. what services own it. and most importantly — how does the score i'm looking at right now compare to what Port has stored? is it drifting?

### score drift

this is the part that made the whole thing worth building. Port stores a `repOpticsScore` on each entity. the report page calculates a fresh score from the live scan. put them side by side and you get drift — a delta between what the catalog thinks and what's actually true right now.

```
Current: 76 (B)  ←→  Port: 72 (B)
         ▲ +4 improved
```

green trending arrow if the repo got better since last sync. red if it got worse. flat line if they match. and if Port has no score at all — "no previous score recorded" in italic zinc. no drama. the static fallback values are intentionally wrong so the drift is visible even without Port API credentials.

### the plumbing

one new API route: `/api/port/entity/{owner%2Frepo}`. URL-decode the identifier, try the live Port API for both `githubRepository` and `service` blueprints, fall back to static data if no credentials. five-minute cache so you're not hammering Port on every page transition.

the widget subscribes to `repoptics:report-data` — same event, same pattern as the chatbot. twelve lines of `useEffect`, almost verbatim. when the event fires with data, the widget transforms. when it fires with `null` (you navigated away), it reverts to the global summary. `AbortController` handles clicking through repos faster than the API can respond.

### what you actually see

navigate to a report and the widget title bar changes from "Port.io" to "Port.io · bmccall17/repOptics". the body swaps to four sections: score drift with trend indicators, snyk vulns in a crit/high/med/low grid, scorecards with per-rule pass/fail, and services that claim this repo. leave the report page — widget snaps back to global summary. no stale state. no flash of wrong data.

### the pattern

this is the third component using the `ReportContextBridge` event system (the bridge, the chatbot, the Port widget). fire a `CustomEvent` with context on mount, fire `null` on unmount, let consumers decide. no prop drilling, no global state library, no context providers wrapping the app. just DOM events. sometimes the boring thing is the right thing.

the drift indicator is read-only right now. the obvious next step is a "sync to Port" action — push the current score back to the entity. that turns the widget from a mirror into a control surface. but that's a different ADR.

*ADR-0015. the widget woke up.*
