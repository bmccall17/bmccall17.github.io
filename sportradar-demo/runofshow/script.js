/* ========================================
   Sportradar Demo — Mission Control JS
   ======================================== */

(function() {
  'use strict';

  // ========== DRAWER TOGGLE ==========
  document.querySelectorAll('.drawer-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !isOpen);
      if (isOpen) {
        content.classList.remove('open');
      } else {
        content.classList.add('open');
      }
    });
  });

  // Q&A nested drawers
  document.querySelectorAll('.qa-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !isOpen);
      if (isOpen) {
        answer.classList.remove('open');
      } else {
        answer.classList.add('open');
      }
    });
  });

  // ========== TIMER ==========
  let timerRunning = false;
  let timerStart = 0;
  let timerElapsed = 0;
  let timerInterval = null;
  const elapsedEl = document.getElementById('elapsed');
  const toggleBtn = document.getElementById('timer-toggle');

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  function updateTimer() {
    const now = Date.now();
    const total = timerElapsed + (now - timerStart);
    elapsedEl.textContent = formatTime(total);

    // Warning at 40 min, over at 45 min
    const totalMin = total / 60000;
    elapsedEl.classList.toggle('warning', totalMin >= 40 && totalMin < 45);
    elapsedEl.classList.toggle('over', totalMin >= 45);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (timerRunning) {
        timerElapsed += Date.now() - timerStart;
        clearInterval(timerInterval);
        timerRunning = false;
        toggleBtn.textContent = 'RESUME';
        toggleBtn.classList.remove('running');
      } else {
        timerStart = Date.now();
        timerInterval = setInterval(updateTimer, 250);
        timerRunning = true;
        toggleBtn.textContent = 'PAUSE';
        toggleBtn.classList.add('running');
      }
    });
  }

  // ========== NAV HIGHLIGHTING ==========
  const sections = document.querySelectorAll('.act[id]');
  const navActs = document.querySelectorAll('.nav-act');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navActs.forEach(nav => {
          const link = nav.querySelector('a');
          if (link && link.getAttribute('href') === '#' + id) {
            nav.classList.add('active');
          } else {
            nav.classList.remove('active');
          }
        });
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px' });

  sections.forEach(s => observer.observe(s));

  // ========== KEYBOARD SHORTCUTS ==========
  document.addEventListener('keydown', e => {
    // Skip if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key) {
      case 't':
      case 'T':
        e.preventDefault();
        if (toggleBtn) toggleBtn.click();
        break;
      case '1':
        e.preventDefault();
        document.getElementById('act-1')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case '2':
        e.preventDefault();
        document.getElementById('act-2')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case '3':
        e.preventDefault();
        document.getElementById('act-3')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case '4':
        e.preventDefault();
        document.getElementById('qa')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case '5':
        e.preventDefault();
        document.getElementById('intel')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'Escape':
        e.preventDefault();
        // Close all drawers
        document.querySelectorAll('.drawer-trigger[aria-expanded="true"]').forEach(btn => {
          btn.setAttribute('aria-expanded', 'false');
          btn.nextElementSibling.classList.remove('open');
        });
        document.querySelectorAll('.qa-question[aria-expanded="true"]').forEach(btn => {
          btn.setAttribute('aria-expanded', 'false');
          btn.nextElementSibling.classList.remove('open');
        });
        break;
      case 'a':
      case 'A':
        e.preventDefault();
        // Open all drawers
        document.querySelectorAll('.drawer-trigger[aria-expanded="false"]').forEach(btn => {
          btn.setAttribute('aria-expanded', 'true');
          btn.nextElementSibling.classList.add('open');
        });
        break;
    }
  });

  // ========== CHECKLIST PERSISTENCE ==========
  const checkboxes = document.querySelectorAll('.checklist input[type="checkbox"]');
  const STORAGE_KEY = 'sportradar-demo-checklist';

  // Load saved state
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    checkboxes.forEach(cb => {
      if (saved[cb.id]) cb.checked = true;
    });
  } catch(e) { /* ignore */ }

  // Save on change
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const state = {};
      checkboxes.forEach(c => { state[c.id] = c.checked; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    });
  });

  // ========== HAMBURGER (mobile) ==========
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('mission-nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('open');
    });

    // Close nav when clicking a link (mobile)
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          nav.classList.remove('open');
        }
      });
    });
  }

})();
