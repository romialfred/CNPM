import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DEMO_PASSWORD, fillCredentials, startChallenge, SUSPENDED_EMAIL } from './auth-flow';

/**
 * Contrôles axe des écrans réellement implémentés.
 *
 * Les écrans pilotes restants (PUB-001, PUB-006, BO-002) ne sont pas listés : leurs
 * routes n'existent pas et la redirection de repli les ferait auditer contre la page
 * d'accueil provisoire — un test vert qui ne vérifierait rien.
 */

async function expectNoBlockingViolation(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
  expect(blocking).toEqual([]);
}

test('axe PUB-001 — accueil public', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoBlockingViolation(page);
});

test('axe AUTH-001 — saisie des identifiants', async ({ page }) => {
  await page.goto('/auth/login');
  await expectNoBlockingViolation(page);
});

test('axe AUTH-001 — identifiants refusés', async ({ page }) => {
  await page.goto('/auth/login');
  await fillCredentials(page, 'inconnu@cnpm.example', 'mauvais');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expectNoBlockingViolation(page);
});

test('axe AUTH-001 — accès non autorisé', async ({ page }) => {
  // État implémenté mais jusqu'ici jamais audité : un état atteignable et non testé
  // est un angle mort, pas une absence de risque.
  await page.goto('/auth/login');
  await fillCredentials(page, SUSPENDED_EMAIL, DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('Accès non autorisé')).toBeVisible();
  await expectNoBlockingViolation(page);
});

test('axe AUTH-001 — vérification 2FA', async ({ page }) => {
  // Le défi doit être amorcé par le parcours réel : une navigation directe vers
  // /auth/verify affiche l'état « session expirée », et l'audit ne porterait alors
  // pas sur le formulaire OTP qu'il prétend couvrir.
  await startChallenge(page);
  await expect(page.getByRole('group', { name: /Code de vérification/ })).toBeVisible();
  await expectNoBlockingViolation(page);
});

test('axe PUB-006 — vitrine publique membre', async ({ page }) => {
  await page.goto('/membres/somacop-sa');
  await expect(page.getByRole('heading', { level: 1, name: 'SOMACOP SA' })).toBeVisible();
  await expectNoBlockingViolation(page);
});

test('axe PUB-006 — vitrine non publiée', async ({ page }) => {
  await page.goto('/membres/somacop-sa-brouillon');
  await expect(page.getByText('Vitrine non publiée')).toBeVisible();
  await expectNoBlockingViolation(page);
});

test('axe PUB-006 — vitrine introuvable', async ({ page }) => {
  await page.goto('/membres/inconnu');
  await expect(page.getByText('Vitrine introuvable')).toBeVisible();
  await expectNoBlockingViolation(page);
});

test('axe AUTH-001 — session de connexion expirée', async ({ page }) => {
  // Sans défi actif, l'écran bascule en repli. L'alerte est ici de ton « warning »,
  // donc role="status" et non role="alert".
  await page.goto('/auth/verify');
  await expect(page.getByText('Session de connexion expirée')).toBeVisible();
  await expectNoBlockingViolation(page);
});
