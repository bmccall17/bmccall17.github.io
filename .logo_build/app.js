/* ═══════════════════════════════════════════
   BAM LOGO FACTORY — Engine
   https://bmccall17.github.io/.logo_build
   ═══════════════════════════════════════════ */

const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('logo-svg');
const canvasArea = document.getElementById('canvas-area');

// ── Default values (matching the original SVG) ──
const DEFAULTS = {
    circleRadius: 242, circleFillDark: 11, ringStroke: 6.2, innerRingOpacity: 46,
    chromRedX: 12, chromRedY: 5, chromCyanX: -9, chromCyanY: -1,
    chromOpacity: 40, chromStrokeW: 2.9,
    ringGlowBlur: 25, ringGlowOpacity: 37,
    bamGlowBlur: 35, bamGlowOpacity: 52,
    nameGlowBlur: 31, nameGlowOpacity: 52,
    sliceCount: 2,
    slice1Y: 192, slice1H: 15, slice1X: 12,
    slice2Y: 341, slice2H: 18, slice2X: 11,
    slice3Y: 360, slice3H: 5, slice3X: 19,
    sliceExtend: false,
    scanLineOn: false, scanLineY: 486, scanLineW: 765, scanLineH: 2.3, scanLineOpacity: 39,
    bamFontSize: 178, bamLetterSpacing: 6, bamYOffset: 12,
    nameX: 595, brettSize: 160, brettY: 114, aSize: 160, aY: 216,
    mccallSize: 160, mccallY: 319, nameLetterSpacing: -2,
    colorPrimary: '#39ff14', colorRing: '#2dff05',
    colorChromRed: '#ff2255', colorChromCyan: '#00ffee', colorSliceTint: '#00ffcc',
    distortFreqX: 97, distortFreqY: 24, distortScale: 2, distortSeed: 85
};

let bgMode = 'transparent';

// ── Seeded PRNG (mulberry32) — timestamp-based seed ──
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Create PRNG seeded with current millisecond timestamp
const rng = mulberry32(Date.now());

// ── Randomize controls within tasteful ranges ──
function randomizeControls() {
    // Helper: random float in [min, max]
    const rf = (min, max) => min + rng() * (max - min);
    // Helper: random int in [min, max]
    const ri = (min, max) => Math.round(rf(min, max));
    // Helper: random hex color with hue jitter
    const rHue = (baseH, range) => {
        const h = (baseH + ri(-range, range) + 360) % 360;
        const s = ri(80, 100);
        const l = ri(45, 65);
        return hslToHex(h, s, l);
    };

    function hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
        return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
    }

    const vals = {
        circleRadius: ri(200, 280),
        circleFillDark: ri(4, 16),
        ringStroke: rf(1.5, 5),
        innerRingOpacity: ri(10, 40),
        chromRedX: ri(2, 12),
        chromRedY: ri(-6, 6),
        chromCyanX: ri(-12, -2),
        chromCyanY: ri(-6, 6),
        chromOpacity: ri(15, 40),
        chromStrokeW: rf(1.5, 5),
        ringGlowBlur: ri(15, 55),
        ringGlowOpacity: ri(50, 90),
        bamGlowBlur: ri(10, 35),
        bamGlowOpacity: ri(35, 70),
        nameGlowBlur: ri(6, 25),
        nameGlowOpacity: ri(25, 60),
        sliceCount: ri(1, 5),
        slice1Y: ri(150, 250),
        slice1H: ri(4, 25),
        slice1X: ri(5, 25),
        slice2Y: ri(280, 370),
        slice2H: ri(3, 18),
        slice2X: ri(-25, -3),
        slice3Y: ri(340, 420),
        slice3H: ri(2, 12),
        slice3X: ri(8, 30),
        sliceExtend: rng() > 0.6,
        scanLineOn: rng() > 0.3,
        scanLineY: ri(160, 350),
        scanLineW: ri(200, 600),
        scanLineH: rf(0.8, 3),
        scanLineOpacity: ri(20, 55),
        bamFontSize: ri(120, 180),
        bamLetterSpacing: ri(-6, 4),
        bamYOffset: ri(15, 45),
        nameX: ri(560, 700),
        brettSize: ri(120, 175),
        brettY: ri(130, 210),
        aSize: ri(70, 130),
        aY: ri(260, 340),
        mccallSize: ri(120, 175),
        mccallY: ri(350, 440),
        nameLetterSpacing: ri(-5, 3),
        colorPrimary: rHue(120, 30),
        colorRing: rHue(115, 25),
        colorChromRed: rHue(345, 20),
        colorChromCyan: rHue(175, 25),
        colorSliceTint: rHue(160, 30),
        distortFreqX: ri(15, 70),
        distortFreqY: ri(40, 150),
        distortScale: ri(3, 15),
        distortSeed: ri(0, 100)
    };

    for (const [key, val] of Object.entries(vals)) {
        const input = document.getElementById(key);
        if (!input) continue;
        if (input.type === 'checkbox') input.checked = val;
        else input.value = typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val;
        updateValDisplay(input);
    }
}

