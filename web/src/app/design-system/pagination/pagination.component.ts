import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronsLeft,
  LucideChevronsRight,
} from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../icon/icon';

/** Ellipse rendue entre deux plages de pages non contiguës. */
const GAP = '…' as const;
type PageSlot = number | typeof GAP;

/**
 * Pagination du design system — `Pagination` (NAV-008).
 *
 * Composant de présentation pur : il ne découpe aucune collection, il annonce une
 * position et demande un déplacement. Le découpage appartient à la source, sinon la
 * page 2 d'un jeu paginé côté serveur n'existerait que dans le navigateur.
 */
@Component({
  selector: 'cnpm-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    LucideChevronLeft,
    LucideChevronRight,
    LucideChevronsLeft,
    LucideChevronsRight,
  ],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  /** Page courante, indexée à partir de 1 comme elle est lue. */
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly gap = GAP;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
  );

  protected readonly isFirst = computed(() => this.page() <= 1);
  protected readonly isLast = computed(() => this.page() >= this.totalPages());

  /** Rang du premier élément affiché, à partir de 1 ; 0 si la collection est vide. */
  protected readonly rangeStart = computed(() =>
    this.totalItems() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalItems()),
  );

  /**
   * Fenêtre de pages : première, dernière, courante et ses voisines immédiates.
   * Au-delà de quelques dizaines de pages, tout énumérer produit une barre plus
   * large que l'écran — le critère de reflow à 320 px l'interdit.
   */
  protected readonly slots = computed<readonly PageSlot[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, total, current]);
    for (const offset of [-1, 1]) {
      const neighbour = current + offset;
      if (neighbour > 1 && neighbour < total) {
        pages.add(neighbour);
      }
    }

    const ordered = [...pages].sort((a, b) => a - b);
    const slots: PageSlot[] = [];
    let previous = 0;
    for (const value of ordered) {
      if (previous && value - previous > 1) {
        slots.push(GAP);
      }
      slots.push(value);
      previous = value;
    }
    return slots;
  });

  protected goTo(page: number): void {
    const target = Math.min(Math.max(page, 1), this.totalPages());
    if (target !== this.page()) {
      this.pageChange.emit(target);
    }
  }

  protected changePageSize(value: string): void {
    const size = Number(value);
    if (Number.isFinite(size) && size > 0) {
      this.pageSizeChange.emit(size);
    }
  }
}
