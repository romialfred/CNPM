import { expect, test } from '@playwright/test';

/**
 * Contrôles PUB-006 que ni axe ni le build ne couvrent : statut de publication,
 * indexation, sections vides et attribution du contenu.
 */

test.describe('PUB-006 — publication et indexation', () => {
  test('une vitrine publiée est indexable et porte son SEO', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    await expect(page.getByRole('heading', { level: 1, name: 'SOMACOP SA' })).toBeVisible();

    await expect(page).toHaveTitle('SOMACOP SA - Membre du CNPM');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(robots).toBe('index,follow');
    expect(description).toContain('SOMACOP SA');
  });

  test('une vitrine non publiée n’est jamais indexée', async ({ page }) => {
    // Le contenu d'un brouillon ne doit pas fuiter, et le moteur ne doit pas le
    // référencer : sans cette garde, une vitrine en préparation deviendrait publique.
    await page.goto('/membres/somacop-sa-brouillon');
    await expect(page.getByText('Vitrine non publiée')).toBeVisible();

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toBe('noindex,nofollow');
    await expect(page.getByRole('heading', { level: 1, name: 'SOMACOP SA' })).toHaveCount(0);
    await expect(page.getByText('contact@somacop.example')).toHaveCount(0);
  });

  test('une vitrine introuvable n’est jamais indexée', async ({ page }) => {
    await page.goto('/membres/inconnu');
    await expect(page.getByText('Vitrine introuvable')).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toBe('noindex,nofollow');
  });
});

test.describe('PUB-006 — composition', () => {
  test('aucune section vide n’est rendue', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // La fiche proscrit les espaces morts : toute section rendue doit porter du
    // contenu, et toute définition affichée doit avoir une valeur.
    const emptySections = await page.evaluate(() => {
      const offenders: string[] = [];
      document.querySelectorAll('section').forEach((section) => {
        const body = section.querySelector('dl, ul, p:not(.cnpm-showcase__section-title)');
        if (!body || (body.textContent ?? '').trim() === '') {
          offenders.push(section.getAttribute('aria-labelledby') ?? 'section');
        }
      });
      document.querySelectorAll('dd').forEach((value) => {
        if ((value.textContent ?? '').trim() === '') {
          offenders.push('definition vide');
        }
      });
      return offenders;
    });
    expect(emptySections).toEqual([]);
  });

  test('la responsabilité du contenu est attribuée au membre', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    await expect(
      page.getByText('Contenu publié sous la responsabilité de SOMACOP SA.'),
    ).toBeVisible();
  });

  test('un seul titre de niveau 1', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
});

test.describe('PUB-006 — consentement des contacts', () => {
  test('aucune coordonnée n’est publiée sans consentement horodaté', async ({ page }) => {
    // `requirements.md` : « Les contacts publics nécessitent un consentement et une
    // date de vérification ». Cette vitrine-ci n'en porte pas : la section disparaît.
    // La vitrine de démonstration `somacop-sa`, elle, porte un consentement explicite
    // et publie donc ses coordonnées — les deux sens de la règle sont couverts.
    await page.goto('/membres/somacop-sa-sans-consentement');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await expect(page.getByText('accueil@somacop.example')).toHaveCount(0);
    await expect(page.getByText('+223 20 00 00 00')).toHaveCount(0);
  });

  test('les coordonnées sont publiées lorsque le consentement est horodaté', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('accueil@somacop.example').first()).toBeVisible();
  });
});

test.describe('PUB-006 — badge de vérification', () => {
  test('le badge ouvre une explication du statut, au clavier', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    const trigger = page.getByRole('button', { name: /Membre vérifié par le CNPM/ });

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.focus();
    await page.keyboard.press('Enter');

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // L'explication n'énonce que ce que le handoff établit : le statut est attribué
    // par le CNPM. Les critères relèvent d'UX-DEC-004 et ne sont pas inventés.
    await expect(page.getByText(/attribué par le CNPM/)).toBeVisible();
  });

  test('l’explication n’invente pas une date de vérification absente', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    await page.getByRole('button', { name: /Membre vérifié par le CNPM/ }).click();
    await expect(page.getByText(/date de vérification n’est pas disponible/)).toBeVisible();
  });
});

test.describe('PUB-006 — navigation locale', () => {
  test('les ancres mènent à des sections réellement rendues', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    await expect(page.getByRole('navigation', { name: 'Sections de la vitrine' })).toBeVisible();

    const orphans = await page.evaluate(() => {
      const missing: string[] = [];
      document
        .querySelectorAll<HTMLAnchorElement>('.cnpm-public__nav--desktop a[href^="#"]')
        .forEach((link) => {
          const id = link.getAttribute('href')?.slice(1) ?? '';
          if (!document.getElementById(id)) {
            missing.push(id);
          }
        });
      return missing;
    });
    expect(orphans).toEqual([]);
  });

  test('aucune ancre ne pointe vers Contact tant qu’il n’est pas publié', async ({ page }) => {
    await page.goto('/membres/somacop-sa-sans-consentement');
    const nav = page.getByRole('navigation', { name: 'Sections de la vitrine' });
    await expect(nav.getByRole('link', { name: 'Contact' })).toHaveCount(0);
  });

  test('l’ancre rend l’URL partageable', async ({ page }) => {
    await page.goto('/membres/somacop-sa');
    await page
      .getByRole('navigation', { name: 'Sections de la vitrine' })
      .getByRole('link', { name: 'Réalisations' })
      .click();
    await expect(page).toHaveURL(/#realisations$/);
  });
});

test.describe('PUB-006 — reflow', () => {
  for (const width of [320, 360]) {
    test(`aucun débordement horizontal à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/membres/somacop-sa');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
