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

async function openAudit(page: Page): Promise<void> {
  await page.goto('/admin/security/audit?size=10');
  await expect(page.getByRole('heading', { level: 1, name: 'Journaux d’audit' })).toBeVisible();
  await expect(page.getByText('12 événements')).toBeVisible();
}

async function openSettings(page: Page): Promise<void> {
  await page.goto('/admin/settings');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Paramétrage fonctionnel' }),
  ).toBeVisible();
  await expect(page.getByText('3 valeurs trouvées')).toBeVisible();
}

test('BO-032 — lecture seule, pagination et focus accessibles', async ({ page }) => {
  await openAudit(page);
  await expect(page.locator('.cnpm-audit__desktop-table')).toBeVisible();
  await expect(page.locator('table caption')).toContainText('Journaux d’audit');
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('#journal-audit-title')).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`BO-032 — fiches sans débordement à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openAudit(page);
    await expect(page.locator('.cnpm-audit__desktop-table')).toBeHidden();
    await expect(page.locator('.cnpm-audit__mobile-list')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
  });
}

test('BO-032 — reflow à zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openAudit(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});

test('BO-033 — permissions d’écriture, focus et champs requis', async ({ page }) => {
  await openSettings(page);
  await expect(page.locator('.cnpm-settings__table')).toBeVisible();
  const create = page.getByRole('button', { name: 'Créer une valeur' });
  await create.click();
  await expect(page.locator('#settings-editor-title')).toBeFocused();
  await expect(page.locator('#settings-domain')).toHaveAttribute('required', '');
  await expect(page.locator('#settings-code')).toHaveAttribute('required', '');
  await expect(page.locator('#settings-label')).toHaveAttribute('required', '');
  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(create).toBeFocused();
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`BO-033 — fiches et actions tactiles à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openSettings(page);
    await expect(page.locator('.cnpm-settings__table')).toBeHidden();
    const card = page.locator('.cnpm-settings__cards > li').first();
    await expect(card).toBeVisible();
    const action = card.getByRole('button', { name: 'Modifier cette valeur' });
    const box = await action.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
  });
}

test('BO-033 — reflow à zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openSettings(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});
