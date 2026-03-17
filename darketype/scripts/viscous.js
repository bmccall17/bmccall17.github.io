(function () {
  // 1. GUARD: skip on mobile
  if (window.innerWidth < 768) return;

  // 2. INJECT: SVG filter into DOM
  var svgNS = 'http://www.w3.org/2000/svg';
  var svgEl = document.createElementNS(svgNS, 'svg');
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

  // 3. CACHE: filter element references
  var noise = document.getElementById('vt-noise');
  var dispR = document.getElementById('vt-disp-r');
  var dispG = document.getElementById('vt-disp-g');
  var dispB = document.getElementById('vt-disp-b');

  // 4. FIND: all .glitch-text elements
  var glitchEls = document.querySelectorAll('.glitch-text');
  if (!glitchEls.length) return;

  // 5. RANDOMIZE: glitch animation timing per element
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
  var isHovering = false;
  var isPressing = false;
  var pressStart = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  glitchEls.forEach(function (el) {
    el.addEventListener('mouseenter', function () { isHovering = true; });
    el.addEventListener('mouseleave', function () { isHovering = false; });
    el.addEventListener('mousedown', function (e) {
      if (e.button === 0) { isPressing = true; pressStart = Date.now(); }
    });
  });

  document.addEventListener('mouseup', function () { isPressing = false; });

  // 7. STATE MACHINE
  var STATE_IDLE = 0, STATE_TURB = 1, STATE_DRIP = 2, STATE_PRESS = 3;
  var state = STATE_IDLE;
  var idleTimer = 0;
  var dripPhase = 0; // 0-1 progress
  var dripDuration = 3000;
  var dripStart = 0;

  // Current interpolated params
  var cur = { scaleR: 1, scaleG: 1, scaleB: 1, freqX: 0.015, freqY: 0.015, octaves: 3 };
  // Target params
  var tgt = { scaleR: 1, scaleG: 1, scaleB: 1, freqX: 0.015, freqY: 0.015, octaves: 3 };

  // Seed timing
  var seed = 0;
  var nextSeedChange = 0;

  // Throttle DOM writes to ~30fps
  var lastWrite = 0;
  var WRITE_INTERVAL = 1000 / 30;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function tick(now) {
    requestAnimationFrame(tick);

    // Velocity (smoothed)
    var dx = mouseX - prevX, dy = mouseY - prevY;
    var instantV = Math.sqrt(dx * dx + dy * dy);
    velocity = lerp(velocity, instantV, 0.15);
    prevX = mouseX;
    prevY = mouseY;

    // State transitions
    var prevState = state;

    if (isPressing && isHovering) {
      state = STATE_PRESS;
      idleTimer = 0;
    } else if (isHovering && velocity > 0.5) {
      state = STATE_TURB;
      idleTimer = 0;
    } else if (isHovering && state === STATE_TURB) {
      // Mouse stopped while hovering — start idle timer
      idleTimer += 16.67;
      if (idleTimer > 800) {
        state = STATE_DRIP;
        dripStart = now;
        dripDuration = rand(2500, 3500);
      }
    } else if (state === STATE_DRIP) {
      dripPhase = clamp((now - dripStart) / dripDuration, 0, 1);
      if (isHovering && velocity > 0.5) {
        state = STATE_TURB;
        idleTimer = 0;
      } else if (isPressing) {
        state = STATE_PRESS;
      } else if (dripPhase >= 1) {
        state = STATE_IDLE;
      }
    } else if (!isHovering && !isPressing && state !== STATE_DRIP) {
      state = STATE_IDLE;
      idleTimer = 0;
    }

    // Compute targets per state
    var lerpFactor = 0.06;

    if (state === STATE_IDLE) {
      tgt.scaleR = rand(1, 2);
      tgt.scaleG = rand(1, 2);
      tgt.scaleB = rand(1, 2);
      tgt.freqX = 0.015;
      tgt.freqY = 0.015;
      tgt.octaves = 3;
      // Arrhythmic seed
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
    } else if (state === STATE_PRESS) {
      var holdDuration = Date.now() - pressStart;
      var pressIntensity = clamp(holdDuration / 1500, 0, 1);
      tgt.scaleR = lerp(20, 40, pressIntensity);
      tgt.scaleG = lerp(12, 25, pressIntensity);
      tgt.scaleB = lerp(24, 50, pressIntensity);
      tgt.freqX = lerp(0.06, 0.15, pressIntensity);
      tgt.freqY = tgt.freqX;
      tgt.octaves = 4;
      // Seed every frame for max chaos
      seed++;
      lerpFactor = 0.08;
    } else if (state === STATE_DRIP) {
      var p = dripPhase;
      if (p < 0.6) {
        // Streak phase
        var streakP = p / 0.6;
        tgt.freqX = 0.005;
        tgt.freqY = lerp(0.04, 0.07, streakP);
        var ramp = lerp(2, 12, streakP);
        tgt.scaleR = ramp * 1.1;
        tgt.scaleG = ramp * 0.8;
        tgt.scaleB = ramp * 1.3;
      } else {
        // Ripple phase
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

    // Release from press: faster lerp
    if (prevState === STATE_PRESS && state !== STATE_PRESS) {
      lerpFactor = 0.12;
    }

    // 8. LERP current toward target
    cur.scaleR = lerp(cur.scaleR, tgt.scaleR, lerpFactor);
    cur.scaleG = lerp(cur.scaleG, tgt.scaleG, lerpFactor);
    cur.scaleB = lerp(cur.scaleB, tgt.scaleB, lerpFactor);
    cur.freqX = lerp(cur.freqX, tgt.freqX, lerpFactor);
    cur.freqY = lerp(cur.freqY, tgt.freqY, lerpFactor);

    // 9. WRITE: throttled DOM updates
    if (now - lastWrite < WRITE_INTERVAL) return;
    lastWrite = now;

    var freqStr = cur.freqX.toFixed(4) + ' ' + cur.freqY.toFixed(4);
    noise.setAttribute('baseFrequency', freqStr);
    noise.setAttribute('seed', seed);
    noise.setAttribute('numOctaves', tgt.octaves);
    dispR.setAttribute('scale', cur.scaleR.toFixed(1));
    dispG.setAttribute('scale', cur.scaleG.toFixed(1));
    dispB.setAttribute('scale', cur.scaleB.toFixed(1));
  }

  requestAnimationFrame(tick);
})();
