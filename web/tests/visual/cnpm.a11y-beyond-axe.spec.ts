import { expect, test, type Page } from '@playwright/test';
import { DEMO_CODE, fillCredentials, startChallenge } from './auth-flow';

/**
 * Contrôles d'accessibilité qu'axe ne couvre pas.
 *
 * Un audit indépendant a trouvé trois défauts réels sur AUTH-001 alors qu'axe ne
 * signalait aucune violation : un anneau de focus à 1,27:1, un focus retombant sur le
 * `body` après chaque changement d'état, et un débordement horizontal à 320 px. Axe ne
 * vérifie ni le contraste du focus, ni la conservation du focus, ni le reflow réel.
 * Ces trois assertions ferment ces angles morts.
 */

/** Contraste WCAG entre deux couleurs `rgb(...)`. */
function contrastRatio(foreground: string, background: string): number {
  const parse = (color: string): [number, number, number] => {
    const parts = color.match(/\d+(\.\d+)?/g);
    if (!parts || parts.length < 3) {
      throw new Error(`Couleur illisible : ${color}`);
    }
    return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
  };
  const luminance = (color: string): number => {
    const [r, g, b] = parse(color).map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function focusedElementTag(page: Page): Promise<string> {
  return page.evaluate(() => document.activeElement?.tagName ?? 'NONE');
}

test.describe('Indicateur de focus (WCAG 1.4.11)', () => {
  test('chaque contrôle atteint au clavier expose un indicateur de focus visible', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    // On attend le focus initial posé par l'application : tabuler avant rendrait le
    // parcours non déterministe (la première tabulation partirait du body).
    await expect(page.locator('input[type="email"]')).toBeFocused();

    // La tabulation réelle est indispensable : `element.focus()` en script ne
    // déclenche pas `:focus-visible` sur un bouton, si bien qu'un test fondé sur le
    // focus programmatique ne mesurerait jamais l'indicateur réellement affiché.
    const inspect = () =>
      page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body) {
          return null;
        }
        // L'indicateur peut être porté par le contrôle ou par son conteneur visuel
        // (motif `:focus-within` du champ mot de passe).
        const carriers = [active, active.parentElement, active.parentElement?.parentElement].filter(
          (element): element is HTMLElement => !!element,
        );
        const visible = carriers.some((element) => {
          const style = getComputedStyle(element);
          const hasOutline =
            style.outlineStyle !== 'none' && parseFloat(style.outlineWidth || '0') >= 2;
          const focusBorder = style.borderColor.includes('82, 104, 179');
          return hasOutline || focusBorder;
        });
        return { id: `${active.tagName}.${active.className}`, visible };
      });

    const seen: string[] = [];
    const offenders: string[] = [];
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press('Tab');
      const result = await inspect();
      if (!result) {
        break;
      }
      if (seen.includes(result.id)) {
        break;
      }
      seen.push(result.id);
      if (!result.visible) {
        offenders.push(result.id);
      }
    }

    expect(seen.length).toBeGreaterThan(3);
    expect(offenders).toEqual([]);
  });

  test('le contour de focus du bouton principal atteint 3:1', async ({ page }) => {
    await page.goto('/auth/login');
    const submit = page.getByRole('button', { name: 'Se connecter' });
    await submit.focus();

    const { outlineColor, outlineWidth, pageBackground } = await submit.evaluate((node) => {
      const style = getComputedStyle(node as HTMLElement);
      return {
        outlineColor: style.outlineColor,
        outlineWidth: style.outlineWidth,
        pageBackground: getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)',
      };
    });

    expect(parseFloat(outlineWidth)).toBeGreaterThanOrEqual(2);
    const surface = pageBackground === 'rgba(0, 0, 0, 0)' ? 'rgb(255,255,255)' : pageBackground;
    expect(contrastRatio(outlineColor, surface)).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Indicateur de focus en état d’erreur (WCAG 1.4.11)', () => {
  // L'état invalide est celui où l'utilisateur a le plus besoin de savoir où il est.
  // La règle d'erreur fige `border-color` ; si l'indicateur ne reposait que sur la
  // bordure, il disparaîtrait exactement là. Ces contrôles ont été ajoutés après
  // qu'un audit a montré que le premier correctif ne traitait que l'état valide.
  const FOCUS_OUTLINE = 'rgb(39, 52, 129)'; // --cnpm-color-brand-blue-700, 11,08:1 sur blanc

  test('un champ invalide focalisé garde un contour opaque', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[type="email"]').fill('pas-un-email');
    await page.locator('input[type="email"]').blur();

    const style = await page.locator('input[type="email"]').evaluate((node) => {
      node.focus();
      const computed = getComputedStyle(node);
      return {
        invalid: node.getAttribute('aria-invalid'),
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
        outlineColor: computed.outlineColor,
      };
    });

    expect(style.invalid).toBe('true');
    expect(style.outlineStyle).toBe('solid');
    expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    expect(style.outlineColor).toBe(FOCUS_OUTLINE);
  });

  test('une case OTP invalide focalisée garde un contour opaque', async ({ page }) => {
    await startChallenge(page);
    for (let index = 1; index <= 6; index++) {
      await page.getByLabel(`Chiffre ${index} sur 6`).fill('9');
    }
    await page.getByRole('button', { name: 'Vérifier et se connecter' }).click();
    await expect(page.getByText('Code non valide')).toBeVisible();

    const style = await page.getByLabel('Chiffre 1 sur 6').evaluate((node) => {
      node.focus();
      const computed = getComputedStyle(node);
      return {
        invalid: node.getAttribute('aria-invalid'),
        outlineStyle: computed.outlineStyle,
        outlineColor: computed.outlineColor,
      };
    });

    expect(style.invalid).toBe('true');
    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineColor).toBe(FOCUS_OUTLINE);
  });

  test('le champ mot de passe invalide garde un contour sur son conteneur', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    const style = await page.locator('.cnpm-password').evaluate((node) => {
      (node.querySelector('input') as HTMLInputElement).focus();
      const computed = getComputedStyle(node);
      return { outlineStyle: computed.outlineStyle, outlineColor: computed.outlineColor };
    });

    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineColor).toBe(FOCUS_OUTLINE);
  });
});

