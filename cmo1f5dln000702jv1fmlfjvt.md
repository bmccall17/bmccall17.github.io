---
title: "The melt: what 230,000 particles taught me about letting go"
seoTitle: "The melt: what 230,000 particles taught me about letting go"
seoDescription: "you know that moment where you're staring at your screen and everything feels permanent? the taskbar, the icons, the wallpaper — all these little digi"
datePublished: Thu Apr 16 2026 11:51:37 GMT+0000 (Coordinated Universal Time)
cuid: cmo1f5dln000702jv1fmlfjvt
slug: 2026-03-27-the-melt
canonical: https://bmccall17.github.io/darketype/weblog/2026-03-27_the_melt.html
cover: https://bmccall17.github.io/assets/social/og/2026-03-27_the_melt.png
ogImage: https://bmccall17.github.io/assets/social/og/2026-03-27_the_melt.png
tags: performance, canvas, animation, physics, web-audio, particles, april-fools

---

## The feeling

You know that moment where you're staring at your screen and everything feels permanent? The taskbar, the icons, the wallpaper — all these little digital objects pretending to be solid. I wanted to break that illusion. I wanted your screen to rot.

Not violently. Not like a crash or a glitch. More like watching a wall of ice cream on a hot day. Organic. Gooey. Inevitable. The kind of decay that starts in random pockets and spreads outward until everything is pooled at the bottom in a colorful puddle of what used to be your desktop.

April fools project. One file. No framework. Just a canvas and a quarter million particles learning how to fall.

## The problem

The concept sounds simple: take a screenshot, turn every pixel cluster into a particle, apply gravity. But "simple" is what you say before you've tried it. The real challenge was making 230,000+ particles move organically on a canvas at 60fps without the browser catching fire.

The first version worked. It also looked like a curtain being pulled down — perfectly uniform, perfectly boring. Every particle fell at the same time from the same direction. It looked like a powerpoint transition from 2004.

## The mess

I went through at least five major rewrites of the core physics. Here's what didn't work:

- **Cover scaling with Math.max** — left a black gap at the bottom of the screen. Tried four different approaches to fix the image scaling before discovering the gap had nothing to do with the image at all
- **MaxParticles cap at 150,000** — this was the ghost bug. 1080P at 3px clusters needs 230,400 particles. The loop was silently breaking at 150k, leaving the bottom third of the screen empty. Spent hours "fixing" image scaling when the real problem was an arbitrary cap
- **Linear wave decay** — particles loosened from top to bottom in a straight line. Efficient. Soulless. Looked like someone dragging a squeegee down the screen
- **3D voxels at 8%** — tried giving particles a tumbling cube shape. The math was beautiful. 18,000 Canvas path draws per frame was not. Killed FPS instantly
- **Artificial puddle zone at 85%** — created a hard boundary where particles "arrived" at the puddle. Result: a visible shelf line where particles accumulated in a thin band. Tried velocity thresholds, displacement checks — nothing worked until i deleted the entire concept

## The discoveries

### The particle cap ghost

The most important bug was the one that looked like something else entirely. For hours i was convinced the image wasn't stretching to fill the screen. I tried cover scaling, offscreen canvases, different source images. The image was fine the whole time — the particle extraction loop was just hitting a 150k ceiling and silently stopping two-thirds of the way down.

**Lesson:** when your symptom doesn't match your theory after two fixes, the bug is somewhere else entirely.

### Typed arrays are not optional

At 230k particles, you can't use object arrays. Every particle needs position, origin, velocity, color, weight, looseness, stick timer, and fallen state. That's ~20 properties per particle. With object arrays, the garbage collector will eat your framerate alive.

```javascript
// this is what 230k particles actually looks like in memory
posX       = new Float32Array(count);
posY       = new Float32Array(count);
originX    = new Float32Array(count);
originY    = new Float32Array(count);
velX       = new Float32Array(count);
velY       = new Float32Array(count);
colR       = new Uint8ClampedArray(count);
colG       = new Uint8ClampedArray(count);
colB       = new Uint8ClampedArray(count);
colA       = new Uint8ClampedArray(count);
weight     = new Float32Array(count);
loose      = new Float32Array(count);
stickTimer = new Int16Array(count);
fallen     = new Uint8Array(count);
```

Separate arrays, not an array of structs. Cache-friendly iteration. Zero garbage collection pressure.

### Organic decay needs seeds, not waves

The breakthrough was abandoning the top-down wave entirely. Instead: scatter 20-35 elliptical seed points randomly across the screen. Each seed has its own radius, growth speed, delay, and elliptical distortion (random scaleX, scaleY, rotation angle). Seeds expand over time, loosening every particle they touch.

