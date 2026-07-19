import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
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
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  RECEIPTS_GATEWAY,
  ReceiptAccessError,
  type ReceiptChannel,
  type ReceiptPeriod,
  type ReceiptQuery,
  type ReceiptRegistryOverview,
  type ReceiptRegistryRow,
  type ReceiptSortKey,
  type ReceiptStatus,
} from './receipts-gateway';

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;
const STATUSES: readonly ReceiptStatus[] = ['ISSUED', 'CANCELLED'];
const CHANNELS: readonly ReceiptChannel[] = ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CHECK'];
const PERIODS: readonly ReceiptPeriod[] = ['2024-T1', '2024-T2', '2024-T3', '2024-T4'];
const SORT_KEYS: readonly ReceiptSortKey[] = ['issuedAt', 'amount', 'status'];
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});
const AMOUNT_FORMATTER = new Intl.NumberFormat('fr-ML', { maximumFractionDigits: 0 });

/** BO-016 — registre de consultation des métadonnées de reçus. */
@Component({
  selector: 'cnpm-receipts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
  templateUrl: './receipts.page.html',
  styleUrl: './receipts.page.scss',
})
export class ReceiptsPage {
  private readonly gateway = inject(RECEIPTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly demoMode = inject(CNPM_DATA_MODE) === 'demo';
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statuses = STATUSES;
  protected readonly channels = CHANNELS;
  protected readonly periods = PERIODS;
  protected readonly filtersExpanded = signal(true);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly status = computed(() => knownValue(this.params().get('statut'), STATUSES));
  protected readonly channel = computed(() => knownValue(this.params().get('canal'), CHANNELS));
  protected readonly period = computed(() => knownValue(this.params().get('periode'), PERIODS));
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const size = positiveInteger(this.params().get('taille'), DEFAULT_PAGE_SIZE);
    return (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
  });
  protected readonly sort = computed<SortState>(() => ({
    key: knownValue(this.params().get('tri'), SORT_KEYS) ?? 'issuedAt',
    direction: this.params().get('ordre') === 'asc' ? 'asc' : 'desc',
  }));
  protected readonly sortOption = computed(() => `${this.sort().key}:${this.sort().direction}`);
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  private readonly query = computed<ReceiptQuery>(() => ({
    search: this.search(),
    status: this.status(),
    channel: this.channel(),
    period: this.period(),
    sort: this.sort() as ReceiptQuery['sort'],
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
          catchError((error: unknown) => {
            if (error instanceof ReceiptAccessError) return of({ kind: 'forbidden' as const });
            if (error instanceof UnavailableHttpFeatureError)
              return of({ kind: 'unavailable' as const });
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
    if (result.data.rows.length > 0) return 'ready' as const;
    return this.hasFilters() ? ('noResult' as const) : ('empty' as const);
  });
  protected readonly rows = computed<readonly ReceiptRegistryRow[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.rows : [];
  });
  protected readonly totalItems = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.totalItems : 0;
  });
  protected readonly overview = computed<ReceiptRegistryOverview | null>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.overview : null;
  });
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.status() || this.channel() || this.period()),
  );
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.status())
      chips.push({ key: 'statut', label: `Statut : ${this.statusLabel(this.status()!)}` });
    if (this.channel())
      chips.push({ key: 'canal', label: `Canal : ${this.channelLabel(this.channel()!)}` });
    if (this.period())
      chips.push({ key: 'periode', label: `Période : ${this.periodLabel(this.period()!)}` });
    return chips;
  });

  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Identifiant de démonstration' },
    { key: 'member', label: 'Membre fictif' },
    { key: 'amount', label: 'Montant', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'period', label: 'Période' },
    { key: 'issuedAt', label: 'Date du scénario', sortable: true },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'provenance', label: 'Provenance fictive' },
    { key: 'correction', label: 'Chaîne de correction' },
  ];
  protected readonly rowKey = (row: ReceiptRegistryRow): string => row.id;

  protected applySearch(): void {
    this.patch({ q: clean(this.searchDraft()), page: null });
  }

  protected setStatus(value: string): void {
    this.patch({ statut: clean(value), page: null });
  }

  protected setChannel(value: string): void {
    this.patch({ canal: clean(value), page: null });
  }

  protected setPeriod(value: string): void {
    this.patch({ periode: clean(value), page: null });
  }

  protected setSortOption(value: string): void {
    const [key, direction] = value.split(':');
    if (!knownValue(key ?? null, SORT_KEYS)) return;
    this.patch({
      tri: key === 'issuedAt' ? null : key,
      ordre: direction === 'asc' ? 'asc' : null,
      page: null,
    });
  }

  protected onSortChange(sort: SortState): void {
    if (!knownValue(sort.key, SORT_KEYS)) return;
    this.patch({
      tri: sort.key === 'issuedAt' ? null : sort.key,
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
    this.patch({ q: null, statut: null, canal: null, periode: null, page: null });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected statusLabel(status: ReceiptStatus): string {
    return status === 'ISSUED' ? 'Émis — scénario' : 'Annulé — scénario';
  }

  protected statusTone(status: ReceiptStatus): CnpmBadgeTone {
    return status === 'ISSUED' ? 'success' : 'error';
  }

  protected channelLabel(channel: ReceiptChannel): string {
    const labels: Record<ReceiptChannel, string> = {
      MOBILE_MONEY: 'Mobile Money',
      BANK_TRANSFER: 'Virement bancaire',
      CASH: 'Espèces',
      CHECK: 'Chèque',
    };
    return labels[channel];
  }

  protected periodLabel(period: ReceiptPeriod): string {
    return period.replace('-', ' · ');
  }

  protected correctionLabel(row: ReceiptRegistryRow): string {
    if (row.supersedesReference) return `Remplace ${row.supersedesReference}`;
    if (row.replacedByReference) return `Remplacé par ${row.replacedByReference}`;
    return 'Version initiale du scénario';
  }

  protected formatDate(value: string): string {
    return DATE_FORMATTER.format(new Date(value));
  }

  protected formatAmount(value: number): string {
    return AMOUNT_FORMATTER.format(value);
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
