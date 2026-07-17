import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Contrôles du socle d'états (LOT 1) : AUTH-008 et les régions de toasts montées en
 * permanence. Ces briques sont réutilisées par tous les écrans ; leurs invariants
 * d'accessibilité valent d'être verrouillés une fois pour toutes.
 */

test.describe('AUTH-008 — session expirée', () => {
  test('affiche une page explicite, jamais un écran blanc', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));

    await page.goto('/auth/session-ended');
    await expect(page.getByRole('heading', { level: 1, name: 'Session expirée' })).toBeVisible();
    await expect(page.getByText(/pris fin pour des raisons de sécurité/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('propose une reconnexion qui mène à la page de connexion', async ({ page }) => {
    await page.goto('/auth/session-ended');
    await page.getByRole('link', { name: 'Se reconnecter' }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('un seul titre de niveau 1', async ({ page }) => {
    // Le cadre d'authentification porte un h2 (message de confiance) : l'état d'erreur
    // doit donc fournir le h1, sans quoi la page n'en aurait aucun.
    await page.goto('/auth/session-ended');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('aucune violation axe', async ({ page }) => {
    await page.goto('/auth/session-ended');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  for (const width of [320, 360]) {
    test(`ne déborde pas horizontalement à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/auth/session-ended');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('Toasts — régions vivantes', () => {
  test('les deux régions sont montées en permanence et vides au repos', async ({ page }) => {
    // Une région aria-live créée en même temps que son contenu n'est pas annoncée : la
    // pré-existence des régions est ce qui rend les toasts audibles.
    await page.goto('/auth/login');
    const regions = page.locator('.cnpm-toasts__region');
    await expect(regions).toHaveCount(2);
    await expect(page.locator('.cnpm-toasts__region[aria-live="polite"]')).toHaveCount(1);
    await expect(page.locator('.cnpm-toasts__region[aria-live="assertive"]')).toHaveCount(1);
    // Aucun toast n'est affiché tant qu'aucune action n'en émet.
    await expect(page.locator('.cnpm-toast')).toHaveCount(0);
  });
});
