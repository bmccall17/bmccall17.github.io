---
title: "every letter has its own bruise"
date: 2026-03-18T07:00:00
state: "shipped"
tags: [darketype, animation, per-character, chromatic-aberration, performance, shipped]
---

# every letter has its own bruise

the LCD effect from ADR-0016 worked at the paragraph level. you'd move your cursor near a block of text and the entire thing would light up with chromatic fringe — red one way, blue the other, the whole `<p>` treated as a single object. it was convincing enough at a glance, but if you really *looked* you could feel the granularity. paragraphs aren't objects. they're crowds. every letter in them is its own piece of glass, and the pressure metaphor breaks down when fifty characters respond identically to a force that should be hitting them at different distances.

so now they don't.

### wrapping every character in its own physics

each text node inside `#content` gets walked by a `TreeWalker` and split into individual `<span class="prox-char">` elements. every letter, every space, every punctuation mark — its own inline-block element that `transform` can act on. the wrapping excludes `PRE`, `CODE`, `A`, `IMG`, and other tags where character-level manipulation would be destructive or meaningless.

this sounds expensive. ~4000 spans on a typical entry. but the expense isn't in *having* them — inline-block spans don't cost much at rest. the expense is in *touching* them. and the entire architecture of this system is designed around touching as few as possible per frame.

### two-tier spatial culling

**tier 1** — block gate. every `<p>`, `<li>`, `<h2>`, etc. has its bounding rect cached. before checking any character inside a block, the cursor's distance to the block's nearest edge is tested. if the block is outside `proxRadius + 50px`, every character inside it is skipped. this rejects entire paragraphs in a single comparison.

**tier 2** — character distance. for characters in blocks that passed the gate, each one's cached center position is tested against the cursor. only characters within the proximity radius proceed to transform computation.

result: ~200-600 characters evaluated per frame instead of ~4000. the block gate kills ~80% of the work before it starts.

### the displacement model

characters within range experience three simultaneous effects:

**radial push** — each letter translates away from the cursor along the cursor→character vector. maximum displacement: 7px at zero distance. the intensity curve is the same quadratic toe from the block-level system: `intensity * (0.4 + intensity * 0.6)`, scaled by activity decay. but now each character computes its own distance, its own angle, its own push magnitude. a word directly under the cursor splits apart while a word 150px away barely trembles.

**micro-rotation** — displaced characters tilt away from the pressure point, up to 8 degrees. the direction follows the push vector's horizontal component. this is the detail that makes it feel physical — not just "characters moved" but "characters torqued." like pressing into a membrane where each element has its own moment of inertia.

**chromatic fringe** — independent per-character `text-shadow` with R/B split along the push vector (4px spread, 0.5 alpha). green ghost channel appears above 50% intensity. the shadow values are quantized to 0.5px positions and 0.05 alpha increments — this makes the diff-check between frames actually catch identical values, so characters in slowly-fading zones don't trigger DOM writes every frame.

### click ripple at character resolution

same wavefront + wake model from the block-level system, but now each letter gets hit individually as the ring passes its position. the band width tightened from 100px to 60px — precision justified by per-character granularity.

the wavefront displacement pushes characters 8px outward from click origin. the wake behind the front trails at 3px, dissolving with distance and time. drip angle blends from radial to downward over the ripple lifetime. gravity drift sags the whole field vertically as the ripple ages.

and now ripples stack. click once, a ring expands. click again before it finishes, a second ring expands from the new origin. up to eight simultaneous ripples, each with independent timing, radius, and wake. oldest gets recycled if you exceed the cap.

### the wake problem

the first version had a performance cliff. a single ripple would start at 60fps and decay into the twenties as it expanded. the frame recorder showed why: the wake zone (`rDist < rippleRadius`) was catching *every character the wavefront had already passed*. by mid-ripple, that was 1200-1600 characters — nearly every letter on the page. each one getting a fresh `textShadow` write every frame because the wake intensity formula included `(1 - rippleProgress)`, which changes every tick, defeating the diff-check.

three fixes:

