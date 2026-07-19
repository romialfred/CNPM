import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const DEMO_CODE = 'DEMO-VERIF-2026-001';

async function expectNoAxeViolation(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('PUB-015 / REC-006 — vérification publique limitée', () => {
  test('rend uniquement un aperçu fictif minimal et sans appel API', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) apiRequests.push(request.url());
    });
    await page.goto(`/verification/${DEMO_CODE}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.getByText('Aperçu valide — démonstration')).toBeVisible();
    await expect(page.getByText('Non exposée')).toBeVisible();
    await expect(page.locator('.verification-result img, .verification-result canvas')).toHaveCount(0);
    await expect(page.getByText('Démonstration non probante')).toBeVisible();
    expect(apiRequests).toEqual([]);
  });

  test('normalise la saisie et ne révèle rien pour un code inconnu', async ({ page }) => {
    await page.goto(`/verification/${DEMO_CODE}`);
    await page.getByLabel('Code de vérification').fill(' code-inconnu ');
    await page.getByRole('button', { name: 'Vérifier cet aperçu' }).click();
    await expect(page).toHaveURL(/\/verification\/CODE-INCONNU$/);
    await expect(page.getByText('Aucun aperçu correspondant')).toBeVisible();
    await expect(page.locator('.verification-facts')).toHaveCount(0);
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
    await page.goto(`/verification/${DEMO_CODE}`);
    await expect(page.locator('.verification-success')).toBeVisible();
    await expectNoAxeViolation(page);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });

  for (const width of [320, 360]) {
    test(`reste utilisable sans débordement horizontal à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/verification/${DEMO_CODE}`);
      await expect(page.locator('.verification-success')).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test('conserve le reflow avec un zoom CSS à 200 %', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/verification/${DEMO_CODE}`);
    await page.addStyleTag({ content: 'html { zoom: 2; }' });
    await expect(page.locator('.verification-success')).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
});
