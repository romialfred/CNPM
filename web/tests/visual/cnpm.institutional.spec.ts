import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoAxeViolation(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('PUB-002 / PUB-003 — présentation et services', () => {
  test('relie les deux pages depuis la navigation publique', async ({ page }) => {
    await page.goto('/le-cnpm');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.locator('.role-card')).toHaveCount(4);

    await page.getByRole('link', { name: 'Voir les services' }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.locator('.service-card')).toHaveCount(6);
  });

  test('n’invente aucune mutation et conserve des destinations réelles', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) apiRequests.push(request.url());
    });
    await page.goto('/services');
    await expect(page.getByText('ne remplace aucun texte statutaire')).toBeVisible();
    await expect(
      page.locator('#contenu-principal').getByRole('link', { name: 'Accéder au portail membre' }),
    ).toHaveAttribute('href', '/auth/login');
    expect(apiRequests).toEqual([]);
  });

  test('ne présente aucune violation axe ni erreur d’exécution', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });
    await page.goto('/le-cnpm');
    await expect(page.locator('.role-card').first()).toBeVisible();
    await expectNoAxeViolation(page);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });

  for (const width of [320, 360]) {
    test(`reste utilisable sans débordement horizontal à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/services');
      await expect(page.locator('.service-card').first()).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test('conserve le reflow avec un zoom CSS à 200 %', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/le-cnpm');
    await page.addStyleTag({ content: 'html { zoom: 2; }' });
    await expect(page.locator('.role-card').first()).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
});
