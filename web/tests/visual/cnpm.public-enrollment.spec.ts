import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CAPTURE_DIR = process.env.CNPM_ENROLLMENT_CAPTURE_DIR;

async function fillEnterprise(page: Page): Promise<void> {
  await page.getByLabel('Raison sociale fictive').fill('Entreprise Démo Sahel');
  await page.getByLabel('Nom commercial fictif').fill('Démo Sahel');
  await page.getByLabel('Forme juridique déclarée').fill('Forme fictive');
  await page.getByLabel('Référence RCCM de démonstration').fill('DEMO-RCCM-001');
  await page.getByLabel('Référence NIF de démonstration').fill('DEMO-NIF-001');
}

async function fillContact(page: Page): Promise<void> {
  await page.getByLabel('Nom du contact fictif').fill('Awa Démo');
  await page.getByLabel('Adresse e-mail fictive').fill('contact@demo.invalid');
  await page.getByLabel('Téléphone fictif').fill('DEMO-TELEPHONE');
}

async function reachConfirmation(page: Page): Promise<void> {
  await fillEnterprise(page);
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await fillContact(page);
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await page.getByRole('button', { name: 'Créer la confirmation locale' }).click();
}

test.describe('PUB-012/PUB-013 — adhésion publique fictive', () => {
  test('valide le parcours local, l’URL des étapes et l’absence de soumission', async ({
    page,
  }) => {
    const businessRequests: string[] = [];
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/v1/') || url.pathname.startsWith('/api/')) {
        businessRequests.push(request.url());
      }
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto('/adhesion');
    await expect(page).toHaveURL(/\/adhesion\?etape=entreprise$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();

    await page.getByRole('button', { name: 'Étape suivante' }).click();
    await expect(page.locator('.cnpm-error-summary')).toBeFocused();
    await expect(page.getByLabel('Raison sociale fictive')).toHaveAttribute('aria-invalid', 'true');
    await page
      .locator('.cnpm-error-summary')
      .getByRole('link', { name: /Raison sociale fictive/ })
      .click();
    await expect(page.getByLabel('Raison sociale fictive')).toBeFocused();

    await fillEnterprise(page);
    await page.getByRole('button', { name: 'Étape suivante' }).click();
    await expect(page).toHaveURL(/etape=contact/);
    await fillContact(page);
    await page.getByRole('button', { name: 'Étape suivante' }).click();
    await expect(page).toHaveURL(/etape=pieces/);
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await expect(page.getByText('GED et analyse antivirus')).toBeVisible();

    await page.getByRole('button', { name: 'Étape suivante' }).click();
    await expect(page).toHaveURL(/etape=verification/);
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Créer la confirmation locale' }).click();

    await expect(page).toHaveURL(/\/adhesion\/confirmation\?reference=DEMO-ADH-2026-001$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.getByText('Aucun dossier officiel créé')).toBeVisible();
    await expect(page.getByText('DEMO-ADH-2026-001')).toBeVisible();
    expect(businessRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);

    const storageKeys = await page.evaluate(() => [
      ...Object.keys(localStorage),
      ...Object.keys(sessionStorage),
    ]);
    expect(storageKeys.filter((key) => /adh|enroll/i.test(key))).toEqual([]);
  });

  test('permet de parcourir les étapes au clavier', async ({ page }) => {
    await page.goto('/adhesion?etape=entreprise');
    const contactStep = page.locator('.enrollment-step button').nth(1);
    await contactStep.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/etape=contact/);
    await expect(contactStep).toHaveAttribute('aria-current', 'step');
  });

  test('protège la sortie et ne restaure aucune confirmation après accès direct', async ({
    page,
  }) => {
    await page.goto('/adhesion?etape=entreprise');
    await page.getByLabel('Raison sociale fictive').fill('Entreprise Démo incomplète');
    await page.locator('.cnpm-public__brand-link').click();
    await expect(page).toHaveURL(/\/adhesion\?etape=entreprise$/);
    await expect(page.locator('.enrollment-exit')).toBeFocused();
    await page.getByRole('button', { name: 'Rester sur la page' }).click();
    await expect(page.getByLabel('Raison sociale fictive')).toHaveValue(
      'Entreprise Démo incomplète',
    );

    await page.goto('/adhesion/confirmation?reference=DEMO-ADH-2026-001');
    await expect(
      page.getByRole('heading', { name: 'Aucune confirmation locale disponible' }),
    ).toBeVisible();
  });

  test('ne présente aucune violation axe sur le formulaire et la confirmation', async ({
    page,
  }) => {
    await page.goto('/adhesion?etape=entreprise');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await reachConfirmation(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  for (const width of [320, 360]) {
    test(`reste sans débordement horizontal à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/adhesion?etape=entreprise');
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test('conserve le reflow à un zoom CSS de 200 %', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/adhesion?etape=entreprise');
    await page.addStyleTag({ content: 'html { zoom: 2; }' });
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  test('produit les captures de preuve demandées', async ({ page }) => {
    test.skip(!CAPTURE_DIR, 'CNPM_ENROLLMENT_CAPTURE_DIR non défini');
    const target = path.resolve(CAPTURE_DIR!);
    await mkdir(target, { recursive: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/adhesion?etape=entreprise');
    await page.screenshot({ path: path.join(target, 'PUB-012-1440x900.png'), fullPage: true });

    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/adhesion?etape=pieces');
    await page.screenshot({ path: path.join(target, 'PUB-012-320x900.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/adhesion?etape=entreprise');
    await reachConfirmation(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await page.screenshot({ path: path.join(target, 'PUB-013-1440x900.png'), fullPage: true });
  });
});
