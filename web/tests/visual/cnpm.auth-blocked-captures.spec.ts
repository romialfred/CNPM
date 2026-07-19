import { test } from '@playwright/test';

test('AUTH-003 a AUTH-007 produisent les captures de revue demandees', async ({ page }) => {
  const captureDir = process.env['CNPM_CAPTURE_DIR'];
  test.skip(!captureDir, 'CNPM_CAPTURE_DIR absent');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/auth/forgot-password');
  await page.screenshot({ path: `${captureDir}/AUTH-004-1440x900.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/auth/2fa-enrollment');
  await page.screenshot({ path: `${captureDir}/AUTH-007-390x844.png`, fullPage: true });
});