// ── Helper: read all control values ──
function getValues() {
    const v = {};
    for (const key of Object.keys(DEFAULTS)) {
        const el = document.getElementById(key);
        if (!el) { v[key] = DEFAULTS[key]; continue; }
        if (el.type === 'checkbox') v[key] = el.checked;
        else if (el.type === 'color') v[key] = el.value;
        else v[key] = parseFloat(el.value);
    }
    return v;
}

// ── Helper: create SVG element ──
function el(tag, attrs, text) {
    const e = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const [k, val] of Object.entries(attrs)) e.setAttribute(k, val);
    if (text !== undefined) e.textContent = text;
    return e;
}

// ── Rebuild SVG ──
function render() {
    const v = getValues();
    svg.innerHTML = '';

    const cx = 280, cy = 280;
    const r = v.circleRadius;
    const dark = v.circleFillDark;
    const fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif";

    // — Defs —
    const defs = el('defs');

    // Neon glow filter for BAM text
    const neonGlow = el('filter', { id: 'neon-glow', x: '-70%', y: '-70%', width: '240%', height: '240%' });
    neonGlow.append(
        el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '6', result: 'b1' }),
        el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: String(v.bamGlowBlur), result: 'b2' }),
        el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: String(v.bamGlowBlur * 2), result: 'b3' })
    );
    const m1 = el('feMerge');
    m1.append(el('feMergeNode', { in: 'b3' }), el('feMergeNode', { in: 'b2' }), el('feMergeNode', { in: 'b1' }), el('feMergeNode', { in: 'SourceGraphic' }));
    neonGlow.append(m1);
    defs.append(neonGlow);

    // Text glow filter for name
    const textGlow = el('filter', { id: 'text-glow', x: '-30%', y: '-30%', width: '160%', height: '160%' });
    textGlow.append(
        el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: String(v.nameGlowBlur * 0.33), result: 'b1' }),
        el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: String(v.nameGlowBlur), result: 'b2' })
    );
    const m2 = el('feMerge');
    m2.append(el('feMergeNode', { in: 'b2' }), el('feMergeNode', { in: 'b1' }), el('feMergeNode', { in: 'SourceGraphic' }));
    textGlow.append(m2);
    defs.append(textGlow);

    // Ring glow filter
    const ringGlow = el('filter', { id: 'ring-glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    ringGlow.append(
        el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: String(v.ringGlowBlur * 0.36), result: 'b1' }),
        el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: String(v.ringGlowBlur), result: 'b2' }),
        el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: String(v.ringGlowBlur * 2), result: 'b3' })
    );
    const m3 = el('feMerge');
    m3.append(el('feMergeNode', { in: 'b3' }), el('feMergeNode', { in: 'b2' }), el('feMergeNode', { in: 'b1' }), el('feMergeNode', { in: 'SourceGraphic' }));
    ringGlow.append(m3);
    defs.append(ringGlow);

    // Ring distortion filter
    const ringDistort = el('filter', { id: 'ring-distort', x: '-15%', y: '-15%', width: '130%', height: '130%' });
    ringDistort.append(
        el('feTurbulence', { type: 'turbulence', baseFrequency: `${v.distortFreqX / 1000} ${v.distortFreqY / 100}`, numOctaves: '2', seed: String(v.distortSeed), result: 'noise' }),
        el('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: String(v.distortScale), xChannelSelector: 'R', yChannelSelector: 'G' })
    );
    defs.append(ringDistort);

    // Circle fill gradient
    const grad = el('radialGradient', { id: 'circle-fill', cx: '50%', cy: '42%', r: '62%' });
    const d1 = Math.round(dark * 2.3);
    const d2 = Math.round(dark * 0.75);
    grad.append(
        el('stop', { offset: '0%', 'stop-color': `rgb(${d1},${d1 + Math.round(dark)},${d1})` }),
        el('stop', { offset: '100%', 'stop-color': `rgb(${d2},${d2 + Math.round(dark * 0.25)},${d2})` })
    );
    defs.append(grad);

    // Glitch clip paths
    const sliceData = [
        { y: v.slice1Y, h: v.slice1H },
        { y: v.slice2Y, h: v.slice2H },
        { y: v.slice3Y, h: v.slice3H },
    ];
    const clipW = v.sliceExtend ? 1600 : 565;
    for (let i = 0; i < 3; i++) {
        const cp = el('clipPath', { id: `gc${i + 1}` });
        cp.append(el('rect', { x: '0', y: String(sliceData[i].y), width: String(clipW), height: String(sliceData[i].h) }));
        defs.append(cp);
    }

    svg.append(defs);

    // — Background rect (only for export preview) —
    // not added here; handled in export

    // — Outer atmospheric glow ring —
    svg.append(el('circle', {
        cx, cy, r: r + 3, fill: 'none', stroke: v.colorPrimary,
        'stroke-width': '5', filter: 'url(#ring-glow)', opacity: String(v.ringGlowOpacity / 100)
    }));

    // — Circle body —
    svg.append(el('circle', { cx, cy, r, fill: 'url(#circle-fill)' }));

    // — Chromatic aberration rings —
    svg.append(el('circle', {
        cx: cx + v.chromRedX, cy: cy + v.chromRedY, r, fill: 'none',
        stroke: v.colorChromRed, 'stroke-width': String(v.chromStrokeW), opacity: String(v.chromOpacity / 100)
    }));
    svg.append(el('circle', {
        cx: cx + v.chromCyanX, cy: cy + v.chromCyanY, r, fill: 'none',
        stroke: v.colorChromCyan, 'stroke-width': String(v.chromStrokeW), opacity: String(v.chromOpacity / 100)
    }));

    // — Main ring (distorted) —
    svg.append(el('circle', {
        cx, cy, r, fill: 'none', stroke: v.colorRing, 'stroke-width': String(v.ringStroke),
        filter: 'url(#ring-distort)', opacity: '0.92'
    }));

    // — Inner ring accent —
    svg.append(el('circle', {
        cx, cy, r: r - 6, fill: 'none', stroke: v.colorPrimary,
        'stroke-width': '0.8', opacity: String(v.innerRingOpacity / 100)
    }));

    // — BAM text glow —
    const bamY = cy + v.bamYOffset;
    const bamAttrs = {
        x: cx, y: bamY, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
        'font-family': fontStack, 'font-weight': '700',
        'font-size': String(v.bamFontSize), 'letter-spacing': String(v.bamLetterSpacing)
    };
    svg.append(el('text', { ...bamAttrs, fill: v.colorPrimary, filter: 'url(#neon-glow)', opacity: String(v.bamGlowOpacity / 100) }, 'bam'));
    svg.append(el('text', { ...bamAttrs, fill: v.colorPrimary }, 'bam'));

    // — Glitch slices —
    const sliceShifts = [v.slice1X, v.slice2X, v.slice3X];
    const sliceColors = [v.colorPrimary, v.colorSliceTint, v.colorPrimary];
    const sliceOpacities = [0.88, 0.85, 0.95];
    const sliceTextOpacities = [0.9, 0.8, 0.75];

    for (let i = 0; i < Math.min(v.sliceCount, 3); i++) {
        const shift = sliceShifts[i];
        const g = el('g', { 'clip-path': `url(#gc${i + 1})` });

        // Shifted circle body
        g.append(el('circle', { cx: cx + shift, cy, r, fill: 'url(#circle-fill)', opacity: String(sliceOpacities[i]) }));
        // Shifted ring
        if (i < 2) {
            g.append(el('circle', { cx: cx + shift, cy, r, fill: 'none', stroke: v.colorRing, 'stroke-width': '2', opacity: String(0.7 - i * 0.1) }));
        }
        // Shifted BAM text
        g.append(el('text', {
            x: cx + shift, y: bamY, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
            'font-family': fontStack, 'font-weight': '700',
            'font-size': String(v.bamFontSize), 'letter-spacing': String(v.bamLetterSpacing),
            fill: sliceColors[i], opacity: String(sliceTextOpacities[i])
        }, 'bam'));

        // If extending, also shift name text
        if (v.sliceExtend) {
            const nameTexts = [
                { text: 'brett', size: v.brettSize, y: v.brettY },
                { text: 'a', size: v.aSize, y: v.aY },
                { text: 'mccall', size: v.mccallSize, y: v.mccallY }
            ];
            for (const nt of nameTexts) {
                g.append(el('text', {
                    x: v.nameX + shift, y: nt.y, 'dominant-baseline': 'hanging',
                    'font-family': fontStack, 'font-weight': '700',
                    'font-size': String(nt.size), 'letter-spacing': String(v.nameLetterSpacing),
                    fill: sliceColors[i], opacity: String(sliceTextOpacities[i])
                }, nt.text));
            }
        }

        svg.append(g);
    }

    // Extra slices 4-6 (generated automatically)
    for (let i = 3; i < v.sliceCount; i++) {
        const autoY = 150 + i * 70;
        const autoH = 3 + Math.random() * 8;
        const autoShift = (i % 2 === 0 ? 1 : -1) * (5 + i * 4);
        const cpId = `gc-auto-${i}`;
        const cp = el('clipPath', { id: cpId });
        cp.append(el('rect', { x: '0', y: String(autoY), width: String(clipW), height: String(autoH) }));
        defs.append(cp);

        const g = el('g', { 'clip-path': `url(#${cpId})` });
        g.append(el('circle', { cx: cx + autoShift, cy, r, fill: 'url(#circle-fill)', opacity: '0.85' }));
        g.append(el('text', {
            x: cx + autoShift, y: bamY, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
            'font-family': fontStack, 'font-weight': '700',
            'font-size': String(v.bamFontSize), 'letter-spacing': String(v.bamLetterSpacing),
            fill: v.colorPrimary, opacity: '0.7'
        }, 'bam'));
        svg.append(g);
    }

    // — Scan line artifact —
    if (v.scanLineOn) {
        svg.append(el('rect', {
            x: '90', y: String(v.scanLineY), width: String(v.scanLineW),
            height: String(v.scanLineH), fill: v.colorPrimary, opacity: String(v.scanLineOpacity / 100)
        }));
    }

    // — Stacked name text —
    const nameTextData = [
        { text: 'brett', size: v.brettSize, y: v.brettY, spacing: v.nameLetterSpacing },
        { text: 'a', size: v.aSize, y: v.aY, spacing: 1 },
        { text: 'mccall', size: v.mccallSize, y: v.mccallY, spacing: v.nameLetterSpacing }
    ];

    for (const nt of nameTextData) {
        const a = {
            x: v.nameX, y: nt.y, 'dominant-baseline': 'hanging',
            'font-family': fontStack, 'font-weight': '700',
            'font-size': String(nt.size), 'letter-spacing': String(nt.spacing)
        };
        // glow
        svg.append(el('text', { ...a, fill: v.colorPrimary, filter: 'url(#text-glow)', opacity: String(v.nameGlowOpacity / 100) }, nt.text));
        // crisp
        svg.append(el('text', { ...a, fill: v.colorPrimary }, nt.text));
    }
}

