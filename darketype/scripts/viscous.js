(function () {
  // 1. GUARD: skip on mobile
  if (window.innerWidth < 768) return;

  // 2. INJECT: SVG filter into DOM (heading filter only)
  var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('width', '0');
  svgEl.setAttribute('height', '0');
  svgEl.style.position = 'absolute';
  svgEl.innerHTML =
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
    '</filter>';
  document.body.appendChild(svgEl);

  // 3. CACHE: heading filter refs
  var noise = document.getElementById('vt-noise');
  var dispR = document.getElementById('vt-disp-r');
  var dispG = document.getElementById('vt-disp-g');
  var dispB = document.getElementById('vt-disp-b');

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
  // 8. CONTENT EFFECT — proximity-based chromatic + click ripple
  // ────────────────────────────────────────────────
  // contentEl already declared in section 4
  var contentBlocks = [];
  var contentBlocksDirty = true;
  var isHoveringContent = false;

  // Click ripple state
  var ripple = { active: false, x: 0, y: 0, radius: 0, startTime: 0, duration: 6000, maxRadius: 800 };

  // Proximity config
  var PROX_RADIUS = 250; // px — how far the chromatic field extends from cursor
  var contentActivity = 0; // 0-1, ramps with movement, decays when still

  function refreshContentBlocks() {
    contentBlocks = [];
    if (!contentEl) return;
    var els = contentEl.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, td, th');
    for (var i = 0; i < els.length; i++) {
      // Skip images and interactive elements
      if (els[i].tagName === 'IMG' || els[i].tagName === 'A') continue;
      contentBlocks.push({ el: els[i], shadow: '' });
    }
    contentBlocksDirty = false;
  }

  if (contentEl) {
    // Watch for dynamic content load (entry.html loads markdown async)
    var observer = new MutationObserver(function () { contentBlocksDirty = true; });
    observer.observe(contentEl, { childList: true, subtree: true });

    contentEl.addEventListener('mouseenter', function () { isHoveringContent = true; });
    contentEl.addEventListener('mouseleave', function () {
      isHoveringContent = false;
      // Clear all block shadows
      for (var i = 0; i < contentBlocks.length; i++) {
        if (contentBlocks[i].shadow) {
          contentBlocks[i].el.style.textShadow = '';
          contentBlocks[i].shadow = '';
        }
      }
    });

    // Click triggers ripple from click point
    contentEl.addEventListener('click', function (e) {
      if (e.target.closest('a, button, img')) return;
      ripple.active = true;
      ripple.x = e.clientX;
      ripple.y = e.clientY;
      ripple.radius = 0;
      ripple.startTime = performance.now();
      ripple.duration = rand(5000, 7000);
      ripple.maxRadius = rand(700, 900);
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

    // ── Content proximity + ripple (per-element, throttled with heading writes) ──
    if (contentEl) {
      if (contentBlocksDirty) refreshContentBlocks();

      // Activity: ramps up when cursor moves over content, decays when still
      if (isHoveringContent && velocity > 1) {
        contentActivity = clamp(contentActivity + 0.08, 0, 1);
      } else {
        contentActivity = clamp(contentActivity - 0.02, 0, 1); // ~1.5s fade
      }

      // Ripple state
      var rippleProgress = 0;
      if (ripple.active) {
        rippleProgress = clamp((now - ripple.startTime) / ripple.duration, 0, 1);
        ripple.radius = rippleProgress * ripple.maxRadius;
        if (rippleProgress >= 1) ripple.active = false;
      }

      for (var i = 0; i < contentBlocks.length; i++) {
        var block = contentBlocks[i];
        var el = block.el;
        var rect = el.getBoundingClientRect();
        // Use closest edge point, not center — feels more precise for wide blocks
        var elCX = clamp(mouseX, rect.left, rect.right);
        var elCY = clamp(mouseY, rect.top, rect.bottom);
        var newShadow = '';

        // 1. Cursor proximity chromatic fringe (fades when mouse stops)
        if (contentActivity > 0.01) {
          var pdx = mouseX - elCX;
          var pdy = mouseY - elCY;
          var pDist = Math.sqrt(pdx * pdx + pdy * pdy);

          if (pDist < PROX_RADIUS) {
            // Linear falloff with a soft toe, scaled by activity
            var pIntensity = 1 - (pDist / PROX_RADIUS);
            pIntensity = pIntensity * (0.4 + pIntensity * 0.6) * contentActivity;

            // Chromatic direction: R/B pushed away from cursor along the vector
            var angle = Math.atan2(pdy, pdx);
            // If cursor is inside the element, use velocity direction instead
            if (pDist < 5 && velocity > 0.5) {
              angle = Math.atan2(mouseY - prevY, mouseX - prevX);
            }
            var spread = pIntensity * 5;
            var rOff = Math.cos(angle) * spread;
            var rOffY = Math.sin(angle) * spread;
            var alpha = (pIntensity * 0.4).toFixed(2);

            newShadow =
              rOff.toFixed(1) + 'px ' + rOffY.toFixed(1) + 'px rgba(255,20,20,' + alpha + '), ' +
              (-rOff).toFixed(1) + 'px ' + (-rOffY).toFixed(1) + 'px rgba(30,80,255,' + alpha + ')';

            // Add green channel ghost at high proximity
            if (pIntensity > 0.5) {
              var gAlpha = ((pIntensity - 0.5) * 0.3).toFixed(2);
              newShadow += ', 0px ' + (pIntensity * 2).toFixed(1) + 'px rgba(0,255,65,' + gAlpha + ')';
            }
          }
        }

        // 2. Click ripple — expanding ring + dissolving wake from click origin
        if (ripple.active) {
          // Distance from click origin to element center (use actual center for ripple geometry)
          var blockCX = rect.left + rect.width / 2;
          var blockCY = rect.top + rect.height / 2;
          var rdx = blockCX - ripple.x;
          var rdy = blockCY - ripple.y;
          var rDist = Math.sqrt(rdx * rdx + rdy * rdy);

          // Radial angle from click origin to element
          var rAngle = Math.atan2(rdy, rdx);

          // The wavefront ring: sharp leading edge
          var BAND = 100;
          var distFromFront = Math.abs(rDist - ripple.radius);
          var frontIntensity = 0;
          if (distFromFront < BAND) {
            frontIntensity = 1 - (distFromFront / BAND);
            frontIntensity *= frontIntensity;
          }

          // The wake: elements already passed by the wavefront dissolve slowly
          var wakeIntensity = 0;
          if (rDist < ripple.radius && ripple.radius > 10) {
            // How far behind the front (0 = just passed, 1 = at click origin)
            var behindRatio = 1 - (rDist / ripple.radius);
            // Wake fades based on overall progress — dissolves over time
            wakeIntensity = (1 - behindRatio * 0.5) * (1 - rippleProgress);
            wakeIntensity = clamp(wakeIntensity, 0, 1);
          }

          var totalRipple = clamp(frontIntensity * 1.2 + wakeIntensity * 0.7, 0, 1);

          if (totalRipple > 0.02) {
            // Spread: front hits hard, wake is wider but softer
            var rSpread = frontIntensity * 7 + wakeIntensity * 4;

            // Direction: starts radial from click, rotates toward downward over time
            // Drip angle blends from radial → straight down as ripple progresses
            var dripAngle = rAngle + (Math.PI / 2 - rAngle) * rippleProgress * 0.6;
            var rrOff = Math.cos(dripAngle) * rSpread;
            var rrOffY = Math.sin(dripAngle) * rSpread;

            // Vertical drip component increases with time
            var dripDrift = totalRipple * rippleProgress * 6;

            var rAlpha = (totalRipple * 0.45).toFixed(2);
            var gAlpha = (totalRipple * 0.15).toFixed(2);

            var rippleShadow =
              rrOff.toFixed(1) + 'px ' + (rrOffY + dripDrift).toFixed(1) + 'px rgba(255,20,20,' + rAlpha + '), ' +
              (-rrOff).toFixed(1) + 'px ' + (-rrOffY + dripDrift).toFixed(1) + 'px rgba(30,80,255,' + rAlpha + '), ' +
              '0px ' + (dripDrift * 1.5).toFixed(1) + 'px rgba(0,255,65,' + gAlpha + ')';

            newShadow = newShadow ? newShadow + ', ' + rippleShadow : rippleShadow;
          }
        }

        // Only write if changed
        if (newShadow !== block.shadow) {
          el.style.textShadow = newShadow;
          block.shadow = newShadow;
        }
      }
    }
  }

  requestAnimationFrame(tick);
})();
