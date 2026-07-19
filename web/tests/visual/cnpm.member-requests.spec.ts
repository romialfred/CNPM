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
  apiCalls: string[];
} {
  const errors = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    apiCalls: [] as string[],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') errors.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => errors.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (request.url().includes('/service-requests')) errors.apiCalls.push(request.url());
  });
  return errors;
}

async function openList(page: Page): Promise<void> {
  await page.goto('/member/requests?taille=5');
  await expect(page.getByRole('heading', { level: 1, name: 'Mes requêtes' })).toBeVisible();
  await expect(page.getByText('6 dossiers fictifs')).toBeVisible();
}

test('MP-009 — URL partageable, filtre, pagination et focus clavier', async ({ page }) => {
  const errors = observeErrors(page);
  await openList(page);
  await expect(page.locator('.member-requests__desktop-table')).toBeVisible();
  await expect(page.locator('table caption')).toContainText('Requêtes et réclamations fictives');

  await page.getByLabel('Statut', { exact: true }).selectOption('IN_PROGRESS');
  await page.getByLabel('Type', { exact: true }).selectOption('CLAIM');
  await page.getByLabel('Tri et ordre').selectOption('targetAt:asc');
  await page.getByRole('button', { name: 'Appliquer' }).click();
  await expect(page).toHaveURL(/statut=IN_PROGRESS/);
  await expect(page).toHaveURL(/type=CLAIM/);
  await expect(page).toHaveURL(/tri=targetAt/);
  await expect(page).toHaveURL(/ordre=asc/);
  await expect(page.getByText('1 dossier fictif')).toBeVisible();
  await expect(page.locator('#member-requests-results-title')).toBeFocused();

  await page.getByRole('button', { name: 'Réinitialiser tous les filtres' }).click();
  await expect(page.getByText('6 dossiers fictifs')).toBeVisible();
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('#member-requests-results-title')).toBeFocused();
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], apiCalls: [] });
});

test('MP-010 — validation, pièce simulée et accusé local sans appel API', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto('/member/requests/new');
  await expect(page.getByRole('heading', { level: 1, name: 'Nouvelle requête' })).toBeVisible();

  await page.getByRole('button', { name: 'Créer le dossier fictif' }).click();
  const summary = page.locator('.cnpm-error-summary');
  await expect(summary).toContainText('4 erreurs à corriger');
  await expect(summary).toBeFocused();

  await page.getByLabel('Type — obligatoire').selectOption('REQUEST');
  await page.getByLabel('Catégorie — obligatoire').selectOption('DEMO_DOCUMENT');
  await page.getByLabel('Objet — obligatoire').fill('Demande locale Playwright fictive');
  await page
    .getByLabel('Description — obligatoire')
    .fill('Description entièrement fictive destinée au parcours Playwright membre.');
  await page.getByLabel('Choisir des fichiers de démonstration').setInputFiles({
    name: 'preuve-playwright-fictive.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('contenu non exploité'),
  });
  await expect(page.getByText('preuve-playwright-fictive.pdf')).toBeVisible();
  await expect(page.getByText(/non téléversé/)).toBeVisible();
  await page.getByRole('button', { name: 'Créer le dossier fictif' }).click();

  await expect(page).toHaveURL(/\/member\/requests\/demo-member-request-created-0007\?created=1/);
  await expect(page.getByText('Accusé fictif créé localement')).toBeVisible();
  await expect(page.getByText('DEMO-REQ-MEMBRE-2026-0007').first()).toBeVisible();
  await expect(page.getByText(/Aucun accusé officiel n’est émis/)).toBeVisible();
  await expect(page.getByText('preuve-playwright-fictive.pdf')).toBeVisible();
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], apiCalls: [] });
});

test('MP-011 — dossier, pièces demandées et conversation partagée uniquement', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto('/member/requests/demo-member-request-1?q=pièce&taille=5');
  await expect(
    page.getByRole('heading', { level: 2, name: 'DEMO-REQ-MEMBRE-2026-0006' }),
  ).toBeVisible();
  await expect(page.getByText('Justificatif fictif au format PDF')).toBeVisible();
  await expect(
    page.getByText(/notes réservées aux agents ne sont jamais transmises/),
  ).toBeVisible();
  await expect(page.getByText('strictement interne')).toHaveCount(0);

  const reply = page.getByLabel('Message — obligatoire');
  await reply.focus();
  await expect(reply).toBeFocused();
  await reply.fill('Réponse locale et entièrement fictive du membre.');
  await page.getByRole('button', { name: 'Ajouter localement' }).click();
  await expect(page.getByText('Réponse locale et entièrement fictive du membre.')).toBeVisible();
  await expect(page.getByText(/Message ajouté à la conversation fictive locale/)).toBeVisible();
  await expect(page.locator('#conversation-title')).toBeFocused();
  await expect(page.locator('.member-request-detail__back')).toHaveAttribute(
    'href',
    /q=pi%C3%A8ce/,
  );
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], apiCalls: [] });
});

test('MP-011 — état introuvable explicite et sans fuite de dossier', async ({ page }) => {
  await page.goto('/member/requests/absente');
  await expect(page.getByRole('heading', { level: 2, name: 'Requête introuvable' })).toBeVisible();
  await expect(page.getByText('Demande initiale')).toHaveCount(0);
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`MP-009/010/011 — reflow sans débordement à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await openList(page);
    await expect(page.locator('.member-requests__desktop-table')).toBeHidden();
    await expect(page.locator('.member-requests__mobile-list')).toBeVisible();
    const detailLink = page.locator('.member-requests__mobile-list').getByRole('link').first();
    expect((await detailLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.screenshot({
      path: testInfo.outputPath(`mp-009-list-${width}.png`),
    });

    await page.goto('/member/requests/new');
    await expect(page.getByRole('heading', { level: 1, name: 'Nouvelle requête' })).toBeVisible();
    const mobileActions = page.locator('.new-member-request__actions');
    await expect
      .poll(() => mobileActions.evaluate((element) => getComputedStyle(element).position))
      .toBe('static');
    const flowOrder = await page.evaluate(() => {
      const attachments = document.querySelector('.new-member-request__card:nth-of-type(2)');
      const actions = document.querySelector('.new-member-request__actions');
      if (!(attachments instanceof HTMLElement) || !(actions instanceof HTMLElement)) return false;
      return actions.offsetTop >= attachments.offsetTop + attachments.offsetHeight;
    });
    expect(flowOrder).toBe(true);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.screenshot({
      path: testInfo.outputPath(`mp-010-new-${width}.png`),
    });

    await page.goto('/member/requests/demo-member-request-1');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Conversation partagée' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.screenshot({
      path: testInfo.outputPath(`mp-011-detail-${width}.png`),
    });
  });
}

test('MP-009 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openList(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});
