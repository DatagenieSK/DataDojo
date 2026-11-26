import { test, expect } from '@playwright/test';

test.describe('Part A: Engine Core & Review Checks', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[PAGE ${msg.type()}]`, msg.text()));
    page.on('pageerror', err => console.log('[PAGE ERROR]', err));
  });

  test('1. No Pyodide network request on fresh page load until interaction', async ({ page }) => {
    let pyodideWorkerCreated = false;
    page.on('worker', (worker) => {
      if (worker.url().includes('assets/js/worker.js')) {
        pyodideWorkerCreated = true;
      }
    });

    await page.goto('/DataDojo/');
    await page.waitForLoadState('networkidle');

    // Verify Dojo Pyodide worker was not created on page load
    expect(pyodideWorkerCreated).toBe(false);

    // Now interact with a cell - click Run on the home page demo cell
    const runBtn = page.locator('.dojo-btn-run').first();
    await expect(runBtn).toBeVisible();

    const workerPromise = page.waitForEvent('worker', worker => worker.url().includes('assets/js/worker.js'));
    await runBtn.click();
    await workerPromise;

    // And verify the demo cell produces output
    await expect(page.locator('.dojo-output-content').first()).toContainText('Welcome to DataDojo!', { timeout: 25000 });
  });

  test('2. Infinite loop times out in ~10s, shows friendly message, and next run succeeds', async ({ page }) => {
    test.setTimeout(50000);

    await page.goto('/DataDojo/');
    const editor = page.locator('.dojo-textarea').first();
    const runBtn = page.locator('.dojo-btn-run').first();
    const errorStatus = page.locator('.dojo-output-status.dojo-status-error').first();

    // Enter infinite loop code
    await editor.fill('while True:\n    pass');
    await runBtn.click();

    // Wait for the friendly timeout message from error translator
    await expect(errorStatus).toContainText('Time Limit Reached', { timeout: 25000 });

    // Now verify the next run works immediately because runner restarted worker
    await editor.fill('print("Dojo is back!")');
    await runBtn.click();

    await expect(page.locator('.dojo-output-content').first()).toContainText('Dojo is back!', { timeout: 20000 });
  });

  test('3. Completing white-01-hello updates XP and streak, surviving reload', async ({ page }) => {
    await page.goto('/DataDojo/belts/white/01-hello-dojo/');

    const exerciseCell = page.locator('.dojo-cell[data-type="exercise"][data-id="white-01-hello"]');
    await expect(exerciseCell).toBeVisible();

    const editor = exerciseCell.locator('.dojo-textarea');
    const checkBtn = exerciseCell.locator('.dojo-btn-check');

    // Fill solution
    await editor.fill('name = "Ninja"\nprint("Hello,", name)');
    await checkBtn.click();

    // Verify success feedback
    await expect(exerciseCell.locator('.dojo-feedback-success')).toBeVisible({ timeout: 25000 });

    // Verify HUD reflects 15 XP (10 base + 5 hint-free bonus)
    const hudXp = page.locator('.dojo-hud-xp');
    await expect(hudXp).toContainText('15 XP');

    // Verify streak is 1
    const hudStreak = page.locator('.dojo-hud-streak');
    await expect(hudStreak).toContainText('1');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // HUD and completed state should survive reload
    await expect(page.locator('.dojo-hud-xp')).toContainText('15 XP');
    await expect(page.locator('.dojo-hud-streak')).toContainText('1');
    await expect(exerciseCell.locator('.dojo-badge-completed')).toBeVisible();
  });

  test('4. With localStorage disabled, notice appears and site continues working', async ({ page }) => {
    // Disable localStorage before navigation
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('SecurityError: Access to localStorage is denied.');
        },
      });
    });

    await page.goto('/DataDojo/');

    // Check notice
    const notice = page.locator('.dojo-storage-notice');
    await expect(notice).toBeVisible({ timeout: 10000 });
    await expect(notice).toContainText('Storage is unavailable');

    // Ensure running code still works
    const runBtn = page.locator('.dojo-btn-run').first();
    await runBtn.click();
    await expect(page.locator('.dojo-output-content').first()).toContainText('Welcome to DataDojo!', { timeout: 25000 });
  });
});
