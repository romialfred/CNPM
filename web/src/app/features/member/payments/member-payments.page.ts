import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import {
  memberPaymentChannelLabel,
  memberPaymentStatusLabel,
  memberPaymentStatusTone,
} from './member-payment-presenter';
import {
  MEMBER_PAYMENTS_GATEWAY,
  type MemberPaymentChannel,
  type MemberPaymentQuery,
  type MemberPaymentSort,
  type MemberPaymentStatus,
} from './member-payments-gateway';

const PAGE_SIZES = [3, 5, 10] as const;
const STATUSES: readonly MemberPaymentStatus[] = [
  'PREPARED',
  'PROCESSING',
  'NEEDS_REVIEW',
  'FAILED',
];
const CHANNELS: readonly MemberPaymentChannel[] = [
  'MOBILE_MONEY_PREVIEW',
  'BANK_TRANSFER_PREVIEW',
  'CASH_DECLARATION_PREVIEW',
];
const SORTS: readonly MemberPaymentSort[] = ['updatedAt', 'reference', 'amountXof', 'status'];

type PaymentsViewState = 'loading' | 'ready' | 'empty' | 'no-results' | 'unavailable' | 'error';

/** MP-006 — historique paginé des seuls règlements visibles du membre courant. */
@Component({
  selector: 'cnpm-member-payments-page',
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
  templateUrl: './member-payments.page.html',
  styleUrl: './member-payments.page.scss',
})
export class MemberPaymentsPage {
  private readonly gateway = inject(MEMBER_PAYMENTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly formBuilder = inject(FormBuilder);
  private readonly pageHeader = viewChild(PageHeaderComponent);
  private readonly resultsTitle = viewChild<ElementRef<HTMLElement>>('resultsTitle');

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statuses = STATUSES;
  protected readonly channels = CHANNELS;
  protected readonly filtersExpanded = signal(true);
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence' },
    { key: 'contribution', label: 'Cotisation' },
    { key: 'updatedAt', label: 'Dernière mise à jour' },
    { key: 'amountXof', label: 'Montant' },
    { key: 'channel', label: 'Canal' },
    { key: 'status', label: 'Statut' },
    { key: 'action', label: 'Suivi' },
  ];
  protected readonly filterForm = this.formBuilder.nonNullable.group({
    search: [''],
    status: [''],
    channel: [''],
    sortOption: ['updatedAt:desc'],
  });

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly search = computed(() => (this.params().get('q') ?? '').trim().slice(0, 80));
  protected readonly status = computed(() => known(this.params().get('statut'), STATUSES));
  protected readonly channel = computed(() => known(this.params().get('canal'), CHANNELS));
  protected readonly sort = computed<MemberPaymentSort>(
    () => known(this.params().get('tri'), SORTS) ?? 'updatedAt',
  );
  protected readonly direction = computed<'asc' | 'desc'>(() =>
    this.params().get('ordre') === 'asc' ? 'asc' : 'desc',
  );
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const value = positiveInteger(this.params().get('taille'), 3);
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : 3;
  });
  private readonly query = computed<MemberPaymentQuery>(() => ({
    search: this.search() || undefined,
    status: this.status() ?? undefined,
    channel: this.channel() ?? undefined,
    sort: this.sort(),
    direction: this.direction(),
    page: this.page(),
    size: this.pageSize(),
  }));
  private readonly retryTick = signal(0);
  private readonly restoreResultsFocus = signal(false);
  private initialPageFocusPending = true;
  private readonly fetchTrigger = computed(() => ({ query: this.query(), retry: this.retryTick() }));
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
  protected readonly payments = computed(() => this.data()?.items ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalElements ?? 0);
  protected readonly hasFilters = computed(() => Boolean(this.search() || this.status() || this.channel()));
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.status()) {
      chips.push({ key: 'statut', label: `Statut : ${memberPaymentStatusLabel(this.status()!)}` });
    }
    if (this.channel()) {
      chips.push({ key: 'canal', label: `Canal : ${memberPaymentChannelLabel(this.channel()!)}` });
    }
    return chips;
  });
  protected readonly state = computed<PaymentsViewState>(() => {
    const result = this.result();
    if (result.kind !== 'ready') return result.kind;
    if (result.page.items.length > 0) return 'ready';
    return this.hasFilters() ? 'no-results' : 'empty';
  });
  protected readonly detailQueryParams = computed(() => ({
    q: this.search() || null,
    statut: this.status(),
    canal: this.channel(),
    tri: this.sort(),
    ordre: this.direction(),
    page: this.page(),
    taille: this.pageSize(),
  }));

  protected readonly rowKey = (item: { readonly id: string }): string => item.id;
  protected readonly statusLabel = memberPaymentStatusLabel;
  protected readonly statusTone = memberPaymentStatusTone;
  protected readonly channelLabel = memberPaymentChannelLabel;

  constructor() {
    effect(() => {
      this.filterForm.setValue(
        {
          search: this.search(),
          status: this.status() ?? '',
          channel: this.channel() ?? '',
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
    this.restoreResultsFocus.set(true);
    this.patch({
      q: values.search.trim().slice(0, 80) || null,
      statut: known(values.status, STATUSES),
      canal: known(values.channel, CHANNELS),
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
    this.patch({ q: null, statut: null, canal: null, page: 1 });
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
