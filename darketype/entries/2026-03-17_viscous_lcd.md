---
title: "pressing your finger into the screen"
date: 2026-03-17T18:00:00
state: "shipped"
tags: [darketype, svg-filters, animation, lcd, chromatic-aberration, shipped]
next_experiment: "point-specific displacement with feImage radial masks"
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

### the content layer

blog entry bodies (`#content`) get a separate, subtler system. a second SVG filter (`#viscous-content`) with its own parameter set, plus a cursor-relative chromatic `text-shadow`:

```
textShadow = `${cx * 2}px ${cy * 0.8}px rgba(255,0,0,0.12),
              ${-cx * 2}px ${-cy * 0.8}px rgba(0,100,255,0.12)`
```

`cx` and `cy` are the cursor's normalized position within the content div (-0.5 to 0.5). move your cursor left and the red shadow drifts left while blue drifts right. move down and the vertical offset follows. the effect is subtle — 0.12 opacity — but it creates a sense that the text has depth, like the characters are printed on layers of glass that shift relative to each other as you move your viewpoint.

click empty space in the content and you get the full drip sequence through the content filter. click a link or image and nothing happens — `e.target.closest('a, button, img')` guards against triggering the effect on interactive elements.

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
- `#content h1, #content h2, #content h3 { filter: none; }`: headings inside markdown content don't double-filter. they inherit the content div's filter system.
- passive mousemove listener so scroll performance doesn't degrade.
- `will-change: filter` on filtered elements for GPU compositing hints.
- h1/h2 headings get their filter applied via inline style *only* during hover or active drip, and removed when returning to idle. no perpetual filter overhead on text you're not looking at.

### the feeling

the best way i can describe it: the text used to feel like it was *printed*. now it feels like it's *suspended*. hover and it reacts. move fast and it struggles to keep up. stop and it drips. click and it bruises.

every timing interval in the system is randomized within a range. seed changes, drip durations, glitch cycles, streak-to-ripple transition points. nothing loops. nothing repeats. the chaos is *arrhythmic* — biological rather than mechanical.

six SVG filter primitives. one state machine. zero dependencies. the darketype headings finally feel like they're made of something.

*ADR-0016. pressing your finger into the screen.*