test.describe('Conservation du focus (WCAG 2.4.3)', () => {
  test('le focus reste dans la page pendant la soumission et après une erreur', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await fillCredentials(page, 'inconnu@cnpm.example', 'mauvais');

    const submit = page.getByRole('button', { name: 'Se connecter' });
    await submit.focus();
    await submit.click();

    // Pendant l'envoi, le bouton est neutralisé par aria-disabled et non par
    // l'attribut natif : il doit conserver le focus, sinon aria-busy n'est jamais
    // annoncé et l'utilisateur clavier repart du haut du document.
    expect(await focusedElementTag(page)).not.toBe('BODY');

    await expect(page.getByRole('alert')).toBeVisible();
    expect(await focusedElementTag(page)).not.toBe('BODY');
  });

  test('le focus initial est posé sur les deux étapes', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await startChallenge(page);
    await expect(page.getByLabel('Chiffre 1 sur 6')).toBeFocused();
  });

  test('le focus revient sur la première case après un code invalide', async ({ page }) => {
    await startChallenge(page);
    for (let index = 1; index <= 6; index++) {
      await page.getByLabel(`Chiffre ${index} sur 6`).fill('9');
    }
    await page.getByRole('button', { name: 'Vérifier et se connecter' }).click();

    await expect(page.getByText('Code non valide')).toBeVisible();
    await expect(page.getByLabel('Chiffre 1 sur 6')).toBeFocused();
  });
});

