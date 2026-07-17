import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Carte de réalisation d'une vitrine membre (`ShowcaseProjectCard` du catalogue).
 *
 * Le titre est rendu au niveau de titre demandé par l'appelant : une carte ne peut
 * pas décider seule de sa place dans la hiérarchie du document.
 */
@Component({
  selector: 'cnpm-showcase-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="cnpm-project">
      @if (category()) {
        <p class="cnpm-project__category">{{ category() }}</p>
      }
      <h3 class="cnpm-project__title">{{ title() }}</h3>
      @if (summary()) {
        <p class="cnpm-project__summary">{{ summary() }}</p>
      }
    </article>
  `,
  styleUrl: './showcase-project-card.component.scss',
})
export class ShowcaseProjectCardComponent {
  readonly title = input.required<string>();
  readonly summary = input<string>();
  readonly category = input<string>();
}
