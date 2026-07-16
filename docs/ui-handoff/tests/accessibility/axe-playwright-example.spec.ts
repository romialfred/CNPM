import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('PUB-006 vitrine membre sans violation bloquante', async ({ page }) => {
  await page.goto('/membres/somacop-sa');
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''));
  expect(blocking).toEqual([]);
});
