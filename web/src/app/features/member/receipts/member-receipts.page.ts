import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type { DataTableColumn } from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  FilterBarComponent,
  type FilterChip,
} from '../../../design-system/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { memberReceiptStatusLabel, memberReceiptStatusTone } from './member-receipt-presenter';
import {
  MEMBER_RECEIPTS_GATEWAY,
  type MemberReceiptQuery,
  type MemberReceiptSort,
  type MemberReceiptStatus,
  type MemberReceiptSummary,
} from './member-receipts-gateway';

const PAGE_SIZES = [5, 10, 20] as const;
const STATUSES: readonly MemberReceiptStatus[] = [
  'DEMONSTRATION_AVAILABLE',
  'DEMONSTRATION_CANCELLED',
];
const SORTS: readonly MemberReceiptSort[] = ['scenarioDate', 'reference', 'amountXof'];

type ReceiptListState = 'loading' | 'ready' | 'empty' | 'no-result' | 'error' | 'unavailable';

/** MP-007 — collection d’aperçus fictifs en lecture seule pour le membre courant. */
@Component({
  selector: 'cnpm-member-receipts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-receipts.page.html',
  styleUrl: './member-receipts.page.scss',
})
export class MemberReceiptsPage {
  private readonly gateway = inject(MEMBER_RECEIPTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statuses = STATUSES;
  protected readonly filtersExpanded = signal(true);
  protected readonly filterForm = this.formBuilder.group({
    search: '',
    status: '',
    exercise: '',
    sortOption: 'scenarioDate:desc',
  });
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Aperçu fictif' },
    { key: 'periodLabel', label: 'Période' },
    { key: 'scenarioDate', label: 'Date du scénario' },
    { key: 'amountXof', label: 'Montant du scénario' },
    { key: 'status', label: 'Statut' },
    { key: 'action', label: 'Aperçu' },
  ];

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly search = computed(() => this.params().get('q')?.trim() ?? '');
  protected readonly status = computed(() => known(this.params().get('statut'), STATUSES));
  protected readonly exercise = computed(() => {
    const value = Number(this.params().get('exercice'));
    return Number.isInteger(value) && value >= 2000 && value <= 2100 ? value : null;
  });
  protected readonly sort = computed<MemberReceiptSort>(
    () => known(this.params().get('tri'), SORTS) ?? 'scenarioDate',
  );
  protected readonly direction = computed<'asc' | 'desc'>(() =>
    this.params().get('ordre') === 'asc' ? 'asc' : 'desc',
  );
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const value = positiveInteger(this.params().get('taille'), 5);
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : 5;
  });
  private readonly query = computed<MemberReceiptQuery>(() => ({
    search: this.search(),
    status: this.status() ?? undefined,
    exercise: this.exercise() ?? undefined,
    sort: this.sort(),
    direction: this.direction(),
    page: this.page(),
    size: this.pageSize(),
  }));
  private readonly retryTick = signal(0);
  private readonly restoreResultsFocus = signal(false);
  private readonly resultsTitle = viewChild<ElementRef<HTMLElement>>('resultsTitle');
  private readonly pageHeader = viewChild(PageHeaderComponent);
  private initialPageFocusPending = true;
  private readonly fetchTrigger = computed(() => ({
    query: this.query(),
    retry: this.retryTick(),
  }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.list(query).pipe(
          map((page) => ({ kind: 'ready' as const, page })),
          catchError((error: unknown) =>
            of(
              error instanceof UnavailableHttpFeatureError
                ? { kind: 'unavailable' as const }
                : { kind: 'error' as const },
            ),
          ),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly data = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.page : null;
  });
  protected readonly receipts = computed(() => this.data()?.items ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalElements ?? 0);
  protected readonly exercises = computed(
    () => this.data()?.availableExercises ?? ([2026, 2025, 2024] as const),
  );
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.status() || this.exercise()),
  );
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.status()) {
      chips.push({ key: 'statut', label: `Statut : ${memberReceiptStatusLabel(this.status()!)}` });
    }
    if (this.exercise()) {
      chips.push({ key: 'exercice', label: `Exercice : ${this.exercise()}` });
    }
    return chips;
  });
  protected readonly state = computed<ReceiptListState>(() => {
    const result = this.result();
    if (result.kind !== 'ready') return result.kind;
    if (result.page.items.length > 0) return 'ready';
    return this.hasFilters() ? 'no-result' : 'empty';
  });
  protected readonly detailQueryParams = computed(() => ({
    q: this.search() || null,
    statut: this.status(),
    exercice: this.exercise(),
    tri: this.sort(),
    ordre: this.direction(),
    page: this.page(),
    taille: this.pageSize(),
  }));

  protected readonly rowKey = (receipt: MemberReceiptSummary): string => receipt.id;
  protected readonly statusLabel = memberReceiptStatusLabel;
  protected readonly statusTone = memberReceiptStatusTone;

  constructor() {
    effect(() => {
      this.filterForm.setValue(
        {
          search: this.search(),
          status: this.status() ?? '',
          exercise: this.exercise()?.toString() ?? '',
          sortOption: `${this.sort()}:${this.direction()}`,
        },
        { emitEvent: false },
      );
    });

    effect(() => {
      const result = this.result();
      if (result.kind !== 'ready') return;
      const lastPage = Math.max(1, result.page.totalPages);
      if (this.page() > lastPage) {
        this.patch({ page: lastPage });
        return;
      }
      if (this.restoreResultsFocus()) {
        this.restoreResultsFocus.set(false);
        queueMicrotask(() => this.resultsTitle()?.nativeElement.focus());
      } else if (this.initialPageFocusPending) {
        this.initialPageFocusPending = false;
        afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
      }
    });
  }

  protected applyFilters(): void {
    const values = this.filterForm.getRawValue();
    const [sort, direction] = values.sortOption.split(':');
    const exercise = Number(values.exercise);
    this.restoreResultsFocus.set(true);
    this.patch({
      q: values.search.trim() || null,
      statut: known(values.status, STATUSES),
      exercice: Number.isInteger(exercise) && exercise > 0 ? exercise : null,
      tri: known(sort ?? null, SORTS) ?? 'scenarioDate',
      ordre: direction === 'asc' ? 'asc' : 'desc',
      page: 1,
    });
  }

  protected removeFilter(key: string): void {
    this.restoreResultsFocus.set(true);
    this.patch({ [key]: null, page: 1 });
  }

  protected resetFilters(): void {
    this.restoreResultsFocus.set(true);
    this.patch({ q: null, statut: null, exercice: null, page: 1 });
  }

  protected onPageChange(page: number): void {
    this.restoreResultsFocus.set(true);
    this.patch({ page });
  }

  protected onPageSizeChange(size: number): void {
    this.restoreResultsFocus.set(true);
    this.patch({ page: 1, taille: size });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patch(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function known<T extends string>(value: string | null, values: readonly T[]): T | null {
  return value && (values as readonly string[]).includes(value) ? (value as T) : null;
}
