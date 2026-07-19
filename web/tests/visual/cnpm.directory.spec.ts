import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoAxeViolation(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('PUB-004 / PUB-005 — annuaire public', () => {
  test('présente uniquement les vitrines publiées et ouvre PUB-006', async ({ page }) => {
    await page.goto('/membres');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Découvrir les membres' }),
    ).toBeVisible();
    await expect(page.getByText('Données entièrement fictives de démonstration.')).toBeVisible();
    await expect(page.getByText('Coopérative Démo — brouillon fictif')).toHaveCount(0);

    const firstCard = page.locator('.cnpm-directory__card').first();
    await expect(firstCard.getByText('Profil fictif de démonstration')).toBeVisible();
    await expect(firstCard.locator('img')).toHaveCount(0);
    await firstCard.getByRole('link', { name: /Voir la vitrine de/ }).click();
    await expect(page).toHaveURL(/\/membres\/atelier-kanu-demonstration$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Atelier Kanu — démonstration' }),
    ).toBeVisible();
  });

  test('conserve q, sector, page et pageSize dans une URL partageable', async ({ page }) => {
    await page.goto('/membres/recherche?pageSize=6');
    await page.getByRole('button', { name: 'Page 2' }).click();
    await expect(page).toHaveURL(/page=1/);
    await page.getByLabel('Nom, activité ou localisation').fill('Kanu');
    await page.getByLabel('Secteur').fill('Services numériques');
    await page.getByRole('button', { name: 'Rechercher' }).click();

    await expect(page).toHaveURL(/q=Kanu/);
    await expect(page).toHaveURL(/sector=Services(%20|\+)num%C3%A9riques/);
    await expect(page).toHaveURL(/pageSize=6/);
    await expect(page).not.toHaveURL(/page=1/);
    await expect(page.getByText('Atelier Kanu — démonstration')).toBeVisible();
    await expect(page.getByText('1 membre publié')).toBeVisible();
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
    await page.goto('/membres/recherche?q=kanu');
    await expect(page.getByText('Atelier Kanu — démonstration')).toBeVisible();
    await expectNoAxeViolation(page);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });

  test('restaure le focus sur les résultats après pagination', async ({ page }) => {
    await page.goto('/membres/recherche?pageSize=6');
    await page.getByRole('button', { name: 'Page 2' }).click();
    await expect(page).toHaveURL(/page=1/);
    await expect(page.locator('#resultats-titre')).toBeFocused();
  });

  for (const width of [320, 360]) {
    test(`reste utilisable sans débordement horizontal à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/membres/recherche');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Rechercher un membre' }),
      ).toBeVisible();
      await expect(page.locator('.cnpm-directory__card').first()).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test('conserve le reflow avec un zoom CSS à 200 %', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/membres/recherche');
    await page.addStyleTag({ content: 'html { zoom: 2; }' });
    await expect(page.getByRole('heading', { level: 1, name: 'Rechercher un membre' })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
});
