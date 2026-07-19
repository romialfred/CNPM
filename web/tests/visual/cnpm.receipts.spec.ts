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

async function openRegistry(page: Page): Promise<void> {
  await page.goto('/admin/receipts');
  await expect(page.getByRole('heading', { level: 1, name: 'Registre des reçus' })).toBeVisible();
  await expect(page.getByText('12 enregistrements trouvés')).toBeVisible();
}

test('BO-016 — navigation et registre restent strictement consultatifs', async ({ page }) => {
  await openRegistry(page);
  await expect(page.getByRole('link', { name: 'Reçus', exact: true })).toBeVisible();
  await expect(page.locator('table caption')).toContainText('Registre fictif');
  await expect(
    page.getByRole('button', { name: /Émettre|Annuler|Télécharger|Vérifier/ }),
  ).toHaveCount(0);
  await expect(page.locator('.cnpm-receipts a[download]')).toHaveCount(0);
  await expect(page.locator('.cnpm-receipts img, .cnpm-receipts canvas')).toHaveCount(0);
  await expectNoAxeViolation(page);
});

test('BO-016 — filtres et tri sont partageables par URL', async ({ page }) => {
  await openRegistry(page);
  await page.getByLabel('Statut', { exact: true }).selectOption('CANCELLED');
  await expect(page).toHaveURL(/statut=CANCELLED/);
  await expect(page.getByText('3 enregistrements trouvés')).toBeVisible();

  await page.getByLabel('Canal de paiement').selectOption('BANK_TRANSFER');
  await expect(page).toHaveURL(/canal=BANK_TRANSFER/);
  await expect(page.getByText('1 enregistrement trouvé')).toBeVisible();

  await page.getByLabel('Trier par').selectOption('amount:asc');
  await expect(page).toHaveURL(/tri=amount/);
  await expect(page).toHaveURL(/ordre=asc/);
  await expectNoAxeViolation(page);
});

test('BO-016 — pagination clavier et provenance fictive', async ({ page }) => {
  await openRegistry(page);
  await expect(page.getByText('Confirmation fictive :').first()).toBeVisible();

  const next = page.getByRole('button', { name: 'Page 2', exact: true });
  await next.focus();
  await expect(next).toBeFocused();
  await next.press('Enter');
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.cnpm-pagination__range')).toContainText('11–12 sur 12');
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`BO-016 — reflow sans débordement à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openRegistry(page);
    await expect(page.locator('.cnpm-receipts__table')).toBeHidden();
    await expect(page.locator('.cnpm-receipts__cards > li').first()).toBeVisible();
    const apply = page.getByRole('button', { name: 'Appliquer' });
    const box = await apply.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
  });
}

test('BO-016 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openRegistry(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});
