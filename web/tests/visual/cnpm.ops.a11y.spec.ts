import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SCREENS = [
  { route: '/admin/recovery/campaigns', heading: 'Campagnes de relance' },
  { route: '/admin/reporting', heading: 'Reporting décisionnel' },
  { route: '/admin/security/users', heading: 'Administration et sécurité' },
] as const;

for (const screen of SCREENS) {
  test(`axe ${screen.route} — aucune violation bloquante`, async ({ page }) => {
    await page.goto(screen.route);
    await expect(page.getByRole('heading', { level: 1, name: screen.heading })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    );
    expect(blocking).toEqual([]);
  });
}