// ── Init controls ──
function initControls() {
    for (const [key, def] of Object.entries(DEFAULTS)) {
        const el = document.getElementById(key);
        if (!el) continue;
        if (el.type === 'checkbox') el.checked = def;
        else el.value = def;
        updateValDisplay(el);
    }
}

function updateValDisplay(input) {
    const span = input.parentElement?.querySelector('.val');
    if (!span) return;
    if (input.type === 'checkbox') {
        span.textContent = input.checked ? 'ON' : 'OFF';
    } else if (input.type === 'color') {
        span.textContent = input.value;
    } else {
        const unit = input.dataset.unit || '';
        span.textContent = input.value + unit;
    }
}

// ── Wire up live controls ──
document.querySelectorAll('#controls-panel input').forEach(input => {
    const ev = input.type === 'color' ? 'input' : (input.type === 'checkbox' ? 'change' : 'input');
    input.addEventListener(ev, () => {
        updateValDisplay(input);
        render();
    });
});

// ── Reset button ──
document.getElementById('btn-reset').addEventListener('click', () => {
    initControls();
    render();
});

// ── Background mode toggle ──
canvasArea.classList.add('bg-transparent');
document.querySelectorAll('.bg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        bgMode = btn.dataset.bg;
        canvasArea.className = '';
        if (bgMode === 'transparent') canvasArea.classList.add('bg-transparent');
        else if (bgMode === '#ffffff') canvasArea.classList.add('bg-white');
        else canvasArea.classList.add('bg-black');
    });
});

