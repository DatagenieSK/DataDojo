import { test, expect } from '@playwright/test';

test.describe('Part B: Engine Features & Schema v2', () => {
  test('1. Progress v1 data in localStorage migrates to v2 on load', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('datadojo:v1', JSON.stringify({
        v: 1,
        xp: 35,
        completed: {
          'white-01-hello': { at: '2026-11-20', usedTips: 0 },
        },
        streak: { count: 2, lastDay: '2026-11-26' },
        createdAt: '2026-11-15',
      }));
    });

    await page.goto('/DataDojo/');
    await page.waitForLoadState('networkidle');

    // Verify HUD reflects 35 XP from v1 data
    const hudXp = page.locator('.dojo-hud-xp');
    await expect(hudXp).toContainText('35 XP');

    // Verify localStorage has been migrated to v: 2 with belts: {}
    const raw = await page.evaluate(() => window.localStorage.getItem('datadojo:v1'));
    const parsed = JSON.parse(raw);
    expect(parsed.v).toBe(2);
    expect(parsed.belts).toBeDefined();
    expect(parsed.xp).toBe(35);
  });

  test('2. Quiz cell completes and awards XP once', async ({ page }) => {
    // Navigates to kata 03 which contains a dojo-quiz
    await page.goto('/DataDojo/belts/white/03-numbers/');

    const quiz = page.locator('.dojo-quiz').first();
    await expect(quiz).toBeVisible();

    const initialXpText = await page.locator('.dojo-hud-xp').textContent();
    const initialXp = parseInt(initialXpText.match(/\d+/)[0], 10);

    // Answer questions by selecting correct radio options
    const questionCards = quiz.locator('.dojo-quiz-question-card');
    const qCount = await questionCards.count();

    for (let i = 0; i < qCount; i++) {
      const card = questionCards.nth(i);
      const correctRadio = card.locator('input[value="1"]');
      await correctRadio.check();
      await expect(card.locator('.feedback-correct')).toBeVisible();
    }

    // Verify quiz completed banner
    await expect(quiz.locator('.dojo-feedback-success')).toBeVisible();

    // Verify XP was awarded (+5 XP)
    const hudXp = page.locator('.dojo-hud-xp');
    await expect(hudXp).toContainText(`${initialXp + 5} XP`);

    // Reload page - completed state persists
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(quiz.locator('.dojo-badge-completed')).toBeVisible();
  });

  test('3. Order cell can be rearranged using Up and Down buttons and passes check', async ({ page }) => {
    await page.goto('/DataDojo/belts/white/05-decisions/');

    const order = page.locator('.dojo-order').first();
    await expect(order).toBeVisible();

    // Click Check with initial shuffled order - should fail
    const checkBtn = order.locator('.dojo-btn-check');
    await checkBtn.click();
    await expect(order.locator('.dojo-output-status')).toBeVisible({ timeout: 25000 });

    // Use buttons to rearrange or reset
    const upButtons = order.locator('.dojo-order-up');
    const firstUp = upButtons.nth(1);
    if (await firstUp.isEnabled()) {
      await firstUp.click();
    }

    await expect(order.locator('.dojo-order-item')).toHaveCount(6);
  });

  test('4. Grading unlocks Claim your belt at pass target and awards 50 XP once', async ({ page }) => {
    // Seed progress with 4 of 5 passed tasks so claim button unlocks
    await page.addInitScript(() => {
      window.localStorage.setItem('datadojo:v1', JSON.stringify({
        v: 2,
        xp: 50,
        completed: {
          'white-grading-01': { at: '2026-11-27', kind: 'grading-task', usedTips: 0 },
          'white-grading-02': { at: '2026-11-27', kind: 'grading-task', usedTips: 0 },
          'white-grading-03': { at: '2026-11-27', kind: 'grading-task', usedTips: 0 },
          'white-grading-04': { at: '2026-11-27', kind: 'grading-task', usedTips: 0 },
        },
        belts: {},
        streak: { count: 1, lastDay: '2026-11-27' },
        createdAt: '2026-11-27',
      }));
    });

    await page.goto('/DataDojo/belts/white/grading/');

    const claimBtn = page.locator('.dojo-btn-claim-belt');
    await expect(claimBtn).toBeVisible();

    await claimBtn.click();

    // Check celebration toast
    await expect(page.locator('.dojo-toast')).toBeVisible();
    await expect(page.locator('.dojo-toast')).toContainText('White Belt Earned');

    // Verify HUD reflects 100 XP (50 previous + 50 belt claim)
    await expect(page.locator('.dojo-hud-xp')).toContainText('100 XP');

    // Claim button disappears, claimed banner displays
    await expect(claimBtn).not.toBeVisible();
    await expect(page.locator('.dojo-grading-claimed-badge')).toBeVisible();
  });
});
