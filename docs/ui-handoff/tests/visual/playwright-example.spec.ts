import { expect, test } from '@playwright/test';

test('BO-002 liste des membres', async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto('/admin/members?visualTest=1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('body')).toHaveScreenshot('BO-002.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.005,
  });
});
