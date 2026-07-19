import { DecimalPipe } from '@angular/common';
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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import {
  unavailableFeature$,
  UnavailableHttpFeatureError,
} from '../../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../../design-system/alert/alert.component';
import {
  BadgeComponent,
  type CnpmBadgeTone,
} from '../../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../../design-system/button/button.component';
import { DataTableComponent } from '../../../../design-system/data-table/data-table.component';
import type { DataTableColumn } from '../../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../design-system/error-state/error-state.component';
import {
  FilterBarComponent,
  type FilterChip,
} from '../../../../design-system/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../../layout/admin-shell/admin-shell.component';
import {
  RECOVERY_GATEWAY,
  RecoveryAccessError,
  type CommunicationAuthorization,
  type PledgeStatus,
  type RecoveryActionKind,
  type RecoveryActionRow,
  type RecoveryActionSortKey,
  type RecoveryActionStatus,
  type RecoveryActionsQuery,
  type RecoverySuspensionKind,
} from '../recovery-gateway';

const KINDS: readonly RecoveryActionKind[] = ['EMAIL', 'SMS', 'CALL', 'VISIT', 'MEETING'];
const STATUSES: readonly RecoveryActionStatus[] = [
  'DUE_TODAY',
  'PLANNED',
  'OVERDUE',
  'SUSPENDED',
  'BLOCKED_CONSENT',
];
const SUSPENSIONS: readonly RecoverySuspensionKind[] = ['DISPUTE', 'PROMISE'];
const SORTS: readonly RecoveryActionSortKey[] = ['scheduledAt', 'organization', 'kind', 'status'];
const PAGE_SIZES = [5, 10, 25] as const;
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});
const DAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' });

