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
import { FormsModule } from '@angular/forms';
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
import { contributionStatusLabel, contributionStatusTone } from './member-contribution-presenter';
import {
  MEMBER_CONTRIBUTIONS_GATEWAY,
  type MemberContributionQuery,
  type MemberContributionSort,
  type MemberContributionStatus,
  type SortDirection,
} from './member-contributions-gateway';

const PAGE_SIZES = [3, 5, 10] as const;
const DEFAULT_PAGE_SIZE = 3;
const STATUSES: readonly MemberContributionStatus[] = [
  'A_ECHOIR',
  'EN_RETARD',
  'PARTIELLE',
  'REGLEE',
];
const SORTS: readonly MemberContributionSort[] = ['dueDate', 'reference', 'status'];

type ContributionsViewState =
  'loading' | 'ready' | 'empty' | 'no-results' | 'unavailable' | 'error';

/** MP-002 — consultation read-only des cotisations du membre courant. */
@Component({
  selector: 'cnpm-member-contributions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
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
  templateUrl: './member-contributions.page.html',
  styleUrl: './member-contributions.page.scss',
})
export class MemberContributionsPage {
  private readonly gateway = inject(MEMBER_CONTRIBUTIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statuses = STATUSES;
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence' },
    { key: 'exercise', label: 'Exercice' },
    { key: 'dueDate', label: 'Échéance' },
    { key: 'calledAmount', label: 'Montant fourni' },
    { key: 'paidAmount', label: 'Affecté' },
    { key: 'outstandingAmount', label: 'Solde fourni' },
    { key: 'status', label: 'Statut' },
    { key: 'action', label: 'Détail' },
  ];

  protected readonly filtersExpanded = signal(true);
  protected readonly draftStatus = signal('');
  protected readonly draftExercise = signal('');
  protected readonly draftSort = signal<MemberContributionSort>('dueDate');
  protected readonly draftDirection = signal<SortDirection>('desc');

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly page = computed(() => {
    const value = Number(this.params().get('page'));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });
  protected readonly pageSize = computed(() => {
    const value = Number(this.params().get('taille'));
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_PAGE_SIZE;
  });
  protected readonly selectedStatus = computed<MemberContributionStatus | undefined>(() => {
    const value = this.params().get('statut') as MemberContributionStatus | null;
    return value && STATUSES.includes(value) ? value : undefined;
  });
  protected readonly selectedExercise = computed<number | undefined>(() => {
    const value = Number(this.params().get('exercice'));
    return Number.isInteger(value) && value >= 2000 && value <= 2100 ? value : undefined;
  });
  protected readonly selectedSort = computed<MemberContributionSort>(() => {
    const value = this.params().get('tri') as MemberContributionSort | null;
    return value && SORTS.includes(value) ? value : 'dueDate';
  });
  protected readonly selectedDirection = computed<SortDirection>(() =>
    this.params().get('ordre') === 'asc' ? 'asc' : 'desc',
  );

  private readonly query = computed<MemberContributionQuery>(() => ({
    status: this.selectedStatus(),
    exercise: this.selectedExercise(),
    sort: this.selectedSort(),
    direction: this.selectedDirection(),
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
  protected readonly contributions = computed(() => this.data()?.items ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalElements ?? 0);
  protected readonly exercises = computed(
    () => this.data()?.availableExercises ?? ([2026, 2025, 2024] as const),
  );
  protected readonly hasActiveFilters = computed(() =>
    Boolean(this.selectedStatus() || this.selectedExercise()),
  );
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const status = this.selectedStatus();
    const exercise = this.selectedExercise();
    if (status) chips.push({ key: 'statut', label: `Statut : ${contributionStatusLabel(status)}` });
    if (exercise) chips.push({ key: 'exercice', label: `Exercice : ${exercise}` });
    return chips;
  });
  protected readonly state = computed<ContributionsViewState>(() => {
    const result = this.result();
    if (result.kind === 'loading') return 'loading';
    if (result.kind === 'error') return 'error';
    if (result.kind === 'unavailable') return 'unavailable';
    if (result.page.items.length > 0) return 'ready';
    return this.hasActiveFilters() ? 'no-results' : 'empty';
  });
  protected readonly detailQueryParams = computed(() => ({
    statut: this.selectedStatus() ?? null,
    exercice: this.selectedExercise() ?? null,
    tri: this.selectedSort(),
    ordre: this.selectedDirection(),
    page: this.page(),
    taille: this.pageSize(),
  }));

  protected readonly rowKey = (item: { readonly id: string }): string => item.id;
  protected readonly statusLabel = contributionStatusLabel;
  protected readonly statusTone = contributionStatusTone;

  constructor() {
    effect(() => {
      this.draftStatus.set(this.selectedStatus() ?? '');
      this.draftExercise.set(this.selectedExercise()?.toString() ?? '');
      this.draftSort.set(this.selectedSort());
      this.draftDirection.set(this.selectedDirection());
    });

    effect(() => {
      const result = this.result();
      if (result.kind !== 'ready') return;
      const lastPage = Math.max(1, result.page.totalPages);
      if (this.page() > lastPage) {
        this.patchUrl({ page: lastPage });
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
    const exercise = Number(this.draftExercise());
    this.restoreResultsFocus.set(true);
    this.patchUrl({
      statut: this.draftStatus() || null,
      exercice: Number.isInteger(exercise) && exercise > 0 ? exercise : null,
      tri: this.draftSort(),
      ordre: this.draftDirection(),
      page: 1,
    });
  }

  protected removeFilter(key: string): void {
    this.restoreResultsFocus.set(true);
    this.patchUrl({ [key]: null, page: 1 });
  }

  protected resetFilters(): void {
    this.restoreResultsFocus.set(true);
    this.patchUrl({ statut: null, exercice: null, page: 1 });
  }

  protected onPageChange(page: number): void {
    this.restoreResultsFocus.set(true);
    this.patchUrl({ page });
  }

  protected onPageSizeChange(size: number): void {
    this.restoreResultsFocus.set(true);
    this.patchUrl({ page: 1, taille: size });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patchUrl(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
