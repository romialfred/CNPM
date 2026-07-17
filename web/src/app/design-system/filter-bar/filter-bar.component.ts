import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideChevronDown, LucideChevronUp, LucideSlidersHorizontal, LucideX } from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../icon/icon';

export interface FilterChip {
  /** Identifiant du filtre à retirer ; jamais son libellé, qui peut être ambigu. */
  readonly key: string;
  readonly label: string;
}

/**
 * Panneau de filtres — `FilterBar` (FRM-013).
 *
 * États du catalogue : `collapsed`, `expanded`, `active-filters`. Exigence
 * d'accessibilité : le nombre de filtres actifs et le libellé de retrait.
 *
 * Chaque chip nomme le filtre qu'il retire (« Retirer le filtre Statut : Actif »)
 * plutôt qu'un « Retirer » répété : une liste de boutons homonymes est inutilisable
 * dès qu'on la parcourt hors contexte visuel.
 */
@Component({
  selector: 'cnpm-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideChevronDown, LucideChevronUp, LucideSlidersHorizontal, LucideX],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
})
export class FilterBarComponent {
  readonly expanded = input(true);
  readonly chips = input<readonly FilterChip[]>([]);

  readonly expandedChange = output<boolean>();
  readonly chipRemove = output<string>();
  readonly resetAll = output<void>();

  protected readonly iconSize = CNPM_ICON_SIZE;

  protected toggle(): void {
    this.expandedChange.emit(!this.expanded());
  }
}
