import { provideLucideConfig } from '@lucide/angular';

/**
 * Normalisation des pictogrammes — `docs/ui-handoff/docs/07-implementation/icons-and-assets.md`
 * exige que « taille et trait [soient] normalisés par le wrapper `CnpmIcon` ».
 *
 * L'API de `@lucide/angular` est par icône (`<svg lucideUsers>`), ce qui préserve le
 * tree-shaking exigé par « importer uniquement les icônes utilisées ». Un wrapper
 * `<cnpm-icon name="...">` imposerait au contraire d'importer les 1 600 icônes pour
 * en résoudre une seule. La normalisation passe donc par la configuration globale,
 * qui est le point unique où taille et trait sont fixés.
 *
 * UX-DEC-009 (« valider une bibliothèque unique, proposée : Lucide ») reste ouverte,
 * mais `@lucide/angular` est déjà une dépendance déclarée du dépôt, sous licence ISC.
 * Si la bibliothèque est écartée, seul ce fichier et les balises `lucide*` changent.
 */

/**
 * Échelle de tailles de `docs/ui-handoff/docs/01-foundations/iconography.md`.
 * Aucune autre valeur n'est admise dans une feature.
 */
export const CNPM_ICON_SIZE = {
  /** Pictogramme d'accompagnement dans une table dense. */
  dense: 14,
  /** Bouton compact et métadonnée. */
  compact: 16,
  /** Contrôle standard. */
  control: 20,
  /** Navigation et actions principales. */
  navigation: 24,
  /** Illustration fonctionnelle d'un état vide. */
  empty: 32,
} as const;

export function provideCnpmIcons() {
  return provideLucideConfig({
    size: CNPM_ICON_SIZE.control,
    strokeWidth: 2,
    // La couleur suit `currentColor` : le pictogramme hérite du contraste déjà
    // vérifié sur son porteur, au lieu d'introduire une couleur non tokenisée.
    color: 'currentColor',
  });
}
