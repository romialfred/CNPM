import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const LIST_ROUTE = '/admin/groups';

async function openList(page: Page): Promise<void> {
  await page.goto(LIST_ROUTE);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Groupements professionnels' }),
  ).toBeVisible();
  await expect(page.getByText('12 groupements disponibles')).toBeVisible();
}

async function expectNoBlockingViolation(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

test('BO-024 — table accessible et navigation conditionnée', async ({ page }) => {
  await openList(page);
  await expect(page.locator('table caption')).toContainText('Groupements professionnels');
  await expect(page.getByRole('link', { name: 'Groupements', exact: true })).toBeVisible();
  await expectNoBlockingViolation(page);
});

test('BO-024 → BO-025 → BO-024 conserve la page dans l’URL', async ({ page }) => {
  await openList(page);
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/groups\?page=2/);
  await expect(page.locator('.cnpm-pagination__range')).toContainText('11–12 sur 12');

  const detailLink = page.locator('.cnpm-groups__table .cnpm-groups__detail-link').first();
  await detailLink.focus();
  await expect(detailLink).toBeFocused();
  await detailLink.press('Enter');

  await expect(page).toHaveURL(/\/admin\/groups\/[^?]+\?page=2/);
  await expect(page.getByText('Incréments non disponibles')).toBeVisible();
  await expect(page.getByRole('button', { name: /Modifier|Créer/ })).toHaveCount(0);
  await expectNoBlockingViolation(page);

  await page.getByRole('link', { name: 'Groupements', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/groups\?page=2/);
  await expect(page.locator('.cnpm-pagination__range')).toContainText('11–12 sur 12');
});

for (const width of [320, 360]) {
  test(`BO-024 — reflow sans débordement et action tactile à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openList(page);

    const card = page.locator('.cnpm-groups__cards > li').first();
    await expect(card).toBeVisible();
    const action = card.getByRole('button', { name: 'Voir la fiche' });
    const box = await action.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expectNoBlockingViolation(page);
  });
}
