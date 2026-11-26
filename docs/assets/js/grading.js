/**
 * DataDojo Grading Page Controller
 * Tracks grading exercises, updates passed counter, unlocks "Claim your belt" button, and celebrates.
 */

import { CONFIG } from './config.js';

export function initGrading(gradingContainer, options = {}) {
  const { progressStore, hud } = options;
  const beltId = gradingContainer.dataset.belt || 'white';
  const passThreshold = parseInt(gradingContainer.dataset.pass || '4', 10);
  const exerciseCells = gradingContainer.querySelectorAll('.dojo-cell[data-type="exercise"]');
  const totalTasks = exerciseCells.length;

  const beltConfig = CONFIG.BELTS.find(b => b.id === beltId) || CONFIG.BELTS[0];
  const isAlreadyClaimed = progressStore ? progressStore.isBeltClaimed(beltId) : false;

  // Build Grading header banner with task counter
  const headerDiv = document.createElement('div');
  headerDiv.className = 'dojo-grading-header';
  headerDiv.innerHTML = `
    <div class="dojo-grading-banner">
      <div class="dojo-grading-info">
        <span class="dojo-grading-belt-badge dojo-belt-${beltId}">
          🥋 <strong>${beltConfig.name} Belt Grading</strong>
        </span>
        <span class="dojo-grading-pass-target">Pass target: ${passThreshold} of ${totalTasks} tasks</span>
      </div>
      <div class="dojo-grading-status" aria-live="polite">
        <span class="dojo-grading-count">0 of ${totalTasks} tasks passed</span>
      </div>
      <div class="dojo-grading-claim-wrapper" style="display: none;">
        <button type="button" class="dojo-btn dojo-btn-claim-belt">
          🥋 Claim your ${beltConfig.name} Belt (+${CONFIG.XP.CLAIM_BELT} XP)
        </button>
      </div>
      <div class="dojo-grading-claimed-badge" style="display: ${isAlreadyClaimed ? 'block' : 'none'};">
        <div class="dojo-feedback-card dojo-feedback-success">
          <strong>🥋 ${beltConfig.name} Belt Earned!</strong>
          <p>You have earned this belt. You can always review and practice these tasks anytime.</p>
        </div>
      </div>
    </div>
  `;
  gradingContainer.insertBefore(headerDiv, gradingContainer.firstChild);

  const countEl = headerDiv.querySelector('.dojo-grading-count');
  const claimWrapper = headerDiv.querySelector('.dojo-grading-claim-wrapper');
  const claimBtn = headerDiv.querySelector('.dojo-btn-claim-belt');
  const claimedBadge = headerDiv.querySelector('.dojo-grading-claimed-badge');

  function updateGradingState() {
    let passedCount = 0;
    exerciseCells.forEach((cell) => {
      const exerciseId = cell.dataset.id;
      if (progressStore && progressStore.isCompleted(exerciseId)) {
        passedCount++;
      }
    });

    countEl.textContent = `${passedCount} of ${totalTasks} tasks passed`;

    const alreadyClaimed = progressStore ? progressStore.isBeltClaimed(beltId) : false;
    if (alreadyClaimed) {
      claimWrapper.style.display = 'none';
      claimedBadge.style.display = 'block';
    } else if (passedCount >= passThreshold) {
      claimWrapper.style.display = 'block';
      claimedBadge.style.display = 'none';
    } else {
      claimWrapper.style.display = 'none';
      claimedBadge.style.display = 'none';
    }
  }

  updateGradingState();

  // Listen for claim button click
  claimBtn.addEventListener('click', () => {
    if (!progressStore) return;
    const res = progressStore.claimBelt(beltId);
    updateGradingState();
    if (res.success && hud) {
      hud.showBeltCelebration(beltConfig);
    }
  });

  // Return a callback that can be triggered when any exercise passes
  return {
    onTaskComplete: () => {
      updateGradingState();
    },
  };
}
