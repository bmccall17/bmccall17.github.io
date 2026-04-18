---
title: "Port pushes back (and then it doesn't)"
datePublished: Thu Apr 16 2026 11:51:34 GMT+0000 (Coordinated Universal Time)
cuid: cmo1f5bb8000502jv7hyd61oj
slug: 2026-03-06-port-pushes-back
canonical: https://bmccall17.github.io/darketype/weblog/2026-03-06_port_pushes_back.html
cover: https://bmccall17.github.io/assets/social/og/2026-03-06_port_pushes_back.png
tags: devops, services, integration, github-actions, port, snyk, self-service, scorecards

---

# The sequel

[Yesterday](2026-03-05_port_ocean_pain.md) was about pain — fighting the ocean integration, the grayed-out button, the docker image wall. Today was about pushing past that and seeing how far the platform actually goes. Spoiler: pretty far, but every step has a catch.

# What got built

## Snyk enrichment

The `port-ocean-sync.yml` workflow now does double duty. After syncing repos from github, it queries the snyk API for vulnerability counts and merges them onto the same repo entities. Each repo now carries `snykVulnCritical`, `snykVulnHigh`, `snykVulnMedium`, `snykVulnLow`, and `snykMonitored` as properties. This took one extra workflow step and zero new infrastructure.

On top of that, a `security_posture` scorecard grades every repo: Snyk Monitored = Bronze, No Critical Vulns = Silver, No Critical + No High = Gold. Four scorecards now — decision_clarity, governance_standards, delivery_maturity, security_posture. The catalog went from "list of repos" to "list of repos with opinions."

## Dashboard

A "Scorecard Overview" dashboard page, created via `POST /v1/pages`. Eight widgets: markdown header explaining what you're looking at, a full entity table, four pie charts (one per scorecard showing level distribution), a repOptics grades pie, and a language distribution pie. All done in a single API call. No UI clicking. The REST API continues to be the best part of Port.

## Service entities and the entity graph

This is where it got interesting. Port had a `service` blueprint sitting empty. We filled it:

- Added properties: description, type (web-app/game/tool/platform/etc), tier (production/experimental/internal), lifecycle (active/maintained/archived), tech stack, live URL
- Added a `repositories` relation (service -> many githubRepository)
- Created 12 services mapping to all 15 repos

The real insight: two of those services — IDS and Forbidden Desert XR — are partykit projects that never touch github. They have no repos, no scorecards, no snyk data. But they still exist in the catalog as first-class services with URLs, tech stacks, and lifecycle status. This is what Port means by "software catalog" vs "github mirror." you can model things that aren't in your SCM.

## Self-service action (the one that doesn't work yet)

Registered a "Run repOptics Scan" action on the githubRepository blueprint. The idea: click a button on any repo in Port, it triggers a github actions workflow that runs the repOptics scanner, writes scores back to the entity, and reports success/failure to Port. The workflow file exists, the action is registered, the scanner works locally (repOptics scores itself B, 74/100).

But it doesn't fire.

# The catches

## Identifier chaos (the sequel)

Round one: the ocean sync workflow was building entity identifiers as `bmccall17_repoName`. The Port GitHub Ocean integration uses just `repoName`. Duplicates everywhere. Fixed the identifiers, deleted the dupes, moved on.

Round two: installed the Port GitHub App (needed for self-service actions — see below). The app immediately spun up an old-style "Exporter" integration that started syncing repos with the short `repoName` identifier. Meanwhile the Ocean integration uses `bmccall17/repoName`. So now *three* sources were creating repository entities: the old exporter (wrong identifiers), the ocean integration (correct identifiers), and snyk (also correct identifiers). Repos tripled. The data sources page looked like a graveyard — two "Sunset" integrations you didn't ask for, one working ocean sync, and snyk quietly doing its thing.

The fix: suspend the old exporter and gitops integrations (they're deprecated anyway), delete all entities with the short identifier format, and update all three identifier constructions in the custom workflows to use `owner/repo` format. `Port-ocean-sync.yml` had two: one using `.name` (changed to `.full_name`) and one actively stripping the owner prefix with `cut -d'/' -f2` (changed to just using the full name). `Port-repoptics-scan.yml` had one: changed `${{ inputs.repo }}` to `${{ inputs.owner }}/${{ inputs.repo }}`.

Lesson refined: it's not just "match the identifier format." it's "understand that installing a github app might silently create a second integration that uses a *different* identifier format than your existing one, and there's no warning." the platform assumes you want every integration it can spin up. You have to actively shut down the ones you don't.

## The github app gap (resolved)

The self-service action uses Port's `GITHUB` invocation method, which means Port needs to call the github API to trigger `workflow_dispatch`. This requires Port's GitHub App to be installed on the repo with Actions write permission. The app wasn't installed. Port's UI gives no error — the action just hangs forever showing "in progress." no timeout, no failure message, no hint about what's missing.

Installed the app. Port triggered the workflow. It actually fired. The scan ran, scored the repo, wrote results back to Port, reported success. The whole loop works now — click a button in Port, get a health report. The irony: installing the app to fix one problem (workflow dispatch) created another problem (duplicate entities from the old exporter). Classic integration cascade.

## The ocean integration's missing token

The `main.yml` ocean-sail workflow was syncing repos fine but failing on pull requests and users. Turns out the config block was missing the github token entirely — it was only passing `github_host`. PRs and users need authenticated access. One-line fix, but it explained why 8 PRs and 7 users were failing every sync.

## `"Type": "module"` rabbit hole

Wanted to run the repOptics scanner as a standalone script from github actions. The scanner imports `octokit` v5 which is ESM-only. The project's package.json didn't have `"type": "module"` because Next.js handles module resolution internally. Tsx in CJS mode can't import ESM packages. Tried: `node --experimental-strip-types`, `tsx -e`, `.mts` extension, `--loader tsx`. None worked until we added `"type": "module"` to package.json and `tsx` as a devDep. Then had to exclude `scripts/` from tsconfig so Next.js wouldn't try to type-check the scanner script. Then had to redirect `console.log` to stderr in the script because the scanner logs to stdout and we need clean JSON output.

The things you do to run a typescript file.

# The approach that keeps working

Same pattern as yesterday: when the UI or the abstraction layer fights you, drop to the REST API. The dashboard, the scorecards, the service entities, the blueprint properties — all created via curl. The Port API is consistent, well-documented, and predictable. The layers above it (ocean-sail, the UI wizards, the GitHub App integration) each have their own quirks.

The one exception: Port's AI agent. Asked it about the sync failures, the missing service blueprint, the action not firing. It gave accurate, specific answers every time. The AI and the REST API are the two paths that actually work reliably.

# What's left

- PR metrics dashboard (the data is already there in githubPullRequest entities)
- Push the main.yml fix so PRs and users sync properly
- Push the identifier fixes so the ocean sync and scan workflows use `owner/repo` format
- All the unpushed changes need to get to main

# Distillation

Yesterday i said "the API underneath is clean and well-designed. The layers on top of it need to get out of the way." today added a corollary: the integrations don't just get in the way — they get in each other's way. Installing one thing creates side effects in another. The platform is powerful enough to model anything, but the integration layer assumes you want everything turned on, and the identifier contracts between integrations are implicit, not enforced. If you run a custom sync alongside a managed integration, *you* are responsible for making sure they agree on how to name things. Nobody checks.

The self-service action working end-to-end is the highlight. Click a button, scan a repo, write results back. That's the demo. The three hours of identifier debugging to get there is the reality. And the pattern still holds: the API and the AI are the reliable paths. Everything else is a negotiation.