@Component({
  selector: 'cnpm-recovery-actions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormsModule,
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
  templateUrl: './recovery-actions.page.html',
  styleUrl: './recovery-actions.page.scss',
})
export class RecoveryActionsPage {
  private readonly gateway = inject(RECOVERY_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly retryTick = signal(0);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly kinds = KINDS;
  protected readonly statuses = STATUSES;
  protected readonly suspensions = SUSPENSIONS;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly filtersExpanded = signal(true);
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly kindDraft = signal(
    known(this.route.snapshot.queryParamMap.get('type'), KINDS) ?? '',
  );
  protected readonly statusDraft = signal(
    known(this.route.snapshot.queryParamMap.get('statut'), STATUSES) ?? '',
  );
  protected readonly suspensionDraft = signal(
    known(this.route.snapshot.queryParamMap.get('suspension'), SUSPENSIONS) ?? '',
  );
  protected readonly sortDraft = signal(initialSort(this.route.snapshot.queryParamMap));
  private readonly detailTitle = viewChild<ElementRef<HTMLHeadingElement>>('detailTitle');
  private readonly detailFocusRequest = signal<{ readonly id: string } | null>(null);
  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly kind = computed(() => known(this.params().get('type'), KINDS));
  protected readonly status = computed(() => known(this.params().get('statut'), STATUSES));
  protected readonly suspension = computed(() =>
    known(this.params().get('suspension'), SUSPENSIONS),
  );
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const value = positiveInteger(this.params().get('taille'), 5);
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : 5;
  });
  protected readonly sortKey = computed(
    () => known(this.params().get('tri'), SORTS) ?? 'scheduledAt',
  );
  protected readonly sortDirection = computed(() =>
    this.params().get('ordre') === 'desc' ? ('desc' as const) : ('asc' as const),
  );
  private readonly query = computed<RecoveryActionsQuery>(() => ({
    search: this.search(),
    kind: this.kind(),
    status: this.status(),
    suspension: this.suspension(),
    sort: { key: this.sortKey(), direction: this.sortDirection() },
    page: this.page(),
    pageSize: this.pageSize(),
  }));
  private readonly trigger = computed(() => ({ query: this.query(), retry: this.retryTick() }));
  private readonly result = toSignal(
    toObservable(this.trigger).pipe(
      switchMap(({ query }) =>
        (this.gateway.searchActions?.(query) ?? unavailableFeature$('BO-019')).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) => {
            if (error instanceof RecoveryAccessError) return of({ kind: 'forbidden' as const });
            if (error instanceof UnavailableHttpFeatureError) {
              return of({ kind: 'unavailable' as const });
            }
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed(() => {
    const result = this.result();
    if (result.kind !== 'ready') return result.kind;
    if (result.data.items.length > 0) return 'ready' as const;
    return this.hasFilters() ? ('noResult' as const) : ('empty' as const);
  });
  protected readonly items = computed<readonly RecoveryActionRow[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.items : [];
  });
  protected readonly totalItems = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.totalItems : 0;
  });
  protected readonly overview = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.overview : null;
  });
  protected readonly selected = computed(() => {
    const id = this.params().get('selection');
    return id ? (this.items().find((item) => item.id === id) ?? null) : null;
  });
  private readonly synchronizeDrafts = effect(() => {
    const params = this.params();
    this.searchDraft.set(params.get('q') ?? '');
    this.kindDraft.set(known(params.get('type'), KINDS) ?? '');
    this.statusDraft.set(known(params.get('statut'), STATUSES) ?? '');
    this.suspensionDraft.set(known(params.get('suspension'), SUSPENSIONS) ?? '');
    this.sortDraft.set(initialSort(params));
  });
  private readonly clampOutOfRangePage = effect(() => {
    const result = this.result();
    if (result.kind !== 'ready') return;

    const lastPage = Math.max(1, Math.ceil(result.data.totalItems / this.pageSize()));
    if (this.page() > lastPage) {
      this.patch({ page: lastPage === 1 ? null : lastPage, selection: null });
    }
  });
  private readonly focusRequestedDetail = effect(() => {
    const request = this.detailFocusRequest();
    const item = this.selected();
    const title = this.detailTitle();
    if (request?.id === item?.id && title) {
      title.nativeElement.focus();
    }
  });
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.kind() || this.status() || this.suspension()),
  );
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.kind()) chips.push({ key: 'type', label: `Action : ${this.kindLabel(this.kind()!)}` });
    if (this.status()) {
      chips.push({ key: 'statut', label: `Statut : ${this.statusLabel(this.status()!)}` });
    }
    if (this.suspension()) {
      chips.push({
        key: 'suspension',
        label: `Suspension : ${this.suspensionLabel(this.suspension()!)}`,
      });
    }
    return chips;
  });
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'scheduledAt', label: 'Échéance' },
    { key: 'case', label: 'Dossier fictif' },
    { key: 'action', label: 'Action prévue' },
    { key: 'campaign', label: 'Campagne / segment' },
    { key: 'protection', label: 'Protection' },
    { key: 'status', label: 'Statut' },
    { key: 'detail', label: 'Consultation' },
  ];
  protected readonly rowKey = (row: RecoveryActionRow) => row.id;

  protected applyFilters(): void {
    const [key, direction] = this.sortDraft().split(':');
    this.patch({
      q: clean(this.searchDraft()),
      type: known(this.kindDraft(), KINDS),
      statut: known(this.statusDraft(), STATUSES),
      suspension: known(this.suspensionDraft(), SUSPENSIONS),
      tri: known(key ?? null, SORTS) ?? 'scheduledAt',
      ordre: direction === 'desc' ? 'desc' : 'asc',
      page: null,
      selection: null,
    });
  }

  protected select(id: string): void {
    this.detailFocusRequest.set({ id });
    this.patch({ selection: id });
  }

  protected removeChip(key: string): void {
    if (key === 'q') this.searchDraft.set('');
    if (key === 'type') this.kindDraft.set('');
    if (key === 'statut') this.statusDraft.set('');
    if (key === 'suspension') this.suspensionDraft.set('');
    this.patch({ [key]: null, page: null, selection: null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.kindDraft.set('');
    this.statusDraft.set('');
    this.suspensionDraft.set('');
    this.patch({
      q: null,
      type: null,
      statut: null,
      suspension: null,
      page: null,
      selection: null,
    });
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page, selection: null });
  }

  protected onPageSizeChange(pageSize: number): void {
    this.patch({ taille: pageSize === 5 ? null : pageSize, page: null, selection: null });
  }

  protected retry(): void {
    this.retryTick.update((value) => value + 1);
  }

  protected formatDate(value: string): string {
    return `${DATE_FORMATTER.format(new Date(value))} · Bamako`;
  }

  protected formatDay(value: string): string {
    return DAY_FORMATTER.format(new Date(`${value}T00:00:00Z`));
  }

  protected kindLabel(kind: RecoveryActionKind): string {
    return { EMAIL: 'E-mail', SMS: 'SMS', CALL: 'Appel', VISIT: 'Visite', MEETING: 'Rendez-vous' }[
      kind
    ];
  }

  protected statusLabel(status: RecoveryActionStatus): string {
    return {
      PLANNED: 'Planifiée',
      DUE_TODAY: 'À traiter aujourd’hui',
      OVERDUE: 'En retard',
      SUSPENDED: 'Suspendue',
      BLOCKED_CONSENT: 'Canal non autorisé',
    }[status];
  }

  protected statusTone(status: RecoveryActionStatus): CnpmBadgeTone {
    if (status === 'OVERDUE') return 'error';
    if (status === 'SUSPENDED' || status === 'BLOCKED_CONSENT') return 'warning';
    if (status === 'DUE_TODAY') return 'info';
    return 'neutral';
  }

  protected authorizationLabel(value: CommunicationAuthorization): string {
    return {
      AUTHORIZED_DEMO: 'Autorisé — scénario',
      BLOCKED_NO_CONSENT: 'Bloqué — consentement absent',
      NOT_APPLICABLE: 'Sans canal numérique',
    }[value];
  }

  protected suspensionLabel(value: RecoverySuspensionKind): string {
    return value === 'DISPUTE' ? 'Litige bloquant' : 'Promesse active';
  }

  protected promiseStatusLabel(status: PledgeStatus): string {
    return { PENDING: 'Active', HONOURED: 'Tenue', PARTIAL: 'Partielle', BROKEN: 'Non tenue' }[
      status
    ];
  }

  private patch(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}

function known<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function clean(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function initialSort(params: { get(name: string): string | null }): string {
  const key = known(params.get('tri'), SORTS) ?? 'scheduledAt';
  const direction = params.get('ordre') === 'desc' ? 'desc' : 'asc';
  return `${key}:${direction}`;
}
