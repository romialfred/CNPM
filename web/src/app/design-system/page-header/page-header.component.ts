import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * En-tête de page — `PageHeader` (LAY-005).
 *
 * Exigence d'accessibilité du catalogue : hiérarchie de titres. Le composant émet le
 * `h1` de la page ; `ux-ui.md` n'en admet qu'un seul, aussi ne doit-il apparaître
 * qu'une fois par écran.
 *
 * Les actions sont projetées : l'en-tête ne connaît ni les permissions ni les
 * intentions de l'écran qui l'emploie.
 */
@Component({
  selector: 'cnpm-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="cnpm-page-header">
      <div class="cnpm-page-header__text">
        <h1 class="cnpm-page-header__title">{{ title() }}</h1>
        @if (description()) {
          <p class="cnpm-page-header__description">{{ description() }}</p>
        }
      </div>
      <div class="cnpm-page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
}
