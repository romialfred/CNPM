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
  memberApiCalls: string[];
} {
  const errors = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    memberApiCalls: [] as string[],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') errors.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => errors.pageErrors.push(error.message));
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/api/') || path.startsWith('/portal/')) {
      errors.memberApiCalls.push(request.url());
    }
  });
  return errors;
}

async function openAnalytics(page: Page): Promise<void> {
  await page.goto('/member/showcase/analytics?period=30d&display=chart');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Statistiques de la vitrine' }),
  ).toBeVisible();
  await expect(
    page.locator('.showcase-analytics__metrics').getByText('Vues agrégées', { exact: true }),
  ).toBeVisible();
}

async function openDirectory(page: Page): Promise<void> {
  await page.goto('/member/directory?view=cards');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Annuaire privé et opportunités' }),
  ).toBeVisible();
  await expect(page.locator('.member-directory__grid article')).toHaveCount(6);
}

test('MP-017 — agrégats privés, URL, clavier et aucune collecte individuelle', async ({ page }) => {
  const errors = observeErrors(page);
  await openAnalytics(page);

  const content = page.locator('.showcase-analytics');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Statistiques de la vitrine' }),
  ).toBeFocused();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(content.getByText('Suivi désactivé dans la démonstration')).toBeVisible();
  await expect(content.locator('table caption')).toContainText('sans identifiant visiteur');
  await expect(content.locator('a[href^="http"], a[href^="mailto"], a[href^="tel"]')).toHaveCount(
    0,
  );
  await expect(content).not.toContainText(
    /SOMACOP|BICIM|RCCM|NIF|@|\+223|\b(?:\d{1,3}\.){3}\d{1,3}\b/i,
  );

  const period = page.getByLabel('Période fictive');
  await period.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Graphique' })).toBeFocused();
  await period.selectOption('7d');
  await expect(page).toHaveURL(/period=7d/);
  await expect(content.locator('.showcase-analytics__bar')).toHaveCount(7);
  await period.selectOption('90d');
  await expect(page).toHaveURL(/period=90d/);
  await expect(content.locator('.showcase-analytics__bar')).toHaveCount(30);
  await expect(
    content
      .getByText('30 derniers jours tracés sur 90 jours sélectionnés', { exact: false })
      .first(),
  ).toBeVisible();
  await expect(content).toContainText(
    'Les 60 jours antérieurs ne sont ni tracés ni inclus dans les métriques affichées.',
  );
  await page.getByRole('button', { name: 'Tableau' }).click();
  await expect(page).toHaveURL(/display=table/);
  await expect(content.locator('tbody tr')).toHaveCount(30);
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], memberApiCalls: [] });
});

test('MP-018 — annuaire fictif privé, filtres URL et aucune action commerciale', async ({
  page,
}) => {
  const errors = observeErrors(page);
  await openDirectory(page);

  const content = page.locator('.member-directory');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Annuaire privé et opportunités' }),
  ).toBeFocused();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(content.locator('input[type="email"], input[type="tel"], textarea')).toHaveCount(0);
  await expect(content.locator('a[href^="http"], a[href^="mailto"], a[href^="tel"]')).toHaveCount(
    0,
  );
  await expect(
    content.getByRole('button', { name: /Contacter|Message|Acheter|Devis|Favori|Partager/ }),
  ).toHaveCount(0);
  await expect(content).not.toContainText(/SOMACOP|BICIM|RCCM|NIF|@|\+223/);

  await page.getByLabel('Secteur fictif').selectOption('AGRI_DEMO');
  await page.getByRole('button', { name: 'Appliquer' }).click();
  await expect(page).toHaveURL(/sector=AGRI_DEMO/);
  await expect(page.locator('.member-directory__grid article')).toHaveCount(2);
  await expect(page.locator('#directory-results-title')).toBeFocused();
  await page.getByRole('button', { name: 'Compacte' }).click();
  await expect(page).toHaveURL(/view=compact/);
  await expect(page.locator('.member-directory__compact > li')).toHaveCount(2);
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], memberApiCalls: [] });
});

test('Portail membre — Plus rend tous les écrans découvrables au clavier', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAnalytics(page);

  const plus = page.getByRole('button', { name: 'Plus', exact: true });
  await expect(plus).toBeVisible();
  await expect(page.locator('.member-shell__mobile-nav > *')).toHaveCount(5);
  await plus.focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('dialog', { name: 'Plus de services' });
  await expect(panel).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fermer le menu Plus' })).toBeFocused();
  await expect(panel.getByRole('link')).toHaveCount(6);
  await expect(panel.getByRole('link', { name: 'Annuaire' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Vitrine' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Statistiques' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('member-more-panel-390x844.png') });

  const lastLink = panel.getByRole('link', { name: 'Utilisateurs' });
  await lastLink.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Fermer le menu Plus' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(plus).toBeFocused();

  await plus.click();
  await panel.getByRole('link', { name: 'Annuaire' }).click();
  await expect(page).toHaveURL(/\/member\/directory/);
  await expect(panel).toBeHidden();
  await expectNoAxeViolation(page);
});

test('MP-018 — q est borné à 80 et sa chip résiste à 300 caractères', async ({ page }) => {
  const longSearch = 'x'.repeat(300);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`/member/directory?view=cards&q=${longSearch}`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Annuaire privé et opportunités' }),
  ).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('q')?.length).toBe(80);
  await expect(page.getByRole('searchbox', { name: 'Recherche' })).toHaveValue('x'.repeat(80));
  await expect(page.locator('.cnpm-filters__chip-label')).toHaveText(
    'Recherche : xxxxxxxxxxxxxxxx…',
  );
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolation(page);
});

const REQUIRED_VIEWPORTS = [
  { width: 320, height: 900 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1672, height: 941 },
] as const;

for (const viewport of REQUIRED_VIEWPORTS) {
  const label = `${viewport.width}x${viewport.height}`;
  test(`MP-017/018 — responsive, axe et captures à ${label}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await openAnalytics(page);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    expect(
      (await page.getByLabel('Période fictive').boundingBox())?.height ?? 0,
    ).toBeGreaterThanOrEqual(40);
    await page.screenshot({ path: testInfo.outputPath(`mp-017-analytics-${label}.png`) });

    await openDirectory(page);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    expect(
      (await page.getByRole('button', { name: 'Appliquer' }).boundingBox())?.height ?? 0,
    ).toBeGreaterThanOrEqual(40);
    await page.screenshot({ path: testInfo.outputPath(`mp-018-directory-${label}.png`) });
  });
}

test('MP-017/018 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  for (const path of [
    '/member/showcase/analytics?period=30d&display=chart',
    '/member/directory?view=cards',
  ]) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    const overflowSources = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
        .filter((element) => !element.closest('.showcase-analytics__table-wrap'))
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
  }
});
