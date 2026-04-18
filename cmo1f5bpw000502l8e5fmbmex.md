---
title: "Pressing your finger into the screen"
datePublished: Thu Apr 16 2026 11:51:35 GMT+0000 (Coordinated Universal Time)
cuid: cmo1f5bpw000502l8e5fmbmex
slug: 2026-03-17-viscous-lcd
canonical: https://bmccall17.github.io/darketype/weblog/2026-03-17_viscous_lcd.html
cover: https://bmccall17.github.io/assets/social/og/2026-03-17_viscous_lcd.png
tags: animation, lcd, shipped, darketype, svg-filters, chromatic-aberration

---

# Pressing your finger into the screen

You know that thing you did as a kid — pressing your thumb into an old LCD monitor and watching the colors bloom outward in a prismatic bruise? The liquid crystal couldn't hold its alignment under pressure, so light leaked through at wrong angles, splitting white into its component wavelengths. Red one direction, blue another, green somewhere in between. A temporary wound in the display that healed itself in slow motion when you pulled away.

That's what the headings do now.

### The shiver was too polite

Darketype had a hover effect called `shiver` — a 1px translate jitter on a 0.2s infinite loop. `Transform: translate(1px, 1px)`. Five keyframe stops. It felt like a nervous twitch. Fine for 2026-02-06 energy, but as the site grew teeth, shiver started feeling like a stock animation. Too clean. Too periodic. The kind of tremor a UI framework would ship as a "fun hover state."

What i wanted was something that felt *physical*. Not "the text moved" but "the text is being distorted by a force." LCD physics, not CSS tricks.

### The anatomy of a chromatic bruise

The new system lives in `viscous.js` — a single IIFE that injects an SVG filter into the DOM at load time. The filter is the whole trick. Here's the core idea:

```xml
<feColorMatrix> <!-- extract red channel -->
<feColorMatrix> <!-- extract green channel -->
<feColorMatrix> <!-- extract blue channel -->
<feDisplacementMap in="red"   xChannel="R" yChannel="G" />
<feDisplacementMap in="green" xChannel="G" yChannel="B" />
<feDisplacementMap in="blue"  xChannel="B" yChannel="R" />
<feBlend mode="screen" /> <!-- recombine -->
```

Split the source graphic into R, G, B via `feColorMatrix` isolation matrices. Then displace each channel through `feTurbulence` noise — but using *different* channel selectors for each. Red gets displaced by the R/G channels of the noise. Green by G/B. Blue by B/R. Same noise field, three different displacement vectors. The channels drift apart like a prism splitting light.

`FeBlend mode="screen"` recombines them additively. Where all three overlap perfectly you see the original text. Where they've diverged you see chromatic fringe — that LCD rainbow bruise.

### The state machine

Four behaviors, three states, zero CSS animations:

**Idle** — `.glitch-text` (the nav header) gets a barely-perceptible chromatic shimmer. Displacement scale 1-2px, seed changes at arrhythmic intervals (300-700ms, randomized each tick). You might not even notice it. That's the point. H1/h2 headings have no filter applied at all — completely clean until you engage.

**Turbulence** — mouse moves over a heading and the filter activates. Displacement scales with mouse velocity: slow drift gives you subtle fringe (scale 6-12), fast sweeps push it harder (scale 20+). `BaseFrequency` scales too — faster movement creates tighter, more detailed noise. The seed changes rapidly but *arrhythmically* (30-120ms random intervals) so the turbulence pattern never settles into a visible loop. It looks like the text is being pushed through viscous fluid.

**Drip** — mouse stops moving for ~800ms and the distortion transitions into a vertical streak. `BaseFrequency` goes asymmetric: X drops to 0.005 (wide columns), Y ramps to 0.07 (tight vertical bands). The chromatic channels diverge further — R and B spread away from G. Looks like the distortion is melting downward. After ~1.5s the streaks widen and dissolve into a ripple, displacement decays back to zero. Total duration ~3s, randomized so no two drips are identical.

**Click** — same drip sequence but triggered instantly on click. Heading doesn't need to be hovered first. You tap it, it bleeds.

### The content layer — proximity, not uniformity

The first attempt at content effects was wrong. A shared SVG filter on the entire `#content` div meant every paragraph, heading, and list item distorted at the same intensity simultaneously. It looked like the whole page was shimmering, not like something was being *pushed*. The LCD metaphor requires a point of contact — a specific location where the pressure originates.

The fix: no SVG filter on content at all. Instead, per-element chromatic `text-shadow` that scales with distance from the cursor. Each block element (`p`, `li`, `pre`, `blockquote`, etc.) independently calculates its proximity to the mouse:

```js
var pDist = distance(cursor, closestEdgeOfElement);
var pIntensity = 1 - (pDist / PROX_RADIUS);          // linear base
pIntensity = pIntensity * (0.4 + pIntensity * 0.6);   // soft curve
```

Distance is measured to the *nearest edge* of the element's bounding rect, not the center — so hovering directly over text gives maximum intensity even on wide paragraphs. The falloff curve sits between linear and quadratic: visible across most of the 250px radius but still sharp at the center.

The chromatic split direction follows the cursor-to-element vector. R pushes one way, B pushes the other, spread up to 5px at 0.4 alpha. When the cursor is directly over the element and moving, it switches to velocity direction instead — so the fringe follows your movement like light refracting through liquid. Above 50% intensity, a green channel ghost appears with a slight downward offset, completing the RGB trifecta.

Elements outside the radius: untouched. No shadow, no processing, no overhead.

