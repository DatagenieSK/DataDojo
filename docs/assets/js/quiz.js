/**
 * DataDojo Interactive Quiz Cell Component
 * Multiple choice check with radio group semantics, deterministic shuffle, and aria-live feedback.
 */

export function deterministicShuffle(arr, seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    h = Math.imul(1664525, h) + 1013904223 | 0;
    const r = ((h >>> 0) / 4294967296);
    const j = Math.floor(r * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function initQuiz(container, options = {}) {
  const { progressStore, onQuizComplete } = options;
  const quizId = container.dataset.id || 'quiz';
  const xpReward = parseInt(container.dataset.xp || '5', 10);
  let questions = [];

  try {
    questions = JSON.parse(container.dataset.quiz || '[]');
  } catch (e) {
    console.error('Failed to parse quiz questions', e);
    return;
  }

  if (!questions.length) return;

  const isAlreadyCompleted = progressStore ? progressStore.isCompleted(quizId) : false;
  const answeredCorrectly = new Set();

  let html = `
    <div class="dojo-quiz-wrapper" role="region" aria-label="Quick Check Quiz">
      <div class="dojo-quiz-header">
        <div class="dojo-quiz-title">
          <span class="quiz-icon">🎯</span> <strong>Quick Check</strong>
          <span class="dojo-quiz-xp-badge">+${xpReward} XP</span>
          <span class="dojo-badge-completed" style="display: ${isAlreadyCompleted ? 'inline-flex' : 'none'};">✅ Completed</span>
        </div>
      </div>
      <div class="dojo-quiz-questions">
  `;

  questions.forEach((q, qIdx) => {
    // Deterministic shuffle keyed on quizId and question index
    const shuffledOptions = deterministicShuffle(q.options, `${quizId}-q${qIdx}`);
    const qName = `${quizId}_q${qIdx}`;

    html += `
      <div class="dojo-quiz-question-card" data-q-idx="${qIdx}" role="radiogroup" aria-labelledby="${qName}_label">
        <div class="dojo-quiz-q-text" id="${qName}_label">
          <strong>${qIdx + 1}.</strong> ${escapeHtml(q.question)}
        </div>
        <div class="dojo-quiz-options">
    `;

    shuffledOptions.forEach((opt, optIdx) => {
      const optId = `${qName}_opt${optIdx}`;
      html += `
        <label class="dojo-quiz-option-label" for="${optId}">
          <input
            type="radio"
            id="${optId}"
            name="${qName}"
            value="${opt.correct ? '1' : '0'}"
            data-correct="${opt.correct}"
            data-explanation="${escapeHtml(q.explanation || '')}"
            class="dojo-quiz-radio"
          />
          <span class="dojo-quiz-opt-text">${escapeHtml(opt.text)}</span>
        </label>
      `;
    });

    html += `
        </div>
        <div class="dojo-quiz-feedback" aria-live="polite"></div>
      </div>
    `;
  });

  html += `
      </div>
      <div class="dojo-quiz-footer" style="display: none;" aria-live="polite">
        <div class="dojo-feedback-card dojo-feedback-success">
          <strong>🥋 Quick Check Completed!</strong>
          <p>Great focus. You earned +${xpReward} XP for reviewing these concepts.</p>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Add event listeners
  const questionCards = container.querySelectorAll('.dojo-quiz-question-card');
  const footerEl = container.querySelector('.dojo-quiz-footer');
  const badgeEl = container.querySelector('.dojo-badge-completed');

  questionCards.forEach((card) => {
    const qIdx = parseInt(card.dataset.qIdx, 10);
    const feedbackEl = card.querySelector('.dojo-quiz-feedback');
    const radios = card.querySelectorAll('.dojo-quiz-radio');

    radios.forEach((radio) => {
      radio.addEventListener('change', () => {
        const isCorrect = radio.dataset.correct === 'true';
        const explanation = radio.dataset.explanation || '';

        // Reset option styles
        card.querySelectorAll('.dojo-quiz-option-label').forEach((lbl) => {
          lbl.classList.remove('is-selected', 'is-correct', 'is-wrong');
        });

        const label = radio.closest('.dojo-quiz-option-label');
        if (label) label.classList.add('is-selected');

        if (isCorrect) {
          if (label) label.classList.add('is-correct');
          feedbackEl.className = 'dojo-quiz-feedback feedback-correct';
          feedbackEl.innerHTML = `
            <span>🥋 <strong>Correct!</strong> ${explanation}</span>
          `;
          answeredCorrectly.add(qIdx);

          // Check if all questions are answered correctly
          if (answeredCorrectly.size === questions.length) {
            footerEl.style.display = 'block';
            if (badgeEl) badgeEl.style.display = 'inline-flex';

            if (progressStore) {
              const res = progressStore.completeQuiz(quizId, xpReward);
              if (onQuizComplete) {
                onQuizComplete({ id: quizId, earnedXp: res.addedXp, firstTime: res.firstCompletion });
              }
            }
          }
        } else {
          if (label) label.classList.add('is-wrong');
          feedbackEl.className = 'dojo-quiz-feedback feedback-wrong';
          feedbackEl.innerHTML = `
            <span>Not quite. Have another look and try again!</span>
          `;
          answeredCorrectly.delete(qIdx);
        }
      });
    });
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
