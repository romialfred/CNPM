import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CAPTURE_DIR = process.env.CNPM_PUBLIC_INFO_CAPTURE_DIR;

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function fillContact(page: Page): Promise<void> {
  await page.getByLabel('Nom fictif').fill('Awa Démo');
  await page.getByLabel('Organisation fictive').fill('Entreprise Démo Sahel');
  await page.getByLabel('Adresse e-mail fictive').fill('awa@cnpm.invalid');
  await page.getByLabel('Objet fictif').fill('Question de démonstration');
  await page.getByLabel('Message fictif').fill('Ceci est un message local et entièrement fictif.');
}

async function fieldBorderContrastRatios(page: Page): Promise<readonly number[]> {
  return page.locator('.contact-field input, .contact-field textarea').evaluateAll((fields) => {
    const channels = (color: string): readonly number[] =>
      (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (color: string): number => {
      const normalized = channels(color).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2];
    };
    const contrast = (first: string, second: string): number => {
      const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
      return (light + 0.05) / (dark + 0.05);
    };
    return fields.map((field) => {
      const style = getComputedStyle(field);
      return contrast(style.borderTopColor, style.backgroundColor);
    });
  });
}

test.describe('PUB-014/PUB-016 — contact local et documents légaux', () => {
  test('valide localement le contact, efface les champs et ne transmet rien', async ({ page }) => {
    const businessRequests: string[] = [];
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.startsWith('/v1/') || pathname.startsWith('/api/')) {
        businessRequests.push(request.url());
      }
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.getByText('Aucun envoi officiel')).toBeVisible();
    for (const label of [
      'Nom fictif',
      'Adresse e-mail fictive',
      'Objet fictif',
      'Message fictif',
    ]) {
      const field = page.getByLabel(label);
      await expect(field).toHaveAttribute('required', '');
      await expect(field).toHaveAttribute('aria-required', 'true');
    }

    await page.getByRole('button', { name: 'Tester le formulaire local' }).click();
    await expect(page.locator('.cnpm-error-summary')).toBeFocused();
    await expect(page.getByLabel('Nom fictif')).toHaveAttribute('aria-invalid', 'true');
    await page
      .locator('.cnpm-error-summary')
      .getByRole('link', { name: /Nom fictif/ })
      .click();
    await expect(page.getByLabel('Nom fictif')).toBeFocused();

    await fillContact(page);
    await page.getByRole('button', { name: 'Tester le formulaire local' }).click();
    await expect(page.locator('.contact-success')).toBeFocused();
    await expect(page.getByText('Toutes les valeurs saisies ont été effacées')).toBeVisible();
    await expect(page.getByLabel('Nom fictif')).toHaveValue('');
    await expect(page.getByLabel('Adresse e-mail fictive')).toHaveValue('');
    await expect(page.getByLabel('Message fictif')).toHaveValue('');

    expect(businessRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
    const storageKeys = await page.evaluate(() => [
      ...Object.keys(localStorage),
      ...Object.keys(sessionStorage),
    ]);
    expect(storageKeys.filter((key) => /contact|message/i.test(key))).toEqual([]);
  });

  test('respecte le contraste des champs et l’ordre des actions sur desktop', async ({ page }) => {
    await page.goto('/contact');
    const defaultRatios = await fieldBorderContrastRatios(page);
    expect(Math.min(...defaultRatios)).toBeGreaterThanOrEqual(3);

    const secondary = page.getByRole('button', { name: 'Effacer les champs' });
    const primary = page.getByRole('button', { name: 'Tester le formulaire local' });
    const [secondaryBox, primaryBox] = await Promise.all([
      secondary.boundingBox(),
      primary.boundingBox(),
    ]);
    expect(secondaryBox).not.toBeNull();
    expect(primaryBox).not.toBeNull();
    expect(secondaryBox!.x).toBeLessThan(primaryBox!.x);

    await primary.click();
    const invalidRatios = await fieldBorderContrastRatios(page);
    expect(Math.min(...invalidRatios)).toBeGreaterThanOrEqual(3);
  });

  test('parcourt les statuts légaux sans contenu juridique inventé', async ({ page }) => {
    await page.goto('/legal/mentions-legales');
    await expect(page.getByRole('heading', { level: 1, name: 'Mentions légales' })).toBeFocused();
    await expect(page.getByText('Document non publié')).toBeVisible();
    await expect(page.getByText('Version officielle')).toBeVisible();

    const privacy = page.getByRole('navigation', { name: 'Documents légaux' }).getByRole('link', {
      name: 'Confidentialité',
    });
    await privacy.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/legal\/confidentialite$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Politique de confidentialité' }),
    ).toBeFocused();
    await expect(
      page.getByText('Les durées de conservation ne sont pas encore publiées'),
    ).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Documents légaux' })
      .getByRole('link', { name: 'Conditions d’utilisation' })
      .click();
    await expect(page).toHaveURL(/\/legal\/conditions-utilisation$/);
    await expect(page.getByText('Droit applicable et entrée en vigueur')).toBeVisible();
  });

  test('ne présente aucune violation axe sur le contact et la confidentialité', async ({
    page,
  }) => {
    await page.goto('/contact');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.goto('/legal/confidentialite');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test('borne un slug légal hostile, focalise le H1 et conserve axe/reflow', async ({ page }) => {
    const longSlug = `document-${'tres-long-et-inconnu-'.repeat(50)}`;
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/legal/${longSlug}`);

    await expect(
      page.getByRole('heading', { level: 1, name: 'Document légal introuvable' }),
    ).toBeFocused();
    const renderedReference = page.locator('.legal-not-found strong');
    await expect(renderedReference).toContainText('…');
    expect((await renderedReference.textContent())?.length ?? 0).toBeLessThanOrEqual(64);
    await expectNoHorizontalOverflow(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  for (const width of [320, 360, 390, 430]) {
    for (const route of ['/contact', '/legal/confidentialite']) {
      test(`${route} reste sans débordement horizontal à ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await expectNoHorizontalOverflow(page);
        if (route === '/contact') {
          const [actionBox, primaryBox] = await Promise.all([
            page.locator('.contact-actions').boundingBox(),
            page.getByRole('button', { name: 'Tester le formulaire local' }).boundingBox(),
          ]);
          expect(actionBox).not.toBeNull();
          expect(primaryBox).not.toBeNull();
          expect(Math.abs(primaryBox!.x - actionBox!.x)).toBeLessThanOrEqual(1);
          expect(Math.abs(primaryBox!.width - actionBox!.width)).toBeLessThanOrEqual(1);
        }
      });
    }
  }

  for (const route of ['/contact', '/legal/confidentialite']) {
    test(`${route} conserve le reflow à un zoom CSS de 200 %`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(route);
      await page.addStyleTag({ content: 'html { zoom: 2; }' });
      await expectNoHorizontalOverflow(page);
    });
  }

  test('produit les captures de preuve demandées', async ({ page }) => {
    test.skip(!CAPTURE_DIR, 'CNPM_PUBLIC_INFO_CAPTURE_DIR non défini');
    const target = path.resolve(CAPTURE_DIR!);
    await mkdir(target, { recursive: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/contact');
    await page.screenshot({ path: path.join(target, 'PUB-014-1440x900.png'), fullPage: true });

    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/contact');
    await page.screenshot({ path: path.join(target, 'PUB-014-320x900.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/legal/confidentialite');
    await page.screenshot({ path: path.join(target, 'PUB-016-1440x900.png'), fullPage: true });

    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/legal/mentions-legales');
    await page.screenshot({ path: path.join(target, 'PUB-016-360x900.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/contact');
    await page.screenshot({ path: path.join(target, 'PUB-014-390x900.png'), fullPage: true });

    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto('/legal/conditions-utilisation');
    await page.screenshot({ path: path.join(target, 'PUB-016-430x900.png'), fullPage: true });
  });
});
