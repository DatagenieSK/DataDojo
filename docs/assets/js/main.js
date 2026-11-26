/**
 * DataDojo Bootloader & Instant Navigation Integration
 */

import { ProgressStore } from './progress.js';
import { DojoHUD } from './hud.js';
import { initCell } from './cell.js';

let progressStore = null;
let hud = null;
let storageNoticeShown = false;

function showStorageNotice() {
  if (storageNoticeShown) return;
  storageNoticeShown = true;

  const mainContent = document.querySelector('.md-content') || document.body;
  const notice = document.createElement('div');
  notice.className = 'dojo-storage-notice';
  notice.setAttribute('role', 'status');
  notice.innerHTML = `
    <span>🥋 <strong>Dojo Notice:</strong> Storage is unavailable in this browser mode. You can still practice all katas, but your progress will not be saved between visits.</span>
  `;
  mainContent.insertBefore(notice, mainContent.firstChild);
}

function initGlossary() {
  const terms = document.querySelectorAll('.dojo-term');
  if (terms.length === 0) return;

  // Fetch glossary.json if needed
  const glossaryUrl = new URL('../../glossary.json', import.meta.url);
  fetch(glossaryUrl)
    .then((r) => r.json())
    .then((dict) => {
      terms.forEach((el) => {
        const key = el.dataset.term;
        if (dict[key]) {
          el.setAttribute('title', dict[key]);
          el.setAttribute('tabindex', '0');
        }
      });
    })
    .catch(() => {
      // Ignore offline / missing glossary
    });
}

function bootPage() {
  if (!progressStore) {
    progressStore = new ProgressStore(null, () => {
      showStorageNotice();
    });
  }

  if (!hud) {
    hud = new DojoHUD(progressStore);
  }
  hud.mount();

  // Find all dojo-cell nodes
  const cells = document.querySelectorAll('.dojo-cell');
  cells.forEach((container) => {
    // Avoid re-initializing initialized cells
    if (container.dataset.initialized === 'true') return;
    container.dataset.initialized = 'true';

    initCell(container, {
      progressStore,
      onExerciseComplete: ({ id, earnedXp, firstTime, usedTips }) => {
        hud.render();
        if (firstTime) {
          const tipNote = usedTips === 0 ? 'Flawless execution! Hint-free bonus awarded.' : 'Well done sparring!';
          hud.showToast('🥋 Nice kick!', tipNote, earnedXp);
        } else {
          hud.showToast('🥋 Kata Repeated', 'Good form! Repetition builds mastery.', 0);
        }
      },
    });
  });

  initGlossary();
  initScrollReveal();
  initButtonRipples();
}

/**
 * Scroll-entrance reveal using IntersectionObserver.
 * Adds `.dojo-reveal` (invisible + shifted) then `.is-visible` (animated in)
 * when each cell enters the viewport. Degrades gracefully if no IO support.
 */
function initScrollReveal() {
  const targets = document.querySelectorAll('.dojo-cell, .dojo-predict-box, .dojo-exercise');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    // Older browsers — make everything visible immediately
    targets.forEach(el => el.classList.add('dojo-reveal', 'is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger siblings within the same parent for a cascade effect
          const siblings = entry.target.parentElement
            ? [...entry.target.parentElement.querySelectorAll('.dojo-reveal:not(.is-visible)')]
            : [entry.target];
          const idx = siblings.indexOf(entry.target);
          const delay = Math.min(idx * 60, 300); // cap cascade at 300 ms
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -48px 0px' }
  );

  targets.forEach(el => {
    el.classList.add('dojo-reveal');
    observer.observe(el);
  });
}

/**
 * Button ripple — tracks the exact click position so the CSS radial-gradient
 * ripple originates from the finger/cursor rather than the button centre.
 * Sets CSS custom props --rx / --ry consumed by dojo.css.
 */
function initButtonRipples() {
  document.querySelectorAll('.dojo-btn').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      btn.style.setProperty('--rx', x + '%');
      btn.style.setProperty('--ry', y + '%');
    });
  });
}

// Support MkDocs Material instant navigation via document$
if (typeof window !== 'undefined') {
  if (window.document$) {
    window.document$.subscribe(() => {
      bootPage();
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      bootPage();
    });
  }
}
