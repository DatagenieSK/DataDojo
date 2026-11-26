/**
 * DataDojo Interactive Order Cell Component (Parsons Problems)
 * Learners arrange lines of code with Up/Down buttons, run against tests in worker.
 */

import { runner } from './runner.js';
import { translate } from './errors.js';
import { deterministicShuffle } from './quiz.js';

export function initOrder(container, options = {}) {
  const { progressStore, onOrderComplete } = options;
  const orderId = container.dataset.id || 'order';
  const xpReward = parseInt(container.dataset.xp || '10', 10);
  const goal = container.dataset.goal || 'Arrange the lines in the correct order.';
  const testsCode = container.dataset.tests || '';

  let correctLines = [];
  let distractors = [];
  try {
    correctLines = JSON.parse(container.dataset.lines || '[]');
    distractors = JSON.parse(container.dataset.distractors || '[]');
  } catch (e) {
    console.error('Failed to parse lines or distractors for order cell', e);
    return;
  }

  const allLines = [...correctLines, ...distractors];
  if (!allLines.length) return;

  const tips = [
    container.dataset.tip1 || '',
    container.dataset.tip2 || '',
    container.dataset.tip3 || '',
  ].filter(Boolean);

  let currentTipsRevealed = 0;
  const isAlreadyCompleted = progressStore ? progressStore.isCompleted(orderId) : false;

  // Generate initial shuffled order deterministically
  // Ensure it is not already solved
  let currentItems = allLines.map((text, idx) => ({ id: `line_${idx}`, text }));
  let shuffled = deterministicShuffle(currentItems, orderId);

  // If accidentally identical to correct order, swap first two
  const isIdentical = shuffled.length === correctLines.length &&
    shuffled.every((item, i) => item.text === correctLines[i]);
  if (isIdentical && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  let userLines = [...shuffled];

  function renderLines() {
    const listEl = container.querySelector('.dojo-order-list');
    if (!listEl) return;

    listEl.innerHTML = userLines.map((item, idx) => `
      <div class="dojo-order-item" data-id="${item.id}" data-idx="${idx}">
        <div class="dojo-order-item-controls">
          <button
            type="button"
            class="dojo-order-btn dojo-order-up"
            data-action="up"
            data-idx="${idx}"
            aria-label="Move line ${idx + 1} up"
            ${idx === 0 ? 'disabled' : ''}
          >▲</button>
          <button
            type="button"
            class="dojo-order-btn dojo-order-down"
            data-action="down"
            data-idx="${idx}"
            aria-label="Move line ${idx + 1} down"
            ${idx === userLines.length - 1 ? 'disabled' : ''}
          >▼</button>
        </div>
        <div class="dojo-order-code">
          <pre><code>${escapeHtml(item.text)}</code></pre>
        </div>
      </div>
    `).join('');
  }

  let html = `
    <div class="dojo-order-wrapper" role="region" aria-label="Arrange the lines exercise">
      <div class="dojo-order-header">
        <div class="dojo-order-title">
          <span class="order-icon">🧩</span> <strong>Arrange the Lines</strong>
          <span class="dojo-order-xp-badge">+${xpReward} XP</span>
          <span class="dojo-badge-completed" style="display: ${isAlreadyCompleted ? 'inline-flex' : 'none'};">✅ Completed</span>
        </div>
        <div class="dojo-order-goal">${escapeHtml(goal)}</div>
      </div>

      <div class="dojo-order-list" role="list" aria-label="Code lines list"></div>

      <div class="dojo-cell-toolbar">
        <div class="dojo-toolbar-left">
          <button type="button" class="dojo-btn dojo-btn-check" aria-label="Check Arrangement">
            <span class="btn-icon">✓</span> Check
          </button>
          <button type="button" class="dojo-btn dojo-btn-reset" aria-label="Reset Arrangement">
            ↺ Reset
          </button>
          ${tips.length > 0 ? `
            <button type="button" class="dojo-btn dojo-btn-tip" aria-label="Get Sensei Tip">
              🥋 Sensei Tip (${tips.length} left)
            </button>
          ` : ''}
        </div>
        <div class="dojo-toolbar-right">
          <span class="dojo-order-count">${userLines.length} lines</span>
        </div>
      </div>

      <div class="dojo-tips-ladder" aria-live="polite"></div>

      <div class="dojo-cell-output" aria-live="polite" aria-atomic="true">
        <div class="dojo-output-status" style="display: none;"></div>
        <pre class="dojo-output-content" style="display: none;"></pre>
      </div>
    </div>
  `;

  container.innerHTML = html;
  renderLines();

  const listEl = container.querySelector('.dojo-order-list');
  const btnCheck = container.querySelector('.dojo-btn-check');
  const btnReset = container.querySelector('.dojo-btn-reset');
  const btnTip = container.querySelector('.dojo-btn-tip');
  const tipsContainer = container.querySelector('.dojo-tips-ladder');
  const statusEl = container.querySelector('.dojo-output-status');
  const contentEl = container.querySelector('.dojo-output-content');
  const badgeEl = container.querySelector('.dojo-badge-completed');

  // Handle line movement via Up/Down buttons
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.dojo-order-btn');
    if (!btn || btn.disabled) return;

    const action = btn.dataset.action;
    const idx = parseInt(btn.dataset.idx, 10);

    if (action === 'up' && idx > 0) {
      const temp = userLines[idx];
      userLines[idx] = userLines[idx - 1];
      userLines[idx - 1] = temp;
      renderLines();
      // Keep focus on the moved item button
      const newBtn = listEl.querySelector(`.dojo-order-item[data-idx="${idx - 1}"] .dojo-order-up`);
      if (newBtn) newBtn.focus();
    } else if (action === 'down' && idx < userLines.length - 1) {
      const temp = userLines[idx];
      userLines[idx] = userLines[idx + 1];
      userLines[idx + 1] = temp;
      renderLines();
      const newBtn = listEl.querySelector(`.dojo-order-item[data-idx="${idx + 1}"] .dojo-order-down`);
      if (newBtn) newBtn.focus();
    }
  });

  // Handle Reset
  btnReset.addEventListener('click', () => {
    userLines = [...shuffled];
    renderLines();
    statusEl.style.display = 'none';
    contentEl.style.display = 'none';
  });

  // Handle Tip Ladder
  if (btnTip && tipsContainer) {
    btnTip.addEventListener('click', () => {
      if (currentTipsRevealed < tips.length) {
        const tipText = tips[currentTipsRevealed];
        currentTipsRevealed++;
        const tipBox = document.createElement('div');
        tipBox.className = 'dojo-tip-box';
        tipBox.innerHTML = `<strong>💡 Tip ${currentTipsRevealed}:</strong> ${escapeHtml(tipText)}`;
        tipsContainer.appendChild(tipBox);

        const remaining = tips.length - currentTipsRevealed;
        if (remaining > 0) {
          btnTip.textContent = `🥋 Next Tip (${remaining} left)`;
        } else {
          btnTip.textContent = '🥋 All Tips Shown';
          btnTip.disabled = true;
        }
      }
    });
  }

  // Handle Check
  btnCheck.addEventListener('click', async () => {
    statusEl.style.display = 'block';
    statusEl.className = 'dojo-output-status dojo-status-loading';
    statusEl.innerHTML = 'Testing arrangement…';
    contentEl.style.display = 'none';

    // Assemble user code from lines
    const userCode = userLines.map(item => item.text).join('\n');
    const res = await runner.check(userCode, testsCode);

    if (res.rawError) {
      const err = translate(res.rawError);
      statusEl.className = 'dojo-output-status dojo-status-error';
      statusEl.innerHTML = `
        <div class="dojo-error-card">
          <div class="dojo-error-header"><strong>🥋 ${escapeHtml(err.title)}</strong></div>
          <div class="dojo-error-body">
            <p>${escapeHtml(err.explain)}</p>
            <p class="dojo-try-this">💡 <strong>Try this:</strong> ${escapeHtml(err.tryThis)}</p>
          </div>
        </div>
      `;
      return;
    }

    if (res.testFailure) {
      statusEl.className = 'dojo-output-status dojo-status-failed';
      statusEl.innerHTML = `
        <div class="dojo-feedback-card dojo-feedback-warn">
          <strong>🥋 Keep Going!</strong>
          <p>${escapeHtml(res.testFailure)}</p>
        </div>
      `;
      if (res.stdout) {
        contentEl.style.display = 'block';
        contentEl.textContent = res.stdout;
      }
      return;
    }

    if (res.passed) {
      statusEl.className = 'dojo-output-status dojo-status-success';
      statusEl.innerHTML = `
        <div class="dojo-feedback-card dojo-feedback-success">
          <strong>🥋 Order Solved!</strong>
          <p>Great arrangement! The lines run in perfect sequence.</p>
        </div>
      `;
      if (res.stdout) {
        contentEl.style.display = 'block';
        contentEl.textContent = res.stdout;
      }
      if (badgeEl) badgeEl.style.display = 'inline-flex';

      if (progressStore) {
        const result = progressStore.completeOrder(orderId, currentTipsRevealed, xpReward);
        if (onOrderComplete) {
          onOrderComplete({
            id: orderId,
            earnedXp: result.addedXp,
            firstTime: result.firstCompletion,
            usedTips: currentTipsRevealed,
          });
        }
      }
    }
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
