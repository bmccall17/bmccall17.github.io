/**
 * Mobile Navigation Logic
 * - Disables native scroll
 * - Implements custom "stack" navigation
 * - Handles touch gestures & arrow clicks
 */

const initMobileNav = () => {
    if (window.innerWidth > 768) return; // Exit if desktop

    console.log('Mobile Nav: Initializing...');

    const cards = Array.from(document.querySelectorAll('.ghost-card'));
    const container = document.querySelector('.stream-layout');

    // We need to handle the Profile Sidebar too? 
    // Ideally, we treat the sidebar as the "Cover" or first item.
    // For now, let's focus on the tiles as requested. 
    // We will inject the Profile Sidebar content as the first "Card" dynamically?
    // Or just let the user focus on tiles. 
    // Let's create a virtual "Intro Card" from the sidebar for consistency.

    // Actually, let's just make the sidebar visible if index is -1 or something?
    // Simpler: Just cycle existing cards.

    let currentIndex = 0;
    let isAnimating = false;

    // --- SETUP ARROWS ---
    const navContainer = document.createElement('div');
    navContainer.className = 'mobile-nav-arrows';
    navContainer.innerHTML = `
        <div class="nav-arrow up-arrow" id="navUp">▲</div>
        <div class="nav-arrow down-arrow" id="navDown">▼</div>
    `;
    document.body.appendChild(navContainer);

    const btnUp = document.getElementById('navUp');
    const btnDown = document.getElementById('navDown');

    // --- UTILS ---
    const updateView = () => {
        cards.forEach((card, i) => {
            card.classList.remove('active', 'prev', 'next');

            if (i === currentIndex) {
                card.classList.add('active');
            } else if (i === currentIndex - 1) {
                card.classList.add('prev');
            } else if (i === currentIndex + 1) {
                card.classList.add('next');
            } else if (i < currentIndex) {
                // Way above
                card.style.opacity = '0';
                card.style.transform = 'translate(-50%, -200%) scale(0.8)';
            } else {
                // Way below
                card.style.opacity = '0';
                card.style.transform = 'translate(-50%, 200%) scale(0.8)';
            }
        });

        // Update Arrows
        if (currentIndex <= 0) btnUp.classList.add('disabled');
        else btnUp.classList.remove('disabled');

        if (currentIndex >= cards.length - 1) btnDown.classList.add('disabled');
        else btnDown.classList.remove('disabled');
    };

    const goNext = () => {
        if (currentIndex < cards.length - 1) {
            currentIndex++;
            updateView();
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateView();
        }
    };

    // --- EVENT LISTENERS ---

    // Arrows
    btnUp.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
    btnDown.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });

    // Touch Handling (Swipe)
    let touchStartY = 0;

    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        // Don't prevent default everywhere, buttons need clicks
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        e.preventDefault(); // BLOCK NATIVE SCROLL
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;

        if (Math.abs(diff) > 50) { // Threshold
            if (diff > 0) goNext(); // Swiped Up -> Show Next
            else goPrev();          // Swiped Down -> Show Prev
        }
    });

    // Wheel (for testing on desktop in mobile mode)
    window.addEventListener('wheel', (e) => {
        // Debounce?
        e.preventDefault();
        if (isAnimating) return;
        isAnimating = true;
        setTimeout(() => isAnimating = false, 200);

        if (e.deltaY > 0) goNext();
        else goPrev();
    }, { passive: false });

    // Initial Render
    updateView();
};

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
    initMobileNav();
}
