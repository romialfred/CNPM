import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  LucideBuilding2,
  LucideChartNoAxesCombined,
  LucideClipboardCheck,
  LucideFileBadge,
  LucideHandshake,
  LucideLayoutDashboard,
  LucideMegaphone,
  LucideMessagesSquare,
  LucideReceiptText,
  LucideSettings,
  LucideUsers,
  LucideWalletCards,
} from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../../design-system/icon/icon';
import type { AdminNavIconName } from './admin-nav';

/**
 * Correspondance entre une rubrique de navigation et son pictogramme.
 *
 * Applique le mapping de `docs/ui-handoff/docs/01-foundations/iconography.md`. Deux
 * écarts, tous deux contraints par la bibliothèque et non par un choix de design :
 *
 * - le mapping désigne `FileBadge2` pour les cotisations ; ce nom n'existe plus dans
 *   Lucide 1.x, où `FileBadge` lui succède ;
 * - le mapping ne couvre ni « Tableau de bord » ni « Groupements » ; `LayoutDashboard`
 *   et `Handshake` sont retenus, à confirmer avec UX-DEC-009.
 *
 * L'aiguillage est explicite plutôt que dynamique : les composants Lucide portent un
 * sélecteur d'attribut sur `svg`, et une instanciation dynamique créerait l'hôte via
 * `createElement` au lieu de `createElementNS` — l'élément naîtrait hors de l'espace
 * de noms SVG et ne se peindrait pas.
 *
 * Chaque pictogramme est décoratif : Lucide pose `aria-hidden="true"` en l'absence de
 * `title`, et le libellé de la rubrique porte seul le nom accessible.
 */
@Component({
  selector: 'cnpm-admin-nav-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideBuilding2,
    LucideChartNoAxesCombined,
    LucideClipboardCheck,
    LucideFileBadge,
    LucideHandshake,
    LucideLayoutDashboard,
    LucideMegaphone,
    LucideMessagesSquare,
    LucideReceiptText,
    LucideSettings,
    LucideUsers,
    LucideWalletCards,
  ],
  template: `
    @switch (name()) {
      @case ('dashboard') {
        <svg lucideLayoutDashboard [size]="size"></svg>
      }
      @case ('members') {
        <svg lucideUsers [size]="size"></svg>
      }
      @case ('companies') {
        <svg lucideBuilding2 [size]="size"></svg>
      }
      @case ('enrolments') {
        <svg lucideClipboardCheck [size]="size"></svg>
      }
      @case ('contributions') {
        <svg lucideFileBadge [size]="size"></svg>
      }
      @case ('payments') {
        <svg lucideWalletCards [size]="size"></svg>
      }
      @case ('receipts') {
        <svg lucideReceiptText [size]="size"></svg>
      }
      @case ('reminders') {
        <svg lucideMegaphone [size]="size"></svg>
      }
      @case ('requests') {
        <svg lucideMessagesSquare [size]="size"></svg>
      }
      @case ('groups') {
        <svg lucideHandshake [size]="size"></svg>
      }
      @case ('reporting') {
        <svg lucideChartNoAxesCombined [size]="size"></svg>
      }
      @case ('administration') {
        <svg lucideSettings [size]="size"></svg>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class AdminNavIconComponent {
  readonly name = input.required<AdminNavIconName>();
  protected readonly size = CNPM_ICON_SIZE.navigation;
}
