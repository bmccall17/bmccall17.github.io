const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const ENTRIES_JSON = path.join(__dirname, '../darketype/entries.json');
const OUTPUT_DIR = path.join(__dirname, '../assets/social/og');
const FORCE = process.argv.includes('--force');

// seeded PRNG (mulberry32)
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// state-based config
function stateConfig(state) {
    const s = (state || 'void').toLowerCase();
    if (s === 'mess' || s === 'broken') return { glitchStripes: 3, chromaticOffset: 5, tint: null, dimFactor: 1 };
    if (s === 'shipped') return { glitchStripes: 0, chromaticOffset: 2, tint: null, dimFactor: 1 };
    if (s === 'void' || s === 'seed') return { glitchStripes: 1, chromaticOffset: 3, tint: null, dimFactor: 0.6 };
    if (s === 'learning' || s === 'debugging') return { glitchStripes: 1, chromaticOffset: 3, tint: 'rgba(255,180,0,0.04)', dimFactor: 0.9 };
    if (s === 'optimistic') return { glitchStripes: 1, chromaticOffset: 3, tint: 'rgba(30,80,255,0.04)', dimFactor: 1 };
    return { glitchStripes: 1, chromaticOffset: 3, tint: null, dimFactor: 0.85 };
}

// word-wrap text into lines that fit maxWidth
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

// ─── pictogram keyword mapping ───
function pickPictogram(entry) {
    const title = (entry.title || '').toLowerCase();
    const tags = (entry.tags || []).map(t => (typeof t === 'string' ? t : '').toLowerCase());
    const all = title + ' ' + tags.join(' ');

    // specific matches first
    if (all.includes('cslp') || all.includes('leakage') || all.includes('leaking'))
        return 'dataLeak';
    if (all.includes('origin') || all.includes('manifesto'))
        return 'compass';
    if (all.includes('singularity') || all.includes('event horizon') || all.includes('physics'))
        return 'blackHole';
    if (all.includes('loop'))
        return 'infinityLoop';
    if (all.includes('autopsy') || all.includes('audit') || all.includes('gamedev'))
        return 'magnifyingGlass';
    if (all.includes('ted') || all.includes('stage') || all.includes('optimis'))
        return 'spotlight';
    if (all.includes('chaos') || all.includes('fractal'))
        return 'fractalTree';
    if (all.includes('logo') || all.includes('factory'))
        return 'gears';
    if (all.includes('maze') || all.includes('ktane') || all.includes('kahn'))
        return 'maze';
    if (all.includes('ocean') || all.includes('port') && all.includes('disaster'))
        return 'anchor';
    if (all.includes('runbook') || all.includes('tarot') || all.includes('diagnostic'))
        return 'tarotCard';
    if (all.includes('antigravity') || all.includes('automation'))
        return 'floatingBlocks';
    if (all.includes('daemon') || all.includes('summon') || all.includes('metaverse'))
        return 'portal';
    if (all.includes('pushes back') || all.includes('scorecard'))
        return 'shield';
    if (all.includes('vertex') || all.includes('neural') || all.includes('repoptic'))
        return 'neuralNet';
    if (all.includes('viscous') || all.includes('lcd') || all.includes('finger'))
        return 'fingerprint';
    if (all.includes('widget') || all.includes('context-awareness') || all.includes('woke'))
        return 'eye';
    if (all.includes('per-char') || all.includes('chromatic') || all.includes('bruise'))
        return 'prism';
    if (all.includes('context') && all.includes('lake'))
        return 'lake';
    if (all.includes('rebellion') || all.includes('phase zero'))
        return 'flag';

    return 'terminal'; // fallback
}

