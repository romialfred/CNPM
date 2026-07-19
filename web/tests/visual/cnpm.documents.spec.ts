import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectAccessible(page: Page) {
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(report.violations).toEqual([]);
}
async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
}

test('BO-023 — bibliothèque strictement consultative et filtrable par URL', async ({
  page,
}, testInfo) => {
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (['fetch', 'xhr'].includes(request.resourceType()) && request.url().includes('/documents')) {
      apiCalls.push(request.url());
    }
  });
  await page.goto('/admin/documents');
  await expect(page.getByRole('heading', { level: 1, name: 'GED et documents' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Documents', exact: true })).toBeVisible();
  await expect(page.getByText('12 métadonnées trouvées')).toBeVisible();
  await expect(
    page.locator(
      '.documents-page a[download], .documents-page input[type=file], .documents-page img, .documents-page canvas',
    ),
  ).toHaveCount(0);
  await page.getByLabel('Classification').selectOption('RESTRICTED');
  await expect(page).toHaveURL(/classification=RESTRICTED/);
  await page.getByLabel('Cycle de vie').selectOption('EXPIRING');
  await expect(page).toHaveURL(/statut=EXPIRING/);
  await expect(page.getByText('1 métadonnée trouvée')).toBeVisible();
  expect(apiCalls).toEqual([]);
  await expectAccessible(page);
  await page.screenshot({ path: testInfo.outputPath('bo-023-1440.png') });
});

for (const width of [320, 360]) {
  test(`BO-023 — reflow sans débordement à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin/documents');
    await expect(page.getByText('12 métadonnées trouvées')).toBeVisible();
    await expect(page.locator('.documents-page__table')).toBeHidden();
    await expect(page.locator('.documents-page__cards > li').first()).toBeVisible();
    await expectNoOverflow(page);
    await expectAccessible(page);
    await page.screenshot({ path: testInfo.outputPath(`bo-023-${width}.png`) });
  });
}

test('BO-023 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/admin/documents');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoOverflow(page);
  await expectAccessible(page);
});
