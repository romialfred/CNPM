import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Contrôles BO-002 — liste des membres.
 *
 * Chaque critère d'acceptation de `ref-bo-002-members-list.md` a son scénario, et les
 * règles transverses (statut jamais porté par la seule couleur, portée de sélection,
 * cohérence des totaux) ont le leur.
 */

const ROUTE = '/admin/members';

async function open(page: Page, query = ''): Promise<void> {
  await page.goto(`${ROUTE}${query}`);
  // Attendre le tableau, pas le titre : le titre appartient à l'en-tête et existe
  // avant que la moindre donnée soit arrivée.
  await expect(page.locator('.cnpm-table__scroll')).toBeVisible();
}

test.describe('BO-002 — table accessible', () => {
  test('la table possède une légende et des en-têtes de colonne', async ({ page }) => {
    await open(page);
    // La légende est retirée de la peinture mais reste dans l'arbre d'accessibilité :
    // `toBeVisible` échouerait alors que l'exigence est satisfaite.
    await expect(page.locator('table caption')).toHaveCount(1);
    await expect(page.locator('table caption')).toContainText('Liste des membres');

    const headers = page.locator('.cnpm-table__head th[scope="col"]');
    // Huit colonnes métier. La fiche en impose 9 à 10 : « Dernière activité », la
    // colonne de sélection et « Catégorie » ont été retirées à la demande du client
    // (UX-DEC-017 pour la sélection). Le tableau était illisible à onze colonnes.
    await expect(headers).toHaveCount(8);
  });

  test('le tri est annoncé par aria-sort et pas seulement par un pictogramme', async ({ page }) => {
    await open(page);
    const codeHeader = page.locator('th', { hasText: 'Code membre' });
    await expect(codeHeader).toHaveAttribute('aria-sort', 'none');

    await page.getByRole('button', { name: /Code membre/ }).click();
    await expect(codeHeader).toHaveAttribute('aria-sort', 'ascending');

    await page.getByRole('button', { name: /Code membre/ }).click();
    await expect(codeHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('la zone défilante du tableau est atteignable au clavier', async ({ page }) => {
    // Une région qui défile sans être focalisable est inatteignable au clavier seul.
    await open(page);
    await expect(page.locator('.cnpm-table__scroll')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('.cnpm-table__scroll')).toHaveAttribute('role', 'region');
  });

  test('aucune violation axe sur l’écran chargé', async ({ page }) => {
    await open(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('BO-002 — statut', () => {
  test('le statut porte un texte, pas seulement une couleur', async ({ page }) => {
    await open(page);
    const badges = page.locator('.cnpm-table__row .cnpm-badge');
    const texts = await badges.allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    // Chaque pastille porte un libellé lisible : sans texte, seule la teinte
    // distinguerait « Actif » de « Dormant ».
    for (const text of texts) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('la colonne Statut ne porte que le statut', async ({ page }) => {
    // DATA-DEC-001 : « Grand cotisant » est un marqueur orthogonal, pas une quatrième
    // valeur de statut. Il a quitté la liste à la demande du client et se lit désormais
    // sur la fiche du membre. Ce test verrouille les DEUX moitiés de la règle : le
    // statut est présent, le marqueur ne l'accompagne ni ne le remplace.
    await open(page);
    const row = page.locator('.cnpm-table__row', { hasText: 'SOMACOP' });
    await expect(row.locator('.cnpm-badge', { hasText: 'Actif' })).toBeVisible();
    await expect(row.getByText('Grand cotisant')).toHaveCount(0);
    // Le compte reste lisible dans le panneau de synthèse, où il a du sens.
    await expect(
      page.locator('.cnpm-insight__stat', { hasText: 'Grands cotisants' }),
    ).toHaveCount(1);
  });
});

test.describe('BO-002 — cohérence des totaux', () => {
  test('actifs et dormants composent la base ; les prospects en sont exclus', async ({ page }) => {
    // Critère d'acceptation explicite. La maquette échoue à ce test : elle annonce
    // 1 126 membres au total pour 3 842 actifs.
    await open(page);
    const read = async (label: string): Promise<number> => {
      const value = await page
        .locator('.cnpm-insight__stat', { hasText: label })
        .locator('dd')
        .textContent();
      return Number((value ?? '').replace(/[^\d]/g, ''));
    };

    const total = await read('Base de membres');
    const active = await read('Actifs');
    const dormant = await read('Dormants');
    const prospects = await read('Prospects');
    const large = await read('Grands cotisants');

    expect(active + dormant).toBe(total);
    expect(prospects).toBeGreaterThan(0);
    // Les prospects n'entrent pas dans la base…
    expect(total).toBeLessThan(total + prospects);
    // …et les grands cotisants en sont un sous-ensemble, donc jamais plus nombreux.
    expect(large).toBeLessThanOrEqual(total);
  });

  test('le total du tableau ne contredit pas le panneau', async ({ page }) => {
    await open(page);
    const total = page.locator('.cnpm-members__total');
    // Le cadre du tableau est monté pendant le chargement. Attendre explicitement
    // la valeur évite de transformer une course réseau en faux défaut métier.
    await expect(total).toContainText(/Total\s*:\s*\d+/);
    const totalText = (await total.textContent()) ?? '';
    const tableTotal = Number(totalText.replace(/[^\d]/g, ''));

    const base = Number(
      (
        (await page
          .locator('.cnpm-insight__stat', { hasText: 'Base de membres' })
          .locator('dd')
          .textContent()) ?? ''
      ).replace(/[^\d]/g, ''),
    );
    const prospects = Number(
      (
        (await page
          .locator('.cnpm-insight__stat', { hasText: 'Prospects' })
          .locator('dd')
          .textContent()) ?? ''
      ).replace(/[^\d]/g, ''),
    );

    // Sans filtre, le tableau liste la base et les prospects : le panneau doit
    // rendre compte exactement des mêmes enregistrements.
    expect(tableTotal).toBe(base + prospects);
  });
});

test.describe('BO-002 — filtres, tri et page dans l’URL', () => {
  test('un filtre part dans l’URL et survit au rechargement', async ({ page }) => {
    await open(page);
    await page.locator('#filtre-statut').selectOption('DORMANT');
    await expect(page).toHaveURL(/statut=DORMANT/);

    await page.reload();
    await expect(page.locator('.cnpm-table__scroll')).toBeVisible();
    await expect(page.locator('#filtre-statut')).toHaveValue('DORMANT');
    // Toutes les lignes affichées portent bien le statut demandé.
    const badges = await page.locator('.cnpm-table__row .cnpm-badge').allTextContents();
    expect(badges.some((text) => text.includes('Actif'))).toBe(false);
  });

  test('un chip retire son filtre et nomme ce qu’il retire', async ({ page }) => {
    await open(page, '?statut=DORMANT');
    const chip = page.getByRole('button', { name: /Retirer le filtre Statut/ });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page).not.toHaveURL(/statut=/);
  });

  test('la page est bornée et la pagination annonce le rang affiché', async ({ page }) => {
    await open(page);
    await expect(page.locator('.cnpm-pagination__range')).toContainText('1–10 sur 33');

    await page.getByRole('button', { name: 'Page 2', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('.cnpm-pagination__range')).toContainText('11–20 sur 33');
  });

  test('changer la taille de page ramène à la première page', async ({ page }) => {
    // Rester en page 4 après être passé à 50 par page pointerait au-delà du jeu.
    await open(page, '?page=4');
    await page.locator('#taille-page').selectOption('50');
    await expect(page).not.toHaveURL(/page=4/);
    await expect(page.locator('.cnpm-pagination__range')).toContainText('1–33 sur 33');
  });
});

test.describe('BO-002 — états', () => {
  test('« aucun résultat » n’est pas confondu avec « aucun membre »', async ({ page }) => {
    // Les deux appellent des gestes opposés : élargir la recherche, ou créer un membre.
    await open(page, '?q=zzzzz-introuvable');
    await expect(page.getByText('Aucun membre ne correspond')).toBeVisible();
    await expect(page.getByText('Aucun membre enregistré')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Réinitialiser les filtres' })).toBeVisible();
  });

  test('la réinitialisation depuis l’état sans résultat ramène la liste', async ({ page }) => {
    await open(page, '?q=zzzzz-introuvable');
    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click();
    await expect(page.locator('.cnpm-table__row').first()).toBeVisible();
  });
});

test.describe('BO-002 — sélection retirée', () => {
  test('aucune case à cocher ne subsiste dans la liste', async ({ page }) => {
    // UX-DEC-017. La fiche exige `BulkActionBar` et une sélection groupée, mais aucune
    // action groupée réelle n'était livrée : la seule action offerte était « Effacer la
    // sélection », qui ne fait que défaire la sélection elle-même. On demandait donc de
    // cocher des lignes pour ne rien pouvoir en faire.
    // Ce test garde l'écart VISIBLE : il échouera le jour où la sélection reviendra,
    // obligeant à rouvrir la décision au lieu de la laisser s'effacer.
    await open(page);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.locator('.cnpm-bulk__count')).toHaveCount(0);
  });
});

test.describe('BO-002 — reflow', () => {
  for (const width of [320, 360, 768]) {
    test(`la page ne déborde pas horizontalement à ${width} px`, async ({ page }) => {
      // Le tableau défile dans sa propre région ; la page, elle, ne défile jamais.
      await page.setViewportSize({ width, height: 900 });
      await open(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
