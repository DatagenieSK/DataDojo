/**
 * DataDojo Header Heads-Up Display (HUD) & Celebration Toasts
 */

import { CONFIG } from './config.js';

export class DojoHUD {
  constructor(progressStore) {
    this.progressStore = progressStore;
    this.container = null;
    this.toastContainer = null;
  }

  mount() {
    // Look for header element or inject into header
    const header = document.querySelector('.md-header__inner') || document.body;
    let hudWrapper = document.getElementById('dojo-hud');
    if (!hudWrapper) {
      hudWrapper = document.createElement('div');
      hudWrapper.id = 'dojo-hud';
      hudWrapper.className = 'dojo-hud';
      hudWrapper.setAttribute('role', 'region');
      hudWrapper.setAttribute('aria-label', 'Learner Progress HUD');
      header.appendChild(hudWrapper);
    }
    this.container = hudWrapper;

    // Toast container
    let toastWrapper = document.getElementById('dojo-toast-container');
    if (!toastWrapper) {
      toastWrapper = document.createElement('div');
      toastWrapper.id = 'dojo-toast-container';
      toastWrapper.className = 'dojo-toast-container';
      toastWrapper.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastWrapper);
    }
    this.toastContainer = toastWrapper;

    this.render();
  }

  getCurrentBelt() {
    return this.progressStore.getCurrentBelt();
  }

  render() {
    if (!this.container) return;
    const state = this.progressStore.getState();
    const belt = this.getCurrentBelt();

    this.container.innerHTML = `
      <div class="dojo-hud-belt" title="Current Belt: ${belt.name} (${belt.subtitle})">
        <span class="dojo-belt-badge dojo-belt-${belt.id}">
          🥋 Belt: <strong>${belt.name}</strong>
        </span>
      </div>
      <div class="dojo-hud-xp" title="Total Experience Points">
        ⭐ <strong>${state.xp}</strong> XP
      </div>
      <div class="dojo-hud-streak" title="Daily Practice Streak">
        🔥 <strong>${state.streak.count}</strong> ${state.streak.count === 1 ? 'day' : 'days'}
      </div>
      <div class="dojo-hud-menu-wrapper">
        <button type="button" class="dojo-btn-hud-menu" aria-label="Progress settings & data menu" aria-haspopup="true" aria-expanded="false">
          ⚙️ Data
        </button>
        <div class="dojo-hud-dropdown" role="menu" style="display: none;">
          <button type="button" class="dojo-menu-item" id="dojo-export-btn" role="menuitem">
            📥 Export Progress (.json)
          </button>
          <label class="dojo-menu-item dojo-file-label" role="menuitem">
            📤 Import Progress
            <input type="file" id="dojo-import-input" accept=".json,application/json" style="display: none;" />
          </label>
          <button type="button" class="dojo-menu-item dojo-menu-item-danger" id="dojo-reset-btn" role="menuitem">
            🗑️ Reset Progress
          </button>
        </div>
      </div>
    `;

    const menuBtn = this.container.querySelector('.dojo-btn-hud-menu');
    const dropdown = this.container.querySelector('.dojo-hud-dropdown');
    const exportBtn = this.container.querySelector('#dojo-export-btn');
    const importInput = this.container.querySelector('#dojo-import-input');
    const resetBtn = this.container.querySelector('#dojo-reset-btn');

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
      menuBtn.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
    });

    document.addEventListener('click', () => {
      if (dropdown) {
        dropdown.style.display = 'none';
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Export progress
    exportBtn.addEventListener('click', () => {
      const dataStr = this.progressStore.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datadojo-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Import progress
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        this.progressStore.importData(text);
        this.render();
        this.showToast('🥋 Progress Restored!', 'Successfully imported your training data.', 0);
      } catch (err) {
        alert('Could not import progress: ' + (err.message || 'Invalid format'));
      }
      importInput.value = '';
    });

    // Reset progress
    resetBtn.addEventListener('click', () => {
      const confirmed = window.confirm('Are you sure you want to reset your Dojo progress? This will reset your XP, completed katas, and streak.');
      if (confirmed) {
        this.progressStore.resetProgress();
        this.render();
        this.showToast('🥋 Clean Slate', 'Progress has been reset.', 0);
      }
    });
  }

  showToast(title, message, earnedXp = 0) {
    if (!this.toastContainer) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toast = document.createElement('div');
    toast.className = `dojo-toast ${prefersReducedMotion ? 'dojo-toast-static' : 'dojo-toast-animated'}`;

    // Use relative path for mascot image to work on sub-path
    const pandaUrl = new URL('../img/panda.svg', import.meta.url).href;

    toast.innerHTML = `
      <img src="${pandaUrl}" alt="" class="dojo-toast-panda" width="48" height="48" />
      <div class="dojo-toast-body">
        <strong>${title}</strong>
        <div>${message}</div>
        ${earnedXp > 0 ? `<span class="dojo-toast-xp">+${earnedXp} XP!</span>` : ''}
      </div>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('dojo-toast-fade');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 500);
    }, 4000);
  }

  showBeltCelebration(belt) {
    this.render();
    this.showToast(
      `🥋 ${belt.name} Belt Earned!`,
      `Sensei Panda bows with deep respect! You have mastered the ${belt.name} Belt (${belt.subtitle}).`,
      CONFIG.XP.CLAIM_BELT
    );
  }
}
