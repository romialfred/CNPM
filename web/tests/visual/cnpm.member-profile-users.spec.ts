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
    if (new URL(request.url()).pathname.startsWith('/portal/')) {
      errors.memberApiCalls.push(request.url());
    }
  });
  return errors;
}

async function openProfile(page: Page): Promise<void> {
  await page.goto('/member/profile');
  await expect(page.getByRole('heading', { level: 1, name: 'Profil entreprise' })).toBeVisible();
  await expect(
    page.locator('.member-profile').getByText('Entreprise Démo Sahel', { exact: true }).first(),
  ).toBeVisible();
}

async function openUsers(page: Page): Promise<void> {
  await page.goto('/member/users?size=5');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Utilisateurs de l’entreprise' }),
  ).toBeVisible();
  await expect(page.getByText('6 utilisateurs fictifs')).toBeVisible();
}

test('MP-013 — profil entreprise consultatif, fictif, accessible et auto-scopé', async ({
  page,
}) => {
  const errors = observeErrors(page);
  await openProfile(page);

  const content = page.locator('.member-profile');
  await expect(page.getByRole('heading', { level: 1, name: 'Profil entreprise' })).toBeFocused();
  await expect(content.getByText('CNPM-DEMO-0001', { exact: true })).toHaveCount(2);
  await expect(content.getByText('18/03/2024')).toBeVisible();
  await expect(content.locator('form, input, textarea, select, img')).toHaveCount(0);
  await expect(content.getByRole('button')).toHaveCount(0);
  await expect(content).not.toContainText(/Keycloak|RCCM|NIF|KYC|secret|jeton/i);
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], memberApiCalls: [] });
});

test('MP-014 — URL partageable, filtres, pagination, lecture seule et clavier', async ({
  page,
}) => {
  const errors = observeErrors(page);
  await openUsers(page);

  const content = page.locator('.member-users');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Utilisateurs de l’entreprise' }),
  ).toBeFocused();
  await expect(page.locator('.member-users__desktop-table')).toBeVisible();
  await expect(page.locator('table caption')).toContainText('sans action IAM');
  await expect(content.locator('input[type="checkbox"]')).toHaveCount(0);
  await expect(
    content.getByRole('button', {
      name: /Inviter|Attribuer|Réinitialiser|Révoquer|Suspendre|Activer|Désactiver/,
    }),
  ).toHaveCount(0);
  await expect(content).not.toContainText(/Keycloak|secret|jeton|sessionId|ipAddress|permission/i);

  const search = page.getByRole('searchbox', { name: 'Recherche' });
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('État', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Tri et ordre', { exact: true })).toBeFocused();

  await search.fill('fictif 04');
  await page.getByLabel('État', { exact: true }).selectOption('INACTIVE_DEMO');
  await page.getByLabel('Tri et ordre', { exact: true }).selectOption('lastActivityOn:desc');
  await page.getByRole('button', { name: 'Appliquer' }).click();
  await expect(page).toHaveURL(/q=fictif(?:\+|%20)04/);
  await expect(page).toHaveURL(/status=INACTIVE_DEMO/);
  await expect(page).toHaveURL(/sort=lastActivityOn/);
  await expect(page).toHaveURL(/order=desc/);
  await expect(page.getByText('1 utilisateur fictif')).toBeVisible();
  await expect(page.locator('#member-users-results-title')).toBeFocused();

  await page.getByRole('button', { name: 'Réinitialiser tous les filtres' }).click();
  await expect(page.getByText('6 utilisateurs fictifs')).toBeVisible();
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.member-users__desktop-table tbody tr')).toHaveCount(1);
  await expect(page.locator('#member-users-results-title')).toBeFocused();
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], memberApiCalls: [] });
});

test('MP-014 — état sans résultat explicite et récupérable', async ({ page }) => {
  await page.goto('/member/users?q=reference-absente&status=ACTIVE_DEMO&size=5');
  await expect(page.getByRole('status').getByText('Aucun utilisateur ne correspond')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Réinitialiser les filtres' })).toBeVisible();
  await expectNoAxeViolation(page);
});

for (const width of [320, 360]) {
  test(`MP-013/014 — reflow et captures à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await openProfile(page);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.screenshot({ path: testInfo.outputPath(`mp-013-profile-${width}.png`) });

    await openUsers(page);
    await expect(page.locator('.member-users__desktop-table')).toBeHidden();
    await expect(page.locator('.member-users__mobile-list')).toBeVisible();
    const applyButton = page.getByRole('button', { name: 'Appliquer' });
    expect((await applyButton.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.getByRole('button', { name: 'Replier' }).click();
    await page.screenshot({ path: testInfo.outputPath(`mp-014-users-${width}.png`) });
    await page.locator('.member-users__mobile-list article').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`mp-014-user-card-${width}.png`) });
  });
}

test('MP-013/014 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  for (const path of ['/member/profile', '/member/users?size=5']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
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
  }
});
