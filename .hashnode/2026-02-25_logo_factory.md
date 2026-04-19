---
title: "The logo factory: when ai iteration fails, build your own tool"
slug: 2026-02-25-logo-factory
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-02-25_logo_factory.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-02-25_logo_factory.png"
tags: logo, tedx, tools, ai-iteration, easter-egg
seriesSlug: darketype-devlog
---

# The problem

TEDxAsheville asked for a logo. Not just any logo — *our* logo. The one that represents the BAM identity on the team page. Recently dissolved my old company Better Than Unicorns, so the spot on the team page where that logo used to live was empty. Needed something fresh.

![TEDxAsheville team page — Brett McCall, License Holder, with the old BTU logo below](https://bmccall17.github.io/darketype/entries/media/2026-02-25_logo_factory/tedx_team_page.png)

The obvious move: ask the AI agent to iterate on the SVG. I'm running Antigravity with Opus 4.6 right now, and it's incredible at code — but iterating on visual design through text prompts is... Painful. "Make the glow slightly brighter." "no, too bright." "shift the chromatic aberration 2px left." "that's too far." back and forth, forever.

# The shift

Instead of asking the machine to iterate endlessly on pixel values, i asked it to build me a **tool** that would let me iterate myself. Direct manipulation. Sliders. Live preview. Real-time feedback.

The result: the BAM Logo Factory.

![The logo factory — every parameter exposed, live SVG preview, export to SVG/PNG](https://bmccall17.github.io/darketype/entries/media/2026-02-25_logo_factory/logo_factory.png)

# The mess

- 40+ Parameters exposed: circle radius, chromatic aberration offsets, neon glow blur/opacity, glitch slice positions, ring distortion, font sizes, colors... Everything.
- Live SVG rendering — every slider change redraws immediately.
- Export to clean SVG (transparent/white/black backgrounds) or high-res PNG at 2x.
- Every load is unique: a seeded PRNG (mulberry32, seeded from `Date.now()` milliseconds) randomizes all parameters within "tasteful" ranges on boot. Your logo is never the same twice.
- The reset button snaps back to my canonical preset.

# The easter egg

Here's the fun part: the logo factory is hidden. You can't just navigate to it.

On the root site, there's a singularity effect — green pixel cubes that you suck up with your cursor like a black hole. As you absorb more cubes, the BAM avatar in the sidebar glows progressively brighter. CSS custom property `--absorption` drives it from 0→1 in real time.

When you absorb *all* the cubes — `absorption ≥ 0.99` — the avatar starts pulsating. Breathing scale, triple-layered glow bloom. And the cursor changes to a pointer.

Click it. You're in.

```javascript
// the absorption ratio drives the glow
const absorptionRatio = deadCount / particles.length;
avatar.style.setProperty('--absorption', absorptionRatio.toFixed(3));

// at max, unlock the secret
if (absorptionRatio >= 0.99) {
    avatar.classList.add('singularity-maxed');
}
```

# Glimmers

The meta-lesson: when AI is bad at iterating on something visual, don't fight the medium. Change the medium. Build the tool that lets the human do what humans are good at (direct manipulation, taste, spatial reasoning) and let the machine do what it's good at (generating the SVG rendering engine, wiring up 40 sliders, handling export logic).

Also: every visitor to the logo factory sees a different version of your logo. The seed changes every millisecond. There is no canonical version until you decide there is.

# Distillation

Don't iterate *through* the agent. Iterate *with a tool the agent builds for you*.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-02-25_logo_factory.html).*