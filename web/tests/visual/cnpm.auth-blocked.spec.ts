import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  ['/auth/verify/method', 'Choix de la méthode 2FA', 'AUTH-003'],
  ['/auth/forgot-password', 'Mot de passe oublié', 'AUTH-004'],
  ['/auth/reset-password', 'Réinitialiser le mot de passe', 'AUTH-005'],
  ['/auth/activate', 'Activation du compte', 'AUTH-006'],
  ['/auth/2fa-enrollment', 'Enrôlement 2FA', 'AUTH-007'],
] as const;

for (const [route, title, screenId] of routes) {
  test(`${screenId} — état fermé sans opération sensible`, async ({ page }) => {
    await page.goto(route);

    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByText(`Référence ${screenId}`)).toBeVisible();
    await expect(page.locator('form, input, button')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Retour à la connexion' })).toHaveAttribute(
      'href',
      '/auth/login',
    );

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('AUTH bloqué — reflow sans débordement à 320 px et zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/auth/forgot-password');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);

  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});
