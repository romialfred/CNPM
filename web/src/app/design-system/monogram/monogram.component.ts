import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Taille du monogramme : `md` en tableau (32 px), `lg` en tuile (44 px). */
export type MonogramSize = 'md' | 'lg';

/** Nombre de teintes douces disponibles (voir `.cnpm-avatar--{1..N}` dans `_table.scss`). */
const TINT_COUNT = 5;

/**
 * Monogramme d'identité — pastille à initiales, teintée de façon déterministe d'après le
 * nom. Purement décoratif (`aria-hidden`) : le nom lisible l'accompagne toujours à côté,
 * si bien que la pastille n'ajoute aucune information au lecteur d'écran. Réutilisé par les
 * cellules d'identité des tableaux et par les tuiles.
 */
@Component({
  selector: 'cnpm-monogram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="cnpm-avatar"
    [class]="tintClass()"
    [class.cnpm-avatar--lg]="size() === 'lg'"
    aria-hidden="true"
    >{{ initials() }}</span
  >`,
})
export class MonogramComponent {
  readonly name = input('');
  readonly size = input<MonogramSize>('md');

  protected readonly initials = computed(() => deriveInitials(this.name()));
  protected readonly tintClass = computed(() => `cnpm-avatar--${tintIndex(this.name())}`);
}

/** Jusqu'à deux initiales majuscules : premières lettres des deux premiers mots, sinon deux
 *  premières lettres du mot unique. Chiffres et symboles ignorés. */
function deriveInitials(value: string): string {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}]/gu, ''))
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return '—';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Teinte stable pour un nom donné : la somme des codes de caractères, modulo le nombre de
 *  teintes. Le même nom garde toujours la même couleur (repère visuel constant). */
function tintIndex(value: string): number {
  let sum = 0;
  for (const char of value.trim()) {
    sum += char.codePointAt(0) ?? 0;
  }
  return (sum % TINT_COUNT) + 1;
}