And then there's the decay. The chromatic fringe doesn't persist when you stop moving — it *heals*. An `contentActivity` scalar ramps up with mouse velocity (`+0.08` per frame) and bleeds back toward zero when the cursor goes still (`-0.02` per frame, ~1.5s to fully dissolve). Every proximity intensity gets multiplied by this value. Stop your cursor mid-paragraph and the chromatic bruise slowly closes beneath it, like the liquid crystal realigning after you lift your finger. Start moving again and it blooms instantly. The asymmetry is intentional — pressure is fast, healing is slow.

### The click ripple — wavefront + wake

Click empty space in the content and a chromatic shockwave expands outward from the click point. `E.target.closest('a, button, img')` guards interactive elements.

The ripple has two components:

**The wavefront** — a 100px-wide ring expanding from click origin at ~130px/s. Elements inside the ring get a sharp chromatic burst (7px spread, 0.45 alpha). The ring travels outward for 5-7 seconds, reaching 700-900px from origin.

**The wake** — everything the wavefront has already passed through. Instead of snapping back to clean, passed elements retain a dissolving chromatic shadow that fades as the overall ripple progresses. The wake intensity is proportional to how recently the front passed and how far along the total animation is.

The direction of the chromatic split *rotates over time*. At the moment of impact, R/B separate radially — away from click origin, like a shockwave. As the ripple ages, the split direction rotates toward straight down — the LCD "drip." this blend creates a natural transition from explosive impact to gravitational settle:

```js
var dripAngle = rAngle + (PI/2 - rAngle) * rippleProgress * 0.6;
```

A vertical drift component also increases with time, so the entire chromatic field slowly sags downward as the ripple dissolves. Three shadow layers per affected element: red, blue, and a faint green drip ghost.

### Making the glitch less metronomic

The original `@keyframes glitch` ran at exactly 2s intervals. Perfectly periodic skew + chromatic text-shadow. You could set a metronome to it. Now, on each `animationiteration` event, JS randomizes the duration between 1.5s and 3s:

```js
el.style.animationDuration = (1.5 + Math.random() * 1.5).toFixed(2) + 's';
```

Same keyframes, unpredictable timing. The glitch feels like it's *deciding* when to fire rather than running on a clock.

### What lerp gives you for free

Every parameter transition uses linear interpolation at 0.06-0.08 per frame. No easing functions, no CSS transitions, no `requestAnimationFrame` timing curves. Just `current = current + (target - current) * 0.06` sixty times a second. This creates exponential decay — fast initial movement that asymptotically approaches the target. The result *feels* viscous without any explicit physics. The text doesn't snap between states, it *oozes*.

The 30fps throttle on DOM writes means the SVG filter attributes update at half the visual frame rate. This is intentional — feTurbulence recalculation is the expensive part, and 30hz is fast enough that the turbulence pattern shifts look smooth while keeping CPU usage reasonable. Six filter primitives per heading is moderate but not free.

### The guard rails

- `Window.innerWidth < 768`: entire system disabled on mobile. FeTurbulence on a phone GPU is antisocial behavior.
- `#Content h1, #content h2, #content h3 { filter: none; }`: content headings don't get the SVG heading filter — they participate in the proximity text-shadow system instead.
- Content blocks use per-element `text-shadow` instead of SVG filters — no feTurbulence overhead on the body text at all.
- `MutationObserver` on `#content` catches dynamically loaded markdown (entry.html fetches entries async) and refreshes the block list.
- Shadow strings are diff-checked before writing — DOM updates only happen when the value actually changes.
- Passive mousemove listener so scroll performance doesn't degrade.
- `Will-change: filter` on filtered elements for GPU compositing hints.
- H1/h2 headings get their SVG filter applied via inline style *only* during hover or active drip, and removed when returning to idle. No perpetual filter overhead on text you're not looking at.

### Two systems, one metaphor

The headings and the content use completely different rendering techniques to sell the same illusion. Headings get a real SVG filter — per-channel displacement through turbulence noise, six filter primitives, dynamically controlled via `setAttribute` at 30fps. Heavy, but headings are short text runs and the filter only activates on engagement.

Content gets per-element `text-shadow` — three shadow layers (R, B, G ghost) with coordinates computed from cursor proximity and velocity. No SVG overhead at all. The trade-off is that text-shadow can't do true displacement (pixels don't move, they just get colored halos), but at the scale we're working at — 5px spread, 0.4 alpha — it reads as chromatic aberration. Your brain fills in the physics.

The click ripple bridges both approaches: it's all text-shadow, but the expanding wavefront + dissolving wake + directional rotation sells a shockwave that feels heavier than it is.

### The feeling

The text used to feel like it was *printed*. Now it feels like it's *suspended in fluid*. Move your cursor and the nearby text bruises — color channels splitting apart along your path. Stop and the bruise heals, slowly, like pressure releasing from glass. Click and a chromatic shockwave ripples outward, its leading edge sharp, its wake dissolving downward into gravity.

The headings are louder. Hover and they distort through real per-channel displacement — viscous, heavy, arrhythmic. Click and they drip. Leave and the filter peels off entirely. No residue.

Every timing interval is randomized within a range. Seed changes, drip durations, glitch cycles, decay rates, ripple speeds. Nothing loops. Nothing repeats. The chaos is *arrhythmic* — biological rather than mechanical.

Zero dependencies. One SVG filter for headings. Per-element text-shadow for content. Two systems pretending to be the same physics.

*ADR-0016. Pressing your finger into the screen.*