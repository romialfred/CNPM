import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideEye, LucidePencil } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
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
  ORGANIZATIONS_GATEWAY,
  OrganizationAccessError,
  type Organization,
  type OrganizationQuery,
} from './organizations-gateway';

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;
const KNOWN_STATUSES = ['ACTIVE', 'DORMANT', 'PROSPECT'] as const;
const SORT_KEYS = new Set(['legalName', 'status']);

/** BO-005 — liste paginée des entreprises, partageable par son URL. */
@Component({
  selector: 'cnpm-organizations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    AdminShellComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    LucideEye,
    LucidePencil,
  ],
  templateUrl: './organizations.page.html',
  styleUrl: './organizations.page.scss',
})
export class OrganizationsPage {
  private readonly gateway = inject(ORGANIZATIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statuses = KNOWN_STATUSES;
  protected readonly filtersExpanded = signal(true);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly status = computed(() => this.params().get('statut'));
  protected readonly statusIsKnown = computed(() =>
    KNOWN_STATUSES.includes(this.status() as (typeof KNOWN_STATUSES)[number]),
  );
  protected readonly organizationType = computed(() => this.params().get('type'));
  protected readonly sectorCode = computed(() => this.params().get('secteur'));
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const size = positiveInteger(this.params().get('taille'), DEFAULT_PAGE_SIZE);
    return (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
  });
  protected readonly sort = computed<SortState | null>(() => {
    const key = this.params().get('tri');
    if (!key || !SORT_KEYS.has(key)) {
      return { key: 'legalName', direction: 'asc' };
    }
    return { key, direction: this.params().get('ordre') === 'desc' ? 'desc' : 'asc' };
  });

  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly typeDraft = signal(this.route.snapshot.queryParamMap.get('type') ?? '');
  protected readonly sectorDraft = signal(this.route.snapshot.queryParamMap.get('secteur') ?? '');

  private readonly query = computed<OrganizationQuery>(() => ({
    search: this.search(),
    status: this.status(),
    organizationType: this.organizationType(),
    sectorCode: this.sectorCode(),
    sort: this.sort(),
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
              error instanceof OrganizationAccessError
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
    if (result.kind !== 'ready') {
      return result.kind;
    }
    if (result.data.rows.length > 0) {
      return 'ready' as const;
    }
    return this.hasFilters() ? ('noResult' as const) : ('empty' as const);
  });
  protected readonly rows = computed<readonly Organization[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.rows : [];
  });
  protected readonly totalItems = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.totalItems : 0;
  });
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.status() || this.organizationType() || this.sectorCode()),
  );

  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.status())
      chips.push({ key: 'statut', label: `Statut : ${this.statusLabel(this.status()!)}` });
    if (this.organizationType())
      chips.push({ key: 'type', label: `Type : ${this.organizationType()}` });
    if (this.sectorCode()) chips.push({ key: 'secteur', label: `Secteur : ${this.sectorCode()}` });
    return chips;
  });

  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'legalName', label: 'Entreprise', sortable: true },
    { key: 'organizationType', label: 'Type' },
    { key: 'sectorCode', label: 'Secteur' },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'riskLevel', label: 'Risque' },
    { key: 'actions', label: 'Actions' },
  ];
  protected readonly rowKey = (organization: Organization): string => organization.id;

  protected statusLabel(value: string): string {
    return knownLabel(value, { ACTIVE: 'Active', DORMANT: 'Dormante', PROSPECT: 'Prospect' });
  }

  protected statusTone(value: string): CnpmBadgeTone {
    return value === 'ACTIVE'
      ? 'success'
      : value === 'DORMANT'
        ? 'warning'
        : value === 'PROSPECT'
          ? 'info'
          : 'neutral';
  }

  protected riskLabel(value: string): string {
    return knownLabel(value, { NORMAL: 'Normal' });
  }

  protected riskTone(value: string): CnpmBadgeTone {
    return value === 'NORMAL' ? 'success' : 'neutral';
  }

  protected sectorLabel(value: string | null): string {
    return value ? value.replaceAll('_', ' ') : 'Non renseigné';
  }

  protected listQueryParams(): Record<string, string> {
    const query = this.params();
    return Object.fromEntries(query.keys.map((key) => [key, query.get(key) ?? '']));
  }

  protected viewOrganization(id: string): void {
    void this.router.navigate(['/admin/organizations', id], {
      queryParams: this.listQueryParams(),
    });
  }

  protected editOrganization(id: string): void {
    void this.router.navigate(['/admin/organizations', id, 'edit'], {
      queryParams: this.listQueryParams(),
    });
  }

  protected applyTextFilters(): void {
    this.patch({
      q: clean(this.searchDraft()),
      type: clean(this.typeDraft()),
      secteur: clean(this.sectorDraft()),
      page: null,
    });
  }

  protected setStatus(value: string): void {
    this.patch({ statut: clean(value), page: null });
  }

  protected removeChip(key: string): void {
    if (key === 'q') this.searchDraft.set('');
    if (key === 'type') this.typeDraft.set('');
    if (key === 'secteur') this.sectorDraft.set('');
    this.patch({ [key]: null, page: null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.typeDraft.set('');
    this.sectorDraft.set('');
    this.patch({ q: null, statut: null, type: null, secteur: null, page: null });
  }

  protected onSortChange(sort: SortState): void {
    this.patch({
      tri: sort.key === 'legalName' ? null : sort.key,
      ordre: sort.direction === 'asc' ? null : sort.direction,
      page: null,
    });
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(size: number): void {
    this.patch({ taille: size === DEFAULT_PAGE_SIZE ? null : size, page: null });
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

function clean(value: string): string | null {
  return value.trim() || null;
}

function knownLabel(value: string, labels: Readonly<Record<string, string>>): string {
  return labels[value] ?? value.replaceAll('_', ' ');
}
