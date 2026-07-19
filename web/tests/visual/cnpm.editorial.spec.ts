import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoAxeViolation(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('PUB-009 / PUB-010 / PUB-011 — actualités et agenda', () => {
  test('filtre les actualités via une URL partageable et ouvre le détail', async ({ page }) => {
    await page.goto('/actualites');
    await expect(page.getByRole('heading', { level: 1, name: 'Actualités de démonstration' })).toBeVisible();
    await expect(page.getByText('Contenus 100 % fictifs')).toBeVisible();

    await page.getByLabel('Rechercher').fill('portail');
    await page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(page).toHaveURL(/q=portail/);
    await expect(page.locator('.news-card')).toHaveCount(1);

    await page.locator('.news-card h3 a').click();
    await expect(page).toHaveURL(/\/actualites\/portail-membre-reperes$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.getByText('workflow éditorial EVT-004')).toBeVisible();
    await expect(page.locator('.editorial-article img')).toHaveCount(0);
  });

  test('rend un agenda fictif sans inscription ni appel réseau', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) apiRequests.push(request.url());
    });

    await page.goto('/agenda');
    await expect(page.getByRole('heading', { level: 1, name: 'Agenda de démonstration' })).toBeVisible();
    await expect(page.locator('.event-card')).toHaveCount(3);
    await expect(page.getByText('Inscription non ouverte')).toHaveCount(3);
    await expect(page.locator('.event-card a, .event-card button')).toHaveCount(0);
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

    await page.goto('/actualites');
    await expect(page.locator('.news-card').first()).toBeVisible();
    await expectNoAxeViolation(page);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });

  for (const width of [320, 360]) {
    test(`reste utilisable sans débordement horizontal à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/agenda');
      await expect(page.locator('.event-card').first()).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test('conserve le reflow avec un zoom CSS à 200 %', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/actualites');
    await page.addStyleTag({ content: 'html { zoom: 2; }' });
    await expect(page.locator('.news-card').first()).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
});
