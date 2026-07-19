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
  showcaseApiCalls: string[];
} {
  const errors = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    showcaseApiCalls: [] as string[],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') errors.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => errors.pageErrors.push(error.message));
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/api/') || path.startsWith('/portal/')) {
      errors.showcaseApiCalls.push(request.url());
    }
  });
  return errors;
}

async function openEditor(page: Page): Promise<void> {
  await page.goto('/member/showcase/edit');
  await expect(page.getByRole('heading', { level: 1, name: 'Éditeur de vitrine' })).toBeVisible();
  await expect(
    page.getByText('Brouillon local chargé. Aucune donnée n’est envoyée au serveur.'),
  ).toBeVisible();
}

async function openPreview(page: Page, viewport = 'desktop'): Promise<void> {
  await page.goto(`/member/showcase/preview?viewport=${viewport}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Aperçu de la vitrine' })).toBeVisible();
  await expect(page.locator('.showcase-template')).toBeVisible();
}

test('MP-015 — édition fictive locale, limites, reprise et clavier', async ({ page }) => {
  const errors = observeErrors(page);
  await openEditor(page);

  const content = page.locator('.showcase-editor');
  await expect(page.getByRole('heading', { level: 1, name: 'Éditeur de vitrine' })).toBeFocused();
  await expect(content.locator('.showcase-editor__sidebar nav li')).toHaveCount(12);
  await expect(
    content.locator('input[type="file"], input[type="email"], input[type="tel"]'),
  ).toHaveCount(0);
  await expect(
    content.getByRole('button', { name: /Soumettre|Publier|Modérer|Téléverser|Restaurer/ }),
  ).toHaveCount(0);
  await expect(content).not.toContainText(/SOMACOP|BICIM|RCCM|NIF|@|\+223/);

  const name = page.getByLabel('Nom fictif');
  await name.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Slug de démonstration')).toBeFocused();

  const tagline = page.getByLabel('Phrase de présentation fictive');
  await tagline.fill('Phrase fictive enregistrée dans le navigateur');
  await expect(page.getByText('Brouillon local enregistré dans ce navigateur.')).toBeVisible();
  await page.reload();
  await expect(tagline).toHaveValue('Phrase fictive enregistrée dans le navigateur');

  await name.fill('');
  await page.getByRole('button', { name: 'Vérifier le brouillon' }).click();
  await expect(page.locator('.showcase-editor__validation cnpm-alert')).toContainText(
    'Brouillon incomplet',
  );
  await expect(page.locator('.showcase-editor__validation')).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await name.fill('Atelier Kanu — entreprise fictive');
  await expect(page.getByText('Brouillon local enregistré dans ce navigateur.')).toBeVisible();
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], showcaseApiCalls: [] });
});

test('MP-016 — aperçu privé conforme, noindex, URL viewport et aucune action sensible', async ({
  page,
}) => {
  const errors = observeErrors(page);
  await openPreview(page);

  const content = page.locator('.showcase-preview');
  await expect(page.getByRole('heading', { level: 1, name: 'Aperçu de la vitrine' })).toBeFocused();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(content.getByText('Badge CNPM non attribué')).toBeVisible();
  await expect(content.getByText('Section masquée — consentement absent')).toBeVisible();
  await expect(content.locator('.showcase-template img, input, textarea')).toHaveCount(0);
  await expect(content.locator('a[href^="http"], a[href^="mailto"], a[href^="tel"]')).toHaveCount(
    0,
  );
  await expect(
    content.getByRole('button', { name: /Soumettre|Publier|Modérer|Téléverser/ }),
  ).toHaveCount(0);
  await expect(content).not.toContainText(/SOMACOP|BICIM|RCCM|NIF|@|\+223/);

  await page.getByRole('button', { name: 'Mobile' }).click();
  await expect(page).toHaveURL(/viewport=mobile/);
  await expect(page.locator('.showcase-preview__frame--mobile')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mobile' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expectNoAxeViolation(page);
  expect(errors).toEqual({ consoleErrors: [], pageErrors: [], showcaseApiCalls: [] });
});

for (const width of [320, 360, 768, 1280]) {
  test(`MP-015/016 — responsive, axe et captures à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 700 ? 900 : 960 });
    await openEditor(page);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    const previewLink = page.getByRole('link', { name: 'Ouvrir l’aperçu privé' }).first();
    expect((await previewLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(40);
    await page.screenshot({ path: testInfo.outputPath(`mp-015-editor-${width}.png`) });
    await page.locator('#showcase-editor-identity').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`mp-015-editor-form-${width}.png`) });

    const viewport = width <= 360 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
    await openPreview(page, viewport);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolation(page);
    await page.screenshot({ path: testInfo.outputPath(`mp-016-preview-${width}.png`) });
  });
}

test('MP-015/016 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  for (const path of ['/member/showcase/edit', '/member/showcase/preview?viewport=mobile']) {
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
