import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CAPTURE_DIR = process.env.CNPM_ADMIN_ROLES_CAPTURE_DIR;

async function expectAccessible(page: Page): Promise<void> {
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(report.violations).toEqual([]);
}

async function expectNoPageOverflow(page: Page): Promise<void> {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
}

test('BO-031 — ouvre la matrice consultative depuis sa route canonique', async ({
  page,
}, testInfo) => {
  await page.goto('/admin/security/roles');

  await expect(page).toHaveURL(/\/admin\/security\/roles$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Administration et sécurité' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Rôles et permissions' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page.getByRole('heading', { level: 2, name: 'Matrice des rôles et permissions' }),
  ).toBeVisible();
  await expect(page.getByRole('table', { name: /Matrice des permissions par rôle/ })).toBeVisible();
  await expect(page.getByText('Matrice en lecture seule')).toBeVisible();
  await expectAccessible(page);
  if (CAPTURE_DIR) {
    const target = path.resolve(CAPTURE_DIR);
    await mkdir(target, { recursive: true });
    await page.screenshot({ path: path.join(target, 'BO-031-1440x900.png'), fullPage: true });
  } else {
    await page.screenshot({ path: testInfo.outputPath('bo-031-1440.png'), fullPage: true });
  }
});

for (const width of [320, 360]) {
  test(`BO-031 — reflow sans débordement à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin/security/roles');
    await expect(page.getByRole('tab', { name: 'Rôles et permissions' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expectNoPageOverflow(page);
    await expectAccessible(page);
  });
}

test('BO-031 — reste utilisable au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/admin/security/roles');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoPageOverflow(page);
  await expectAccessible(page);
});
