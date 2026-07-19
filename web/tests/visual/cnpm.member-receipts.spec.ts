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

function observeErrors(page: Page): {
  consoleErrors: string[];
  pageErrors: string[];
  receiptApiCalls: string[];
} {
  const errors = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    receiptApiCalls: [] as string[],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') errors.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => errors.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/receipts')) {
      errors.receiptApiCalls.push(request.url());
    }
  });
  return errors;
}

async function openList(page: Page): Promise<void> {
  await page.goto('/member/receipts?taille=5');
  await expect(page.getByRole('heading', { level: 1, name: 'Mes reçus' })).toBeVisible();
  await expect(page.getByText('6 aperçus fictifs')).toBeVisible();
}

test('MP-007 — URL partageable, filtres, pagination et clavier', async ({ page }) => {
  const errors = observeErrors(page);
  await openList(page);
  await expect(page.locator('.member-receipts__desktop-table')).toBeVisible();
  await expect(page.locator('table caption')).toContainText('Aperçus de reçus fictifs');

  await page.getByRole('searchbox', { name: 'Recherche' }).fill('2025');
  await page.getByLabel('Statut', { exact: true }).selectOption('DEMONSTRATION_CANCELLED');
  await page.getByLabel('Exercice', { exact: true }).selectOption('2025');
  await page.getByLabel('Tri et ordre', { exact: true }).selectOption('amountXof:asc');
  await page.getByRole('button', { name: 'Appliquer' }).click();
  await expect(page).toHaveURL(/q=2025/);
  await expect(page).toHaveURL(/statut=DEMONSTRATION_CANCELLED/);
  await expect(page).toHaveURL(/exercice=2025/);
  await expect(page).toHaveURL(/tri=amountXof/);
  await expect(page).toHaveURL(/ordre=asc/);
  await expect(page.getByText('1 aperçu fictif')).toBeVisible();
  await expect(page.locator('#member-receipts-results-title')).toBeFocused();

  await page.getByRole('button', { name: 'Réinitialiser tous les filtres' }).click();
  await expect(page.getByText('6 aperçus fictifs')).toBeVisible();
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('#member-receipts-results-title')).toBeFocused();
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], receiptApiCalls: [] });
});

test('MP-007 vers MP-008 conserve le contexte et ouvre un aperçu au clavier', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto('/member/receipts?exercice=2026&tri=reference&ordre=asc&taille=5');
  await expect(page.getByText('2 aperçus fictifs')).toBeVisible();
  const detailLink = page.locator('.member-receipts__desktop-table').getByRole('link').first();
  await detailLink.focus();
  await expect(detailLink).toBeFocused();
  await detailLink.press('Enter');

  await expect(page).toHaveURL(/\/member\/receipts\/demo-receipt-preview-2026-001/);
  await expect(page).toHaveURL(/exercice=2026/);
  await expect(page.getByRole('heading', { level: 2, name: 'DEMO-APERCU-2026-001' })).toBeVisible();
  await expect(page.getByText('Source fictive')).toBeVisible();
  await expect(page.getByText('Paiement non reproduit')).toBeVisible();
  await expect(page.getByText(/Aucun PDF, QR, cachet ou signature n’est généré/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Télécharger|Partager|Émettre|Vérifier/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /Télécharger|Partager|Émettre|Vérifier/ }),
  ).toHaveCount(0);
  await expect(page.locator('[data-qr], .qr-code, .signature, .stamp')).toHaveCount(0);
  await expect(page.locator('.member-receipt-detail__back')).toHaveAttribute(
    'href',
    /exercice=2026/,
  );
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], receiptApiCalls: [] });
});

test('MP-008 — état introuvable sans fuite de reçu', async ({ page }) => {
  await page.goto('/member/receipts/reference-absente');
  await expect(page.getByRole('heading', { level: 2, name: 'Aperçu introuvable' })).toBeVisible();
  await expect(page.getByText('APERÇU DE DÉMONSTRATION')).toHaveCount(0);
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`MP-007/008 — reflow et captures à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await openList(page);
    await expect(page.locator('.member-receipts__desktop-table')).toBeHidden();
    await expect(page.locator('.member-receipts__mobile-list')).toBeVisible();
    const detailLink = page.locator('.member-receipts__mobile-list').getByRole('link').first();
    expect((await detailLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.screenshot({ path: testInfo.outputPath(`mp-007-list-${width}.png`) });

    await page.goto('/member/receipts/demo-receipt-preview-2026-001');
    await expect(
      page.getByRole('heading', { level: 2, name: 'DEMO-APERCU-2026-001' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.screenshot({ path: testInfo.outputPath(`mp-008-preview-${width}.png`) });
  });
}

test('MP-007/008 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openList(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  const overflowSources = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 10)
      .map((element) => ({
        tag: element.tagName,
        className: element.className,
        right: Math.round(element.getBoundingClientRect().right),
      })),
  );
  expect(overflowSources).toEqual([]);
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);

  await page.goto('/member/receipts/demo-receipt-preview-2026-001');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});
