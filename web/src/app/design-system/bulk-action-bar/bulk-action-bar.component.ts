import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Barre d'actions groupées — `BulkActionBar` (DAT-004).
 *
 * Exigence d'accessibilité du catalogue : le nombre d'éléments sélectionnés doit être
 * annoncé. La région vit en permanence dans le DOM et n'est jamais montée à la volée :
 * une région `aria-live` créée en même temps que son contenu n'est pas annoncée, le
 * lecteur d'écran n'ayant rien observé changer.
 *
 * La fiche BO-002 impose une portée de sélection explicite — page ou tous les
 * résultats. La barre affiche donc toujours ce sur quoi une action groupée porterait,
 * plutôt que de laisser croire qu'elle vise l'ensemble du jeu filtré.
 */
@Component({
  selector: 'cnpm-bulk-action-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="cnpm-bulk" [class.cnpm-bulk--active]="selectedCount() > 0">
      <p class="cnpm-bulk__count" role="status" aria-live="polite">
        @if (selectedCount() === 0) {
          Aucune ligne sélectionnée
        } @else {
          {{ selectedCount() | number }}
          {{ selectedCount() === 1 ? 'ligne sélectionnée' : 'lignes sélectionnées' }}
          sur cette page
        }
      </p>
      @if (selectedCount() > 0) {
        <div class="cnpm-bulk__actions">
          <ng-content />
        </div>
      }
    </div>
  `,
  styleUrl: './bulk-action-bar.component.scss',
})
export class BulkActionBarComponent {
  readonly selectedCount = input.required<number>();
}