// ─── pictogram drawing functions ───
// all draw within a bounding box centered at (cx, cy) with size ~s
const pictograms = {
    dataLeak(ctx, cx, cy, s, color, rand) {
        // dripping pixel grid — data leaking out
        const gridSize = s * 0.7;
        const cellCount = 5;
        const cellSize = gridSize / cellCount;
        const startX = cx - gridSize / 2;
        const startY = cy - gridSize / 2 - s * 0.1;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        // grid frame
        ctx.strokeRect(startX, startY, gridSize, gridSize);

        // grid cells (some filled)
        for (let r = 0; r < cellCount; r++) {
            for (let c = 0; c < cellCount; c++) {
                if (rand() > 0.5) {
                    ctx.fillStyle = color;
                    ctx.fillRect(startX + c * cellSize + 2, startY + r * cellSize + 2,
                        cellSize - 4, cellSize - 4);
                }
            }
        }

        // drips falling from bottom
        for (let i = 0; i < 4; i++) {
            const dx = startX + (i + 0.5 + rand() * 0.5) * (gridSize / 4);
            const dripLen = s * 0.2 + rand() * s * 0.35;
            ctx.beginPath();
            ctx.moveTo(dx, startY + gridSize);
            ctx.lineTo(dx, startY + gridSize + dripLen);
            ctx.stroke();
            // droplet
            ctx.beginPath();
            ctx.arc(dx, startY + gridSize + dripLen + 4, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    compass(ctx, cx, cy, s, color) {
        // compass rose — origin/direction
        const r = s * 0.4;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        // outer circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // cardinal points as elongated diamonds
        const points = [
            [0, -1], [1, 0], [0, 1], [-1, 0]  // N, E, S, W
        ];
        for (const [dx, dy] of points) {
            const tipX = cx + dx * r * 1.15;
            const tipY = cy + dy * r * 1.15;
            const baseLen = r * 0.15;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(cx + dx * r * 0.4 - dy * baseLen, cy + dy * r * 0.4 + dx * baseLen);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + dx * r * 0.4 + dy * baseLen, cy + dy * r * 0.4 - dx * baseLen);
            ctx.closePath();
            ctx.fill();
        }

        // center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
    },

    blackHole(ctx, cx, cy, s, color) {
        // concentric distortion rings — event horizon
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        for (let i = 6; i >= 1; i--) {
            const r = (s * 0.08) * i;
            const squeeze = 0.4 + (i / 6) * 0.3;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r * squeeze, Math.PI * 0.1 * i, 0, Math.PI * 2);
            ctx.stroke();
        }

        // accretion particles
        ctx.fillStyle = color;
        const rand = mulberry32(42);
        for (let i = 0; i < 20; i++) {
            const angle = rand() * Math.PI * 2;
            const dist = s * 0.25 + rand() * s * 0.25;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist * 0.5;
            ctx.fillRect(px, py, 2, 2);
        }

        // dark core
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
    },

    infinityLoop(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        const w = s * 0.35;
        const h = s * 0.2;

        ctx.beginPath();
        // left loop
        ctx.moveTo(cx, cy);
        ctx.bezierCurveTo(cx - w, cy - h * 2, cx - w * 2, cy + h * 2, cx, cy);
        // right loop
        ctx.bezierCurveTo(cx + w, cy - h * 2, cx + w * 2, cy + h * 2, cx, cy);
        ctx.stroke();

        // arrow markers
        ctx.fillStyle = color;
        const arrowSize = 6;
        // top of right loop
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.8, cy - h * 0.7);
        ctx.lineTo(cx + w * 0.8 + arrowSize, cy - h * 0.7 + arrowSize);
        ctx.lineTo(cx + w * 0.8 - arrowSize, cy - h * 0.7 + arrowSize);
        ctx.closePath();
        ctx.fill();
    },

    magnifyingGlass(ctx, cx, cy, s, color) {
        const r = s * 0.25;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        // glass circle
        ctx.beginPath();
        ctx.arc(cx - s * 0.05, cy - s * 0.05, r, 0, Math.PI * 2);
        ctx.stroke();

        // handle
        const hx = cx - s * 0.05 + r * 0.7;
        const hy = cy - s * 0.05 + r * 0.7;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + s * 0.22, hy + s * 0.22);
        ctx.stroke();

        // circuit lines inside glass
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.5, cy - s * 0.05);
        ctx.lineTo(cx, cy - s * 0.05);
        ctx.lineTo(cx, cy - s * 0.05 - r * 0.4);
        ctx.moveTo(cx, cy - s * 0.05);
        ctx.lineTo(cx + r * 0.3, cy - s * 0.05 + r * 0.3);
        ctx.stroke();

        // dots at circuit junctions
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(cx, cy - s * 0.05, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy - s * 0.05 - r * 0.4, 3, 0, Math.PI * 2); ctx.fill();
    },

    spotlight(ctx, cx, cy, s, color) {
        // stage with spotlight cone
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        // light source at top
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.4, 8, 0, Math.PI * 2);
        ctx.fill();

        // cone of light
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - s * 0.38);
        ctx.lineTo(cx - s * 0.35, cy + s * 0.3);
        ctx.lineTo(cx + s * 0.35, cy + s * 0.3);
        ctx.lineTo(cx + 8, cy - s * 0.38);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // stage platform
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.45, cy + s * 0.3);
        ctx.lineTo(cx + s * 0.45, cy + s * 0.3);
        ctx.stroke();

        // podium silhouette
        ctx.lineWidth = 2;
        ctx.fillStyle = color;
        ctx.fillRect(cx - s * 0.06, cy + s * 0.05, s * 0.12, s * 0.25);
        // person silhouette (head)
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.02, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
    },

    fractalTree(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        function branch(x, y, len, angle, depth) {
            if (depth <= 0 || len < 3) return;
            const ex = x + Math.cos(angle) * len;
            const ey = y + Math.sin(angle) * len;
            ctx.lineWidth = Math.max(1, depth * 0.8);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            branch(ex, ey, len * 0.65, angle - 0.5, depth - 1);
            branch(ex, ey, len * 0.65, angle + 0.5, depth - 1);
        }

        branch(cx, cy + s * 0.4, s * 0.3, -Math.PI / 2, 7);
    },

    gears(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        function drawGear(gx, gy, r, teeth) {
            ctx.beginPath();
            for (let i = 0; i < teeth; i++) {
                const a1 = (i / teeth) * Math.PI * 2;
                const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
                const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
                const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
                const ri = r * 0.75;
                const ro = r;
                if (i === 0) ctx.moveTo(gx + Math.cos(a1) * ri, gy + Math.sin(a1) * ri);
                ctx.lineTo(gx + Math.cos(a2) * ro, gy + Math.sin(a2) * ro);
                ctx.lineTo(gx + Math.cos(a3) * ro, gy + Math.sin(a3) * ro);
                ctx.lineTo(gx + Math.cos(a4) * ri, gy + Math.sin(a4) * ri);
            }
            ctx.closePath();
            ctx.stroke();
            // center hole
            ctx.beginPath();
            ctx.arc(gx, gy, r * 0.2, 0, Math.PI * 2);
            ctx.stroke();
        }

        drawGear(cx - s * 0.15, cy - s * 0.1, s * 0.22, 8);
        drawGear(cx + s * 0.2, cy + s * 0.15, s * 0.16, 6);
    },

    maze(ctx, cx, cy, s, color, rand) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const gridN = 7;
        const cellSize = (s * 0.75) / gridN;
        const startX = cx - (gridN * cellSize) / 2;
        const startY = cy - (gridN * cellSize) / 2;

        // outer border
        ctx.strokeRect(startX, startY, gridN * cellSize, gridN * cellSize);

        // internal walls (deterministic from rand)
        for (let r = 0; r < gridN; r++) {
            for (let c = 0; c < gridN; c++) {
                const x = startX + c * cellSize;
                const y = startY + r * cellSize;
                // right wall
                if (c < gridN - 1 && rand() > 0.45) {
                    ctx.beginPath();
                    ctx.moveTo(x + cellSize, y);
                    ctx.lineTo(x + cellSize, y + cellSize);
                    ctx.stroke();
                }
                // bottom wall
                if (r < gridN - 1 && rand() > 0.45) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + cellSize);
                    ctx.lineTo(x + cellSize, y + cellSize);
                    ctx.stroke();
                }
            }
        }

        // entrance/exit markers
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(startX + cellSize * 0.5, startY + cellSize * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(startX + (gridN - 0.5) * cellSize, startY + (gridN - 0.5) * cellSize, 4, 0, Math.PI * 2);
        ctx.fill();
    },

    anchor(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;

        // ring at top
        const ringR = s * 0.08;
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.32, ringR, 0, Math.PI * 2);
        ctx.stroke();

        // vertical shaft
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 0.32 + ringR);
        ctx.lineTo(cx, cy + s * 0.25);
        ctx.stroke();

        // crossbar
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.15, cy - s * 0.12);
        ctx.lineTo(cx + s * 0.15, cy - s * 0.12);
        ctx.stroke();

        // curved flukes
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy + s * 0.25, s * 0.25, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();

        // fluke tips (arrows)
        const tipAngle = Math.PI * 0.15;
        const tipX = cx + Math.cos(tipAngle) * s * 0.25;
        const tipY = cy + s * 0.25 + Math.sin(tipAngle) * s * 0.25;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX + 8, tipY + 8);
        ctx.lineTo(tipX - 4, tipY + 6);
        ctx.closePath();
        ctx.fill();

        const tipAngle2 = Math.PI * 0.85;
        const tipX2 = cx + Math.cos(tipAngle2) * s * 0.25;
        const tipY2 = cy + s * 0.25 + Math.sin(tipAngle2) * s * 0.25;
        ctx.beginPath();
        ctx.moveTo(tipX2, tipY2);
        ctx.lineTo(tipX2 - 8, tipY2 + 8);
        ctx.lineTo(tipX2 + 4, tipY2 + 6);
        ctx.closePath();
        ctx.fill();
    },

    tarotCard(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // card outline
        const cw = s * 0.45;
        const ch = s * 0.7;
        const rx = cx - cw / 2;
        const ry = cy - ch / 2;
        ctx.beginPath();
        ctx.moveTo(rx + 6, ry);
        ctx.lineTo(rx + cw - 6, ry);
        ctx.quadraticCurveTo(rx + cw, ry, rx + cw, ry + 6);
        ctx.lineTo(rx + cw, ry + ch - 6);
        ctx.quadraticCurveTo(rx + cw, ry + ch, rx + cw - 6, ry + ch);
        ctx.lineTo(rx + 6, ry + ch);
        ctx.quadraticCurveTo(rx, ry + ch, rx, ry + ch - 6);
        ctx.lineTo(rx, ry + 6);
        ctx.quadraticCurveTo(rx, ry, rx + 6, ry);
        ctx.closePath();
        ctx.stroke();

        // inner border
        const m = 8;
        ctx.strokeRect(rx + m, ry + m, cw - m * 2, ch - m * 2);

        // eye symbol in center
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.12, cy);
        ctx.quadraticCurveTo(cx, cy - s * 0.1, cx + s * 0.12, cy);
        ctx.quadraticCurveTo(cx, cy + s * 0.1, cx - s * 0.12, cy);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.035, 0, Math.PI * 2);
        ctx.fill();

        // decorative corners
        const cs = s * 0.04;
        ctx.fillRect(rx + m + 3, ry + m + 3, cs, cs);
        ctx.fillRect(rx + cw - m - 3 - cs, ry + m + 3, cs, cs);
        ctx.fillRect(rx + m + 3, ry + ch - m - 3 - cs, cs, cs);
        ctx.fillRect(rx + cw - m - 3 - cs, ry + ch - m - 3 - cs, cs, cs);
    },

    floatingBlocks(ctx, cx, cy, s, color, rand) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        // several cubes floating upward at varying heights
        const blocks = [
            { x: cx - s * 0.2, y: cy + s * 0.15, sz: s * 0.12 },
            { x: cx + s * 0.1, y: cy - s * 0.05, sz: s * 0.15 },
            { x: cx - s * 0.05, y: cy - s * 0.28, sz: s * 0.1 },
            { x: cx + s * 0.2, y: cy + s * 0.3, sz: s * 0.09 },
        ];

        for (const b of blocks) {
            const d = b.sz * 0.35; // isometric offset
            // front face
            ctx.strokeRect(b.x, b.y, b.sz, b.sz);
            // top face
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + d, b.y - d);
            ctx.lineTo(b.x + b.sz + d, b.y - d);
            ctx.lineTo(b.x + b.sz, b.y);
            ctx.stroke();
            // right face
            ctx.beginPath();
            ctx.moveTo(b.x + b.sz, b.y);
            ctx.lineTo(b.x + b.sz + d, b.y - d);
            ctx.lineTo(b.x + b.sz + d, b.y + b.sz - d);
            ctx.lineTo(b.x + b.sz, b.y + b.sz);
            ctx.stroke();
        }

        // upward motion lines
        for (const b of blocks) {
            for (let i = 0; i < 2; i++) {
                const lx = b.x + rand() * b.sz;
                ctx.beginPath();
                ctx.moveTo(lx, b.y + b.sz + 4);
                ctx.lineTo(lx, b.y + b.sz + 4 + s * 0.06 + rand() * s * 0.04);
                ctx.stroke();
            }
        }
    },

    portal(ctx, cx, cy, s, color, rand) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // concentric irregular ellipses (portal opening)
        for (let i = 5; i >= 1; i--) {
            const rx = s * 0.08 * i;
            const ry = s * 0.1 * i;
            ctx.globalAlpha = 0.3 + (i / 5) * 0.5;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // energy sparks radiating out
        ctx.fillStyle = color;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dist = s * 0.38 + rand() * s * 0.1;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            ctx.fillRect(px - 1, py - 1, 3, 3);
            // line toward center
            ctx.beginPath();
            ctx.moveTo(px, py);
            const id = s * 0.32;
            ctx.lineTo(cx + Math.cos(angle) * id, cy + Math.sin(angle) * id);
            ctx.stroke();
        }

        // silhouette figure emerging (horns = daemon)
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        // head
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.02, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // horns
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.04, cy - s * 0.06);
        ctx.quadraticCurveTo(cx - s * 0.1, cy - s * 0.18, cx - s * 0.06, cy - s * 0.14);
        ctx.moveTo(cx + s * 0.04, cy - s * 0.06);
        ctx.quadraticCurveTo(cx + s * 0.1, cy - s * 0.18, cx + s * 0.06, cy - s * 0.14);
        ctx.stroke();
        ctx.globalAlpha = 1;
    },

    shield(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        // shield shape
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 0.4);
        ctx.lineTo(cx + s * 0.3, cy - s * 0.25);
        ctx.lineTo(cx + s * 0.3, cy + s * 0.05);
        ctx.quadraticCurveTo(cx + s * 0.25, cy + s * 0.35, cx, cy + s * 0.45);
        ctx.quadraticCurveTo(cx - s * 0.25, cy + s * 0.35, cx - s * 0.3, cy + s * 0.05);
        ctx.lineTo(cx - s * 0.3, cy - s * 0.25);
        ctx.closePath();
        ctx.stroke();

        // push-back arrows (bouncing off shield)
        ctx.lineWidth = 2;
        ctx.fillStyle = color;
        const arrows = [
            { x: cx + s * 0.38, y: cy - s * 0.15, angle: Math.PI * 0.15 },
            { x: cx + s * 0.4, y: cy + s * 0.05, angle: 0 },
            { x: cx + s * 0.35, y: cy + s * 0.22, angle: -Math.PI * 0.15 },
        ];
        for (const a of arrows) {
            const dx = Math.cos(a.angle);
            const dy = -Math.sin(a.angle);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(a.x + dx * s * 0.15, a.y + dy * s * 0.15);
            ctx.stroke();
            // arrowhead
            ctx.beginPath();
            ctx.moveTo(a.x + dx * s * 0.15, a.y + dy * s * 0.15);
            ctx.lineTo(a.x + dx * s * 0.11 - dy * 4, a.y + dy * s * 0.11 + dx * 4);
            ctx.lineTo(a.x + dx * s * 0.11 + dy * 4, a.y + dy * s * 0.11 - dx * 4);
            ctx.closePath();
            ctx.fill();
        }
    },

    neuralNet(ctx, cx, cy, s, color, rand) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;

        // 3 layers of nodes
        const layers = [
            [-0.3, [-0.3, -0.1, 0.1, 0.3]],
            [0, [-0.2, 0, 0.2]],
            [0.3, [-0.15, 0.15]],
        ];

        const nodes = [];
        for (const [lx, ys] of layers) {
            const layerNodes = [];
            for (const ly of ys) {
                layerNodes.push({ x: cx + lx * s, y: cy + ly * s });
            }
            nodes.push(layerNodes);
        }

        // connections between layers
        for (let l = 0; l < nodes.length - 1; l++) {
            for (const from of nodes[l]) {
                for (const to of nodes[l + 1]) {
                    ctx.globalAlpha = 0.3 + rand() * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;

        // nodes
        for (const layer of nodes) {
            for (const n of layer) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, s * 0.03, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    fingerprint(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        // concentric offset arcs forming fingerprint pattern
        for (let i = 1; i <= 8; i++) {
            const r = s * 0.05 * i;
            const offsetY = i * 2;
            ctx.beginPath();
            ctx.arc(cx, cy + offsetY, r, Math.PI * 0.2, Math.PI * 0.8, true);
            ctx.stroke();
        }
        for (let i = 1; i <= 6; i++) {
            const r = s * 0.05 * i;
            const offsetY = -i * 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy + offsetY, r, Math.PI * 1.2, Math.PI * 1.8, true);
            ctx.stroke();
        }

        // ripple rings (lcd press effect) emanating outward
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const r = s * 0.42 + i * s * 0.06;
            ctx.globalAlpha = 0.4 - i * 0.12;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    },

    eye(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;

        // eye outline (almond shape)
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.38, cy);
        ctx.quadraticCurveTo(cx, cy - s * 0.25, cx + s * 0.38, cy);
        ctx.quadraticCurveTo(cx, cy + s * 0.25, cx - s * 0.38, cy);
        ctx.stroke();

        // iris
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
        ctx.stroke();

        // pupil
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // highlight
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(cx + s * 0.03, cy - s * 0.03, s * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // eyelashes / awareness rays
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const angle = Math.PI * 0.3 + (i / 4) * Math.PI * 0.4;
            const inner = s * 0.22;
            const outer = s * 0.3;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * inner, cy - Math.sin(angle) * inner);
            ctx.lineTo(cx + Math.cos(angle) * outer, cy - Math.sin(angle) * outer);
            ctx.stroke();
        }
    },

    prism(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;

        // triangle prism
        const triH = s * 0.5;
        const triW = s * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.1, cy - triH * 0.5);
        ctx.lineTo(cx - s * 0.1 - triW * 0.5, cy + triH * 0.5);
        ctx.lineTo(cx - s * 0.1 + triW * 0.5, cy + triH * 0.5);
        ctx.closePath();
        ctx.stroke();

        // incoming beam
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.5, cy);
        ctx.lineTo(cx - s * 0.1 - triW * 0.15, cy + triH * 0.08);
        ctx.stroke();

        // split beams (RGB)
        const beamStart = { x: cx - s * 0.1 + triW * 0.2, y: cy };
        const colors = ['rgba(255,50,50,0.7)', 'rgba(50,255,50,0.7)', 'rgba(50,80,255,0.7)'];
        const angles = [-0.2, 0, 0.2];
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = colors[i];
            ctx.beginPath();
            ctx.moveTo(beamStart.x, beamStart.y + angles[i] * s * 0.15);
            ctx.lineTo(cx + s * 0.45, cy + angles[i] * s * 0.7);
            ctx.stroke();
        }

        // scattered letters
        ctx.font = `bold 16px "Courier New", monospace`;
        const letters = ['a', 'b', 'c'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillText(letters[i], cx + s * 0.38 + i * 6, cy + angles[i] * s * 0.7 + 5);
        }
    },

    lake(ctx, cx, cy, s, color, rand) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        // water surface line
        const surfaceY = cy - s * 0.05;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.45, surfaceY);
        for (let x = cx - s * 0.45; x <= cx + s * 0.45; x += 4) {
            ctx.lineTo(x, surfaceY + Math.sin((x - cx) * 0.06) * 3);
        }
        ctx.stroke();

        // concentric ripples on surface
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            ctx.globalAlpha = 0.6 - i * 0.12;
            ctx.beginPath();
            ctx.ellipse(cx, surfaceY, s * 0.08 * i, s * 0.02 * i, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // data nodes sinking below surface (reflected/submerged)
        ctx.fillStyle = color;
        const nodes = [
            { x: cx - s * 0.15, y: surfaceY + s * 0.12 },
            { x: cx + s * 0.1, y: surfaceY + s * 0.2 },
            { x: cx, y: surfaceY + s * 0.3 },
            { x: cx - s * 0.08, y: surfaceY + s * 0.22 },
            { x: cx + s * 0.2, y: surfaceY + s * 0.15 },
        ];
        // connections
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (rand() > 0.4) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
        for (const n of nodes) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // data points above surface (floating up)
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) {
            const fx = cx - s * 0.1 + i * s * 0.1;
            const fy = surfaceY - s * 0.1 - i * s * 0.08;
            ctx.beginPath();
            ctx.arc(fx, fy, 3, 0, Math.PI * 2);
            ctx.fill();
            // rising line
            ctx.beginPath();
            ctx.moveTo(fx, fy + 5);
            ctx.lineTo(fx, surfaceY - 3);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    },

    flag(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;

        // pole
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.15, cy - s * 0.4);
        ctx.lineTo(cx - s * 0.15, cy + s * 0.4);
        ctx.stroke();

        // flag (waving)
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.15, cy - s * 0.4);
        ctx.quadraticCurveTo(cx + s * 0.05, cy - s * 0.45, cx + s * 0.25, cy - s * 0.32);
        ctx.quadraticCurveTo(cx + s * 0.15, cy - s * 0.2, cx + s * 0.3, cy - s * 0.1);
        ctx.lineTo(cx - s * 0.15, cy - s * 0.05);
        ctx.stroke();

        // "0" on flag
        ctx.font = `bold ${s * 0.14}px "Courier New", monospace`;
        ctx.fillText('0', cx - s * 0.02, cy - s * 0.18);
    },

    terminal(ctx, cx, cy, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // terminal window
        const tw = s * 0.65;
        const th = s * 0.5;
        const tx = cx - tw / 2;
        const ty = cy - th / 2;

        // window frame with rounded corners
        ctx.beginPath();
        ctx.moveTo(tx + 6, ty);
        ctx.lineTo(tx + tw - 6, ty);
        ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + 6);
        ctx.lineTo(tx + tw, ty + th - 6);
        ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - 6, ty + th);
        ctx.lineTo(tx + 6, ty + th);
        ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - 6);
        ctx.lineTo(tx, ty + 6);
        ctx.quadraticCurveTo(tx, ty, tx + 6, ty);
        ctx.closePath();
        ctx.stroke();

        // title bar
        ctx.beginPath();
        ctx.moveTo(tx, ty + th * 0.15);
        ctx.lineTo(tx + tw, ty + th * 0.15);
        ctx.stroke();

        // title bar dots
        ctx.fillStyle = color;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(tx + 12 + i * 12, ty + th * 0.075, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // prompt lines
        ctx.font = `14px "Courier New", monospace`;
        ctx.fillText('> _', tx + 10, ty + th * 0.38);
        ctx.fillText('>', tx + 10, ty + th * 0.58);
        ctx.fillText('>', tx + 10, ty + th * 0.78);
    },
};

