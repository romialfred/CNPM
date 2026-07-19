import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ACTIONS_URL =
  '/admin/recovery/actions?suspension=PROMISE&selection=demo-recovery-action-0005';
const PORTFOLIO_URL =
  '/admin/recovery/portfolio?suspension=PROMISE&selection=demo-recovery-case-0005';
const MOBILE_VIEWPORTS = [
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;
const DESKTOP_VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

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

async function expectNoContactAffordance(page: Page, detailSelector: string) {
  await expect(page.locator('a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0);
  await expect(
    page.locator(detailSelector).getByText('Contact masqué — démonstration', { exact: true }),
  ).toBeVisible();
}

async function expectFourLockedActions(page: Page, selector: string) {
  const actions = page.locator(`${selector} button`);
  await expect(actions).toHaveCount(4);
  for (const action of await actions.all()) {
    await expect(action).toHaveAttribute('aria-disabled', 'true');
  }
}

test('BO-019 — file fictive, promesse protégée et sélection au clavier', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (['fetch', 'xhr'].includes(request.resourceType()) && request.url().includes('/recovery')) {
      apiCalls.push(request.url());
    }
  });

  await page.goto(ACTIONS_URL);
  await expect(
    page.getByRole('heading', { level: 1, name: 'File des relances et actions' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Campagnes', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Portefeuille agent', exact: true })).toBeVisible();
  await expect(page.locator('.recovery-actions-page__detail-name')).toHaveText(
    'Organisation Démo Epsilon',
  );
  await expect(page.getByText('Engagement fictif consigné pour la démonstration.')).toBeVisible();
  await expect(page.getByText(/suspension datée du/i)).toBeVisible();
  await expectFourLockedActions(page, '.recovery-actions-page__locked-actions');
  await expectNoContactAffordance(page, '.recovery-actions-page__detail');
  expect(apiCalls).toEqual([]);
  await expectAccessible(page);
  await page.screenshot({ path: testInfo.outputPath('bo-019-1672.png'), fullPage: true });

  await page.goto('/admin/recovery/actions');
  const firstExamine = page.getByRole('button', { name: 'Examiner' }).first();
  await firstExamine.focus();
  await expect(firstExamine).toBeFocused();
  await firstExamine.press('Enter');
  await expect(page).toHaveURL(/selection=demo-recovery-action-/);
});

test('BO-020 — portefeuille consultatif et métriques REL-007 non sanctionnantes', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (['fetch', 'xhr'].includes(request.resourceType()) && request.url().includes('/recovery')) {
      apiCalls.push(request.url());
    }
  });

  await page.goto(PORTFOLIO_URL);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Portefeuille agent de recouvrement' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Performance de l’agent Démo' }),
  ).toBeVisible();
  await expect(page.locator('.recovery-portfolio-page__detail-name')).toHaveText(
    'Organisation Démo Epsilon',
  );
  await expect(page.getByText('Engagement fictif consigné pour la démonstration.')).toBeVisible();
  await expect(page.getByText('aucun score ne sanctionne ni ne classe un membre')).toBeVisible();
  await expectFourLockedActions(page, '.recovery-portfolio-page__locked-actions');
  await expectNoContactAffordance(page, '.recovery-portfolio-page__detail');
  expect(apiCalls).toEqual([]);
  await expectAccessible(page);
  await page.screenshot({ path: testInfo.outputPath('bo-020-1672.png'), fullPage: true });
});

for (const viewport of MOBILE_VIEWPORTS) {
  test(`BO-019/020 — reflow sans débordement à ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);

    await page.goto(ACTIONS_URL);
    await expect(page.locator('.recovery-actions-page__detail-name')).toHaveText(
      'Organisation Démo Epsilon',
    );
    await expectNoOverflow(page);
    await expectAccessible(page);
    await page.screenshot({
      path: testInfo.outputPath(`bo-019-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });

    await page.goto(PORTFOLIO_URL);
    await expect(page.locator('.recovery-portfolio-page__detail-name')).toHaveText(
      'Organisation Démo Epsilon',
    );
    await expectNoOverflow(page);
    await expectAccessible(page);
    await page.screenshot({
      path: testInfo.outputPath(`bo-020-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });
  });
}

for (const viewport of DESKTOP_VIEWPORTS) {
  test(`BO-019/020 — composition desktop à ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const url of [ACTIONS_URL, PORTFOLIO_URL]) {
      await page.goto(url);
      await expectNoOverflow(page);
      await expectAccessible(page);
    }
  });
}

test('BO-019/020 — Examiner annonce et focalise le détail sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const scenario of [
    {
      url: '/admin/recovery/actions',
      cards: '.recovery-actions-page__cards',
      title: '#recovery-action-detail-title',
    },
    {
      url: '/admin/recovery/portfolio',
      cards: '.recovery-portfolio-page__cards',
      title: '#recovery-portfolio-detail-title',
    },
  ]) {
    await page.goto(scenario.url);
    await page
      .locator(scenario.cards)
      .getByRole('button', { name: /Examiner/ })
      .first()
      .click();
    await expect(page.locator(scenario.title)).toBeFocused();
    await expect(page.getByRole('button', { name: /Sélection active/ })).toBeVisible();
  }
});

test('BO-019/020 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  for (const url of [ACTIONS_URL, PORTFOLIO_URL]) {
    await page.goto(url);
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await expectNoOverflow(page);
    await expectAccessible(page);
  }
});
