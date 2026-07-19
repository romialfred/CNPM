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
  documentApiCalls: string[];
} {
  const errors = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    documentApiCalls: [] as string[],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') errors.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => errors.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.includes('/portal/documents')) {
      errors.documentApiCalls.push(request.url());
    }
  });
  return errors;
}

async function openList(page: Page): Promise<void> {
  await page.goto('/member/documents?size=5');
  await expect(page.getByRole('heading', { level: 1, name: 'Mes documents' })).toBeVisible();
  await expect(page.getByText('6 métadonnées fictives')).toBeVisible();
}

test('MP-012 — URL partageable, filtres, pagination, lecture seule et clavier', async ({
  page,
}) => {
  const errors = observeErrors(page);
  await openList(page);
  await expect(page.locator('.member-documents__desktop-table')).toBeVisible();
  await expect(page.locator('table caption')).toContainText('sans contenu ni action');
  await expect(page.getByRole('heading', { level: 1, name: 'Mes documents' })).toBeFocused();

  const content = page.locator('.member-documents');
  await expect(content.getByRole('link')).toHaveCount(0);
  await expect(
    content.locator('input[type="file"], img, canvas, [data-qr], .qr-code, .signature, .stamp'),
  ).toHaveCount(0);
  await expect(
    content.getByRole('button', {
      name: /Télécharger|Ouvrir|Aperçu|Partager|Signer|Vérifier|Renouveler/,
    }),
  ).toHaveCount(0);
  await expect(content).not.toContainText(/CONFIDENTIAL|RESTRICTED|object_key|sha256|antivirus/i);

  await page.getByRole('searchbox', { name: 'Recherche' }).fill('2025');
  await page.getByLabel('Type', { exact: true }).selectOption('ATTESTATION');
  await page.getByLabel('Statut', { exact: true }).selectOption('EXPIRED');
  await page.getByLabel('Tri et ordre', { exact: true }).selectOption('title:asc');
  await page.getByRole('button', { name: 'Appliquer' }).click();
  await expect(page).toHaveURL(/q=2025/);
  await expect(page).toHaveURL(/type=ATTESTATION/);
  await expect(page).toHaveURL(/status=EXPIRED/);
  await expect(page).toHaveURL(/sort=title/);
  await expect(page).toHaveURL(/order=asc/);
  await expect(page.getByText('1 métadonnée fictive')).toBeVisible();
  await expect(page.locator('#member-documents-results-title')).toBeFocused();

  await page.getByRole('button', { name: 'Réinitialiser tous les filtres' }).click();
  await expect(page.getByText('6 métadonnées fictives')).toBeVisible();
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.member-documents__desktop-table tbody tr')).toHaveCount(1);
  await expect(page.locator('#member-documents-results-title')).toBeFocused();
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], documentApiCalls: [] });
});

test('MP-012 — état sans résultat explicite et récupérable', async ({ page }) => {
  await page.goto('/member/documents?q=reference-absente&type=MEMBER_CARD&size=5');
  await expect(page.getByRole('status').getByText('Aucun document ne correspond')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Réinitialiser les filtres' })).toBeVisible();
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`MP-012 — reflow et capture à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await openList(page);
    await expect(page.locator('.member-documents__desktop-table')).toBeHidden();
    await expect(page.locator('.member-documents__mobile-list')).toBeVisible();
    const applyButton = page.getByRole('button', { name: 'Appliquer' });
    expect((await applyButton.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.getByRole('button', { name: 'Replier' }).click();
    await expect(page.getByRole('button', { name: 'Déplier' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`mp-012-documents-${width}.png`) });
    await page.locator('.member-documents__mobile-list article').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`mp-012-document-card-${width}.png`) });
  });
}

test('MP-012 — reflow au zoom 200 %', async ({ page }) => {
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
});
