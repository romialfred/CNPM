import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideLayoutGrid, LucideLayoutList } from '@lucide/angular';

/** Mode d'affichage d'une liste : tableau (« liste ») ou tuiles (« grille »). */
export type CnpmViewMode = 'liste' | 'grille';

/**
 * Bascule liste/tuiles — contrôle segmenté à deux boutons. Présentational et contrôlé :
 * la valeur courante entre par `value`, un changement sort par `valueChange` ; l'écran
 * porteur décide de la persistance (typiquement un paramètre d'URL, pour rester partageable).
 * L'état actif est porté par `aria-pressed`, jamais par la seule couleur.
 */
@Component({
  selector: 'cnpm-view-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideLayoutList, LucideLayoutGrid],
  template: `
    <div class="cnpm-view-toggle" role="group" [attr.aria-label]="label()">
      <button
        type="button"
        class="cnpm-view-toggle__btn"
        [class.cnpm-view-toggle__btn--active]="value() === 'liste'"
        [attr.aria-pressed]="value() === 'liste'"
        (click)="select('liste')"
      >
        <svg lucideLayoutList aria-hidden="true"></svg>
        <span class="cnpm-view-toggle__label">Liste</span>
      </button>
      <button
        type="button"
        class="cnpm-view-toggle__btn"
        [class.cnpm-view-toggle__btn--active]="value() === 'grille'"
        [attr.aria-pressed]="value() === 'grille'"
        (click)="select('grille')"
      >
        <svg lucideLayoutGrid aria-hidden="true"></svg>
        <span class="cnpm-view-toggle__label">Tuiles</span>
      </button>
    </div>
  `,
  styleUrl: './view-toggle.component.scss',
})
export class ViewToggleComponent {
  readonly value = input<CnpmViewMode>('liste');
  readonly label = input('Affichage de la liste');
  readonly valueChange = output<CnpmViewMode>();

  protected select(mode: CnpmViewMode): void {
    if (mode !== this.value()) {
      this.valueChange.emit(mode);
    }
  }
}
