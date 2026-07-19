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
  DOCUMENTS_GATEWAY,
  DocumentAccessError,
  type DocumentClassification,
  type DocumentKind,
  type DocumentLifecycle,
  type DocumentQuery,
  type DocumentRegistryRow,
  type DocumentSortKey,
} from './documents-gateway';

const CLASSIFICATIONS: readonly DocumentClassification[] = [
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
];
const LIFECYCLES: readonly DocumentLifecycle[] = ['CURRENT', 'EXPIRING', 'EXPIRED', 'ARCHIVED'];
const KINDS: readonly DocumentKind[] = [
  'MEMBERSHIP',
  'ORGANIZATION',
  'PAYMENT_SUPPORT',
  'GOVERNANCE',
];
const SORT_KEYS: readonly DocumentSortKey[] = ['updatedAt', 'expiresAt', 'title'];
const PAGE_SIZES = [10, 25, 50] as const;
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' });

/** BO-023 — bibliothèque de métadonnées documentaire, sans contenu ni opération GED. */
@Component({
  selector: 'cnpm-documents-page',
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
  templateUrl: './documents.page.html',
  styleUrl: './documents.page.scss',
})
export class DocumentsPage {
  private readonly gateway = inject(DOCUMENTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly demoMode = inject(CNPM_DATA_MODE) === 'demo';
  protected readonly classifications = CLASSIFICATIONS;
  protected readonly lifecycles = LIFECYCLES;
  protected readonly kinds = KINDS;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly filtersExpanded = signal(true);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly classification = computed(() =>
    known(this.params().get('classification'), CLASSIFICATIONS),
  );
  protected readonly lifecycle = computed(() => known(this.params().get('statut'), LIFECYCLES));
  protected readonly kind = computed(() => known(this.params().get('type'), KINDS));
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const size = positiveInteger(this.params().get('taille'), 10);
    return (PAGE_SIZES as readonly number[]).includes(size) ? size : 10;
  });
  protected readonly sort = computed<SortState>(() => ({
    key: known(this.params().get('tri'), SORT_KEYS) ?? 'updatedAt',
    direction: this.params().get('ordre') === 'asc' ? 'asc' : 'desc',
  }));
  protected readonly sortOption = computed(() => `${this.sort().key}:${this.sort().direction}`);
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  private readonly query = computed<DocumentQuery>(() => ({
    search: this.search(),
    classification: this.classification(),
    lifecycle: this.lifecycle(),
    kind: this.kind(),
    sort: this.sort() as DocumentQuery['sort'],
    page: this.page(),
    pageSize: this.pageSize(),
  }));
  private readonly retryTick = signal(0);
  private readonly trigger = computed(() => ({ query: this.query(), retry: this.retryTick() }));
  private readonly result = toSignal(
    toObservable(this.trigger).pipe(
      switchMap(({ query }) =>
        this.gateway.search(query).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) => {
            if (error instanceof DocumentAccessError) return of({ kind: 'forbidden' as const });
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
  protected readonly rows = computed<readonly DocumentRegistryRow[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.rows : [];
  });
  protected readonly totalItems = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.totalItems : 0;
  });
  protected readonly overview = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.overview : null;
  });
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.classification() || this.lifecycle() || this.kind()),
  );
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.classification())
      chips.push({
        key: 'classification',
        label: `Classification : ${this.classificationLabel(this.classification()!)}`,
      });
    if (this.lifecycle())
      chips.push({ key: 'statut', label: `Statut : ${this.lifecycleLabel(this.lifecycle()!)}` });
    if (this.kind()) chips.push({ key: 'type', label: `Type : ${this.kindLabel(this.kind()!)}` });
    return chips;
  });
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'title', label: 'Document', sortable: true },
    { key: 'businessObject', label: 'Objet métier' },
    { key: 'classification', label: 'Classification' },
    { key: 'lifecycle', label: 'Cycle de vie' },
    { key: 'version', label: 'Version' },
    { key: 'updatedAt', label: 'Mise à jour', sortable: true },
    { key: 'expiresAt', label: 'Échéance', sortable: true },
  ];
  protected readonly rowKey = (row: DocumentRegistryRow) => row.id;

  protected applySearch(): void {
    this.patch({ q: clean(this.searchDraft()), page: null });
  }
  protected setClassification(value: string): void {
    this.patch({ classification: clean(value), page: null });
  }
  protected setLifecycle(value: string): void {
    this.patch({ statut: clean(value), page: null });
  }
  protected setKind(value: string): void {
    this.patch({ type: clean(value), page: null });
  }
  protected setSortOption(value: string): void {
    const [key, direction] = value.split(':');
    if (!known(key ?? null, SORT_KEYS)) return;
    this.patch({
      tri: key === 'updatedAt' ? null : key,
      ordre: direction === 'asc' ? 'asc' : null,
      page: null,
    });
  }
  protected onSortChange(sort: SortState): void {
    if (!known(sort.key, SORT_KEYS)) return;
    this.patch({
      tri: sort.key === 'updatedAt' ? null : sort.key,
      ordre: sort.direction === 'desc' ? null : sort.direction,
      page: null,
    });
  }
  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page });
  }
  protected onPageSizeChange(size: number): void {
    this.patch({ taille: size === 10 ? null : size, page: null });
  }
  protected removeChip(key: string): void {
    if (key === 'q') this.searchDraft.set('');
    this.patch({ [key]: null, page: null });
  }
  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ q: null, classification: null, statut: null, type: null, page: null });
  }
  protected retry(): void {
    this.retryTick.update((value) => value + 1);
  }

  protected classificationLabel(value: DocumentClassification): string {
    return { INTERNAL: 'Interne', CONFIDENTIAL: 'Confidentiel', RESTRICTED: 'Restreint' }[value];
  }
  protected classificationTone(value: DocumentClassification): CnpmBadgeTone {
    return value === 'RESTRICTED' ? 'error' : value === 'CONFIDENTIAL' ? 'warning' : 'neutral';
  }
  protected lifecycleLabel(value: DocumentLifecycle): string {
    return {
      CURRENT: 'À jour — scénario',
      EXPIRING: 'Échéance proche',
      EXPIRED: 'Expiré — scénario',
      ARCHIVED: 'Archivé — scénario',
    }[value];
  }
  protected lifecycleTone(value: DocumentLifecycle): CnpmBadgeTone {
    return { CURRENT: 'success', EXPIRING: 'warning', EXPIRED: 'error', ARCHIVED: 'neutral' }[
      value
    ] as CnpmBadgeTone;
  }
  protected kindLabel(value: DocumentKind): string {
    return {
      MEMBERSHIP: 'Adhésion',
      ORGANIZATION: 'Entreprise',
      PAYMENT_SUPPORT: 'Justificatif financier',
      GOVERNANCE: 'Gouvernance',
    }[value];
  }
  protected formatDate(value: string | null): string {
    return value ? DATE_FORMATTER.format(new Date(value)) : 'Sans échéance';
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
