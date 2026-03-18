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
  // 8. PER-CHARACTER CHROMATIC DISPLACEMENT ENGINE
  // ────────────────────────────────────────────────
  // contentEl already declared in section 4

  var CC = {
    proxRadius: 170, maxDisplacement: 7, maxRotation: 8,
    chromaSpread: 4, chromaAlpha: 0.5, greenThreshold: 0.5,
    activityRamp: 0.08, activityDecay: 0.02,
    rippleBand: 60, rippleFrontDisp: 8, rippleWakeDisp: 3,
    wakeCutoff: 300, dripBlend: 0.6, gravityDrift: 6,
    rippleChroma: 0.45, rippleRotation: 3,
    wakeFloor: 0.21, wakeFloorStep: 0.08
  };

  var CHAR_EXCLUDE = { PRE:1, CODE:1, A:1, IMG:1, BUTTON:1, IFRAME:1, SVG:1, SCRIPT:1, STYLE:1 };
  var BLOCK_SEL = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th';
  var BLOCK_GATE_PAD = 50;
  var RECACHE_INTERVAL = 2000;

  var charSpans = [], charPositions = [], charBlockIdx = [], charBlocks = [];
  var charPosDirty = true;
  var prevTransforms = [], prevShadows = [];
  var activeChars = {};       // sparse object used as set (index → true)
  var activeCharCount = 0;
  var isHoveringContent = false;
  var contentActivity = 0;
  var lastScrollY = window.scrollY;
  var lastRecache = 0;

  var ripples = [];
  var MAX_RIPPLES = 8;

  var charWrapping = false;   // flag to suppress observer during wrap
  var contentObserver = null; // hoisted so wrapContentChars can disconnect

  function charShouldExclude(node) {
    var n = node;
    while (n && n !== contentEl) {
      if (n.nodeType === 1 && CHAR_EXCLUDE[n.tagName]) return true;
      n = n.parentNode;
    }
    return false;
  }

  function wrapContentChars() {
    if (!contentEl) return;
    charWrapping = true;
    if (contentObserver) contentObserver.disconnect();
    unwrapChars();

    var walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) {
      if (!charShouldExclude(node)) textNodes.push(node);
    }

    for (var ti = 0; ti < textNodes.length; ti++) {
      var tNode = textNodes[ti];
      var text = tNode.textContent;
      if (!text) continue;
      var frag = document.createDocumentFragment();
      for (var ci = 0; ci < text.length; ci++) {
        var span = document.createElement('span');
        span.className = 'prox-char';
        span.textContent = text[ci];
        if (/\s/.test(text[ci])) span.setAttribute('data-ws', '');
        frag.appendChild(span);
      }
      tNode.parentNode.replaceChild(frag, tNode);
    }

    charSpans = Array.prototype.slice.call(contentEl.querySelectorAll('.prox-char'));
    prevTransforms = new Array(charSpans.length);
    prevShadows = new Array(charSpans.length);
    for (var i = 0; i < charSpans.length; i++) { prevTransforms[i] = ''; prevShadows[i] = ''; }
    activeChars = {};
    activeCharCount = 0;

    buildCharBlockMap();
    cacheCharPositions();
    charWrapping = false;
    if (contentObserver) contentObserver.observe(contentEl, { childList: true, subtree: true });
  }

  function unwrapChars() {
    activeChars = {};
    activeCharCount = 0;
    var spans = contentEl.querySelectorAll('.prox-char');
    for (var i = 0; i < spans.length; i++) {
      var txt = document.createTextNode(spans[i].textContent);
      spans[i].parentNode.replaceChild(txt, spans[i]);
    }
    contentEl.normalize();
    charSpans = [];
    charPositions = [];
    charBlockIdx = [];
    charBlocks = [];
  }

  function buildCharBlockMap() {
    charBlocks = [];
    var blockEls = contentEl.querySelectorAll(BLOCK_SEL);
    for (var bi = 0; bi < blockEls.length; bi++) {
      if (CHAR_EXCLUDE[blockEls[bi].tagName]) continue;
      charBlocks.push({ el: blockEls[bi], rect: null, charStart: -1, charEnd: -1 });
    }
    charBlockIdx = new Array(charSpans.length);
    for (var ci = 0; ci < charSpans.length; ci++) {
      charBlockIdx[ci] = -1;
      for (var bi = 0; bi < charBlocks.length; bi++) {
        if (charBlocks[bi].el.contains(charSpans[ci])) {
          charBlockIdx[ci] = bi;
          if (charBlocks[bi].charStart === -1) charBlocks[bi].charStart = ci;
          charBlocks[bi].charEnd = ci;
          break;
        }
      }
    }
  }

  function cacheCharPositions() {
    charPositions = new Array(charSpans.length);
    for (var i = 0; i < charSpans.length; i++) {
      var r = charSpans[i].getBoundingClientRect();
      charPositions[i] = { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
    }
    for (var bi = 0; bi < charBlocks.length; bi++) {
      charBlocks[bi].rect = charBlocks[bi].el.getBoundingClientRect();
    }
    charPosDirty = false;
    lastRecache = performance.now();
    lastScrollY = window.scrollY;
  }

  function adjustCharScroll() {
    var dy = lastScrollY - window.scrollY;
    if (dy === 0) return;
    for (var i = 0; i < charPositions.length; i++) charPositions[i].y += dy;
    for (var bi = 0; bi < charBlocks.length; bi++) {
      var br = charBlocks[bi].rect;
      if (br) charBlocks[bi].rect = { top: br.top + dy, bottom: br.bottom + dy, left: br.left, right: br.right, width: br.width, height: br.height };
    }
    lastScrollY = window.scrollY;
  }

  if (contentEl) {
    contentObserver = new MutationObserver(function () {
      if (!charWrapping) wrapContentChars();
    });
    contentObserver.observe(contentEl, { childList: true, subtree: true });

    contentEl.addEventListener('mouseenter', function () { isHoveringContent = true; });
    contentEl.addEventListener('mouseleave', function () { isHoveringContent = false; });

    window.addEventListener('scroll', adjustCharScroll, { passive: true });
    window.addEventListener('resize', function () { charPosDirty = true; });

    document.addEventListener('click', function (e) {
      if (e.target.closest('a, button, input, select, textarea')) return;
      var slot = null;
      for (var i = 0; i < ripples.length; i++) { if (!ripples[i].active) { slot = ripples[i]; break; } }
      if (!slot) {
        if (ripples.length < MAX_RIPPLES) {
          slot = { active: false, x: 0, y: 0, startTime: 0, duration: 0, maxRadius: 0 };
          ripples.push(slot);
        } else {
          slot = ripples[0];
          var oldestAge = 0;
          for (var i = 0; i < ripples.length; i++) {
            var age = performance.now() - ripples[i].startTime;
            if (age > oldestAge) { oldestAge = age; slot = ripples[i]; }
          }
        }
      }
      slot.active = true;
      slot.x = e.clientX;
      slot.y = e.clientY;
      slot.startTime = performance.now();
      slot.duration = 6000 * (0.85 + Math.random() * 0.3);
      slot.maxRadius = 800 * (0.85 + Math.random() * 0.3);
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

    // ── Per-character content displacement ──
    if (!contentEl || charSpans.length === 0) return;

    // Activity
    if (isHoveringContent && velocity > 1) {
      contentActivity = clamp(contentActivity + CC.activityRamp, 0, 1);
    } else {
      contentActivity = clamp(contentActivity - CC.activityDecay, 0, 1);
    }

    // Recache
    if (charPosDirty || (now - lastRecache > RECACHE_INTERVAL)) cacheCharPositions();

    // Read config locals
    var _pr = CC.proxRadius, _md = CC.maxDisplacement, _mr = CC.maxRotation;
    var _cs = CC.chromaSpread, _ca = CC.chromaAlpha, _gt = CC.greenThreshold;
    var _rb = CC.rippleBand, _rfd = CC.rippleFrontDisp, _rwd = CC.rippleWakeDisp;
    var _wc = CC.wakeCutoff, _db = CC.dripBlend, _gd = CC.gravityDrift;
    var _rc = CC.rippleChroma, _rr = CC.rippleRotation;

    // Active ripples
    var aRipples = [];
    for (var ri = 0; ri < ripples.length; ri++) {
      var rp = ripples[ri];
      if (!rp.active) continue;
      var prog = clamp((now - rp.startTime) / rp.duration, 0, 1);
      if (prog >= 1) { rp.active = false; continue; }
      aRipples.push({ x: rp.x, y: rp.y, progress: prog, radius: prog * rp.maxRadius });
    }

    // Dynamic wake floor
    var wf = Math.min(0.95, CC.wakeFloor + Math.max(0, aRipples.length - 1) * CC.wakeFloorStep);

    var gateR = _pr + BLOCK_GATE_PAD;
    var newActive = {};
    var newActiveCount = 0;

    // ── Block gate → char compute ──
    for (var bi = 0; bi < charBlocks.length; bi++) {
      var b = charBlocks[bi];
      if (!b.rect || b.charStart === -1) continue;

      var clX = mouseX < b.rect.left ? b.rect.left : mouseX > b.rect.right ? b.rect.right : mouseX;
      var clY = mouseY < b.rect.top ? b.rect.top : mouseY > b.rect.bottom ? b.rect.bottom : mouseY;
      var bDx = mouseX - clX, bDy = mouseY - clY;
      var blockDist = Math.sqrt(bDx * bDx + bDy * bDy);

      var blockInProx = blockDist < gateR && contentActivity > 0.001;
      var blockInRipple = false;
      if (aRipples.length > 0) {
        var bcx = b.rect.left + b.rect.width * 0.5, bcy = b.rect.top + b.rect.height * 0.5;
        for (var ri = 0; ri < aRipples.length; ri++) {
          var rp = aRipples[ri];
          var rbd = Math.sqrt((bcx - rp.x) * (bcx - rp.x) + (bcy - rp.y) * (bcy - rp.y));
          if (rbd < rp.radius + _rb + BLOCK_GATE_PAD && rbd > rp.radius - _wc - BLOCK_GATE_PAD) {
            blockInRipple = true; break;
          }
        }
      }

      if (!blockInProx && !blockInRipple) continue;

      for (var ci = b.charStart; ci <= b.charEnd; ci++) {
        if (charBlockIdx[ci] !== bi) continue;
        if (charSpans[ci].hasAttribute('data-ws')) continue;

        var pos = charPositions[ci];
        var ttx = 0, tty = 0, trot = 0;
        var hasSh = false;
        var rsx = 0, rsy = 0, bsx = 0, bsy = 0, ra = 0, ba = 0, gsy = 0, ga = 0;

        // Proximity
        if (blockInProx) {
          var cdx = pos.x - mouseX, cdy = pos.y - mouseY;
          var dist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (dist < _pr) {
            var pi = 1 - dist / _pr;
            pi = pi * (0.4 + pi * 0.6) * contentActivity;
            if (pi > 0.01) {
              var angle = (dist < 5 && velocity > 0.5) ?
                Math.atan2(prevY - mouseY, prevX - mouseX) :
                Math.atan2(cdy, cdx);
              var cosA = Math.cos(angle), sinA = Math.sin(angle);
              ttx += cosA * pi * _md;
              tty += sinA * pi * _md;
              trot += pi * _mr * (cosA > 0 ? 1 : -1);
              var sp = pi * _cs;
              rsx = cosA * sp; rsy = sinA * sp;
              bsx = -rsx; bsy = -rsy;
              ra = pi * _ca; ba = pi * _ca;
              if (pi > _gt) { gsy = pi * 2; ga = (pi - _gt) * 0.3; }
              hasSh = true;
            }
          }
        }

        // Ripple (all stack)
        for (var ri = 0; ri < aRipples.length; ri++) {
          var rp = aRipples[ri];
          var rdx = pos.x - rp.x, rdy = pos.y - rp.y;
          var rDist = Math.sqrt(rdx * rdx + rdy * rdy);
          var rAngle = Math.atan2(rdy, rdx);
          var fi = 0, wi = 0;
          var dff = rDist - rp.radius; if (dff < 0) dff = -dff;
          if (dff < _rb) { fi = 1 - dff / _rb; fi *= fi; }
          var bf = rp.radius - rDist;
          if (bf > 0 && bf < _wc && rp.radius > 10) {
            wi = (1 - (bf / rp.radius) * 0.5) * (1 - rp.progress);
            if (wi < 0) wi = 0; if (wi > 1) wi = 1;
          }
          var tr = fi * 1.2 + wi * 0.7; if (tr > 1) tr = 1;
          if (tr > wf) {
            var rSpread = fi * _rfd + wi * _rwd;
            var da = rAngle + (1.5708 - rAngle) * rp.progress * _db;
            var ox = Math.cos(da) * rSpread, oy = Math.sin(da) * rSpread;
            var dd = tr * rp.progress * _gd;
            ttx += ox; tty += oy + dd;
            trot += tr * _rr * (Math.cos(da) > 0 ? 1 : -1);
            var rrA = tr * _rc, rgA = tr * _rc * 0.33;
            if (hasSh) {
              rsx += ox; rsy += oy + dd; bsx -= ox; bsy -= (oy + dd);
              ra = ra + rrA > 1 ? 1 : ra + rrA; ba = ba + rrA > 1 ? 1 : ba + rrA;
              gsy += dd * 1.5; ga = ga + rgA > 1 ? 1 : ga + rgA;
            } else {
              rsx = ox; rsy = oy + dd; bsx = -ox; bsy = -(oy + dd);
              ra = rrA; ba = rrA; gsy = dd * 1.5; ga = rgA;
            }
            hasSh = true;
          }
        }

        // Emit
        var hasEff = ttx > 0.01 || ttx < -0.01 || tty > 0.01 || tty < -0.01 || trot > 0.01 || trot < -0.01;
        if (hasEff || hasSh) {
          newActive[ci] = true;
          newActiveCount++;

          var xf = 'translate(' + ttx.toFixed(2) + 'px,' + tty.toFixed(2) + 'px) rotate(' + trot.toFixed(2) + 'deg)';
          if (xf !== prevTransforms[ci]) {
            charSpans[ci].style.transform = xf;
            prevTransforms[ci] = xf;
          }

          if (hasSh) {
            var qsx = (Math.round(rsx * 2) / 2), qsy = (Math.round(rsy * 2) / 2);
            var qbx = (Math.round(bsx * 2) / 2), qby = (Math.round(bsy * 2) / 2);
            var qra = (Math.round(ra * 20) / 20), qba = (Math.round(ba * 20) / 20);
            var sh = qsx + 'px ' + qsy + 'px 0 rgba(255,20,20,' + qra + '),' +
                     qbx + 'px ' + qby + 'px 0 rgba(30,80,255,' + qba + ')';
            if (ga > 0.001) {
              sh += ',0px ' + (Math.round(gsy * 2) / 2) + 'px 0 rgba(0,255,65,' + (Math.round(ga * 20) / 20) + ')';
            }
            if (sh !== prevShadows[ci]) {
              charSpans[ci].style.textShadow = sh;
              prevShadows[ci] = sh;
            }
          }
        }
      }
    }

    // Clear chars that left active set
    for (var ci in activeChars) {
      if (!newActive[ci]) {
        var idx = +ci;
        if (prevTransforms[idx] !== '') { charSpans[idx].style.transform = ''; prevTransforms[idx] = ''; }
        if (prevShadows[idx] !== '') { charSpans[idx].style.textShadow = ''; prevShadows[idx] = ''; }
      }
    }
    activeChars = newActive;
    activeCharCount = newActiveCount;
  }

  requestAnimationFrame(tick);
})();
