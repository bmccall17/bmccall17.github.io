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
  - fields needed: `title`, `date` (YYYY-MM-DD), `state` (mess, learning, shipped, broken, etc.), `tags`.
  - if drafting a new entry, create the filename as `YYYY-MM-DD_title_slug.md`.
- **grammar-police-dodging:** verify the entire entry strictly follows the "darketype" styling—all lowercase titles, headings, and body text. absolutely no capital letters unless deeply intentional for code.
- ensure `tags` are relevant and exist as an active array in the frontmatter.

### step 2: build architecture
- run the weblog generation script from the project root:
// turbo
```bash
node scripts/build_weblog.js
```
- this script will automatically update:
  - `darketype/entries.json` (the dynamic list)
  - `darketype/weblog/index.html` (the static fallback and UI)
  - `heatmap.json` (the visual activity log)

### step 3: source control & publish
- stage the new entry and the newly generated architecture files.
// turbo
```bash
git add darketype/entries/<the_new_file>.md darketype/entries.json darketype/weblog/index.html heatmap.json
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

### step 4: confirm
- report to the user that the entry is "wired up" and live!
- provide a text link to the entry if applicable.
