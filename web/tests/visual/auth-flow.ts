import { expect, type Page } from '@playwright/test';

/**
 * Identifiants fictifs de l'adaptateur de démonstration
 * (`web/src/app/features/auth/demo-auth.gateway.ts`). Aucune donnée réelle de membre.
 */
export const DEMO_EMAIL = 'demo.agent@cnpm.example';
export const DEMO_PASSWORD = 'demo-pass';
export const DEMO_CODE = '123456';
/** Compte fictif permettant d'atteindre l'état « accès non autorisé ». */
export const SUSPENDED_EMAIL = 'demo.suspendu@cnpm.example';

/**
 * Amène la page à l'étape 2FA par le parcours réel.
 *
 * Indispensable pour tester l'écran de vérification : une navigation directe vers
 * `/auth/verify` n'a aucun défi actif et affiche l'état « session expirée », si bien
 * qu'un test y auditerait le repli au lieu du formulaire OTP.
 */
export async function startChallenge(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await fillCredentials(page, DEMO_EMAIL, DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page).toHaveURL(/\/auth\/verify$/);
}

/**
 * Renseigne les identifiants.
 *
 * Les champs sont ciblés par leur type plutôt que par leur label : le label visible
 * porte l'astérisque de champ requis (« Mot de passe * »), et un ciblage non exact sur
 * « Mot de passe » heurterait aussi le bouton « Afficher le mot de passe ».
 */
export async function fillCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
}
