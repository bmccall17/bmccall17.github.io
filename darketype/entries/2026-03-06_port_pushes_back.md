---
title: "port pushes back (and then it doesn't)"
date: 2026-03-06T09:00:00
state: "learning"
tags: [port, devops, integration, self-service, scorecards, services, github-actions, snyk]
series: "darketype-devlog"
next_experiment: "PR metrics dashboard, push everything to main"
---

# the sequel

[yesterday](2026-03-05_port_ocean_pain.md) was about pain — fighting the ocean integration, the grayed-out button, the docker image wall. today was about pushing past that and seeing how far the platform actually goes. spoiler: pretty far, but every step has a catch.

# what got built

## snyk enrichment

the `port-ocean-sync.yml` workflow now does double duty. after syncing repos from github, it queries the snyk API for vulnerability counts and merges them onto the same repo entities. each repo now carries `snykVulnCritical`, `snykVulnHigh`, `snykVulnMedium`, `snykVulnLow`, and `snykMonitored` as properties. this took one extra workflow step and zero new infrastructure.

on top of that, a `security_posture` scorecard grades every repo: Snyk Monitored = Bronze, No Critical Vulns = Silver, No Critical + No High = Gold. four scorecards now — decision_clarity, governance_standards, delivery_maturity, security_posture. the catalog went from "list of repos" to "list of repos with opinions."

## dashboard

a "Scorecard Overview" dashboard page, created via `POST /v1/pages`. eight widgets: markdown header explaining what you're looking at, a full entity table, four pie charts (one per scorecard showing level distribution), a repOptics grades pie, and a language distribution pie. all done in a single API call. no UI clicking. the REST API continues to be the best part of Port.

## service entities and the entity graph

this is where it got interesting. Port had a `service` blueprint sitting empty. we filled it:

- added properties: description, type (web-app/game/tool/platform/etc), tier (production/experimental/internal), lifecycle (active/maintained/archived), tech stack, live URL
- added a `repositories` relation (service -> many githubRepository)
- created 12 services mapping to all 15 repos

the real insight: two of those services — IDS and Forbidden Desert XR — are partykit projects that never touch github. they have no repos, no scorecards, no snyk data. but they still exist in the catalog as first-class services with URLs, tech stacks, and lifecycle status. this is what Port means by "software catalog" vs "github mirror." you can model things that aren't in your SCM.

## self-service action (the one that doesn't work yet)

registered a "Run repOptics Scan" action on the githubRepository blueprint. the idea: click a button on any repo in Port, it triggers a github actions workflow that runs the repOptics scanner, writes scores back to the entity, and reports success/failure to Port. the workflow file exists, the action is registered, the scanner works locally (repOptics scores itself B, 74/100).

but it doesn't fire.

# the catches

## identifier chaos (the sequel)

round one: the ocean sync workflow was building entity identifiers as `bmccall17_repoName`. the Port GitHub Ocean integration uses just `repoName`. duplicates everywhere. fixed the identifiers, deleted the dupes, moved on.

round two: installed the Port GitHub App (needed for self-service actions — see below). the app immediately spun up an old-style "Exporter" integration that started syncing repos with the short `repoName` identifier. meanwhile the Ocean integration uses `bmccall17/repoName`. so now *three* sources were creating repository entities: the old exporter (wrong identifiers), the ocean integration (correct identifiers), and snyk (also correct identifiers). repos tripled. the data sources page looked like a graveyard — two "Sunset" integrations you didn't ask for, one working ocean sync, and snyk quietly doing its thing.

the fix: suspend the old exporter and gitops integrations (they're deprecated anyway), delete all entities with the short identifier format, and update all three identifier constructions in the custom workflows to use `owner/repo` format. `port-ocean-sync.yml` had two: one using `.name` (changed to `.full_name`) and one actively stripping the owner prefix with `cut -d'/' -f2` (changed to just using the full name). `port-repoptics-scan.yml` had one: changed `${{ inputs.repo }}` to `${{ inputs.owner }}/${{ inputs.repo }}`.

lesson refined: it's not just "match the identifier format." it's "understand that installing a github app might silently create a second integration that uses a *different* identifier format than your existing one, and there's no warning." the platform assumes you want every integration it can spin up. you have to actively shut down the ones you don't.

## the github app gap (resolved)

the self-service action uses Port's `GITHUB` invocation method, which means Port needs to call the github API to trigger `workflow_dispatch`. this requires Port's GitHub App to be installed on the repo with Actions write permission. the app wasn't installed. Port's UI gives no error — the action just hangs forever showing "in progress." no timeout, no failure message, no hint about what's missing.

installed the app. Port triggered the workflow. it actually fired. the scan ran, scored the repo, wrote results back to Port, reported success. the whole loop works now — click a button in Port, get a health report. the irony: installing the app to fix one problem (workflow dispatch) created another problem (duplicate entities from the old exporter). classic integration cascade.

## the ocean integration's missing token

the `main.yml` ocean-sail workflow was syncing repos fine but failing on pull requests and users. turns out the config block was missing the github token entirely — it was only passing `github_host`. PRs and users need authenticated access. one-line fix, but it explained why 8 PRs and 7 users were failing every sync.

## `"type": "module"` rabbit hole

wanted to run the repOptics scanner as a standalone script from github actions. the scanner imports `octokit` v5 which is ESM-only. the project's package.json didn't have `"type": "module"` because Next.js handles module resolution internally. tsx in CJS mode can't import ESM packages. tried: `node --experimental-strip-types`, `tsx -e`, `.mts` extension, `--loader tsx`. none worked until we added `"type": "module"` to package.json and `tsx` as a devDep. then had to exclude `scripts/` from tsconfig so Next.js wouldn't try to type-check the scanner script. then had to redirect `console.log` to stderr in the script because the scanner logs to stdout and we need clean JSON output.

the things you do to run a typescript file.

# the approach that keeps working

same pattern as yesterday: when the UI or the abstraction layer fights you, drop to the REST API. the dashboard, the scorecards, the service entities, the blueprint properties — all created via curl. the Port API is consistent, well-documented, and predictable. the layers above it (ocean-sail, the UI wizards, the GitHub App integration) each have their own quirks.

the one exception: Port's AI agent. asked it about the sync failures, the missing service blueprint, the action not firing. it gave accurate, specific answers every time. the AI and the REST API are the two paths that actually work reliably.

# what's left

- PR metrics dashboard (the data is already there in githubPullRequest entities)
- push the main.yml fix so PRs and users sync properly
- push the identifier fixes so the ocean sync and scan workflows use `owner/repo` format
- all the unpushed changes need to get to main

# distillation

yesterday i said "the API underneath is clean and well-designed. the layers on top of it need to get out of the way." today added a corollary: the integrations don't just get in the way — they get in each other's way. installing one thing creates side effects in another. the platform is powerful enough to model anything, but the integration layer assumes you want everything turned on, and the identifier contracts between integrations are implicit, not enforced. if you run a custom sync alongside a managed integration, *you* are responsible for making sure they agree on how to name things. nobody checks.

the self-service action working end-to-end is the highlight. click a button, scan a repo, write results back. that's the demo. the three hours of identifier debugging to get there is the reality. and the pattern still holds: the API and the AI are the reliable paths. everything else is a negotiation.