Combine that with drip columns (6% of columns melt 3-7x faster — creating vertical fingers of decay) and neighbor contagion (loose particles stochastically spread looseness to nearby static ones), and you get something that actually looks like rot. Pockets appear. They grow. They merge. The decay feels alive because it IS chaotic — thirty-something overlapping ellipses with different timings, not a single uniform sweep.

```javascript
// seeds start with real radius — no waiting for growth from zero
const initR = 20 + Math.random() * 30;
seedPoints.push({
  x: Math.random() * cw, y: Math.random() * ch,
  radius: initR, speed: 40 + Math.random() * 100,
  maxRadius: 100 + Math.random() * 300,
  // elliptical distortion — no perfect circles
  scaleX: 0.5 + Math.random() * 1.5,
  scaleY: 0.5 + Math.random() * 1.5,
  angle: Math.random() * Math.PI,
});
```

### Per-particle trig will kill you

Each frame, every particle needs to check if it's inside any active seed's elliptical region. That's an elliptical distance calculation involving sin/cos of the seed's rotation angle. At 230k particles x 30+ seeds = 7 million trig calls per frame.

The fix: pre-compute each seed's cos/sin and inverse scale factors once per frame, and use axis-aligned bounding boxes for fast rejection before doing the real elliptical math. Most particles fail the bounding box check and never touch trig at all.

### Zero-copy rendering

The trail buffer is a `Uint8ClampedArray` the exact size of the canvas ImageData. Every frame: dim it (multiply RGB by 0.88), write particle colors directly into it, then pass it straight to `new ImageData(trailBuffer, w, h)`. No intermediate canvas. No buffer copy. The browser gets a direct reference to the same memory.

The original version was creating a fresh `Uint8ClampedArray` copy every frame — 8MB of allocation at 60fps. Removing that single line was the biggest performance win of the entire project.

### Remove boundaries, not fix them

The puddle zone was a hard line at 85% screen height where particles were supposed to "arrive." it created a visible shelf artifact that no amount of threshold tuning could fix. Velocity checks, displacement minimums, random depth offsets — all band-aids on a bad idea.

The fix was deleting the entire puddle zone concept. Particles just fall under gravity until they hit the actual screen bottom. No artificial boundary. No shelf. The puddle forms naturally because that's where gravity takes things.

**Lesson:** if you're spending more time tuning a boundary than building the feature, the boundary shouldn't exist.

### Synthesized audio that breathes

Phase 7 added audio — but the interesting part wasn't adding sound, it was making sound *stop*. The ambient drone is three layered oscillators (sawtooth, sub-sine, detuned triangle) through a lowpass filter with a slow LFO wobble. Eerie and dark. But the drone doesn't just play — it tracks the ratio of particles still in motion. As the decay completes and particles settle, the filter closes, the LFO slows, the volume drops. When everything hits bottom, silence.

The drip sounds were the opposite lesson. The first version played a plop for every particle that hit the floor. At peak decay that's hundreds per second — pure noise. The fix: 2% chance per impact, 0.7 second minimum interval. You hear maybe one drip every second or two. Just enough to know something is happening. Restraint turned noise into atmosphere.

## Glimmers

The interaction layer was the final touch that made it feel real. Move your cursor near the decay and particles push away — you can carve through the falling mass. But your cursor also accelerates decay around it, so touching the image makes it melt faster. You're both disrupting and contributing to the destruction.

Falling particles also loosen nearby static ones on contact (collection effect), so the decay cascades — a falling stream pulls adjacent pixels loose as it passes. The whole thing becomes self-reinforcing once it starts.

```javascript
// the CONFIG block — every parameter is tunable
const CONFIG = {
  pixelClusterSize: 3,    // NxN pixel blocks
  gravity: 140,            // px/s^2
  drag: 0.97,
  viscosity: 0.96,
  lateralJitter: 12,       // sideways wobble
  decayStartDelay: 2.0,    // seconds before melt begins
  stickChance: 0.003,      // surface tension pauses
  mouseRadius: 80,          // cursor influence
  mousePushForce: 400,      // how hard cursor pushes
  mouseDecayBoost: 0.4,    // cursor accelerates decay
  trailFade: 0.88,          // afterglow persistence
  masterVolume: 0.35,       // audio levels
  // ... 30+ parameters total
};
```

Everything is exposed in the CONFIG object at the top of the file — physics, timing, interaction, audio, visual polish. One object, one file, every knob you'd want to turn.

## Distillation

The whole project is 1,000 lines of vanilla javascript in a single HTML file. No build step. No dependencies. No framework. Serve it with `npx serve` and click start.

What i actually learned: the hardest part of making something look organic isn't the physics — it's removing the systems you built that make it look artificial. The puddle zone, the linear wave, the uniform timing. Every time i removed a "system" and replaced it with randomness bounded by simple rules, the effect got better.

Decay isn't a transition. It's the absence of structure. The best way to simulate it is to stop trying to control it.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-03-27_the_melt.html).*