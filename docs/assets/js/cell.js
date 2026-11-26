/**
 * DataDojo Interactive Cell Component
 * Converts dojo-run and dojo-exercise DOM nodes into live Python editors.
 */

import { runner } from './runner.js';
import { translate } from './errors.js';

export function setupEditor(textarea, gutter) {
  function updateLineNumbers() {
    const lines = (textarea.value || '').split('\n').length;
    let numbers = '';
    for (let i = 1; i <= lines; i++) {
      numbers += `<div>${i}</div>`;
    }
    gutter.innerHTML = numbers;
  }

  textarea.addEventListener('input', updateLineNumbers);
  textarea.addEventListener('scroll', () => {
    gutter.scrollTop = textarea.scrollTop;
  });

  textarea.addEventListener('keydown', (e) => {
    // Tab key inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      updateLineNumbers();
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const lineBeforeCursor = textarea.value.substring(0, start).split('\n').pop() || '';
      const matchIndent = lineBeforeCursor.match(/^(\s+)/);
      if (matchIndent) {
        e.preventDefault();
        const indent = matchIndent[1];
        // If line ends with a colon, add 2 more spaces
        const extraIndent = lineBeforeCursor.trim().endsWith(':') ? '  ' : '';
        const insertion = '\n' + indent + extraIndent;
        textarea.value = textarea.value.substring(0, start) + insertion + textarea.value.substring(textarea.selectionEnd);
        textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
        updateLineNumbers();
        return;
      }
    }
  });

  updateLineNumbers();
}

