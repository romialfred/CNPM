import { expect, test } from '@playwright/test';
const screens = [
  { id: 'AUTH-001', route: '/auth/login' },
  { id: 'PUB-001', route: '/' },
  { id: 'PUB-006', route: '/membres/somacop-sa' },
  { id: 'BO-002', route: '/admin/members' },
];
for (const screen of screens) {
  test(`${screen.id} visual baseline`, async ({ page }) => {
    await page.addInitScript(() => {
      const fixed = new Date('2024-05-27T12:00:00Z').valueOf();
      const RealDate = Date;
      // @ts-expect-error deterministic visual clock
      window.Date = class extends RealDate { constructor(...args: unknown[]) { super(...(args.length ? args : [fixed]) as []); } static now() { return fixed; } };
    });
    await page.goto(`${screen.route}?visualTest=1`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('body')).toHaveScreenshot(`${screen.id}.png`, {
      animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.005,
    });
  });
}
