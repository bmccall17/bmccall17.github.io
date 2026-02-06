/**
 * Singularity Effect
 * Black Hole Physics: Particles from a "Chaos Layer" (Green Pixels) 
 * are sucked into the mouse cursor, revealing the "Clean Layer" (Header Image) below.
 */

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

const config = {
    pixelSize: 20,
    jitterSpeed: 0.0017, // Low end (0.0017 - 0.17)
    jitterAmount: 2,
    suckRadius: 100,     // Black Hole Horizon
    suckSpeed: 0.15,     // Acceleration
    // Paths are relative to index.html
    cleanImgSrc: 'assets/header.png',
    chaosImgSrc: 'assets/pixels.png'
};

// State
let w, h;
let particles = [];
let mouse = { x: -5000, y: -5000 };

// Assets
const cleanImg = new Image();
const chaosImg = new Image();
let assetsReady = false;
let loadCount = 0;

const checkLoad = () => { loadCount++; if (loadCount >= 2) { assetsReady = true; resize(); console.log('Singularity: Assets Ready'); } };
cleanImg.onload = checkLoad; cleanImg.src = config.cleanImgSrc;
chaosImg.onload = checkLoad; chaosImg.src = config.chaosImgSrc;

// Force resize handling
window.addEventListener('resize', resize);

// Input Handling (Mouse & Touch)
const updateInput = (x, y) => {
    mouse.x = x;
    mouse.y = y;
};

window.addEventListener('mousemove', e => {
    updateInput(e.clientX, e.clientY);
});

// Touch Support
window.addEventListener('touchmove', e => {
    e.preventDefault(); // Stop scrolling while dragging (Scroll Lock Constraint)
    const t = e.touches[0];
    updateInput(t.clientX, t.clientY);
}, { passive: false });

window.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    updateInput(t.clientX, t.clientY);
}, { passive: false });


// Offscreen Buffers
const cleanCanvas = document.createElement('canvas');
const cleanCtx = cleanCanvas.getContext('2d');
const chaosMapCanvas = document.createElement('canvas');
const chaosMapCtx = chaosMapCanvas.getContext('2d');

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cleanCanvas.width = w; cleanCanvas.height = h;
    chaosMapCanvas.width = w; chaosMapCanvas.height = h;

    if (assetsReady) {
        drawCover(cleanCtx, cleanImg);
        generateTiledChaos(chaosMapCtx, chaosImg);
    }
    initParticles();
}

function drawCover(ctx, img) {
    if (!img.width) return;
    const ratio = Math.max(w / img.width, h / img.height);
    const nw = img.width * ratio;
    const nh = img.height * ratio;
    const ix = (w - nw) / 2;
    const iy = (h - nh) / 2;
    ctx.drawImage(img, ix, iy, nw, nh);
}

function generateTiledChaos(ctx, img) {
    const tw = img.width; const th = img.height;
    if (!tw) return;

    const cols = Math.ceil(w / tw); const rows = Math.ceil(h / th);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            ctx.save();
            ctx.translate(x * tw + tw / 2, y * th + th / 2);
            ctx.rotate(Math.floor(Math.random() * 4) * Math.PI / 2);
            ctx.scale(Math.random() > .5 ? 1 : -1, Math.random() > .5 ? 1 : -1);
            ctx.drawImage(img, -tw / 2, -th / 2);
            ctx.restore();
        }
    }
}

function initParticles() {
    particles = [];
    const pc = Math.ceil(w / config.pixelSize);
    const pr = Math.ceil(h / config.pixelSize);

    // Sample colors
    let data = null;
    if (assetsReady) data = chaosMapCtx.getImageData(0, 0, w, h).data;

    for (let y = 0; y < pr; y++) {
        for (let x = 0; x < pc; x++) {
            const px = x * config.pixelSize;
            const py = y * config.pixelSize;
            let color = '#0e4429';

            if (data) {
                const cx = Math.floor(px + config.pixelSize / 2);
                const cy = Math.floor(py + config.pixelSize / 2);
                const i = (cy * w + cx) * 4;
                if (data[i] !== undefined) {
                    color = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
                }
            }

            particles.push({
                x: px, y: py,
                ox: px, oy: py, // Original Grid Pos (Jitter anchor)
                color: color,
                dx: 0, dy: 0,   // Jitter offset
                state: 0,       // 0=IDLE, 1=SUCKED, 2=DEAD
                size: config.pixelSize
            });
        }
    }
    console.log(`Particles Reset: ${particles.length}`);
}

// --- PHYSICS LOOP ---
function frame() {
    // Background: Clean Layer
    ctx.globalCompositeOperation = 'source-over';
    if (assetsReady) ctx.drawImage(cleanCanvas, 0, 0);
    else { ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h); }

    // Update & Draw Particles
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        if (p.state === 2) continue; // Skip Dead

        // --- LOGIC ---
        if (p.state === 0) { // IDLE
            // Jitter
            if (Math.random() < config.jitterSpeed) {
                p.dx = (Math.random() - 0.5) * config.jitterAmount;
                p.dy = (Math.random() - 0.5) * config.jitterAmount;
            }

            // Check Black Hole Distance
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < config.suckRadius * config.suckRadius) {
                p.state = 1; // Event Horizon Crossed
            }

            // Draw Idle
            ctx.fillStyle = p.color;
            ctx.fillRect(p.ox + p.dx, p.oy + p.dy, config.pixelSize + 0.5, config.pixelSize + 0.5);

        } else if (p.state === 1) { // SUCKED
            // Move towards mouse
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;

            p.x += dx * config.suckSpeed;
            p.y += dy * config.suckSpeed;
            p.size *= 0.85; // Shrink

            // Draw Sucked
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);

            // Kill condition
            if (p.size < 1 || (Math.abs(dx) < 5 && Math.abs(dy) < 5)) {
                p.state = 2; // Dead (Singularity reached)
            }
        }
    }

    requestAnimationFrame(frame);
}

// --- CONTROLS ---
// Wired up to index.html elements
const slider = document.getElementById('jitterSlider');
if (slider) {
    slider.addEventListener('input', e => {
        config.jitterSpeed = parseInt(e.target.value) / 10000;
    });
}
window.resetSingularity = initParticles; // Export for button

// Auto-fix for local testing delays
setTimeout(() => { if (!assetsReady) resize(); }, 1500);

resize();
frame();
