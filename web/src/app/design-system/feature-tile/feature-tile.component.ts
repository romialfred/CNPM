import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Accents décoratifs des tuiles.
 *
 * Ils proviennent de `chart.categorical` du handoff, seule palette normative destinée à
 * différencier des éléments SANS leur prêter de sens. Les couleurs sémantiques
 * (succès, alerte, erreur) ne sont volontairement pas réutilisées telles quelles ici :
 * une tuile verte ne signifie pas « conforme », une tuile ambre ne signifie pas
 * « attention ». Le rouge de marque est exclu — il reste réservé aux actions critiques.
 */
export type CnpmTileAccent = 'indigo' | 'blue' | 'sky' | 'teal' | 'amber';

/**
 * Tuile de présentation — icône accentuée, titre, texte.
 *
 * Composant générique : aucune dépendance à un service métier. L'icône est projetée par
 * l'appelant, ce qui évite d'enfermer ici la bibliothèque d'icônes.
 */
@Component({
  selector: 'cnpm-feature-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="cnpm-tile cnpm-liftable" [class]="accentClass()">
      <span class="cnpm-tile__icon" aria-hidden="true">
        <ng-content select="[tileIcon]" />
      </span>
      <div class="cnpm-tile__body">
        <h3 class="cnpm-tile__heading">{{ heading() }}</h3>
        <p class="cnpm-tile__text"><ng-content /></p>
      </div>
      @if (image()) {
        <!-- Photo en BAS de la tuile : le texte reste en tête, l'illustration suit. -->
        <img class="cnpm-tile__media" [src]="image()" alt="" loading="lazy" />
      }
    </article>
  `,
  styleUrl: './feature-tile.component.scss',
})
export class FeatureTileComponent {
  readonly heading = input.required<string>();
  readonly accent = input<CnpmTileAccent>('indigo');
  /** Photo illustrative optionnelle, affichée en tête de tuile ; masquée si absente. */
  readonly image = input('');

  protected readonly accentClass = computed(() => `cnpm-tile--${this.accent()}`);
}