test.describe('Reflow (WCAG 1.4.10)', () => {
  // 320 px est la largeur de reflow exigée par WCAG ; 360 px est le viewport
  // obligatoire VP-360 de docs/ui-handoff/data/viewports.json.
  for (const width of [320, 360]) {
    test(`aucun débordement horizontal à ${width} px sur la connexion`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/auth/login');
      // Sans cette attente, la mesure porterait sur une page encore vide : « aucun
      // débordement » serait vrai et parfaitement dénué de sens.
      await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`aucun débordement horizontal à ${width} px sur la vérification`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await startChallenge(page);
      await expect(page.getByLabel('Chiffre 1 sur 6')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('Cible tactile (règle projet : 44 à 48 px sur mobile et tablette)', () => {
  // Ne mesure PAS qu'un composant choisi : un contrôle limité aux cases OTP laissait
  // passer le bouton « Renvoyer le code » à 36 px sur le même écran — un gate taillé
  // pour réussir. On balaie donc tout contrôle interactif réellement rendu.
  //
  // Les cases à cocher natives font 20 px : leur cible est portée par le <label>
  // englobant, qui est la zone réellement cliquable.
  const measureControls = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const results: { id: string; width: number; height: number }[] = [];
      const nodes = document.querySelectorAll<HTMLElement>(
        'button, a[href], input:not([type="checkbox"]), select',
      );
      for (const node of Array.from(nodes)) {
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          continue;
        }
        results.push({
          id: `${node.tagName}.${node.className}`,
          width: rect.width,
          height: rect.height,
        });
      }
      document.querySelectorAll<HTMLElement>('label.cnpm-checkbox').forEach((label) => {
        const rect = label.getBoundingClientRect();
        results.push({ id: 'LABEL.cnpm-checkbox', width: rect.width, height: rect.height });
      });
      return results;
    });

  for (const width of [360, 390, 430, 768]) {
    test(`tous les contrôles de la connexion atteignent 44 px à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/auth/login');
      // Attente web-first avant toute mesure : `evaluate` juste après `goto`
      // s'exécuterait avant le rendu d'Angular et ne trouverait aucun contrôle.
      await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
      const controls = await measureControls(page);

      expect(controls.length).toBeGreaterThan(0);
      // Les DEUX bornes : le titre annonçait « 44 à 48 px » alors que seule la borne
      // basse était vérifiée — un onglet à 64 px passait sans être vu.
      expect(controls.filter((control) => control.height < 44)).toEqual([]);
      expect(controls.filter((control) => control.height > 48)).toEqual([]);
    });

    test(`tous les contrôles de la vérification atteignent 44 px à ${width} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await startChallenge(page);
      await expect(page.getByLabel('Chiffre 1 sur 6')).toBeVisible();
      const controls = await measureControls(page);

      expect(controls.length).toBeGreaterThan(0);
      expect(controls.filter((control) => control.height < 44)).toEqual([]);
      expect(controls.filter((control) => control.height > 48)).toEqual([]);
      // La largeur des cases OTP est le point qu'un correctif de reflow avait sacrifié.
      const cellWidth = await page
        .getByLabel('Chiffre 1 sur 6')
        .evaluate((node) => node.getBoundingClientRect().width);
      expect(cellWidth).toBeGreaterThanOrEqual(44);
    });
  }
});

test.describe('Composition normative (fiche AUTH-001)', () => {
  // La fiche impose « message de confiance 52–56 %, formulaire 44–48 % ».
  //
  // Le dénominateur est la LARGEUR DE CONTENU de la zone, gouttière comprise — pas la
  // somme des deux colonnes. Rapporter chaque colonne à leur somme rendrait la mesure
  // mathématiquement invariante (avec `54fr/46fr` elle vaudrait toujours 54/46, quelle
  // que soit la gouttière) : le contrôle ne pourrait alors jamais échouer, y compris
  // si la gouttière dévorait la mise en page. C'est précisément la gouttière qui a
  // produit l'écart initial ; le dénominateur doit donc y être sensible.
  //
  // 1672 n'est pas testé : `.cnpm-auth__main` est plafonné à `--cnpm-size-publicMax`
  // (90 rem), si bien que ce viewport rejouerait à l'identique le cas 1440.
  for (const width of [1024, 1280, 1440]) {
    test(`la répartition des deux zones respecte la fiche à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/auth/login');
      // Attente web-first : sans elle, `evaluate` peut s'exécuter avant le rendu
      // d'Angular et lire `null` — un test qui échoue par intermittence.
      await expect(page.locator('.cnpm-auth__trust')).toBeVisible();

      const ratio = await page.evaluate(() => {
        const main = document.querySelector('.cnpm-auth__main') as HTMLElement;
        const trust = document.querySelector('.cnpm-auth__trust') as HTMLElement;
        const panel = document.querySelector('.cnpm-auth__panel') as HTMLElement;
        const style = getComputedStyle(main);
        const contentWidth =
          main.getBoundingClientRect().width -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
        return {
          trust: (trust.getBoundingClientRect().width / contentWidth) * 100,
          panel: (panel.getBoundingClientRect().width / contentWidth) * 100,
        };
      });

      expect(ratio.trust).toBeGreaterThanOrEqual(52);
      expect(ratio.trust).toBeLessThanOrEqual(56);
      expect(ratio.panel).toBeGreaterThanOrEqual(44);
      expect(ratio.panel).toBeLessThanOrEqual(48);
    });
  }

  test('la carte de connexion respecte la largeur maximale de la fiche', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/login');
    await expect(page.locator('.cnpm-login')).toBeVisible();
    const cardWidth = await page
      .locator('.cnpm-login')
      .evaluate((node) => node.getBoundingClientRect().width);
    // Fiche : « Carte de connexion 600–640 px maximum ».
    expect(cardWidth).toBeLessThanOrEqual(640);
  });
});

test.describe('État hors ligne (exigé par CLAUDE.md)', () => {
  test('la perte de connexion est signalée sur la connexion', async ({ page, context }) => {
    await page.goto('/auth/login');
    await expect(page.getByText('Connexion indisponible')).toHaveCount(0);

    await context.setOffline(true);
    await expect(page.getByText('Connexion indisponible')).toBeVisible();

    // Le retour en ligne doit retirer le message : un état périmé induirait en erreur.
    await context.setOffline(false);
    await expect(page.getByText('Connexion indisponible')).toHaveCount(0);
  });

  test('la perte de connexion est signalée sur la vérification', async ({ page, context }) => {
    await startChallenge(page);
    await context.setOffline(true);
    await expect(page.getByText('Connexion indisponible')).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe('État neutralisé', () => {
  test('un bouton neutralisé est visuellement atténué', async ({ page }) => {
    await startChallenge(page);
    // `--cnpm-opacity-disabled` n'existe pas en custom property : une déclaration
    // `var(...)` invalide retomberait à 1 sans qu'aucun build ne le signale, privant
    // l'état neutralisé de tout signal visuel.
    const opacity = await page
      .getByRole('button', { name: 'Renvoyer le code' })
      .evaluate((node) => getComputedStyle(node.querySelector('.cnpm-button__label')!).opacity);
    expect(Number(opacity)).toBeLessThan(1);
  });

  test('l’atténuation ne délave pas le contour de focus du bouton neutralisé', async ({ page }) => {
    await startChallenge(page);
    // Le bouton neutralisé reste focalisable (aria-disabled) : son indicateur de focus
    // doit garder son contraste, donc l'opacité ne doit pas porter sur l'hôte.
    const hostOpacity = await page
      .getByRole('button', { name: 'Renvoyer le code' })
      .evaluate((node) => getComputedStyle(node).opacity);
    expect(Number(hostOpacity)).toBe(1);
  });
});

test.describe('Parcours nominal', () => {
  test('un code valide connecte et redirige', async ({ page }) => {
    await startChallenge(page);
    await page.getByLabel('Chiffre 1 sur 6').fill(DEMO_CODE[0]);
    for (let index = 2; index <= 6; index++) {
      await page.getByLabel(`Chiffre ${index} sur 6`).fill(DEMO_CODE[index - 1]);
    }
    await page.getByRole('button', { name: 'Vérifier et se connecter' }).click();

    await expect(page.getByText('Connexion réussie')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