// ── Export: build export SVG string ──
function buildExportSVG() {
    const clone = svg.cloneNode(true);
    // Add xmlns
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Add background rect if needed
    if (bgMode !== 'transparent') {
        const bgRect = document.createElementNS(SVG_NS, 'rect');
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
        bgRect.setAttribute('width', '1600');
        bgRect.setAttribute('height', '560');
        bgRect.setAttribute('fill', bgMode);
        clone.insertBefore(bgRect, clone.firstChild);
    }

    const serializer = new XMLSerializer();
    let str = serializer.serializeToString(clone);
    // Ensure XML declaration
    if (!str.startsWith('<?xml')) {
        str = '<?xml version="1.0" encoding="UTF-8"?>\n' + str;
    }
    return str;
}

// ── Download SVG ──
document.getElementById('btn-export-svg').addEventListener('click', () => {
    const svgStr = buildExportSVG();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = bgMode === 'transparent' ? 'transparent' : (bgMode === '#ffffff' ? 'white' : 'black');
    a.download = `bam_logo_${suffix}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// ── Download PNG ──
document.getElementById('btn-export-png').addEventListener('click', () => {
    const svgStr = buildExportSVG();
    const scale = 2;
    const w = 1600 * scale;
    const h = 560 * scale;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
        if (bgMode !== 'transparent') {
            ctx.fillStyle = bgMode;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const suffix = bgMode === 'transparent' ? 'transparent' : (bgMode === '#ffffff' ? 'white' : 'black');
            a.download = `bam_logo_${suffix}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
});

// ── Boot — randomize on every load ──
randomizeControls();
render();
