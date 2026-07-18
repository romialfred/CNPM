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
    await expect(page.getByText(/Aucune date d'arrêté officielle n'est publiée/)).toBeVisible();
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
    // Les actualités ne sont rendues que comme contenu de démonstration explicitement
    // fictif. Témoignages et partenaires restent absents faute de consentement.
    await page.goto('/');
    await expect(page.getByText('Contenus fictifs de démonstration')).toBeVisible();
    await expect(page.getByText(/Publication fictive — aucune destination associée/)).toHaveCount(
      3,
    );
    await expect(page.getByRole('heading', { name: 'Témoignages' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Partenaires' })).toHaveCount(0);
  });
});

test.describe('PUB-001 — reflow', () => {
  for (const width of [320, 360, 768, 1024, 1440]) {
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

test.describe('PublicShell — navigation mobile', () => {
  test('le drawer piège le focus, se ferme avec Échap et restaure le déclencheur', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const trigger = page.locator('.cnpm-public__menu-button');
    await expect(trigger).toHaveAccessibleName('Ouvrir le menu');
    await trigger.click();
    const drawer = page.getByRole('dialog', { name: 'Site du CNPM' });
    await expect(drawer).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fermer le menu' })).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const portal = drawer.getByRole('link', { name: 'Accéder au portail membre' });
    await portal.focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Fermer le menu' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('le contenu arrière est inerte lorsque le drawer est ouvert', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();

    await expect(page.locator('#contenu-principal')).toHaveAttribute('inert', '');
    await expect(page.locator('.cnpm-public__footer')).toHaveAttribute('inert', '');
  });
});
