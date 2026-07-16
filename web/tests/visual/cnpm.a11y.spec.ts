import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
for (const route of ['/auth/login', '/', '/membres/somacop-sa', '/admin/members']) {
  test(`axe ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(blocking).toEqual([]);
  });
}
