#!/usr/bin/env node
/**
 * Custom OG image generator for 2026-04-14_fibonacci_magic
 * Renders the iris aperture widget + HUD control panel in the
 * darketype CRT monochromatic style (#0a0a0a bg, green phosphor).
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const OUTPUT_PATH = path.join(__dirname, '../assets/social/og/2026-04-14_fibonacci_magic.png');

const W = 1200, H = 630;

// seeded PRNG
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// word-wrap
function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
        const test = current ? current + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

/**
 * Draw the iris aperture widget (closed state, 13 petals, green phosphor).
 * cx, cy = center; r = outer radius of the iris ring
 */
function drawIris(ctx, cx, cy, r, color, rand) {
    const PETALS = 13;
    const APERTURE = -1.0; // fully closed = petals all the way in

    // outer ring (boundary circle)
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // subtle second ring (inner guide)
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    // draw iris petals (blades)
    // Based on the actual widget: bladeLength=0.5x, bladeWidth=2.4x, bladeRadius=68px (scaled)
    // Each petal is a rounded rectangle rotated around the circle
    const bladeLength = r * 0.5;
    const bladeWidth = r * 0.38;
    const bladeRadius = r * 0.12;
    const pivotOffset = 1.05; // how far from center the pivot sits

    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0)';

    for (let i = 0; i < PETALS; i++) {
        const angle = (i / PETALS) * Math.PI * 2;
        // aperture offset: negative aperture = petals rotate inward (closing)
        const apertureAngle = APERTURE * (Math.PI / PETALS) * 0.8;
        const petalAngle = angle + apertureAngle;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(petalAngle);

        // pivot point along the blade's radial axis
        const pivotDist = r * 0.35 * pivotOffset;
        ctx.translate(pivotDist, 0);

        // draw blade as a rounded rect (long axis = radial direction)
        const bx = -bladeLength * 0.3;
        const by = -bladeWidth / 2;
        const bw = bladeLength;
        const bh = bladeWidth;

        ctx.globalAlpha = 0.18 + (i % 3) * 0.04;
        ctx.fillStyle = color;
        // rounded rect
        ctx.beginPath();
        ctx.moveTo(bx + bladeRadius, by);
        ctx.lineTo(bx + bw - bladeRadius, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + bladeRadius);
        ctx.lineTo(bx + bw, by + bh - bladeRadius);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - bladeRadius, by + bh);
        ctx.lineTo(bx + bladeRadius, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - bladeRadius);
        ctx.lineTo(bx, by + bladeRadius);
        ctx.quadraticCurveTo(bx, by, bx + bladeRadius, by);
        ctx.closePath();
        ctx.fill();

        // blade outline
        ctx.globalAlpha = 0.35 + (i % 2) * 0.15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    // centre crosshair / hub
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    // crosshair ticks on outer ring
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88);
        ctx.lineTo(cx + Math.cos(a) * r * 1.0, cy + Math.sin(a) * r * 1.0);
        ctx.stroke();
    }

    // small centre hub circle
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.06, 0, Math.PI * 2);
    ctx.stroke();

    // centre dot
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.025, 0, Math.PI * 2);
    ctx.fill();

    // petal count label (faint, below iris) 
    ctx.globalAlpha = 0.35;
    ctx.font = `11px "Courier New", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText('petals: 13', cx, cy + r + 18);
    ctx.textAlign = 'left';

    // fibonacci sequence arc labels around outer ring
    const fibs = [1, 1, 2, 3, 5, 8, 13];
    ctx.globalAlpha = 0.2;
    ctx.font = `10px "Courier New", monospace`;
    ctx.fillStyle = color;
    fibs.forEach((n, i) => {
        const a = ((i / fibs.length) * Math.PI * 2) - Math.PI / 2;
        const labelR = r * 1.18;
        const lx = cx + Math.cos(a) * labelR;
        const ly = cy + Math.sin(a) * labelR;
        ctx.textAlign = 'center';
        ctx.fillText(String(n), lx, ly + 4);
    });
    ctx.textAlign = 'left';

    ctx.restore();
}

/**
 * Draw the HUD control panel (right of iris).
 */
function drawHUD(ctx, x, y, w, h, color, rand) {
    ctx.save();

    const GREEN = color;
    const DIM = 'rgba(0,255,65,0.25)';
    const BRIGHT = 'rgba(0,255,65,0.8)';

    // panel background
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = GREEN;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    // panel border
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(x, y, w, h);
    ctx.globalAlpha = 1;

    // header
    ctx.font = `bold 11px "Courier New", monospace`;
    ctx.fillStyle = BRIGHT;
    ctx.globalAlpha = 0.9;
    ctx.fillText('⟳ CONTROLS', x + 10, y + 18);

    // divider under header
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 26);
    ctx.lineTo(x + w, y + 26);
    ctx.stroke();

    // small button row
    const btnY = y + 34;
    const btnW = w / 2 - 8;
    const btnH = 16;
    const btns = ['RESET DEFAULTS', 'COPY CONFIG', 'RECORD 60F', 'DUMP TO CONSOLE'];
    btns.forEach((label, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = x + 6 + col * (btnW + 4);
        const by = btnY + row * (btnH + 4);
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = GREEN;
        ctx.fillRect(bx, by, btnW, btnH);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, btnW, btnH);
        ctx.globalAlpha = 0.7;
        ctx.font = `8px "Courier New", monospace`;
        ctx.fillStyle = GREEN;
        ctx.textAlign = 'center';
        ctx.fillText(label, bx + btnW / 2, by + 10);
        ctx.textAlign = 'left';
    });

    // sliders section
    const sliders = [
        { label: 'Petals',    value: '13',    pct: 0.75 },
        { label: 'Aperture',  value: '-100%', pct: 0.0  },
        { label: 'Speed',     value: '1.1s',  pct: 0.2  },
        { label: 'Opacity',   value: '35%',   pct: 0.35 },
        { label: 'Length',    value: '0.5x',  pct: 0.3  },
        { label: 'Width',     value: '2.4x',  pct: 0.6  },
        { label: 'Radius',    value: '68px',  pct: 0.55 },
        { label: 'Pivot Pos', value: '1.05',  pct: 0.52 },
    ];

    const sectionY = btnY + 42;
    ctx.globalAlpha = 0.45;
    ctx.font = `8px "Courier New", monospace`;
    ctx.fillStyle = GREEN;
    ctx.fillText('IRIS SETTINGS', x + 6, sectionY);

    const trackX = x + 52;
    const trackW = w - 70;
    const rowH = 14;

    sliders.forEach((s, i) => {
        const sy = sectionY + 8 + i * rowH;

        // label
        ctx.globalAlpha = 0.5;
        ctx.font = `7px "Courier New", monospace`;
        ctx.fillStyle = GREEN;
        ctx.fillText(s.label, x + 4, sy + 7);

        // track
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = GREEN;
        ctx.fillRect(trackX, sy + 2, trackW, 4);

        // fill
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = GREEN;
        ctx.fillRect(trackX, sy + 2, trackW * s.pct, 4);

        // thumb
        ctx.globalAlpha = 1;
        ctx.fillStyle = GREEN;
        const thumbX = trackX + trackW * s.pct;
        ctx.beginPath();
        ctx.arc(thumbX, sy + 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // value
        ctx.globalAlpha = 0.8;
        ctx.font = `7px "Courier New", monospace`;
        ctx.fillStyle = GREEN;
        ctx.textAlign = 'right';
        ctx.fillText(s.value, x + w - 3, sy + 8);
        ctx.textAlign = 'left';
    });

    // fibonacci sequence echo at bottom of panel
    const fibY = sectionY + 8 + sliders.length * rowH + 8;
    ctx.globalAlpha = 0.3;
    ctx.font = `7px "Courier New", monospace`;
    ctx.fillStyle = GREEN;
    ctx.fillText('interval: φ → 1,1,2,3,5,8,13,21...', x + 4, fibY);

    ctx.restore();
}

function generate() {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const rand = mulberry32(20260414);

    const GREEN = '#00ff41';
    const GREEN_DIM = 'rgba(0,255,65,0.3)';

    // ── 1. Background ──────────────────────────────────────────────────
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Radial vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // ── 2. Scanlines ───────────────────────────────────────────────────
    for (let y = 0; y < H; y += 3) {
        const bright = (y % 24 === 0);
        ctx.fillStyle = bright ? 'rgba(0,255,65,0.06)' : 'rgba(0,255,65,0.03)';
        ctx.fillRect(0, y, W, 1);
    }

    // ── 3. Pixel grid noise ────────────────────────────────────────────
    const cellSize = 12;
    for (let gx = 0; gx < W; gx += cellSize) {
        for (let gy = 0; gy < H; gy += cellSize) {
            const edgeDist = Math.min(gx, gy, W - gx, H - gy) / 100;
            const density = 0.03 + (1 - Math.min(edgeDist, 1)) * 0.05;
            if (rand() < density) {
                const alpha = 0.02 + rand() * 0.04;
                ctx.fillStyle = `rgba(0,255,65,${alpha})`;
                ctx.fillRect(gx, gy, cellSize - 1, cellSize - 1);
            }
        }
    }

    // ── 4. Iris aperture widget (right side, large) ────────────────────
    const irisCx = W * 0.65;
    const irisCy = H * 0.47;
    const irisR = 155;

    // chromatic offset layers (red & blue ghost layers behind green)
    const OFF = 3;

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.translate(-OFF, -1);
    drawIris(ctx, irisCx, irisCy, irisR, 'rgba(255,20,20,0.7)', rand);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.translate(OFF, 1);
    drawIris(ctx, irisCx, irisCy, irisR, 'rgba(30,80,255,0.7)', rand);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.9;
    drawIris(ctx, irisCx, irisCy, irisR, GREEN, rand);
    ctx.restore();

    // ── 5. HUD control panel (to right of iris) ────────────────────────
    const hudX = W * 0.79;
    const hudY = H * 0.12;
    const hudW = 195;
    const hudH = 390;
    drawHUD(ctx, hudX, hudY, hudW, hudH, GREEN, rand);

    // ── 6. Title text (left side) with chromatic aberration ────────────
    const title = 'weaving the universe into the code';
    const maxWidth = W * 0.46;
    let fontSize = 44;
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    let lines = wrapText(ctx, title, maxWidth);

    while (lines.length > 3 && fontSize > 28) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        lines = wrapText(ctx, title, maxWidth);
    }

    const lineH = fontSize * 1.3;
    const titleY = H * 0.33 + (3 - Math.min(lines.length, 3)) * lineH * 0.3;
    const lx = 55;
    const CHROMA = 3;

    for (let i = 0; i < lines.length && i < 3; i++) {
        const ly = titleY + i * lineH;
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;

        ctx.fillStyle = 'rgba(255,20,20,0.5)';
        ctx.fillText(lines[i], lx - CHROMA, ly - 1);
        ctx.fillStyle = 'rgba(30,80,255,0.5)';
        ctx.fillText(lines[i], lx + CHROMA, ly + 1);
        ctx.fillStyle = GREEN;
        ctx.fillText(lines[i], lx, ly);
    }

    // ── 7. Metadata line ───────────────────────────────────────────────
    const metaText = '[2026-04-14] _expanded';
    ctx.font = '18px "Courier New", monospace';
    const metaY = titleY + lines.length * lineH + 28;

    ctx.fillStyle = 'rgba(255,20,20,0.3)';
    ctx.fillText(metaText, lx - 1, metaY - 0.5);
    ctx.fillStyle = 'rgba(30,80,255,0.3)';
    ctx.fillText(metaText, lx + 1, metaY + 0.5);
    ctx.fillStyle = '#008f11';
    ctx.fillText(metaText, lx, metaY);

    // ── 8. Fibonacci sequence display ──────────────────────────────────
    const fibSeq = '0, 1, 1, 2, 3, 5, 8, 13, 21, 34...';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0,255,65,0.35)';
    ctx.fillText(`φ → ${fibSeq}`, lx, metaY + 28);

    // ── 9. Fibonacci timing labels (floating near iris) ─────────────────
    const timings = ['5s', '8s', '13s', '21s', '34s'];
    const timingBaseAngle = -Math.PI * 0.6;
    ctx.font = '11px "Courier New", monospace';
    timings.forEach((t, i) => {
        const a = timingBaseAngle + (i / (timings.length - 1)) * Math.PI * 1.2;
        const dist = irisR * 1.32 + i * 4;
        const tx = irisCx + Math.cos(a) * dist;
        const ty = irisCy + Math.sin(a) * dist;
        const alpha = 0.15 + i * 0.08;
        ctx.fillStyle = `rgba(0,255,65,${alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText(t, tx, ty);
    });
    ctx.textAlign = 'left';

    // interval label above iris
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0,255,65,0.28)';
    ctx.textAlign = 'center';
    ctx.fillText('auto-rotation delay', irisCx, irisCy - irisR - 28);
    ctx.fillText('fibonacci sequence', irisCx, irisCy - irisR - 14);
    ctx.textAlign = 'left';

    // ── 10. Branding ───────────────────────────────────────────────────
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0,255,65,0.3)';
    ctx.fillText('darketype //', 40, H - 40);

    // ── 11. CRT bezel ──────────────────────────────────────────────────
    const inset = 20;
    ctx.strokeStyle = 'rgba(0,255,65,0.08)';
    ctx.lineWidth = 2;
    const radius = 12;
    ctx.beginPath();
    ctx.moveTo(inset + radius, inset);
    ctx.lineTo(W - inset - radius, inset);
    ctx.quadraticCurveTo(W - inset, inset, W - inset, inset + radius);
    ctx.lineTo(W - inset, H - inset - radius);
    ctx.quadraticCurveTo(W - inset, H - inset, W - inset - radius, H - inset);
    ctx.lineTo(inset + radius, H - inset);
    ctx.quadraticCurveTo(inset, H - inset, inset, H - inset - radius);
    ctx.lineTo(inset, inset + radius);
    ctx.quadraticCurveTo(inset, inset, inset + radius, inset);
    ctx.stroke();

    // ── 12. Glitch stripe (state=expanded → 1 stripe) ──────────────────
    const gy = Math.floor(rand() * (H - 40)) + 20;
    const gh = 2 + Math.floor(rand() * 6);
    const gxOff = Math.floor(rand() * W * 0.15);
    const gw = W * 0.5 + rand() * W * 0.4;

    ctx.fillStyle = 'rgba(255,20,20,0.12)';
    ctx.fillRect(gxOff + CHROMA, gy - 1, gw, gh);
    ctx.fillStyle = 'rgba(30,80,255,0.12)';
    ctx.fillRect(gxOff - CHROMA, gy + 1, gw, gh);
    ctx.fillStyle = 'rgba(0,255,65,0.07)';
    ctx.fillRect(gxOff, gy, gw, gh);

    // ── 13. Write output ───────────────────────────────────────────────
    const buf = canvas.toBuffer('image/png');
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, buf);
    console.log(`✅ written → ${OUTPUT_PATH} (${(buf.length / 1024).toFixed(0)}KB)`);
}

generate();
