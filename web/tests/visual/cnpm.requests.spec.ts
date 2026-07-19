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
  await page.goto('/admin/requests');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Requêtes et réclamations' }),
  ).toBeVisible();
  await expect(page.getByText('12 dossiers trouvés')).toBeVisible();
}

test('BO-021 — filtres, tri et pagination restent dans l’URL', async ({ page }) => {
  await openList(page);
  await expect(page.locator('table caption')).toContainText('Requêtes et réclamations');

  await page.getByLabel('Statut', { exact: true }).selectOption('WAITING_MEMBER');
  await expect(page).toHaveURL(/statut=WAITING_MEMBER/);
  await expect(page.getByText('2 dossiers trouvés')).toBeVisible();

  await page.getByLabel('Priorité', { exact: true }).selectOption('HIGH');
  await expect(page).toHaveURL(/priorite=HIGH/);
  await expect(page.getByText('1 dossier trouvé')).toBeVisible();

  await page.getByLabel('Trier par').selectOption('submittedAt:asc');
  await expect(page).toHaveURL(/ordre=asc/);
  await expectNoAxeViolation(page);
});

test('BO-021 → BO-022 conserve le contexte et ne simule aucune mutation serveur', async ({
  page,
}) => {
  await page.goto('/admin/requests?tri=priority&ordre=desc');
  await expect(page.getByText('12 dossiers trouvés')).toBeVisible();

  const detailLink = page.locator('.cnpm-requests__detail-link').first();
  await detailLink.focus();
  await expect(detailLink).toBeFocused();
  await detailLink.press('Enter');

  await expect(page).toHaveURL(/\/admin\/requests\/[^?]+\?tri=priority&ordre=desc/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Conversation visible par le membre' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Notes strictement internes' }),
  ).toBeVisible();
  await expect(page.getByText('GED indisponible')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clôturer le dossier' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );

  await page.getByLabel('Projet de réponse').fill('Aperçu local Playwright fictif.');
  await page.getByRole('button', { name: 'Préparer l’aperçu local' }).click();
  await expect(page.getByText('Aperçu non envoyé et non enregistré')).toBeVisible();
  await expect(page.locator('.cnpm-request-detail__conversation')).not.toContainText(
    'Aperçu local Playwright fictif.',
  );
  await expectNoAxeViolation(page);

  await page
    .getByLabel('Fil d’Ariane')
    .getByRole('link', { name: 'Requêtes et réclamations' })
    .click();
  await expect(page).toHaveURL('/admin/requests?tri=priority&ordre=desc');
});

test('BO-022 — états interdit et introuvable ne révèlent aucun dossier', async ({ page }) => {
  await page.goto('/admin/requests/REQ-DEMO-INTERDIT');
  await expect(page.getByText('Dossier hors de votre périmètre')).toBeVisible();
  await expect(page.getByText('Demande initiale')).toHaveCount(0);

  await page.goto('/admin/requests/REQ-DEMO-INCONNU');
  await expect(page.getByText('Dossier introuvable')).toBeVisible();
  await expect(page.getByText('Demande initiale')).toHaveCount(0);
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`BO-021/022 — reflow et cible tactile à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openList(page);
    await expect(page.locator('.cnpm-requests__table')).toBeHidden();
    const action = page.locator('.cnpm-requests__cards > li').first().getByRole('link');
    const box = await action.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await action.click();
    await expect(page.getByRole('heading', { level: 2, name: 'Demande initiale' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
  });
}

test('BO-021 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openList(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});