**wake floor** — characters where total ripple intensity falls below a threshold get skipped entirely. default: 0.21. the wake fades to near-invisible at distance, so this cuts out ~800 characters that were costing everything for zero visible effect.

**dynamic floor scaling** — the wake floor increases by 0.08 per additional active ripple. one ripple: floor 0.21. two: 0.29. three: 0.37. the system automatically trades wake fidelity for frame rate as complexity increases. you can rapid-click five times and maintain playable performance because each successive ripple tightens the culling on all of them.

**shadow quantization** — offset values rounded to nearest 0.5px, alpha to nearest 0.05. characters in the slowly-fading wake produce identical shadow strings across multiple frames, so the diff-check prevents unnecessary DOM writes.

### position caching

reading `getBoundingClientRect()` on 4000+ spans per frame is a reflow disaster. all character center positions are cached once after wrapping. on scroll, every cached Y is adjusted by the scroll delta — O(1), no reflow. full recache every 2 seconds or on resize, to correct accumulated float drift from the delta approach.

block rects follow the same strategy. the scroll listener is passive.

### the active set

a sparse object tracks which character indices currently have non-empty transforms. each frame builds a new active set from the compute loop. characters that were in the old set but not the new one get their `style.transform` and `style.textShadow` cleared. characters entering the set get their values written only if they differ from the previous frame's cached string.

this means characters outside all effect zones have *zero per-frame cost*. no iteration, no comparison, no DOM access. the system scales with the number of characters being *touched*, not the number that exist.

### the numbers

typical frame at idle: 0ms (nothing to compute, nothing to write).

typical frame with cursor over text: ~0.5ms compute, ~0.3ms DOM writes, ~200 characters active.

typical frame mid-ripple: ~2ms compute, ~1ms DOM writes, ~400-600 characters active.

worst case (two overlapping ripples near peak expansion): ~6ms compute, ~3ms DOM. still under the 33ms budget for 30fps, and the dynamic wake floor keeps it from climbing further.

### the staging sandbox

the tuning happened in an isolated sandbox: [per-char.html](https://bmccall17.github.io/darketype/staging/per-char.html). single self-contained file with inline styles and script, hardcoded dummy content, no dependencies on production code. it has a full control panel with sliders for every tunable parameter — proximity radius, displacement, rotation, chromatic spread, ripple band width, wake cutoff, drip blend, gravity drift, and the dynamic wake floor. a performance HUD breaks down each frame into compute time, DOM write time, character counts, and shadow write counts. a frame recorder captures 60 frames and dumps a full breakdown to the console.

if future-me needs to retune any of these values, that's where to go. the slider panel lets you watch the effect and the performance counters simultaneously, and the "copy config" button exports the current values as a JSON object you can paste directly into the production `CC` config.

### the config that shipped

```js
{
  proxRadius: 170,
  maxDisplacement: 7,
  maxRotation: 8,
  chromaSpread: 4,
  chromaAlpha: 0.5,
  greenThreshold: 0.5,
  activityRamp: 0.08,
  activityDecay: 0.02,
  rippleBand: 60,
  rippleFrontDisp: 8,
  rippleWakeDisp: 3,
  wakeCutoff: 300,
  dripBlend: 0.6,
  gravityDrift: 6,
  rippleChroma: 0.45,
  rippleRotation: 3,
  wakeFloor: 0.21,
  wakeFloorStep: 0.08
}
```

### the feeling

move your cursor across a paragraph and the letters nearest to it push away — individually, independently, each one tilting and trailing its own chromatic ghost. stop moving and they drift back, each on its own schedule, the bruise dissolving character by character like liquid crystal realigning after you lift your thumb. click and a ring of displaced letters expands outward, each glyph getting knocked aside as the wavefront crosses its position, then slowly sagging downward in the wake.

it's the same metaphor as before — LCD pressure physics, chromatic aberration as force feedback — but now the resolution matches the claim. not "the paragraph responded to your cursor." *every letter responded to your cursor.*

*ADR-0017. every letter has its own bruise.*
