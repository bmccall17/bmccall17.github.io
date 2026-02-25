/**
 * Singularity Effect
 * Black Hole Physics: Particles from a "Chaos Layer" (Green Pixels) 
 * are sucked into the mouse cursor, revealing the "Clean Layer" (Header Image) below.
 */

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

// === TELEMETRY HUD ===
const HUD = {
    el: document.getElementById('telemetry-hud'),
    particles: document.getElementById('hud-particles'),
    absorbed: document.getElementById('hud-absorbed'),
    entropy: document.getElementById('hud-entropy'),
    absorbPct: document.getElementById('hud-absorb-pct'),
    horizon: document.getElementById('hud-horizon'),
    input: document.getElementById('hud-input'),
    cursor: document.getElementById('hud-cursor'),
    fps: document.getElementById('hud-fps'),
    uptime: document.getElementById('hud-uptime'),
};
const _hudStart = Date.now();
let _hudFrameCount = 0;
let _hudLastFpsTime = performance.now();
let _hudInputType = '---';

const config = {
    pixelSize: 20,
    jitterSpeed: 0.0017, // Low end (0.0017 - 0.17)
    jitterAmount: 2,
    suckRadius: 100,     // Black Hole Horizon
    suckSpeed: 0.15,     // Acceleration
    // Paths are relative to index.html
    cleanImgSrc: 'assets/header.png',
    chaosImgSrc: 'assets/pixels.png',

    // Image Alignment (0.0 = Left/Top, 0.5 = Center, 1.0 = Right/Bottom)
    // "Slightly off center" - adjust these to match the face position in the image
    imgFocusX: 0.5,
    imgFocusY: 0.45 // Shifted down a bit more (0.35 -> 0.45 moves image UP in viewport)
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

// Force resize handling (Debounced)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Only resize if dimensions changed significantly (ignore mobile URL bar toggle < 100px height)
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        if (newW !== w || Math.abs(newH - h) > 100) {
            resize();
        }
    }, 200);
});

// Input Handling (Mouse & Touch)
const updateInput = (x, y, type) => {
    mouse.x = x;
    mouse.y = y;
    if (type) _hudInputType = type;
};

window.addEventListener('mousemove', e => {
    updateInput(e.clientX, e.clientY, 'Mouse');
});

// Touch Support (Passive for better scroll performance)
window.addEventListener('touchmove', e => {
    // e.preventDefault(); // REMOVED: Allow scrolling
    const t = e.touches[0];
    updateInput(t.clientX, t.clientY, 'Touch');
}, { passive: true });

