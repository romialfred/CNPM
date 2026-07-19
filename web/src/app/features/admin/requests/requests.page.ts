import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideEye } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  SortState,
} from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  FilterBarComponent,
  type FilterChip,
} from '../../../design-system/filter-bar/filter-bar.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  REQUESTS_GATEWAY,
  RequestAccessError,
  type ServiceRequestPriority,
  type ServiceRequestQuery,
  type ServiceRequestSlaState,
  type ServiceRequestSortKey,
  type ServiceRequestStatus,
  type ServiceRequestSummary,
} from './requests-gateway';

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;
const STATUSES: readonly ServiceRequestStatus[] = [
  'SUBMITTED',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_MEMBER',
  'WAITING_INTERNAL',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
];
const PRIORITIES: readonly ServiceRequestPriority[] = ['NORMAL', 'HIGH', 'URGENT'];
const SORT_KEYS: readonly ServiceRequestSortKey[] = ['submittedAt', 'targetAt', 'priority'];
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

/** BO-021 — file partageable des requêtes et réclamations. */
@Component({
  selector: 'cnpm-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    LucideEye,
    AdminShellComponent,
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
  templateUrl: './requests.page.html',
  styleUrl: './requests.page.scss',
})
export class RequestsPage {
  private readonly gateway = inject(REQUESTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly demoMode = inject(CNPM_DATA_MODE) === 'demo';
  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statuses = STATUSES;
  protected readonly priorities = PRIORITIES;
  protected readonly filtersExpanded = signal(true);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly status = computed(() => knownValue(this.params().get('statut'), STATUSES));
  protected readonly priority = computed(() =>
    knownValue(this.params().get('priorite'), PRIORITIES),
  );
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const size = positiveInteger(this.params().get('taille'), DEFAULT_PAGE_SIZE);
    return (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
  });
  protected readonly sort = computed<SortState>(() => ({
    key: knownValue(this.params().get('tri'), SORT_KEYS) ?? 'submittedAt',
    direction: this.params().get('ordre') === 'asc' ? 'asc' : 'desc',
  }));
  protected readonly sortOption = computed(() => `${this.sort().key}:${this.sort().direction}`);
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  private readonly query = computed<ServiceRequestQuery>(() => ({
    search: this.search(),
    status: this.status(),
    priority: this.priority(),
    sort: this.sort() as ServiceRequestQuery['sort'],
    page: this.page(),
    pageSize: this.pageSize(),
  }));
  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({ query: this.query(), tick: this.retryTick() }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.search(query).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) =>
            of(
              error instanceof RequestAccessError
                ? { kind: 'forbidden' as const }
                : { kind: 'error' as const },
            ),
          ),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed(() => {
    const result = this.result();
    if (result.kind !== 'ready') return result.kind;
    if (result.data.rows.length > 0) return 'ready' as const;
    return this.hasFilters() ? ('noResult' as const) : ('empty' as const);
  });
  protected readonly rows = computed<readonly ServiceRequestSummary[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.rows : [];
  });
  protected readonly totalItems = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.totalItems : 0;
  });
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.status() || this.priority()),
  );
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.status())
      chips.push({ key: 'statut', label: `Statut : ${this.statusLabel(this.status()!)}` });
    if (this.priority())
      chips.push({
        key: 'priorite',
        label: `Priorité : ${this.priorityLabel(this.priority()!)}`,
      });
    return chips;
  });

  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Dossier' },
    { key: 'submittedAt', label: 'Soumis le', sortable: true },
    { key: 'requester', label: 'Demandeur' },
    { key: 'priority', label: 'Priorité', sortable: true },
    { key: 'status', label: 'Statut' },
    { key: 'targetAt', label: 'Échéance fictive', sortable: true },
    { key: 'assignee', label: 'Responsable' },
    { key: 'actions', label: 'Actions' },
  ];
  protected readonly rowKey = (row: ServiceRequestSummary): string => row.id;

  protected applySearch(): void {
    this.patch({ q: clean(this.searchDraft()), page: null });
  }

  protected setStatus(value: string): void {
    this.patch({ statut: clean(value), page: null });
  }

  protected setPriority(value: string): void {
    this.patch({ priorite: clean(value), page: null });
  }

  protected setSortOption(value: string): void {
    const [key, direction] = value.split(':');
    if (!knownValue(key ?? null, SORT_KEYS)) return;
    this.patch({
      tri: key === 'submittedAt' ? null : key,
      ordre: direction === 'asc' ? 'asc' : null,
      page: null,
    });
  }

  protected onSortChange(sort: SortState): void {
    if (!knownValue(sort.key, SORT_KEYS)) return;
    this.patch({
      tri: sort.key === 'submittedAt' ? null : sort.key,
      ordre: sort.direction === 'desc' ? null : sort.direction,
      page: null,
    });
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(size: number): void {
    this.patch({ taille: size === DEFAULT_PAGE_SIZE ? null : size, page: null });
  }

  protected removeChip(key: string): void {
    if (key === 'q') this.searchDraft.set('');
    this.patch({ [key]: null, page: null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ q: null, statut: null, priorite: null, page: null });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected listQueryParams(): Record<string, string> {
    const params = this.params();
    return Object.fromEntries(params.keys.map((key) => [key, params.get(key) ?? '']));
  }

  protected statusLabel(value: ServiceRequestStatus): string {
    const labels: Record<ServiceRequestStatus, string> = {
      SUBMITTED: 'Soumise',
      TRIAGED: 'Qualifiée',
      ASSIGNED: 'Assignée',
      IN_PROGRESS: 'En traitement',
      WAITING_MEMBER: 'Attente membre',
      WAITING_INTERNAL: 'Attente interne',
      RESOLVED: 'Résolue',
      CLOSED: 'Clôturée',
      REOPENED: 'Rouverte',
    };
    return labels[value];
  }

  protected statusTone(value: ServiceRequestStatus): CnpmBadgeTone {
    if (value === 'CLOSED' || value === 'RESOLVED') return 'success';
    if (value === 'WAITING_MEMBER' || value === 'WAITING_INTERNAL') return 'warning';
    if (value === 'REOPENED') return 'error';
    return 'info';
  }

  protected priorityLabel(value: ServiceRequestPriority): string {
    return value === 'URGENT' ? 'Urgente' : value === 'HIGH' ? 'Haute' : 'Normale';
  }

  protected priorityTone(value: ServiceRequestPriority): CnpmBadgeTone {
    return value === 'URGENT' ? 'error' : value === 'HIGH' ? 'warning' : 'neutral';
  }

  protected slaLabel(value: ServiceRequestSlaState): string {
    const labels: Record<ServiceRequestSlaState, string> = {
      ON_TRACK: 'Dans le scénario',
      DUE_SOON: 'Échéance proche',
      OVERDUE: 'Scénario dépassé',
      NOT_APPLICABLE: 'Sans échéance',
    };
    return labels[value];
  }

  protected slaTone(value: ServiceRequestSlaState): CnpmBadgeTone {
    return value === 'OVERDUE'
      ? 'error'
      : value === 'DUE_SOON'
        ? 'warning'
        : value === 'ON_TRACK'
          ? 'success'
          : 'neutral';
  }

  protected formatDate(value: string | null): string {
    return value ? DATE_FORMATTER.format(new Date(value)) : 'Non applicable';
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

function knownValue<T extends string>(value: string | null, values: readonly T[]): T | null {
  return value && (values as readonly string[]).includes(value) ? (value as T) : null;
}