export function initCell(container, options = {}) {
  const { progressStore, onExerciseComplete } = options;
  const isExercise = container.dataset.type === 'exercise';
  const exerciseId = container.dataset.id || '';
  const xpReward = parseInt(container.dataset.xp || '10', 10);
  const starterCode = container.dataset.starter || '';
  const testsCode = container.dataset.tests || '';
  const tips = [
    container.dataset.tip1 || '',
    container.dataset.tip2 || '',
    container.dataset.tip3 || '',
  ].filter(Boolean);

  let currentTipsRevealed = 0;
  let solutionLoaded = false;

  // Build DOM structure
  container.innerHTML = `
    <div class="dojo-cell-wrapper" role="region" aria-label="${isExercise ? 'Sparring Exercise' : 'Runnable Code'}">
      <div class="dojo-editor-container">
        <div class="dojo-gutter" aria-hidden="true"></div>
        <textarea
          class="dojo-textarea"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          aria-label="${isExercise ? 'Code input for sparring exercise' : 'Code input'}"
        >${starterCode}</textarea>
      </div>

      <div class="dojo-cell-toolbar">
        <div class="dojo-toolbar-left">
          <button type="button" class="dojo-btn dojo-btn-run" aria-label="Run Code (Ctrl+Enter)">
            <span class="btn-icon">▶</span> Run
          </button>
          ${isExercise ? `
            <button type="button" class="dojo-btn dojo-btn-check" aria-label="Check Solution">
              <span class="btn-icon">✓</span> Check
            </button>
          ` : ''}
          <button type="button" class="dojo-btn dojo-btn-reset" aria-label="Reset Code">
            ↺ Reset
          </button>
          ${isExercise && !container.dataset.covers ? `
            <button type="button" class="dojo-btn dojo-btn-tip" aria-label="Get Sensei Tip">
              🥋 Sensei Tip (${tips.length} left)
            </button>
          ` : ''}
        </div>
        <div class="dojo-toolbar-right">
          ${isExercise ? `<span class="dojo-badge-completed" style="display: ${progressStore && progressStore.isCompleted(exerciseId) ? 'inline-flex' : 'none'};">✅ Completed</span>` : ''}
          <span class="dojo-shortcut-hint">Ctrl + Enter to run</span>
        </div>
      </div>

      ${isExercise && !container.dataset.covers ? `<div class="dojo-tips-ladder" aria-live="polite"></div>` : ''}

      <div class="dojo-cell-output" aria-live="polite" aria-atomic="true">
        <div class="dojo-output-status" style="display: none;"></div>
        <pre class="dojo-output-content" style="display: none;"></pre>
        <div class="dojo-output-eval" style="display: none;"></div>
      </div>
    </div>
  `;

  const textarea = container.querySelector('.dojo-textarea');
  const gutter = container.querySelector('.dojo-gutter');
  const btnRun = container.querySelector('.dojo-btn-run');
  const btnCheck = container.querySelector('.dojo-btn-check');
  const btnReset = container.querySelector('.dojo-btn-reset');
  const btnTip = container.querySelector('.dojo-btn-tip');
  const tipsContainer = container.querySelector('.dojo-tips-ladder');
  const outputEl = container.querySelector('.dojo-cell-output');
  const statusEl = container.querySelector('.dojo-output-status');
  const contentEl = container.querySelector('.dojo-output-content');
  const evalEl = container.querySelector('.dojo-output-eval');

  setupEditor(textarea, gutter);

  // If already completed in progress store, mark visually
  if (isExercise && progressStore && progressStore.isCompleted(exerciseId)) {
    const headerTitle = container.querySelector('.dojo-cell-title');
    if (headerTitle && !container.querySelector('.dojo-badge-completed')) {
      const badge = document.createElement('span');
      badge.className = 'dojo-badge-completed';
      badge.textContent = '✅ Completed';
      headerTitle.appendChild(badge);
    }
  }

  // Lazy wake up on focus
  textarea.addEventListener('focus', () => {
    runner.ensureWorker();
  }, { once: true });

  // Keyboard shortcut Ctrl/Cmd + Enter
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isExercise) {
        btnCheck ? btnCheck.click() : btnRun.click();
      } else {
        btnRun.click();
      }
    }
  });

  function setStatus(text, type = 'info') {
    statusEl.style.display = 'block';
    statusEl.className = `dojo-output-status dojo-status-${type}`;
    statusEl.innerHTML = text;
  }

  function clearOutput() {
    statusEl.style.display = 'none';
    contentEl.style.display = 'none';
    contentEl.textContent = '';
    evalEl.style.display = 'none';
    evalEl.textContent = '';
  }

  function displayExecutionResult(res, isCheckMode = false) {
    clearOutput();

    if (res.rawError) {
      const err = translate(res.rawError);
      statusEl.style.display = 'block';
      statusEl.className = 'dojo-output-status dojo-status-error';
      statusEl.innerHTML = `
        <div class="dojo-error-card">
          <div class="dojo-error-header">
            <strong>🥋 ${escapeHtml(err.title)}</strong>
          </div>
          <div class="dojo-error-body">
            <p>${escapeHtml(err.explain)}</p>
            <p class="dojo-try-this">💡 <strong>Try this:</strong> ${escapeHtml(err.tryThis)}</p>
          </div>
          <details class="dojo-error-details">
            <summary>Show the technical details</summary>
            <pre>${escapeHtml(err.raw)}</pre>
          </details>
        </div>
      `;
      return;
    }

    if (isCheckMode && res.testFailure) {
      statusEl.style.display = 'block';
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

    if (isCheckMode && res.passed) {
      statusEl.style.display = 'block';
      statusEl.className = 'dojo-output-status dojo-status-success';
      const badge = container.querySelector('.dojo-badge-completed');
      if (badge) badge.style.display = 'inline-flex';
      statusEl.innerHTML = `
        <div class="dojo-feedback-card dojo-feedback-success">
          <strong>🥋 Kata Passed!</strong>
          <p>Great technique! Your code produced the expected result.</p>
        </div>
      `;

      if (progressStore && exerciseId) {
        const result = progressStore.completeExercise(exerciseId, currentTipsRevealed);
        if (onExerciseComplete) {
          onExerciseComplete({
            id: exerciseId,
            earnedXp: result.addedXp,
            firstTime: result.firstCompletion,
            usedTips: currentTipsRevealed,
          });
        }
      }
    }

    if (res.stdout || res.stderr) {
      contentEl.style.display = 'block';
      contentEl.textContent = (res.stdout || '') + (res.stderr ? '\n' + res.stderr : '');
    }

    if (res.finalValue && !isCheckMode) {
      evalEl.style.display = 'block';
      evalEl.innerHTML = `<span class="dojo-eval-badge">Output:</span> <code>${escapeHtml(res.finalValue)}</code>`;
    }

    if (!res.stdout && !res.stderr && !res.finalValue && !isCheckMode) {
      contentEl.style.display = 'block';
      contentEl.textContent = '(Code ran cleanly with no output)';
    }
  }

  // Handle Run
  btnRun.addEventListener('click', async () => {
    setStatus('Waking up Python…', 'loading');
    const res = await runner.run(textarea.value);
    displayExecutionResult(res, false);
  });

  // Handle Check
  if (btnCheck) {
    btnCheck.addEventListener('click', async () => {
      setStatus('Checking your code…', 'loading');
      const res = await runner.check(textarea.value, testsCode);
      displayExecutionResult(res, true);
    });
  }

  // Handle Reset
  btnReset.addEventListener('click', () => {
    textarea.value = starterCode;
    setupEditor(textarea, gutter);
    clearOutput();
  });

  // Handle Tip Ladder
  if (btnTip && tipsContainer) {
    btnTip.addEventListener('click', async () => {
      if (currentTipsRevealed < tips.length) {
        const tipText = tips[currentTipsRevealed];
        currentTipsRevealed++;
        const tipBox = document.createElement('div');
        tipBox.className = 'dojo-tip-box';
        tipBox.innerHTML = `<strong>💡 Tip ${currentTipsRevealed}:</strong> ${escapeHtml(tipText)}`;
        tipsContainer.appendChild(tipBox);

        const remaining = tips.length - currentTipsRevealed;
        if (remaining > 0) {
          btnTip.textContent = `🥋 Sensei Tip (${remaining} left)`;
        } else {
          btnTip.textContent = `🔓 Show Solution`;
        }
      } else if (!solutionLoaded) {
        // Show solution step
        btnTip.disabled = true;
        btnTip.textContent = `Loading solution…`;

        try {
          // Load solution from build-emitted JSON asset
          // Using relative path to support sub-path deployment
          const solutionUrl = new URL(`../solutions/${exerciseId}.json`, import.meta.url);
          const response = await fetch(solutionUrl);
          if (!response.ok) throw new Error('Could not fetch solution');
          const data = await response.json();
          const solutionCode = data.solution || '';

          const solBox = document.createElement('div');
          solBox.className = 'dojo-solution-box';
          solBox.innerHTML = `
            <strong>🥋 Official Solution:</strong>
            <pre><code>${escapeHtml(solutionCode)}</code></pre>
            <button type="button" class="dojo-btn dojo-btn-copy-sol">Copy into Editor</button>
          `;
          solBox.querySelector('.dojo-btn-copy-sol').addEventListener('click', () => {
            textarea.value = solutionCode;
            setupEditor(textarea, gutter);
          });

          tipsContainer.appendChild(solBox);
          solutionLoaded = true;
          btnTip.textContent = `Solution Revealed`;
        } catch (err) {
          const errBox = document.createElement('div');
          errBox.className = 'dojo-tip-box';
          errBox.textContent = 'Could not load solution offline.';
          tipsContainer.appendChild(errBox);
          btnTip.textContent = `Show Solution`;
          btnTip.disabled = false;
        }
      }
    });
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
