// ── SIDEBAR ENGINES + SECRET GLYPH HUD ──────────────────────────
// Adds 4 sidebar modes to the widescreen gutters, controlled by
// a cryptic vertical glyph HUD in the top-left corner.
// Symbols and mode-to-button assignments are randomized per load.
(function() {
  'use strict';

  var leftCanvas = document.getElementById('sidebar-left');
  var rightCanvas = document.getElementById('sidebar-right');
  var glyphHud = document.getElementById('glyph-hud');
  if (!leftCanvas || !rightCanvas || !glyphHud) return;

  var lCtx = leftCanvas.getContext('2d');
  var rCtx = rightCanvas.getContext('2d');
  var currentMode = 'off';
  var sidebarRAF = null;

  // ── Canvas sizing ──
  function resizeCanvases() {
    var dpr = window.devicePixelRatio || 1;
    [leftCanvas, rightCanvas].forEach(function(c) {
      var w = c.offsetWidth;
      var h = c.offsetHeight;
      if (w < 1 || h < 1) return;
      c.width = w * dpr;
      c.height = h * dpr;
      c.getContext('2d').scale(dpr, dpr);
    });
  }
  window.addEventListener('resize', resizeCanvases);
  resizeCanvases();

  // ── Shuffle utility ──
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // ── Glyph HUD setup ──
  var glyphPool = [
    '\u2300','\u2394','\u23e3','\u25ec','\u27c1','\u229e','\u23cf','\u2388','\u232c','\u25ce',
    '\u27d0','\u23da','\u2316','\u25c7','\u22a1','\u238a','\u23c3','\u232d','\u25c8','\u27df',
    '\u2298','\u23c6','\u238d','\u25c9','\u27e0','\u2317','\u23cd','\u238b','\u27e1','\u229c',
    '\u233e','\u23db','\u2386','\u25cd','\u27e4','\u229b','\u23ce','\u238c','\u25a3','\u27e3'
  ];
  var modeKeys = ['off', 'pictogram', 'matrix', 'noise', 'spine'];
  var shuffledGlyphs = shuffle(glyphPool).slice(0, 5);
  var shuffledModes = shuffle(modeKeys);
  var btns = glyphHud.querySelectorAll('.gh-btn');

  for (var bi = 0; bi < btns.length; bi++) {
    btns[bi].textContent = shuffledGlyphs[bi];
    btns[bi].setAttribute('data-mode', shuffledModes[bi]);
    btns[bi].title = '';
  }

  // Click handler
  glyphHud.addEventListener('click', function(e) {
    var btn = e.target.closest ? e.target.closest('.gh-btn') : null;
    if (!btn && e.target.className === 'gh-btn') btn = e.target;
    if (!btn) return;
    e.stopPropagation();
    for (var i = 0; i < btns.length; i++) btns[i].className = 'gh-btn';
    btn.className = 'gh-btn active';
    currentMode = btn.getAttribute('data-mode');
    initMode(currentMode);
  });

  // Auto-start random active mode (not 'off')
  var activeModes = [];
  for (var mi = 0; mi < shuffledModes.length; mi++) {
    if (shuffledModes[mi] !== 'off') activeModes.push(shuffledModes[mi]);
  }
  var startMode = activeModes[Math.floor(Math.random() * activeModes.length)];
  currentMode = startMode;
  for (var i = 0; i < btns.length; i++) {
    if (btns[i].getAttribute('data-mode') === startMode) {
      btns[i].className = 'gh-btn active';
    }
  }
  setTimeout(function() { initMode(startMode); }, 200);

  // ── MODE A: Pictogram ──
  function drawShield(ctx, cx, cy, s) {
    ctx.strokeStyle = 'rgba(0,255,65,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s*0.4);
    ctx.lineTo(cx + s*0.3, cy - s*0.25);
    ctx.lineTo(cx + s*0.3, cy + s*0.05);
    ctx.quadraticCurveTo(cx + s*0.25, cy + s*0.35, cx, cy + s*0.45);
    ctx.quadraticCurveTo(cx - s*0.25, cy + s*0.35, cx - s*0.3, cy + s*0.05);
    ctx.lineTo(cx - s*0.3, cy - s*0.25);
    ctx.closePath();
    ctx.stroke();
    for (var i = 0; i < 3; i++) {
      var ax = cx + s*0.35 + i*s*0.05;
      var ay = cy - s*0.15 + i*s*0.15;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      ctx.lineTo(ax + s*0.12, ay); ctx.stroke();
    }
  }
  function drawPrism(ctx, cx, cy, s) {
    ctx.strokeStyle = 'rgba(0,255,65,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s*0.35);
    ctx.lineTo(cx - s*0.3, cy + s*0.3);
    ctx.lineTo(cx + s*0.3, cy + s*0.3);
    ctx.closePath(); ctx.stroke();
    var colors = ['rgba(255,50,50,0.06)','rgba(50,255,50,0.06)','rgba(50,80,255,0.06)'];
    for (var i = 0; i < colors.length; i++) {
      ctx.strokeStyle = colors[i]; ctx.beginPath();
      ctx.moveTo(cx + s*0.12, cy + (i-1)*s*0.06);
      ctx.lineTo(cx + s*0.5, cy + (i-1)*s*0.25);
      ctx.stroke();
    }
  }
  function drawEye(ctx, cx, cy, s) {
    ctx.strokeStyle = 'rgba(0,255,65,0.07)';
    ctx.lineWidth = 1.5;
    // Outer eye shape
    ctx.beginPath();
    ctx.moveTo(cx - s*0.4, cy);
    ctx.quadraticCurveTo(cx, cy - s*0.25, cx + s*0.4, cy);
    ctx.quadraticCurveTo(cx, cy + s*0.25, cx - s*0.4, cy);
    ctx.stroke();
    // Iris
    ctx.beginPath();
    ctx.arc(cx, cy, s*0.1, 0, Math.PI*2);
    ctx.stroke();
    // Pupil
    ctx.fillStyle = 'rgba(0,255,65,0.05)';
    ctx.beginPath();
    ctx.arc(cx, cy, s*0.04, 0, Math.PI*2);
    ctx.fill();
  }
  var pictoFns = [drawShield, drawPrism, drawEye];
  var pictoLeft = pictoFns[Math.floor(Math.random() * pictoFns.length)];
  var pictoRight = pictoFns[Math.floor(Math.random() * pictoFns.length)];

  function tickPictogram() {
    var w = leftCanvas.offsetWidth, h = leftCanvas.offsetHeight;
    if (w < 1) return;
    lCtx.clearRect(0,0,w,h); rCtx.clearRect(0,0,w,h);
    var scrollOff = window.scrollY * 0.03;
    var s = Math.min(w * 0.8, 280);
    pictoLeft(lCtx, w/2, h/2 + Math.sin(scrollOff*0.02)*20, s);
    pictoRight(rCtx, w/2, h/2 + Math.cos(scrollOff*0.02)*20, s);
  }

  // ── MODE B: Matrix Rain ──
  var matrixColumns = [];
  function initMatrix() {
    matrixColumns = [];
    var w = leftCanvas.offsetWidth;
    var h = leftCanvas.offsetHeight;
    var colW = 14;
    var nCols = Math.max(1, Math.floor(w / colW));
    for (var side = 0; side < 2; side++) {
      var cols = [];
      for (var i = 0; i < nCols; i++) {
        cols.push({
          x: i * colW + colW/2,
          y: Math.random() * h,
          speed: 0.3 + Math.random() * 1.2,
          chars: [],
          nextChar: 0
        });
      }
      matrixColumns.push(cols);
    }
  }
  function tickMatrix() {
    var w = leftCanvas.offsetWidth, h = leftCanvas.offsetHeight;
    if (w < 1) return;
    var ctxArr = [lCtx, rCtx];
    for (var si = 0; si < 2; si++) {
      var ctx = ctxArr[si];
      ctx.fillStyle = 'rgba(10,10,10,0.08)';
      ctx.fillRect(0,0,w,h);
      ctx.font = '11px "Courier New", monospace';
      var cols = matrixColumns[si] || [];
      for (var ci = 0; ci < cols.length; ci++) {
        var col = cols[ci];
        col.y += col.speed;
        if (col.y > h) col.y = -20;
        col.nextChar--;
        if (col.nextChar <= 0) {
          col.chars.push({ y: col.y, ch: Math.random() > 0.5 ? '1' : '0', life: 1 });
          col.nextChar = 2 + Math.floor(Math.random()*3);
        }
        for (var chi = col.chars.length-1; chi >= 0; chi--) {
          var c = col.chars[chi];
          c.life -= 0.008;
          if (c.life <= 0) { col.chars.splice(chi,1); continue; }
          var alpha = c.life * 0.35;
          var glitch = Math.random() > 0.995;
          ctx.fillStyle = glitch
            ? 'rgba(255,50,50,' + (alpha+0.1) + ')'
            : 'rgba(0,255,65,' + alpha + ')';
          ctx.fillText(c.ch, col.x, c.y);
        }
      }
    }
  }

  // ── MODE C: Noise Field ──
  var particles = [];
  function initNoise() {
    particles = [];
    var w = leftCanvas.offsetWidth, h = leftCanvas.offsetHeight;
    for (var side = 0; side < 2; side++) {
      var pts = [];
      var count = Math.max(10, Math.floor(w * h / 3000));
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random()*w, y: Math.random()*h,
          vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3
        });
      }
      particles.push(pts);
    }
  }
  function tickNoise() {
    var w = leftCanvas.offsetWidth, h = leftCanvas.offsetHeight;
    if (w < 1) return;
    var linkDist = 80;
    var ctxArr = [lCtx, rCtx];
    for (var si = 0; si < 2; si++) {
      var ctx = ctxArr[si];
      ctx.clearRect(0,0,w,h);
      var pts = particles[si] || [];
      for (var pi = 0; pi < pts.length; pi++) {
        var p = pts[pi];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }
      ctx.strokeStyle = 'rgba(0,255,65,0.04)';
      ctx.lineWidth = 0.5;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i+1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var d = Math.sqrt(dx*dx + dy*dy);
          if (d < linkDist) {
            ctx.globalAlpha = (1 - d/linkDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,255,65,0.12)';
      for (var pi = 0; pi < pts.length; pi++) {
        ctx.fillRect(pts[pi].x-1, pts[pi].y-1, 2, 2);
      }
    }
  }

  // ── MODE D: Scroll Spine ──
  function tickSpine() {
    var w = leftCanvas.offsetWidth, h = leftCanvas.offsetHeight;
    if (w < 1) return;
    lCtx.clearRect(0,0,w,h); rCtx.clearRect(0,0,w,h);
    var contentEl = document.getElementById('content');
    if (!contentEl) return;
    var headings = contentEl.querySelectorAll('h1,h2,h3');
    var docH = document.documentElement.scrollHeight;
    var scrollY = window.scrollY;
    var viewH = window.innerHeight;
    lCtx.font = '10px "Courier New", monospace';
    var railX = Math.min(w - 10, 20);
    lCtx.strokeStyle = 'rgba(0,143,17,0.15)';
    lCtx.lineWidth = 1;
    lCtx.beginPath(); lCtx.moveTo(railX, 30); lCtx.lineTo(railX, h-30); lCtx.stroke();
    for (var hi = 0; hi < headings.length; hi++) {
      var hd = headings[hi];
      var rect = hd.getBoundingClientRect();
      var absTop = rect.top + scrollY;
      var pct = absTop / docH;
      var y = 30 + pct * (h-60);
      var visible = rect.top >= 0 && rect.top < viewH;
      lCtx.fillStyle = visible ? 'rgba(0,255,65,0.6)' : 'rgba(0,143,17,0.25)';
      lCtx.beginPath(); lCtx.arc(railX, y, 3, 0, Math.PI*2); lCtx.fill();
      var label = hd.textContent.substring(0, Math.floor((w-railX-12)/6));
      lCtx.fillText(label, railX+8, y+3);
    }
    var scrollPct = scrollY / Math.max(1, docH - viewH);
    var indY = 30 + scrollPct * (h-60);
    lCtx.fillStyle = 'rgba(0,255,65,0.5)';
    lCtx.fillRect(railX-6, indY-1, 4, 3);
    var paras = contentEl.querySelectorAll('p, li, blockquote, pre');
    rCtx.fillStyle = 'rgba(0,255,65,0.06)';
    for (var pi = 0; pi < paras.length; pi++) {
      var pr = paras[pi].getBoundingClientRect();
      var pAbsTop = pr.top + scrollY;
      var pY = 30 + (pAbsTop/docH) * (h-60);
      var mh = Math.max(1, (pr.height/docH) * (h-60));
      var density = Math.min(1, paras[pi].textContent.length / 500);
      rCtx.globalAlpha = 0.03 + density * 0.08;
      rCtx.fillRect(10, pY, w-20, mh);
    }
    rCtx.globalAlpha = 1;
    rCtx.strokeStyle = 'rgba(0,255,65,0.15)';
    rCtx.lineWidth = 1;
    var vpTop = 30 + (scrollY/docH)*(h-60);
    var vpH = Math.max(4, (viewH/docH)*(h-60));
    rCtx.strokeRect(8, vpTop, w-16, vpH);
  }

  // ── Engine orchestrator ──
  function initMode(mode) {
    if (sidebarRAF) cancelAnimationFrame(sidebarRAF);
    sidebarRAF = null;
    var w = leftCanvas.offsetWidth, h = leftCanvas.offsetHeight;
    if (w > 0 && h > 0) {
      lCtx.clearRect(0,0,w,h); rCtx.clearRect(0,0,w,h);
    }
    if (mode === 'off') return;
    if (mode === 'matrix') initMatrix();
    if (mode === 'noise') initNoise();
    function loop() {
      sidebarRAF = requestAnimationFrame(loop);
      if (currentMode === 'pictogram') tickPictogram();
      else if (currentMode === 'matrix') tickMatrix();
      else if (currentMode === 'noise') tickNoise();
      else if (currentMode === 'spine') tickSpine();
    }
    loop();
  }
})();
