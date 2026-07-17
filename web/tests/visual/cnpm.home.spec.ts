import { expect, test } from '@playwright/test';

/**
 * Contrôles PUB-001. Le défaut qui a motivé ce fichier : le pipe de formatage
 * échouait faute de locale enregistrée, et les cartes de chiffres s'affichaient
 * VIDES — sans erreur visible, sans échec de build. Seul le rendu réel le montrait.
 */

test.describe('PUB-001 — chiffres clés', () => {
  test('les chiffres sont réellement rendus et formatés', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => consoleErrors.push(String(error)));

    await page.goto('/');
    // Attendre la liste, pas le `h1` : le titre appartient au hero et est présent
    // immédiatement, alors que les chiffres arrivent en asynchrone. La liste porte une
    // bordure, donc une taille : elle est visible même si les valeurs sont vides — le
    // défaut reste détectable par l'assertion qui suit.
    await expect(page.locator('.cnpm-home__metric-list')).toBeVisible();

    const values = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.cnpm-home__metric-value')).map((node) =>
        (node.textContent ?? '').trim(),
      ),
    );

    expect(values.length).toBeGreaterThan(0);
    // Aucune carte vide : c'est exactement le mode de défaillance observé.
    expect(values.filter((value) => value === '')).toEqual([]);
    // Les valeurs viennent des fixtures : 4 968 membres, 78,47 % de recouvrement.
    expect(values.join(' ')).toContain('4');
    expect(consoleErrors).toEqual([]);
  });

  test('la date d’arrêté est annoncée honnêtement quand la source ne la porte pas', async ({
    page,
  }) => {
    // La fiche exige d'afficher la date de mise à jour ; la fixture ne la porte pas.
    // On annonce le caractère indicatif plutôt que d'inventer une fraîcheur.
    await page.goto('/');
    await expect(page.getByText(/date d’arrêté n’est pas encore publiée/)).toBeVisible();
  });
});

test.describe('PUB-001 — composition', () => {
  test('le titre et le CTA sont visibles sans défilement à 1440x900', async ({ page }) => {
    // Critère d'acceptation explicite de la fiche PUB-001.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    const cta = page.getByRole('link', { name: 'Accéder à mon espace' });
    await expect(heading).toBeInViewport();
    await expect(cta).toBeInViewport();
  });

  test('un seul titre de niveau 1', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('aucun contenu institutionnel fabriqué', async ({ page }) => {
    // Les sections sans source (actualités, témoignages, partenaires, newsletter) ne
    // sont pas rendues : les remplir reviendrait à inventer du contenu institutionnel.
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Actualités' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Témoignages' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Partenaires' })).toHaveCount(0);
  });
});

test.describe('PUB-001 — reflow', () => {
  for (const width of [320, 360]) {
    test(`aucun débordement horizontal à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