window.addEventListener('touchstart', e => {
    // e.preventDefault(); // REMOVED: Allow scrolling/clicking
    const t = e.touches[0];
    updateInput(t.clientX, t.clientY, 'Touch');
}, { passive: true });


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

    const screenAspect = w / h;
    const imgAspect = img.width / img.height;

    // If screen is wider than image (Landscape Screen vs Portrait Image),
    // Standard "cover" logic would scale by Width, making Height huge and cropping the top/bottom.
    // User wants "eyes always in frame" (top visible) and suggested tiling.
    if (screenAspect > imgAspect) {
        // Tiling Mode: Fit Height
        const ratio = h / img.height;
        const nw = img.width * ratio;
        const nh = img.height * ratio; // Matches h exactly

        // Center the main tile
        // Use imgFocusX to determine center alignment if desired, but user asked for "one tile in the center"
        // so strictly centering the tile frame is safest.
        let startX = (w - nw) / 2;
        let y = 0; // Fit Height means top aligns with 0

        // Draw Center Tile
        ctx.drawImage(img, startX, y, nw, nh);

        // Tile Left
        let loopX = startX - nw;
        while (loopX + nw > 0) {
            ctx.drawImage(img, loopX, y, nw, nh);
            loopX -= nw;
        }

        // Tile Right
        loopX = startX + nw;
        while (loopX < w) {
            ctx.drawImage(img, loopX, y, nw, nh);
            loopX += nw;
        }

    } else {
        // Portrait/Tall Screen:
        // Standard Cover logic works fine here because it scales by Height (to fill vertical),
        // or scales by Width (if screen is super narrow) which covers smoothly.
        // Actually, if screen is taller than image (Aspect < ImgAspect), we maximize ratio.
        // Math.max(w/W, h/H).
        // Since h/H > w/W, ratio = h/H.
        // So nh = h. Fits height perfectly. No vertical cropping!
        // So we can keep existing logic for this case.

        const ratio = Math.max(w / img.width, h / img.height);
        const nw = img.width * ratio;
        const nh = img.height * ratio;

        // Focus Point Logic (Existing)
        let ix = (w * 0.5) - (nw * config.imgFocusX);
        let iy = (h * 0.5) - (nh * config.imgFocusY);

        if (nw > w) {
            ix = Math.min(0, Math.max(w - nw, ix));
        } else {
            ix = (w - nw) / 2;
        }

        if (nh > h) {
            iy = Math.min(0, Math.max(h - nh, iy));
        } else {
            iy = (h - nh) / 2;
        }

        ctx.drawImage(img, ix, iy, nw, nh);
    }
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
    let activeCount = 0;
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        if (p.state === 1) activeCount++;

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

    // Update Avatar (Reactive)
    const avatar = document.querySelector('.glitch-avatar');
    if (avatar) {
        if (activeCount > 0) {
            avatar.classList.add('chaos-mode');
            const speed = Math.max(0.08, 0.6 - (activeCount / 150));
            avatar.style.setProperty('--glitch-duration', `${speed}s`);
        } else {
            avatar.classList.remove('chaos-mode');
        }

        // === EASTER EGG: Absorption → Glow Progression ===
        let deadCount = 0;
        for (let j = 0; j < particles.length; j++) {
            if (particles[j].state === 2) deadCount++;
        }
        const absorptionRatio = particles.length > 0 ? deadCount / particles.length : 0;
        avatar.style.setProperty('--absorption', absorptionRatio.toFixed(3));

        if (absorptionRatio >= 0.99) {
            avatar.classList.add('singularity-maxed');
        } else {
            avatar.classList.remove('singularity-maxed');
        }
    }

    // === TELEMETRY HUD UPDATE ===
    if (HUD.el) {
        // Particle counts
        const totalParticles = particles.length;
        let deadCount = 0;
        for (let j = 0; j < totalParticles; j++) {
            if (particles[j].state === 2) deadCount++;
        }
        const aliveCount = totalParticles - deadCount;
        const absorbRatio = totalParticles > 0 ? deadCount / totalParticles : 0;

        HUD.particles.textContent = aliveCount.toLocaleString();
        HUD.absorbed.textContent = deadCount.toLocaleString();
        HUD.entropy.textContent = config.jitterSpeed.toFixed(4);

        const absorbPctVal = (absorbRatio * 100).toFixed(1);
        HUD.absorbPct.textContent = absorbPctVal + '%';
        HUD.absorbPct.className = 'hud-value' +
            (absorbRatio > 0.9 ? ' hud-alert' : absorbRatio > 0.5 ? ' hud-warn' : '');

        HUD.horizon.textContent = config.suckRadius;
        HUD.input.textContent = _hudInputType;
        HUD.cursor.textContent = mouse.x > -1000
            ? Math.round(mouse.x) + ',' + Math.round(mouse.y)
            : '---';

        // FPS
        _hudFrameCount++;
        const fpsNow = performance.now();
        if (fpsNow - _hudLastFpsTime >= 1000) {
            HUD.fps.textContent = _hudFrameCount;
            _hudFrameCount = 0;
            _hudLastFpsTime = fpsNow;
        }

        // Uptime
        const elapsed = Math.floor((Date.now() - _hudStart) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        HUD.uptime.textContent = mins + ':' + secs;

        // Activate flicker once live
        if (!HUD.el.classList.contains('hud-live')) {
            HUD.el.classList.add('hud-live');
        }
    }

    requestAnimationFrame(frame);
}

// --- CONTROLS ---
// Wired up to index.html elements (HUD slider + mobile fallback)
const slider = document.getElementById('jitterSlider');
const sliderMobile = document.getElementById('jitterSliderMobile');

function onSliderInput(e) {
    config.jitterSpeed = parseInt(e.target.value) / 10000;
    // Sync both sliders
    if (slider) slider.value = e.target.value;
    if (sliderMobile) sliderMobile.value = e.target.value;
}

if (slider) slider.addEventListener('input', onSliderInput);
if (sliderMobile) sliderMobile.addEventListener('input', onSliderInput);
window.resetSingularity = initParticles; // Export for button

// === EASTER EGG: Click maxed avatar → Logo Factory ===
const bamAvatar = document.querySelector('.glitch-avatar');
if (bamAvatar) {
    bamAvatar.style.cursor = 'default';
    bamAvatar.addEventListener('click', () => {
        if (bamAvatar.classList.contains('singularity-maxed')) {
            window.location.href = '.logo_build/index.html';
        }
    });
}

// Auto-fix for local testing delays
setTimeout(() => { if (!assetsReady) resize(); }, 1500);

resize();
frame();
