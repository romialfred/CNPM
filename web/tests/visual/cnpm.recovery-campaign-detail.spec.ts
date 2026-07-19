import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CAPTURE_DIR = process.env.CNPM_RECOVERY_DETAIL_CAPTURE_DIR;

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

test('BO-018 — ouvre la fiche depuis BO-017 et reste consultatif', async ({ page }) => {
  await page.goto('/admin/recovery/campaigns');
  await expect(page.getByRole('heading', { level: 1, name: 'Campagnes de relance' })).toBeVisible();
  await page
    .locator('.cnpm-recovery__table-link')
    .filter({ hasText: 'Voir la fiche' })
    .first()
    .click();

  await expect(page).toHaveURL(/\/admin\/recovery\/campaigns\/CMP-001$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Détail d’une campagne' }),
  ).toBeVisible();
  await expect(page.getByText('REL-2026-001')).toBeVisible();
  await expect(page.getByText('Contrôles appliqués')).toBeVisible();
  await expect(page.getByText('Actions de recouvrement non disponibles')).toBeVisible();
  await expect(
    page.locator('.campaign-detail').getByRole('button', {
      name: /Lancer|Envoyer|Planifier|Suspendre|Reprendre|Valider/,
    }),
  ).toHaveCount(0);
  await expectAccessible(page);
});

test('BO-018 — rend explicitement une campagne absente', async ({ page }) => {
  await page.goto('/admin/recovery/campaigns/CMP-ABSENTE');
  await expect(page.getByRole('heading', { level: 2, name: 'Campagne introuvable' })).toBeVisible();
  await expectAccessible(page);
});

for (const width of [320, 360]) {
  test(`BO-018 — reflow sans débordement à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin/recovery/campaigns/CMP-002');
    await expect(page.getByText('REL-2026-002')).toBeVisible();
    await expectNoOverflow(page);
    await expectAccessible(page);
  });
}

test('BO-018 — reste utilisable au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/admin/recovery/campaigns/CMP-006');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoOverflow(page);
  await expectAccessible(page);
});

test('BO-018 — produit une capture de revue si demandée', async ({ page }) => {
  test.skip(!CAPTURE_DIR, 'CNPM_RECOVERY_DETAIL_CAPTURE_DIR non défini');
  const target = path.resolve(CAPTURE_DIR!);
  await mkdir(target, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/recovery/campaigns/CMP-002');
  await expect(page.getByText('REL-2026-002')).toBeVisible();
  await page.screenshot({ path: path.join(target, 'BO-018-1440x900.png'), fullPage: true });
});
