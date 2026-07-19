import {
  ChangeDetectionStrategy,
  Component,
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
import {
  memberRequestKindLabel,
  memberRequestSlaLabel,
  memberRequestSlaTone,
  memberRequestStatusLabel,
  memberRequestStatusTone,
} from './member-request-presenter';
import {
  MEMBER_REQUESTS_GATEWAY,
  type MemberRequestKind,
  type MemberRequestQuery,
  type MemberRequestSort,
  type MemberRequestStatus,
  type MemberRequestSummary,
} from './member-requests-gateway';

const PAGE_SIZES = [5, 10, 20] as const;
const STATUSES: readonly MemberRequestStatus[] = [
  'SUBMITTED',
  'IN_PROGRESS',
  'WAITING_MEMBER',
  'RESOLVED',
  'CLOSED',
];
const KINDS: readonly MemberRequestKind[] = ['REQUEST', 'CLAIM'];
const SORTS: readonly MemberRequestSort[] = ['updatedAt', 'createdAt', 'targetAt'];
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-ML', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

type ListState = 'loading' | 'ready' | 'empty' | 'no-result' | 'error' | 'unavailable';

/** MP-009 — liste membre partageable des requêtes et réclamations. */
@Component({
  selector: 'cnpm-member-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MemberPortalShellComponent,
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
  templateUrl: './member-requests.page.html',
  styleUrl: './member-requests.page.scss',
})
export class MemberRequestsPage {
  private readonly gateway = inject(MEMBER_REQUESTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statuses = STATUSES;
  protected readonly kinds = KINDS;
  protected readonly filtersExpanded = signal(true);
  protected readonly filterForm = this.formBuilder.group({
    search: '',
    status: '',
    kind: '',
    sortOption: 'updatedAt:desc',
  });
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Dossier' },
    { key: 'subject', label: 'Objet' },
    { key: 'updatedAt', label: 'Dernière mise à jour' },
    { key: 'status', label: 'Statut' },
    { key: 'targetAt', label: 'Délai cible' },
    { key: 'action', label: 'Détail' },
  ];

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly search = computed(() => this.params().get('q')?.trim() ?? '');
  protected readonly status = computed(() => known(this.params().get('statut'), STATUSES));
  protected readonly kind = computed(() => known(this.params().get('type'), KINDS));
  protected readonly sort = computed<MemberRequestSort>(
    () => known(this.params().get('tri'), SORTS) ?? 'updatedAt',
  );
  protected readonly direction = computed<'asc' | 'desc'>(() =>
    this.params().get('ordre') === 'asc' ? 'asc' : 'desc',
  );
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const value = positiveInteger(this.params().get('taille'), 5);
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : 5;
  });
  private readonly query = computed<MemberRequestQuery>(() => ({
    search: this.search(),
    status: this.status() ?? undefined,
    kind: this.kind() ?? undefined,
    sort: this.sort(),
    direction: this.direction(),
    page: this.page(),
    size: this.pageSize(),
  }));
  private readonly retryTick = signal(0);
  private readonly restoreResultsFocus = signal(false);
  private readonly resultsTitle = viewChild<ElementRef<HTMLElement>>('resultsTitle');
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
  protected readonly requests = computed(() => this.data()?.items ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalElements ?? 0);
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.status() || this.kind()),
  );
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.status()) {
      chips.push({ key: 'statut', label: `Statut : ${memberRequestStatusLabel(this.status()!)}` });
    }
    if (this.kind()) {
      chips.push({ key: 'type', label: `Type : ${memberRequestKindLabel(this.kind()!)}` });
    }
    return chips;
  });
  protected readonly state = computed<ListState>(() => {
    const result = this.result();
    if (result.kind !== 'ready') return result.kind;
    if (result.page.items.length > 0) return 'ready';
    return this.hasFilters() ? 'no-result' : 'empty';
  });
  protected readonly detailQueryParams = computed(() => ({
    q: this.search() || null,
    statut: this.status(),
    type: this.kind(),
    tri: this.sort(),
    ordre: this.direction(),
    page: this.page(),
    taille: this.pageSize(),
  }));

  protected readonly rowKey = (request: MemberRequestSummary): string => request.id;
  protected readonly statusLabel = memberRequestStatusLabel;
  protected readonly statusTone = memberRequestStatusTone;
  protected readonly kindLabel = memberRequestKindLabel;
  protected readonly slaLabel = memberRequestSlaLabel;
  protected readonly slaTone = memberRequestSlaTone;

  constructor() {
    effect(() => {
      this.filterForm.setValue(
        {
          search: this.search(),
          status: this.status() ?? '',
          kind: this.kind() ?? '',
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
      }
    });
  }

  protected applyFilters(): void {
    const values = this.filterForm.getRawValue();
    const [sort, direction] = values.sortOption.split(':');
    this.restoreResultsFocus.set(true);
    this.patch({
      q: clean(values.search),
      statut: known(values.status, STATUSES),
      type: known(values.kind, KINDS),
      tri: known(sort ?? null, SORTS) ?? 'updatedAt',
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
    this.patch({ q: null, statut: null, type: null, page: 1 });
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

  protected formatDate(value: string | null): string {
    return value ? `${DATE_FORMATTER.format(new Date(value))} UTC` : 'Sans date cible';
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

function clean(value: string): string | null {
  return value.trim() || null;
}

function known<T extends string>(value: string | null, values: readonly T[]): T | null {
  return value && (values as readonly string[]).includes(value) ? (value as T) : null;
}
