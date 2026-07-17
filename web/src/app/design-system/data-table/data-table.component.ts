import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { LucideArrowDown, LucideArrowUp, LucideArrowUpDown } from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../icon/icon';
import type { DataTableColumn, DataTableState, SortDirection, SortState } from './data-table.model';

export interface DataTableRowContext<T> {
  readonly $implicit: T;
  readonly index: number;
}

/**
 * Tableau de données du design system — `DataTable` (DAT-001).
 *
 * Exigences d'accessibilité du catalogue : `caption`, en-têtes et état de tri.
 * Le composant fournit la structure, l'état de tri et la sélection ; les cellules
 * restent à la charge de l'appelant, qui seul connaît le formatage de son domaine.
 *
 * Composant de présentation pur : il ne trie pas et ne filtre pas. Le tri est
 * demandé par événement et exécuté à la source, faute de quoi un tri sur la page
 * courante ne trierait que la page — un mensonge sur un jeu paginé.
 */
@Component({
  selector: 'cnpm-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, LucideArrowDown, LucideArrowUp, LucideArrowUpDown],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  /**
   * Résumé du tableau. Obligatoire : `caption` est le seul moyen d'annoncer à un
   * lecteur d'écran ce que contient la grille avant d'y entrer.
   */
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly DataTableColumn[]>();
  readonly rows = input.required<readonly T[]>();
  readonly state = input<DataTableState>('ready');
  readonly sort = input<SortState | null>(null);

  readonly selectable = input(false);
  readonly selectedKeys = input<ReadonlySet<string>>(new Set<string>());
  /** Extrait la clé de sélection d'une ligne ; sans elle, la sélection est impossible. */
  readonly rowKey = input<(row: T) => string>(() => '');
  readonly rowLabel = input<(row: T) => string>(() => '');

  readonly sortChange = output<SortState>();
  readonly rowToggle = output<string>();
  readonly allToggle = output<boolean>();

  protected readonly rowTemplate =
    contentChild.required<TemplateRef<DataTableRowContext<T>>>('row');

  protected readonly iconSize = CNPM_ICON_SIZE;

  protected readonly columnCount = computed(
    () => this.columns().length + (this.selectable() ? 1 : 0),
  );

  protected readonly allSelected = computed(() => {
    const rows = this.rows();
    if (rows.length === 0) {
      return false;
    }
    const selected = this.selectedKeys();
    const key = this.rowKey();
    return rows.every((row) => selected.has(key(row)));
  });

  /**
   * Sélection partielle. Un `indeterminate` visuel sans état annoncé laisserait
   * croire à « rien de sélectionné » : la case porte aussi `aria-checked="mixed"`.
   */
  protected readonly someSelected = computed(() => {
    const rows = this.rows();
    const selected = this.selectedKeys();
    const key = this.rowKey();
    const count = rows.filter((row) => selected.has(key(row))).length;
    return count > 0 && count < rows.length;
  });

  protected ariaSort(column: DataTableColumn): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) {
      return null;
    }
    const sort = this.sort();
    if (!sort || sort.key !== column.key) {
      return 'none';
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected isSorted(column: DataTableColumn): boolean {
    return this.sort()?.key === column.key;
  }

  protected sortDirection(column: DataTableColumn): SortDirection | null {
    const sort = this.sort();
    return sort && sort.key === column.key ? sort.direction : null;
  }

  protected isRowSelected(row: T): boolean {
    return this.selectedKeys().has(this.rowKey()(row));
  }

  protected requestSort(column: DataTableColumn): void {
    if (!column.sortable) {
      return;
    }
    const current = this.sort();
    const direction: SortDirection =
      current && current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key: column.key, direction });
  }

  protected toggleRow(row: T): void {
    this.rowToggle.emit(this.rowKey()(row));
  }

  protected toggleAll(): void {
    this.allToggle.emit(!this.allSelected());
  }
}
