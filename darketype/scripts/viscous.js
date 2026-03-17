(function () {
  // 1. GUARD: skip on mobile
  if (window.innerWidth < 768) return;

  // 2. INJECT: SVG filters into DOM
  var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('width', '0');
  svgEl.setAttribute('height', '0');
  svgEl.style.position = 'absolute';
  svgEl.innerHTML =
    // Heading filter — full intensity LCD chromatic ripple
    '<filter id="viscous-turb" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence id="vt-noise" type="turbulence" baseFrequency="0.015" numOctaves="3" seed="0" result="noise"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>' +
      '<feDisplacementMap id="vt-disp-r" in="red" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="r-out"/>' +
      '<feDisplacementMap id="vt-disp-g" in="green" in2="noise" scale="0" xChannelSelector="G" yChannelSelector="B" result="g-out"/>' +
      '<feDisplacementMap id="vt-disp-b" in="blue" in2="noise" scale="0" xChannelSelector="B" yChannelSelector="R" result="b-out"/>' +
      '<feBlend in="r-out" in2="g-out" mode="screen" result="rg"/>' +
      '<feBlend in="rg" in2="b-out" mode="screen"/>' +
    '</filter>' +
    // Content filter — separate instance for blog entry body drip
    '<filter id="viscous-content" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence id="vc-noise" type="turbulence" baseFrequency="0.015" numOctaves="3" seed="0" result="noise"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>' +
      '<feDisplacementMap id="vc-disp-r" in="red" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="r-out"/>' +
      '<feDisplacementMap id="vc-disp-g" in="green" in2="noise" scale="0" xChannelSelector="G" yChannelSelector="B" result="g-out"/>' +
      '<feDisplacementMap id="vc-disp-b" in="blue" in2="noise" scale="0" xChannelSelector="B" yChannelSelector="R" result="b-out"/>' +
      '<feBlend in="r-out" in2="g-out" mode="screen" result="rg"/>' +
      '<feBlend in="rg" in2="b-out" mode="screen"/>' +
    '</filter>';
  document.body.appendChild(svgEl);

  // 3. CACHE: heading filter refs
  var noise = document.getElementById('vt-noise');
  var dispR = document.getElementById('vt-disp-r');
  var dispG = document.getElementById('vt-disp-g');
  var dispB = document.getElementById('vt-disp-b');

  // Content filter refs
  var cNoise = document.getElementById('vc-noise');
  var cDispR = document.getElementById('vc-disp-r');
  var cDispG = document.getElementById('vc-disp-g');
  var cDispB = document.getElementById('vc-disp-b');

  // 4. FIND: heading elements
  // .glitch-text always has the filter (via CSS). h1/h2 get it only on engagement.
  // Exclude headings inside #content — they use the content filter instead.
  var contentEl = document.getElementById('content');
  var glitchEls = document.querySelectorAll('.glitch-text');
  var headingEls = [];
  document.querySelectorAll('h1, h2').forEach(function (el) {
    if (!contentEl || !contentEl.contains(el)) headingEls.push(el);
  });
  var allViscousEls = Array.prototype.slice.call(glitchEls).concat(headingEls);

  // Track which h1/h2 are currently "active" (filter applied)
  var activeHeading = null;

  function activateHeading(el) {
    if (el.classList.contains('glitch-text')) return; // always has filter via CSS
    el.style.filter = 'url(#viscous-turb)';
    el.style.willChange = 'filter';
    activeHeading = el;
  }

  function deactivateHeading() {
    if (activeHeading && !activeHeading.classList.contains('glitch-text')) {
      activeHeading.style.filter = '';
      activeHeading.style.willChange = '';
    }
    activeHeading = null;
  }

  // 5. RANDOMIZE: glitch animation timing on .glitch-text elements
  glitchEls.forEach(function (el) {
    function randomizeDuration() {
      el.style.animationDuration = (1.5 + Math.random() * 1.5).toFixed(2) + 's';
    }
    randomizeDuration();
    el.addEventListener('animationiteration', randomizeDuration);
  });

  // 6. TRACK: mouse state
  var mouseX = 0, mouseY = 0, prevX = 0, prevY = 0;
  var velocity = 0;
  var isHoveringHeading = false;
  var hoveredEl = null;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  allViscousEls.forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      isHoveringHeading = true;
      hoveredEl = el;
      activateHeading(el);
    });
    el.addEventListener('mouseleave', function () {
      isHoveringHeading = false;
      hoveredEl = null;
      // Don't deactivate during drip — let it finish
      if (state !== STATE_DRIP) {
        deactivateHeading();
      }
    });
    // Click on heading triggers drip
    el.addEventListener('click', function (e) {
      if (state !== STATE_DRIP) {
        activateHeading(el);
        state = STATE_DRIP;
        dripStart = performance.now();
        dripDuration = rand(2500, 3500);
      }
    });
  });

  // 7. HEADING STATE MACHINE (3 states: idle, turbulence, drip — no press)
  var STATE_IDLE = 0, STATE_TURB = 1, STATE_DRIP = 2;
  var state = STATE_IDLE;
  var idleTimer = 0;
  var dripPhase = 0;
  var dripDuration = 3000;
  var dripStart = 0;

  // Current + target interpolated params (idle = zero displacement)
  var cur = { scaleR: 0, scaleG: 0, scaleB: 0, freqX: 0.015, freqY: 0.015, octaves: 3 };
  var tgt = { scaleR: 0, scaleG: 0, scaleB: 0, freqX: 0.015, freqY: 0.015, octaves: 3 };

  var seed = 0;
  var nextSeedChange = 0;

  // Throttle DOM writes to ~30fps
  var lastWrite = 0;
  var WRITE_INTERVAL = 1000 / 30;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // ────────────────────────────────────────────────
  // 8. CONTENT EFFECT — cursor-relative chromatic + click-drip
  // ────────────────────────────────────────────────
  // contentEl already declared in section 4
  var contentDripping = false;
  var contentDripStart = 0;
  var contentDripDuration = 3000;
  var cCur = { scaleR: 0, scaleG: 0, scaleB: 0, freqX: 0.015, freqY: 0.015 };
  var cTgt = { scaleR: 0, scaleG: 0, scaleB: 0, freqX: 0.015, freqY: 0.015 };
  var cSeed = 100;
  var cNextSeedChange = 0;
  var isHoveringContent = false;

  if (contentEl) {
    contentEl.style.filter = 'url(#viscous-content)';
    contentEl.style.willChange = 'filter';

    contentEl.addEventListener('mouseenter', function () { isHoveringContent = true; });
    contentEl.addEventListener('mouseleave', function () {
      isHoveringContent = false;
      // Clear chromatic text-shadow on leave
      contentEl.style.textShadow = '';
    });

    // Click triggers content drip
    contentEl.addEventListener('click', function (e) {
      // Don't trigger on link/button clicks or image viewer
      if (e.target.closest('a, button, img')) return;
      contentDripping = true;
      contentDripStart = performance.now();
      contentDripDuration = rand(2500, 3500);
    });
  }

  // ────────────────────────────────────────────────
  // 9. rAF LOOP
  // ────────────────────────────────────────────────
  function tick(now) {
    requestAnimationFrame(tick);

    // Velocity (smoothed)
    var dx = mouseX - prevX, dy = mouseY - prevY;
    var instantV = Math.sqrt(dx * dx + dy * dy);
    velocity = lerp(velocity, instantV, 0.15);
    prevX = mouseX;
    prevY = mouseY;

    // ── Heading state transitions ──
    if (isHoveringHeading && velocity > 0.5) {
      state = STATE_TURB;
      idleTimer = 0;
    } else if (isHoveringHeading && state === STATE_TURB) {
      idleTimer += 16.67;
      if (idleTimer > 800) {
        state = STATE_DRIP;
        dripStart = now;
        dripDuration = rand(2500, 3500);
      }
    } else if (state === STATE_DRIP) {
      dripPhase = clamp((now - dripStart) / dripDuration, 0, 1);
      if (isHoveringHeading && velocity > 0.5) {
        state = STATE_TURB;
        idleTimer = 0;
      } else if (dripPhase >= 1) {
        state = STATE_IDLE;
        if (!isHoveringHeading) deactivateHeading();
      }
    } else if (!isHoveringHeading && state !== STATE_DRIP) {
      state = STATE_IDLE;
      idleTimer = 0;
    }

    // ── Heading targets ──
    var lerpFactor = 0.06;

    if (state === STATE_IDLE) {
      // Subtle shimmer for .glitch-text (always filtered via CSS).
      // h1/h2 don't have the filter applied when idle, so these values
      // only visually affect .glitch-text.
      tgt.scaleR = rand(1, 2);
      tgt.scaleG = rand(1, 2);
      tgt.scaleB = rand(1, 2);
      tgt.freqX = 0.015;
      tgt.freqY = 0.015;
      tgt.octaves = 3;
      if (now > nextSeedChange) {
        seed++;
        nextSeedChange = now + rand(300, 700);
      }
    } else if (state === STATE_TURB) {
      var vFactor = clamp(velocity / 30, 0, 1);
      tgt.scaleR = lerp(6, 20, vFactor);
      tgt.scaleG = lerp(3, 12, vFactor);
      tgt.scaleB = lerp(8, 24, vFactor);
      tgt.freqX = lerp(0.03, 0.10, vFactor);
      tgt.freqY = tgt.freqX;
      tgt.octaves = 3;
      if (now > nextSeedChange) {
        seed++;
        nextSeedChange = now + rand(30, 120);
      }
    } else if (state === STATE_DRIP) {
      var p = dripPhase;
      if (p < 0.6) {
        var streakP = p / 0.6;
        tgt.freqX = 0.005;
        tgt.freqY = lerp(0.04, 0.07, streakP);
        var ramp = lerp(2, 12, streakP);
        tgt.scaleR = ramp * 1.1;
        tgt.scaleG = ramp * 0.8;
        tgt.scaleB = ramp * 1.3;
      } else {
        var rippleP = (p - 0.6) / 0.4;
        tgt.freqX = lerp(0.005, 0.03, rippleP);
        tgt.freqY = lerp(0.07, 0.02, rippleP);
        var decay = lerp(12, 1, rippleP);
        tgt.scaleR = decay * 1.2;
        tgt.scaleG = decay * 0.7;
        tgt.scaleB = decay * 1.4;
      }
      tgt.octaves = 3;
      if (now > nextSeedChange) {
        seed++;
        nextSeedChange = now + rand(60, 150);
      }
    }

    // Heading lerp
    cur.scaleR = lerp(cur.scaleR, tgt.scaleR, lerpFactor);
    cur.scaleG = lerp(cur.scaleG, tgt.scaleG, lerpFactor);
    cur.scaleB = lerp(cur.scaleB, tgt.scaleB, lerpFactor);
    cur.freqX = lerp(cur.freqX, tgt.freqX, lerpFactor);
    cur.freqY = lerp(cur.freqY, tgt.freqY, lerpFactor);

    // ── Content effect ──
    if (contentEl) {
      // Cursor-relative chromatic text-shadow (subtle, follows cursor direction)
      if (isHoveringContent && !contentDripping) {
        var rect = contentEl.getBoundingClientRect();
        var cx = (mouseX - rect.left) / rect.width - 0.5;  // -0.5 to 0.5
        var cy = (mouseY - rect.top) / rect.height - 0.5;
        var rX = (cx * 2.0).toFixed(1);
        var rY = (cy * 0.8).toFixed(1);
        var bX = (-cx * 2.0).toFixed(1);
        var bY = (-cy * 0.8).toFixed(1);
        contentEl.style.textShadow =
          rX + 'px ' + rY + 'px rgba(255,0,0,0.12), ' +
          bX + 'px ' + bY + 'px rgba(0,100,255,0.12)';
        // Very subtle displacement from cursor movement
        var cVFactor = clamp(velocity / 50, 0, 1);
        cTgt.scaleR = lerp(0, 3, cVFactor);
        cTgt.scaleG = lerp(0, 1.5, cVFactor);
        cTgt.scaleB = lerp(0, 4, cVFactor);
        cTgt.freqX = 0.015;
        cTgt.freqY = 0.015;
        if (now > cNextSeedChange) {
          cSeed++;
          cNextSeedChange = now + rand(200, 500);
        }
      } else if (contentDripping) {
        // Content drip — more dramatic on click
        contentEl.style.textShadow = '';
        var cp = clamp((now - contentDripStart) / contentDripDuration, 0, 1);
        if (cp < 0.6) {
          var sp = cp / 0.6;
          cTgt.freqX = 0.005;
          cTgt.freqY = lerp(0.03, 0.06, sp);
          var cRamp = lerp(1, 10, sp);
          cTgt.scaleR = cRamp * 1.2;
          cTgt.scaleG = cRamp * 0.7;
          cTgt.scaleB = cRamp * 1.4;
        } else {
          var rp = (cp - 0.6) / 0.4;
          cTgt.freqX = lerp(0.005, 0.02, rp);
          cTgt.freqY = lerp(0.06, 0.015, rp);
          var cDecay = lerp(10, 0, rp);
          cTgt.scaleR = cDecay * 1.2;
          cTgt.scaleG = cDecay * 0.7;
          cTgt.scaleB = cDecay * 1.4;
        }
        if (now > cNextSeedChange) {
          cSeed++;
          cNextSeedChange = now + rand(40, 120);
        }
        if (cp >= 1) {
          contentDripping = false;
        }
      } else {
        // Content idle — no displacement
        cTgt.scaleR = 0;
        cTgt.scaleG = 0;
        cTgt.scaleB = 0;
      }

      // Content lerp
      cCur.scaleR = lerp(cCur.scaleR, cTgt.scaleR, 0.08);
      cCur.scaleG = lerp(cCur.scaleG, cTgt.scaleG, 0.08);
      cCur.scaleB = lerp(cCur.scaleB, cTgt.scaleB, 0.08);
      cCur.freqX = lerp(cCur.freqX, cTgt.freqX, 0.08);
      cCur.freqY = lerp(cCur.freqY, cTgt.freqY, 0.08);
    }

    // ── DOM WRITES (throttled ~30fps) ──
    if (now - lastWrite < WRITE_INTERVAL) return;
    lastWrite = now;

    // Heading filter
    var freqStr = cur.freqX.toFixed(4) + ' ' + cur.freqY.toFixed(4);
    noise.setAttribute('baseFrequency', freqStr);
    noise.setAttribute('seed', seed);
    noise.setAttribute('numOctaves', tgt.octaves);
    dispR.setAttribute('scale', cur.scaleR.toFixed(1));
    dispG.setAttribute('scale', cur.scaleG.toFixed(1));
    dispB.setAttribute('scale', cur.scaleB.toFixed(1));

    // Content filter
    if (contentEl) {
      var cFreqStr = cCur.freqX.toFixed(4) + ' ' + cCur.freqY.toFixed(4);
      cNoise.setAttribute('baseFrequency', cFreqStr);
      cNoise.setAttribute('seed', cSeed);
      cDispR.setAttribute('scale', cCur.scaleR.toFixed(1));
      cDispG.setAttribute('scale', cCur.scaleG.toFixed(1));
      cDispB.setAttribute('scale', cCur.scaleB.toFixed(1));
    }
  }

  requestAnimationFrame(tick);
})();
