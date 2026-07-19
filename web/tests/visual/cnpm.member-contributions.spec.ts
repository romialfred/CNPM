import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoAxeViolation(page: Page): Promise<void> {
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(report.violations).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function openList(page: Page): Promise<void> {
  await page.goto('/member/contributions?taille=3');
  await expect(page.getByRole('heading', { level: 1, name: 'Mes cotisations' })).toBeVisible();
  await expect(page.getByText('6 cotisations fictives')).toBeVisible();
}

test('MP-002 — données fictives, URL partageable, pagination et focus', async ({ page }) => {
  await openList(page);
  await expect(page.locator('.member-contributions__desktop-table')).toBeVisible();
  await expect(page.locator('table caption')).toContainText('Cotisations fictives');
  await expect(page.getByText('Démonstration — données 100 % fictives')).toBeVisible();

  await page.getByLabel('Statut', { exact: true }).selectOption('REGLEE');
  await page.getByLabel('Exercice', { exact: true }).selectOption('2025');
  await page.getByLabel('Trier par', { exact: true }).selectOption('reference');
  await page.getByLabel('Ordre', { exact: true }).selectOption('asc');
  await page.getByRole('button', { name: 'Appliquer' }).click();
  await expect(page).toHaveURL(/statut=REGLEE/);
  await expect(page).toHaveURL(/exercice=2025/);
  await expect(page).toHaveURL(/tri=reference/);
  await expect(page).toHaveURL(/ordre=asc/);
  await expect(page.getByText('1 cotisation fictive')).toBeVisible();
  await expect(page.locator('#contributions-results-title')).toBeFocused();

  await page.getByRole('button', { name: 'Réinitialiser tous les filtres' }).click();
  await expect(page.getByText('6 cotisations fictives')).toBeVisible();
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('#contributions-results-title')).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`MP-002 — fiches sans débordement à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openList(page);
    await expect(page.locator('.member-contributions__desktop-table')).toBeHidden();
    await expect(page.locator('.member-contributions__mobile-list')).toBeVisible();
    const link = page.locator('.member-contributions__mobile-list').getByRole('link').first();
    expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
  });
}

test('MP-002 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openList(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});

test('MP-003 — détail, échéancier et actions sensibles neutralisées', async ({ page }) => {
  await page.goto('/member/contributions/demo-contribution-2026-01?page=2&taille=3');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Détail de la cotisation' }),
  ).toBeFocused();
  await expect(page.getByRole('heading', { level: 2, name: 'DEMO-COT-2026-001' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Échéancier fictif' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Ajustements explicités' }),
  ).toBeVisible();
  await expect(page.getByText(/ne sont pas recomposées/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Télécharger l’appel' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Payer en ligne' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.getByText(/DEC-008/).first()).toBeVisible();
  await expect(page.getByText(/DEC-005/)).toBeVisible();
  await expect(page.locator('.member-contribution-detail__back')).toHaveAttribute('href', /page=2/);
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});

test('MP-003 — état introuvable explicite', async ({ page }) => {
  await page.goto('/member/contributions/absente');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Cotisation introuvable' }),
  ).toBeVisible();
  await expectNoAxeViolation(page);
});
