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

test('BO-037 — modération fictive, consultative et sélectionnable par URL', async ({
  page,
}, testInfo) => {
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (['fetch', 'xhr'].includes(request.resourceType()) && request.url().includes('/showcases')) {
      apiCalls.push(request.url());
    }
  });

  await page.goto('/admin/showcases/moderation?submission=demo-showcase-submission-0001');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Modération des vitrines membres' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vitrines', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 3, name: 'Organisation Démo Alpha' }),
  ).toBeVisible();
  await expect(page.getByText('Prototype consultatif fictif')).toBeVisible();
  await expect(
    page.locator(
      '.showcase-moderation-page img, .showcase-moderation-page input, .showcase-moderation-page textarea',
    ),
  ).toHaveCount(0);

  const lockedActions = page.locator('.showcase-moderation-page__actions button');
  await expect(lockedActions).toHaveCount(7);
  for (const button of await lockedActions.all()) {
    await expect(button).toHaveAttribute('aria-disabled', 'true');
  }

  await page.getByRole('button', { name: /Organisation Démo Bêta/ }).click();
  await expect(page).toHaveURL(/submission=demo-showcase-submission-0002/);
  await expect(
    page.getByRole('heading', { level: 3, name: 'Organisation Démo Bêta' }),
  ).toBeVisible();
  expect(apiCalls).toEqual([]);
  await expectAccessible(page);
  await page.screenshot({ path: testInfo.outputPath('bo-037-1672.png'), fullPage: true });
});

for (const width of [320, 360, 390, 430]) {
  test(`BO-037 — reflow sans débordement à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin/showcases/moderation');
    await expect(page.getByRole('heading', { level: 2, name: 'File fictive' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Aperçu et différences' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Contrôles et décision' }),
    ).toBeVisible();
    await expectNoOverflow(page);
    await expectAccessible(page);
    await page.screenshot({ path: testInfo.outputPath(`bo-037-${width}.png`), fullPage: true });
  });
}

test('BO-037 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/admin/showcases/moderation');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoOverflow(page);
  await expectAccessible(page);
});
