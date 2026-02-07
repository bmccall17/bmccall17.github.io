# Deployment Guide: v0.1.3 (Cross-Site Leakage)

This release spans two repositories. Both must be deployed for the "Infection" and "Symptom" to work together.

## 1. Darketype Repo (`bmccall17.github.io`)
**Location**: Current Workspace

**Files to Commit & Push**:
-   `scripts/singularity.js` (Mobile optimization: removed scroll blocking)
-   `scripts/leak_core.js` (New: The Infection Logic)
-   `darketype/weblog/index.html` (New: Heatmap visualizer)
-   `darketype/css/style.css` (Styles for heatmap & glitches)
-   `SHIP_LOG.md` (Updated version history)
-   `devnotes/releases/v0.1.3.md` (Release notes)
-   `heatmap.json` (Generated data)

**Command**:
```bash
git add .
git commit -m "feat(v0.1.3): mobile fixes, heatmap, and CSLP infection logic"
git push
```

---

## 2. Portfolio Repo (`../portfolio`)
**Location**: `../portfolio` (Relative to current)

**Key File**: `static/js/binary-leak.js`

**What Changed**:
-   Added logic to read `localStorage` for `darketype_infection_level`.
-   Added "Singularity Button" assembly code (bottom-left corner).
-   Added text glitch mutation (`d a r k e t y p e`).

**Command (Run in `../portfolio` folder)**:
```bash
cd ../portfolio
git status # Verify static/js/binary-leak.js is modified
git add static/js/binary-leak.js
git commit -m "feat(cslp): implement symptom logic (reads infection level)"
git push
```

## 3. Verification
Once both are deployed (wait ~60s for GitHub Pages):
1.  **Infect Yourself**: Go to `https://bmccall17.github.io/darketype/`.
    -   Open DevTools -> Application -> Local Storage.
    -   Verify `darketype_infection_level` exists (should be > 0).
2.  **See the Symptom**: Go to `https://bmccall17.github.io/portfolio/` (or `brettamccall.com`).
    -   The binary background should occasionally spell `d a r k e t y p e`.
    -   If infection is high (visit Darketype multiple times), a "●" button should appear in the bottom-left.
