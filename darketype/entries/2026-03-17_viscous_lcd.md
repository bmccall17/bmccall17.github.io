---
title: "pressing your finger into the screen"
date: 2026-03-17T18:00:00
state: "shipped"
tags: [darketype, svg-filters, animation, lcd, chromatic-aberration, shipped]
next_experiment: "per-character displacement via inline span wrapping"
---

# pressing your finger into the screen

you know that thing you did as a kid — pressing your thumb into an old LCD monitor and watching the colors bloom outward in a prismatic bruise? the liquid crystal couldn't hold its alignment under pressure, so light leaked through at wrong angles, splitting white into its component wavelengths. red one direction, blue another, green somewhere in between. a temporary wound in the display that healed itself in slow motion when you pulled away.

that's what the headings do now.

### the shiver was too polite

darketype had a hover effect called `shiver` — a 1px translate jitter on a 0.2s infinite loop. `transform: translate(1px, 1px)`. five keyframe stops. it felt like a nervous twitch. fine for 2026-02-06 energy, but as the site grew teeth, shiver started feeling like a stock animation. too clean. too periodic. the kind of tremor a UI framework would ship as a "fun hover state."

what i wanted was something that felt *physical*. not "the text moved" but "the text is being distorted by a force." LCD physics, not CSS tricks.

### the anatomy of a chromatic bruise

the new system lives in `viscous.js` — a single IIFE that injects an SVG filter into the DOM at load time. the filter is the whole trick. here's the core idea:

```xml
<feColorMatrix> <!-- extract red channel -->
<feColorMatrix> <!-- extract green channel -->
<feColorMatrix> <!-- extract blue channel -->
<feDisplacementMap in="red"   xChannel="R" yChannel="G" />
<feDisplacementMap in="green" xChannel="G" yChannel="B" />
<feDisplacementMap in="blue"  xChannel="B" yChannel="R" />
<feBlend mode="screen" /> <!-- recombine -->
```

split the source graphic into R, G, B via `feColorMatrix` isolation matrices. then displace each channel through `feTurbulence` noise — but using *different* channel selectors for each. red gets displaced by the R/G channels of the noise. green by G/B. blue by B/R. same noise field, three different displacement vectors. the channels drift apart like a prism splitting light.

`feBlend mode="screen"` recombines them additively. where all three overlap perfectly you see the original text. where they've diverged you see chromatic fringe — that LCD rainbow bruise.

### the state machine

four behaviors, three states, zero CSS animations:

**idle** — `.glitch-text` (the nav header) gets a barely-perceptible chromatic shimmer. displacement scale 1-2px, seed changes at arrhythmic intervals (300-700ms, randomized each tick). you might not even notice it. that's the point. h1/h2 headings have no filter applied at all — completely clean until you engage.

**turbulence** — mouse moves over a heading and the filter activates. displacement scales with mouse velocity: slow drift gives you subtle fringe (scale 6-12), fast sweeps push it harder (scale 20+). `baseFrequency` scales too — faster movement creates tighter, more detailed noise. the seed changes rapidly but *arrhythmically* (30-120ms random intervals) so the turbulence pattern never settles into a visible loop. it looks like the text is being pushed through viscous fluid.

**drip** — mouse stops moving for ~800ms and the distortion transitions into a vertical streak. `baseFrequency` goes asymmetric: X drops to 0.005 (wide columns), Y ramps to 0.07 (tight vertical bands). the chromatic channels diverge further — R and B spread away from G. looks like the distortion is melting downward. after ~1.5s the streaks widen and dissolve into a ripple, displacement decays back to zero. total duration ~3s, randomized so no two drips are identical.

**click** — same drip sequence but triggered instantly on click. heading doesn't need to be hovered first. you tap it, it bleeds.

### the content layer — proximity, not uniformity

the first attempt at content effects was wrong. a shared SVG filter on the entire `#content` div meant every paragraph, heading, and list item distorted at the same intensity simultaneously. it looked like the whole page was shimmering, not like something was being *pushed*. the LCD metaphor requires a point of contact — a specific location where the pressure originates.

the fix: no SVG filter on content at all. instead, per-element chromatic `text-shadow` that scales with distance from the cursor. each block element (`p`, `li`, `pre`, `blockquote`, etc.) independently calculates its proximity to the mouse:

```js
var pDist = distance(cursor, closestEdgeOfElement);
var pIntensity = 1 - (pDist / PROX_RADIUS);          // linear base
pIntensity = pIntensity * (0.4 + pIntensity * 0.6);   // soft curve
```

distance is measured to the *nearest edge* of the element's bounding rect, not the center — so hovering directly over text gives maximum intensity even on wide paragraphs. the falloff curve sits between linear and quadratic: visible across most of the 250px radius but still sharp at the center.

the chromatic split direction follows the cursor-to-element vector. R pushes one way, B pushes the other, spread up to 5px at 0.4 alpha. when the cursor is directly over the element and moving, it switches to velocity direction instead — so the fringe follows your movement like light refracting through liquid. above 50% intensity, a green channel ghost appears with a slight downward offset, completing the RGB trifecta.

elements outside the radius: untouched. no shadow, no processing, no overhead.

