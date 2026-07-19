import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CONTACTS_URL = '/admin/organizations/10000000-0000-4000-8000-000000000001/contacts';
const CAPTURE_DIR = process.env.CNPM_CONTACTS_CAPTURE_DIR;

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

test('BO-007 — contacts fictifs, action neutralisée et filtres partageables', async ({ page }) => {
  await page.goto(CONTACTS_URL);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Contacts de l’entreprise' }),
  ).toBeVisible();
  await expect(page.getByText('Ateliers Nimba Démonstration')).toBeVisible();
  await expect(page.getByText('Contact Direction Démo').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ajouter un contact' })).toBeDisabled();
  await page.locator('#contact-role').selectOption('FINANCE');
  await page.getByRole('button', { name: 'Filtrer' }).click();
  await expect(page).toHaveURL(/role=FINANCE/);
  await expect(page.getByText('Contact Finance Démo').first()).toBeVisible();
  await expect(page.getByText('1 contact affiché sur 5')).toBeVisible();
  await expectAccessible(page);
});

for (const viewport of [
  { width: 320, height: 900 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1672, height: 941 },
]) {
  test(`BO-007 — reflow ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(CONTACTS_URL);
    await expect(page.getByText('5 contacts affichés sur 5')).toBeVisible();
    await expectNoOverflow(page);
    await expectAccessible(page);
    if (CAPTURE_DIR && (viewport.width === 390 || viewport.width === 1672)) {
      const target = path.resolve(CAPTURE_DIR);
      await mkdir(target, { recursive: true });
      await page.screenshot({
        path: path.join(target, `BO-007-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      });
    }
  });
}

test('BO-007 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto(CONTACTS_URL);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.getByText('5 contacts affichés sur 5')).toBeVisible();
  await expectNoOverflow(page);
  await expectAccessible(page);
});
