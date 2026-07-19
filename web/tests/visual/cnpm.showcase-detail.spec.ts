import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const MEMBER_SLUG = 'atelier-kanu-demonstration';
const PROJECT_ID = 'parcours-pilote-2026';

async function expectNoAxeViolation(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('PUB-007 / PUB-008 — détail de vitrine', () => {
  test('n’appelle aucune API R4 et ouvre une réalisation par son URL stable', async ({ page }) => {
    const apiRequests: string[] = [];
    const consoleErrors: string[] = [];
    const httpErrors: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/')) {
        apiRequests.push(request.url());
      }
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        httpErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(`/membres/${MEMBER_SLUG}/activites`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Activités et réalisations' }),
    ).toBeVisible();
    await expect(page.getByText('Diagnostic pilote fictif')).toBeVisible();
    await expect(page.locator('.cnpm-showcase-detail__content img')).toHaveCount(0);

    const projectLink = page.getByRole('link', {
      name: 'Consulter Parcours pilote 2026 — réalisation fictive',
    });
    await projectLink.focus();
    await expect(projectLink).toBeFocused();
    const outline = await projectLink.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe('none');
    await projectLink.click();

    await expect(page).toHaveURL(new RegExp(`/membres/${MEMBER_SLUG}/realisations/${PROJECT_ID}$`));
    const projectTitle = page.getByRole('heading', {
      level: 1,
      name: 'Parcours pilote 2026 — réalisation fictive',
    });
    await expect(projectTitle).toBeVisible();
    await expect(projectTitle).toBeFocused();
    await expect(page.getByText('Illustration vectorielle — aucune photographie')).toBeVisible();
    expect(apiRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(httpErrors).toEqual([]);
  });

  test('distingue vitrine non publiée, vitrine absente et réalisation absente', async ({
    page,
  }) => {
    await page.goto('/membres/cooperative-demo-brouillon/activites');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Vitrine non publiée' }),
    ).toBeVisible();

    await page.goto('/membres/vitrine-fictive-inconnue/activites');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Vitrine introuvable' }),
    ).toBeVisible();

    await page.goto(`/membres/${MEMBER_SLUG}/realisations/inconnue`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Réalisation introuvable' }),
    ).toBeVisible();
  });

  for (const route of [
    `/membres/${MEMBER_SLUG}/activites`,
    `/membres/${MEMBER_SLUG}/realisations/${PROJECT_ID}`,
  ]) {
    test(`axe sans aucune violation sur ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoAxeViolation(page);
    });
  }

  for (const width of [320, 360]) {
    test(`reflow sans débordement à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/membres/${MEMBER_SLUG}/activites`);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Activités et réalisations' }),
      ).toBeVisible();
      const activitiesDimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(activitiesDimensions.scrollWidth).toBeLessThanOrEqual(
        activitiesDimensions.clientWidth,
      );

      await page.goto(`/membres/${MEMBER_SLUG}/realisations/${PROJECT_ID}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const projectDimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(projectDimensions.scrollWidth).toBeLessThanOrEqual(projectDimensions.clientWidth);
    });
  }

  test('reste lisible à 200 % sans débordement horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/membres/${MEMBER_SLUG}/realisations/${PROJECT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    await expect(
      page.getByRole('link', { name: 'Retour aux activités et réalisations' }),
    ).toBeVisible();
  });
});
