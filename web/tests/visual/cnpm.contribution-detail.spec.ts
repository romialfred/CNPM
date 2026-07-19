import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CAPTURE_DIR = process.env.CNPM_CONTRIBUTION_DETAIL_CAPTURE_DIR;

async function expectAccessible(page: Page): Promise<void> {
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(report.violations).toEqual([]);
}

async function expectNoOverflow(page: Page): Promise<void> {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
}

test('BO-013 — ouvre la fiche canonique depuis BO-011 et reste consultatif', async ({
  page,
}) => {
  await page.goto('/admin/contributions');
  await expect(page.getByRole('heading', { level: 1, name: 'Cotisations' })).toBeVisible();
  await page
    .locator('.cnpm-contributions__detail')
    .getByRole('link', { name: 'Ouvrir la fiche complète' })
    .click();

  await expect(page).toHaveURL(/\/admin\/contributions\/call-0001$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Détail d’une cotisation' })).toBeVisible();
  await expect(page.getByText('APP-2024-T1-0001')).toBeVisible();
  await expect(page.getByText(/appelé =/)).toBeVisible();
  await expect(page.getByText('Actions financières non disponibles')).toBeVisible();
  await expect(
    page.locator('.contribution-detail').getByRole('button', {
      name: /Émettre|Annuler|Relancer|Payer|Générer|Télécharger/,
    }),
  ).toHaveCount(0);
  await expectAccessible(page);
});

test('BO-013 — rend explicitement une référence absente', async ({ page }) => {
  await page.goto('/admin/contributions/call-absent');
  await expect(page.getByRole('heading', { level: 2, name: 'Cotisation introuvable' })).toBeVisible();
  await expectAccessible(page);
});

for (const width of [320, 360]) {
  test(`BO-013 — reflow sans débordement à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin/contributions/call-0002');
    await expect(page.getByText('APP-2024-T1-0002')).toBeVisible();
    await expectNoOverflow(page);
    await expectAccessible(page);
  });
}

test('BO-013 — reste utilisable au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/admin/contributions/call-0005');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoOverflow(page);
  await expectAccessible(page);
});

test('BO-013 — produit une capture de revue si demandée', async ({ page }) => {
  test.skip(!CAPTURE_DIR, 'CNPM_CONTRIBUTION_DETAIL_CAPTURE_DIR non défini');
  const target = path.resolve(CAPTURE_DIR!);
  await mkdir(target, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/contributions/call-0002');
  await expect(page.getByText('APP-2024-T1-0002')).toBeVisible();
  await page.screenshot({ path: path.join(target, 'BO-013-1440x900.png'), fullPage: true });
});