function generateImage(entry) {
    const slug = entry.slug || entry.file.replace(/\.md$/, '');
    const outPath = path.join(OUTPUT_DIR, `${slug}.png`);

    if (!FORCE && fs.existsSync(outPath)) {
        console.log(`⏭  skipping ${slug} (exists)`);
        return;
    }

    const W = 1200, H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const rand = mulberry32(entry.epoch || Date.now());
    const cfg = stateConfig(entry.state);

    // 1. background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // radial vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${cfg.dimFactor < 0.7 ? 0.8 : 0.6})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // 2. scanlines
    for (let y = 0; y < H; y += 3) {
        const bright = (y % 24 === 0);
        ctx.fillStyle = bright ? 'rgba(0,255,65,0.06)' : 'rgba(0,255,65,0.03)';
        ctx.fillRect(0, y, W, 1);
    }

    // 3. sparse pixel grid noise (less dense than before — pictogram is the star)
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

    // ─── pictogram (right side) ───
    const pictoName = pickPictogram(entry);
    const pictoFn = pictograms[pictoName] || pictograms.terminal;
    const pictoCx = W * 0.78;
    const pictoCy = H * 0.48;
    const pictoSize = H * 0.7;

    ctx.save();
    ctx.globalAlpha = 0.35;
    // chromatic offset layers for the pictogram
    const pOff = cfg.chromaticOffset;

    // red layer
    ctx.save();
    ctx.translate(-pOff, -1);
    ctx.strokeStyle = 'rgba(255,20,20,0.5)';
    ctx.fillStyle = 'rgba(255,20,20,0.5)';
    pictoFn(ctx, pictoCx, pictoCy, pictoSize, 'rgba(255,20,20,0.5)', mulberry32(entry.epoch || 1));
    ctx.restore();

    // blue layer
    ctx.save();
    ctx.translate(pOff, 1);
    pictoFn(ctx, pictoCx, pictoCy, pictoSize, 'rgba(30,80,255,0.5)', mulberry32(entry.epoch || 1));
    ctx.restore();

    // green primary layer
    ctx.globalAlpha = 0.4;
    pictoFn(ctx, pictoCx, pictoCy, pictoSize, 'rgba(0,255,65,0.8)', mulberry32(entry.epoch || 1));
    ctx.restore();

    // ─── title text (left side) with chromatic aberration ───
    const title = entry.title || 'untitled';
    const maxWidth = W * 0.52;
    let fontSize = 48;
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    let lines = wrapText(ctx, title, maxWidth);

    while (lines.length > 3 && fontSize > 28) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        lines = wrapText(ctx, title, maxWidth);
    }

    const lineHeight = fontSize * 1.3;
    const titleY = H * 0.35 + (3 - Math.min(lines.length, 3)) * lineHeight * 0.3;

    for (let i = 0; i < lines.length && i < 3; i++) {
        const ly = titleY + i * lineHeight;
        const lx = 60;

        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        ctx.fillStyle = 'rgba(255,20,20,0.5)';
        ctx.fillText(lines[i], lx - cfg.chromaticOffset, ly - 1);
        ctx.fillStyle = 'rgba(30,80,255,0.5)';
        ctx.fillText(lines[i], lx + cfg.chromaticOffset, ly + 1);
        ctx.fillStyle = '#00ff41';
        ctx.fillText(lines[i], lx, ly);
    }

    // 6. metadata line
    const date = (entry.date || '').slice(0, 10);
    const metaText = `[${date}] _${entry.state || 'void'}`;
    ctx.font = '20px "Courier New", monospace';
    const metaY = titleY + lines.length * lineHeight + 30;

    ctx.fillStyle = 'rgba(255,20,20,0.3)';
    ctx.fillText(metaText, 60 - 1, metaY - 0.5);
    ctx.fillStyle = 'rgba(30,80,255,0.3)';
    ctx.fillText(metaText, 60 + 1, metaY + 0.5);
    ctx.fillStyle = '#008f11';
    ctx.fillText(metaText, 60, metaY);

    // 7. branding
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0,255,65,0.3)';
    ctx.fillText('darketype //', 40, H - 40);

    // 8. CRT bezel
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

    // 9. glitch stripes (deterministic)
    for (let g = 0; g < cfg.glitchStripes; g++) {
        const gy = Math.floor(rand() * (H - 40)) + 20;
        const gh = 2 + Math.floor(rand() * 6);
        const gx = Math.floor(rand() * W * 0.3);
        const gw = W * 0.4 + rand() * W * 0.5;

        ctx.fillStyle = `rgba(255,20,20,${0.1 + rand() * 0.15})`;
        ctx.fillRect(gx + cfg.chromaticOffset, gy - 1, gw, gh);
        ctx.fillStyle = `rgba(30,80,255,${0.1 + rand() * 0.15})`;
        ctx.fillRect(gx - cfg.chromaticOffset, gy + 1, gw, gh);
        ctx.fillStyle = `rgba(0,255,65,${0.05 + rand() * 0.1})`;
        ctx.fillRect(gx, gy, gw, gh);
    }

    // state tint overlay
    if (cfg.tint) {
        ctx.fillStyle = cfg.tint;
        ctx.fillRect(0, 0, W, H);
    }

    // write
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buf);
    console.log(`✅ generated ${slug}.png [${pictoName}] (${(buf.length / 1024).toFixed(0)}KB)`);
}

function main() {
    if (!fs.existsSync(ENTRIES_JSON)) {
        console.error('❌ entries.json not found. Run build_weblog.js first.');
        process.exit(1);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const entries = JSON.parse(fs.readFileSync(ENTRIES_JSON, 'utf-8'));
    console.log(`🎨 generating OG images for ${entries.length} entries...`);

    for (const entry of entries) {
        generateImage(entry);
    }

    console.log('🏁 OG image generation complete.');
}

main();
