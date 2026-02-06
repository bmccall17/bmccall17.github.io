/**
 * Cross-Site Leakage Protocol (CSLP) Core
 * v0.1.0
 * 
 * Usage:
 * <script src="https://bmccall17.github.io/scripts/leak_core.js"></script>
 */

(function () {
    console.log('CSLP: Initializing...');

    const CSLP = {
        entropy: 0.0017, // default
        origin: 'unknown',
        targets: [
            'bmccall17.github.io',
            'brettamccall.com',
            'localhost'
        ]
    };

    // 1. The Infection (Shared LocalStorage)
    try {
        let infectionLevel = parseFloat(localStorage.getItem('darketype_infection_level') || 0);

        // Darketype increases infection
        if (window.location.hostname === 'bmccall17.github.io' || window.location.hostname === 'localhost') {
            // Is this the source (Darketype)?
            const isDarketype = window.location.pathname.includes('darketype');

            if (isDarketype) {
                // Increment infection
                infectionLevel = Math.min(1.0, infectionLevel + 0.1);
                localStorage.setItem('darketype_infection_level', infectionLevel.toFixed(2));
                console.log(`CSLP: Infection spread -> ${infectionLevel}`);
            }
        }

        CSLP.entropy = Math.max(0.0017, infectionLevel * 0.1); // Map infection to entropy

        // If Singularity Config exists, update it
        if (window.config) {
            window.config.jitterSpeed = CSLP.entropy;
            // Update UI if present
            const slider = document.getElementById('jitterSlider');
            if (slider) {
                // ... (no auto-update of slider to avoid fighting user control, 
                // unless we want the infection to force the slider up?)
            }
        }
    } catch (e) {
        console.warn('CSLP: LocalStorage access denied', e);
    }

    // 2. Outbound Link Injection
    function injectLinks() {
        document.querySelectorAll('a').forEach(link => {
            try {
                const url = new URL(link.href, window.location.origin); // Handle relative URLs

                // check if target is in our CSLP network
                const isTarget = CSLP.targets.some(t => url.hostname.includes(t));

                if (isTarget) {
                    link.addEventListener('click', (e) => {
                        // refreshing the value just in case it changed
                        // (e.g. slider moved)
                        let currentEntropy = CSLP.entropy;

                        // Try to get from UI first
                        const slider = document.getElementById('jitterSlider');
                        if (slider) {
                            currentEntropy = parseInt(slider.value) / 10000;
                        }

                        // Append to URL
                        const targetUrl = new URL(link.href, window.location.origin);
                        targetUrl.searchParams.set('entropy', currentEntropy);
                        targetUrl.searchParams.set('origin', window.location.hostname);

                        // Proceed (update href or let natural nav happen? 
                        // Updating href is safer for CMD+Click etc)
                        link.href = targetUrl.toString();
                    });
                }
            } catch (e) {
                // ignore invalid urls
            }
        });
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLinks);
    } else {
        injectLinks();
    }

    // Export
    window.CSLP = CSLP;

})();
