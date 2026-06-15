# antigravity rules & integrity - darketype portfolio

> **📂 context**: this project pairs a polished portfolio (`bmccall17.github.io`) with a raw, "underbelly" lab (`darketype`).
> **📄 manifesto**: see `devnotes/portfolio+darketype.md`.

## 1. the core philosophy: "two public selves"

1.  **the portfolio** (root): agile, clean, polished.
2.  **the darketype** (`/darketype`): messy, glitchy, revealing, "failure resume".
3.  **the leak**: binary code and "glitches" must bleed from one to the other.
4.  **the phase 0/1 strategy**: always **think** (phase 0) before you **act** (phase 1). binary code: 0=off (planning), 1=on (execution).

## 2. style & vibe (chaos & revolution)

we are revolting against the grammar police.
- **lowercase everything** unless its a **Bold Statement** or a Proper Noun.
- **no emdashes** allowed.
- **celebrate the mess**: typo? leave it. glitch? feature it.
- **coding conventions** (variables, functions) remain strict for functionality, but comments can be messy.

## 3. cardinal technical rules

### html-first, nerd-core
- **structure**: semantic html is the backbone.
- **styling**: vanilla css. no frameworks unless explicitly justified.
- **vibe**: "monochrome," "terminal," "raw."
- **data**: starts as static files (markdown/html). prepared for future php/sqlite migration, but purely static for now.

### data purity & platform proxies
- **source of truth**: native authoring files (like `darketype/entries`) must remain pure to the author's intent (e.g. "grammar-police-dodging" styling, simple relative paths).
- **proxy architecture**: never mutate source data simply to appease a third-party platform's formatting requirements. always use an automated adapter/proxy script to translate and export the data (e.g. `.hashnode/`) for external consumption.

### the "mess" loop
- **entries**: must be quick to publish (5-12 mins).
- **format**: raw thoughts first, distillation second.
- **schema**: validated by `darketype/entries/TEMPLATE.md`.

### privacy & trust
- **PostHog**: "Telemetry: ON" must be visible.
- **transparency**: we tell users we are tracking them for "science and curiosity."

### deployment & testing
- **git operations**: all git actions (commit, push, etc.) are handled here through antigravity.
- **branching strategy**: always push directly to the `main` branch unless explicitly stated otherwise.
- **production first**: default testing happens on the live production server (after push). local server is secondary.

### security & secrets
- **no secrets in code**: never hardcode api keys, tokens, or passwords.
- **pre-api protocol**: before adding any features requiring keys, we must **stop** and configure `.gitignore` and environment variables properly (a dedicated phase 0 task).
- **confidentiality**: until `.gitignore` is active, assume *everything* is public.

## 4. the complexity protocol (test first)
for complex tasks, we follow a red-green-refactor loop:
1.  **definition of done**: define what "done" looks like via a test case (automated script or specific manual verification steps) *before* building.
2.  **the red state**: the test *must fail* initially. if it passes before you build, the test is wrong.
3.  **planning connection**: phase 0 now includes "writing the failing test" for complex features.

## 5. integrity checks (run before /ship)

### 4.1 design integrity
- [ ] does `darketype` feel distinct from the main portfolio?
- [ ] are the "leaks" (glitches) present but not overwhelming the content?
- [ ] is the "Telemetry: ON" indicator visible?

### 4.2 content integrity
- [ ] do new entries follow the schema?
  - Title, Date, Status, Body.
- [ ] is the "Manifesto" (`darketype/index.html`) intact and guiding the design?
- [ ] is the writing style **rebellious enough**? (lowercase, no emdashes)
- [ ] do contact/feedback CTAs link to `https://bmccall17.github.io/book` (not /contact)?
- [ ] do repOptics-related posts include a humble "buy me a coffee" invitation (`https://buymeacoffee.com/bmccall17`)?
- [ ] do phrases like "how your repo scores" link directly to the scanner (`https://rep-optics.onrender.com/`)?

### 4.3 technical integrity
- [ ] no broken links between "Portfolio" and "Darketype".
- [ ] css files are organized (`/css/style.css` vs `darketype/css/style.css`).

## 5. operating levels

- **level 1 (observer)**: planning, reviewing.
- **level 2 (contained / sandbox)**: writing content, tweaking css.
  - *rule*: small iterations (glitch adjustments, copy edits) do not require a task entry or `/ship` cycle.
  - *protocol*: act fast, break small things. only ship when the session ends or a feature is complete.
- **level 3 (lead)**: structural changes, workflow updates.