and then there's the decay. the chromatic fringe doesn't persist when you stop moving — it *heals*. an `contentActivity` scalar ramps up with mouse velocity (`+0.08` per frame) and bleeds back toward zero when the cursor goes still (`-0.02` per frame, ~1.5s to fully dissolve). every proximity intensity gets multiplied by this value. stop your cursor mid-paragraph and the chromatic bruise slowly closes beneath it, like the liquid crystal realigning after you lift your finger. start moving again and it blooms instantly. the asymmetry is intentional — pressure is fast, healing is slow.

### the click ripple — wavefront + wake

click empty space in the content and a chromatic shockwave expands outward from the click point. `e.target.closest('a, button, img')` guards interactive elements.

the ripple has two components:

**the wavefront** — a 100px-wide ring expanding from click origin at ~130px/s. elements inside the ring get a sharp chromatic burst (7px spread, 0.45 alpha). the ring travels outward for 5-7 seconds, reaching 700-900px from origin.

**the wake** — everything the wavefront has already passed through. instead of snapping back to clean, passed elements retain a dissolving chromatic shadow that fades as the overall ripple progresses. the wake intensity is proportional to how recently the front passed and how far along the total animation is.

the direction of the chromatic split *rotates over time*. at the moment of impact, R/B separate radially — away from click origin, like a shockwave. as the ripple ages, the split direction rotates toward straight down — the LCD "drip." this blend creates a natural transition from explosive impact to gravitational settle:

```js
var dripAngle = rAngle + (PI/2 - rAngle) * rippleProgress * 0.6;
```

a vertical drift component also increases with time, so the entire chromatic field slowly sags downward as the ripple dissolves. three shadow layers per affected element: red, blue, and a faint green drip ghost.

### making the glitch less metronomic

the original `@keyframes glitch` ran at exactly 2s intervals. perfectly periodic skew + chromatic text-shadow. you could set a metronome to it. now, on each `animationiteration` event, JS randomizes the duration between 1.5s and 3s:

```js
el.style.animationDuration = (1.5 + Math.random() * 1.5).toFixed(2) + 's';
```

same keyframes, unpredictable timing. the glitch feels like it's *deciding* when to fire rather than running on a clock.

### what lerp gives you for free

every parameter transition uses linear interpolation at 0.06-0.08 per frame. no easing functions, no CSS transitions, no `requestAnimationFrame` timing curves. just `current = current + (target - current) * 0.06` sixty times a second. this creates exponential decay — fast initial movement that asymptotically approaches the target. the result *feels* viscous without any explicit physics. the text doesn't snap between states, it *oozes*.

the 30fps throttle on DOM writes means the SVG filter attributes update at half the visual frame rate. this is intentional — feTurbulence recalculation is the expensive part, and 30hz is fast enough that the turbulence pattern shifts look smooth while keeping CPU usage reasonable. six filter primitives per heading is moderate but not free.

### the guard rails

- `window.innerWidth < 768`: entire system disabled on mobile. feTurbulence on a phone GPU is antisocial behavior.
- `#content h1, #content h2, #content h3 { filter: none; }`: content headings don't get the SVG heading filter — they participate in the proximity text-shadow system instead.
- content blocks use per-element `text-shadow` instead of SVG filters — no feTurbulence overhead on the body text at all.
- `MutationObserver` on `#content` catches dynamically loaded markdown (entry.html fetches entries async) and refreshes the block list.
- shadow strings are diff-checked before writing — DOM updates only happen when the value actually changes.
- passive mousemove listener so scroll performance doesn't degrade.
- `will-change: filter` on filtered elements for GPU compositing hints.
- h1/h2 headings get their SVG filter applied via inline style *only* during hover or active drip, and removed when returning to idle. no perpetual filter overhead on text you're not looking at.

### two systems, one metaphor

the headings and the content use completely different rendering techniques to sell the same illusion. headings get a real SVG filter — per-channel displacement through turbulence noise, six filter primitives, dynamically controlled via `setAttribute` at 30fps. heavy, but headings are short text runs and the filter only activates on engagement.

content gets per-element `text-shadow` — three shadow layers (R, B, G ghost) with coordinates computed from cursor proximity and velocity. no SVG overhead at all. the trade-off is that text-shadow can't do true displacement (pixels don't move, they just get colored halos), but at the scale we're working at — 5px spread, 0.4 alpha — it reads as chromatic aberration. your brain fills in the physics.

the click ripple bridges both approaches: it's all text-shadow, but the expanding wavefront + dissolving wake + directional rotation sells a shockwave that feels heavier than it is.

### the feeling

the text used to feel like it was *printed*. now it feels like it's *suspended in fluid*. move your cursor and the nearby text bruises — color channels splitting apart along your path. stop and the bruise heals, slowly, like pressure releasing from glass. click and a chromatic shockwave ripples outward, its leading edge sharp, its wake dissolving downward into gravity.

the headings are louder. hover and they distort through real per-channel displacement — viscous, heavy, arrhythmic. click and they drip. leave and the filter peels off entirely. no residue.

every timing interval is randomized within a range. seed changes, drip durations, glitch cycles, decay rates, ripple speeds. nothing loops. nothing repeats. the chaos is *arrhythmic* — biological rather than mechanical.

zero dependencies. one SVG filter for headings. per-element text-shadow for content. two systems pretending to be the same physics.

*ADR-0016. pressing your finger into the screen.*
