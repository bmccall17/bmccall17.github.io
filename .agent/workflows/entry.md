---
description: add a new mess entry and deploy
---

# /entry - add a new mess entry

## purpose
wire up a new markdown mess entry to the `darketype` weblog, build the indices, and publish it live.

## usage
```
/entry [file_path_or_title]
```
if a new mess entry is provided in the prompt, or you are executing this, ensure that you follow the steps below to make sure it is added and fully wired up.

## workflow

### step 1: validate entry
- ensure the markdown file exists in `darketype/entries/` and has valid frontmatter matching `darketype/entries/TEMPLATE.md`.
  - **required fields:** `title`, `date` (YYYY-MM-DD), `state` (see states below), `tags`.
  - **optional fields:** `series`, `og_image`, `next_experiment`, `hashnode` (true/false override).
  - if drafting a new entry, create the filename as `YYYY-MM-DD_title_slug.md`.
- **grammar-police-dodging:** verify the entire entry strictly follows the "darketype" styling — all lowercase titles, headings, and body text. absolutely no capital letters unless deeply intentional for code, or proper names of people, brands, projects. the name is always `Brett A McCall` — middle initial A, no period, never abbreviated.
- ensure `tags` are relevant and exist as an active array in the frontmatter (e.g. `tags: [agent828, crm, meetings]`).

#### states reference
all states except `void` are publishable to Hashnode automatically:
- `shipped` — it works and it's live
- `learning` — still figuring it out
- `mess` — active chaos
- `frustrated` — broken but documented
- `optimistic` — heading somewhere good
- `seed` — early idea, barely planted
- `debugging` — actively diagnosing
- `broken` — dead in the water
- `expanded` — shipped + extended analysis
- `void` — placeholder only, NOT published to Hashnode

#### series field
- `series:` maps to a Hashnode series slug (e.g. `series: "crm-agent828"`).
- **current series slugs:**
  - `"darketype-devlog"` — HUDs, design experiments, creative code (Hashnode: `/darketype-devlog`)
  - `"crm-agent828"` — the CRM build arc: dogfooding → persistence → drafts → data honesty (Hashnode: `/crm-agent828`)
  - `"agent828-build-arc"` — the broader agent828 platform arc: context lake, arch graph, content engine, backlog methodology (Hashnode: `/agent828-build-arc`)
- **series pre-condition:** if using a new series slug, ensure it already exists on the [Hashnode dashboard](https://hashnode.com) → Series → Create before running `hashnode:sync`. if it doesn't exist, sync will warn but not fail.
- the series tag appears automatically on the weblog index (clickable to filter) and on the individual post page (links to the Hashnode series view).

#### image paths
- images for an entry live at: `darketype/entries/media/<entry-slug>/filename.png`
- embed in markdown as: `![alt text](../entries/media/<entry-slug>/filename.png)`
- the `../` is required — markdown is parsed from the `weblog/` directory context by `marked.js`.
- the build script auto-converts these to absolute GitHub Pages URLs for Hashnode.
- **never use:** `weblog/media/` or absolute paths in the entry markdown itself.

#### SEO / meta
- **SEO title** is auto-generated from `title` (trimmed to 60 chars) and pushed to Hashnode on sync.
- **SEO description** is auto-extracted from the first 150 chars of the entry body (markdown stripped) and pushed to Hashnode on sync.
- **OG image** is the per-entry generated image at `assets/social/og/<slug>.png` — pushed to Hashnode automatically.
- no manual SEO fields needed unless you want to override. add `seo_title:` or `seo_description:` to the `.hashnode/` proxy file manually to override.

### step 2: build architecture
- run the full build from the project root:
// turbo
```bash
npm run build
```
- this will automatically update:
  - `darketype/entries.json` (the dynamic list — now includes `series` field for client-side filter)
  - `darketype/weblog/index.html` (the static fallback, UI, STATE_COLORS legend, footer counters, and series tags)
  - `darketype/weblog/{slug}.html` (per-entry static pages with OG tags, series tag, and hashnode link)
  - `darketype/index.html` (footer entry count)
  - `heatmap.json` (the visual activity log)
  - `assets/social/og/{slug}.png` (per-entry OG images with content-specific pictograms)
  - `.hashnode/{slug}.md` (proxy sync files: auto-capitalized, images resolved to absolute URLs, SEO title/description/OG image pre-populated, series slug wired)
- footer counters (entry count, state count) and tag legend colors are **auto-synced** — no manual updates needed.

### step 3: source control & publish
- stage the new entry and all newly generated architecture files.
// turbo
```bash
git add darketype/entries/<the_new_file>.md darketype/entries.json darketype/index.html darketype/weblog/ heatmap.json assets/social/og/ .hashnode/
```
- commit the changes:
// turbo
```bash
git commit -m "add [title] entry and rebuild weblog"
```
- push changes to the main branch to deploy to github pages:
// turbo
```bash
git push origin main
```
- **sync to hashnode:** push the prepared proxy files to the live publication. this will publish/update the post AND set SEO title, SEO description, OG image, series membership, and canonical URL automatically.
// turbo
```bash
npm run hashnode:sync
```

### step 4: confirm
- report to the user that the entry is "wired up" and live!
- provide a text link to the entry on darketype and the Hashnode URL.
- if the entry has a series, confirm it appears in the series filter on the weblog index.