import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideBuilding2, LucideChevronRight, LucideEye } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type { DataTableColumn } from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  GROUPS_GATEWAY,
  GroupAccessError,
  GroupNotFoundError,
  type ProfessionalGroup,
  type ProfessionalGroupQuery,
} from './groups-gateway';
import {
  sectorImage as resolveSectorImage,
  sectorLabel as resolveSectorLabel,
} from './sector-presentation';

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

/** BO-024 — registre paginé des groupements, dans l'ordre stable fourni par l'API. */
@Component({
  selector: 'cnpm-groups-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AdminShellComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    LucideBuilding2,
    LucideChevronRight,
    LucideEye,
  ],
  templateUrl: './groups.page.html',
  styleUrl: './groups.page.scss',
})
export class GroupsPage {
  private readonly gateway = inject(GROUPS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly pageSizes = PAGE_SIZES;

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const size = positiveInteger(this.params().get('size'), DEFAULT_PAGE_SIZE);
    return (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
  });
  private readonly query = computed<ProfessionalGroupQuery>(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
  }));

  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({ query: this.query(), tick: this.retryTick() }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.list(query).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) => {
            if (error instanceof GroupAccessError) return of({ kind: 'forbidden' as const });
            if (error instanceof GroupNotFoundError) return of({ kind: 'notFound' as const });
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
    return result.data.totalItems > 0 ? ('pageEmpty' as const) : ('empty' as const);
  });
  protected readonly rows = computed<readonly ProfessionalGroup[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.rows : [];
  });
  protected readonly totalItems = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.totalItems : 0;
  });
  protected readonly listQueryParams = computed<Record<string, string>>(() => {
    const query = this.params();
    return Object.fromEntries(query.keys.map((key) => [key, query.get(key) ?? '']));
  });

  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'name', label: 'Groupement professionnel' },
    { key: 'sectorCode', label: 'Secteur' },
    { key: 'status', label: 'Statut' },
    { key: 'actions', label: 'Action', align: 'end' },
  ];
  protected readonly rowKey = (group: ProfessionalGroup): string => group.id;

  protected statusLabel(value: string): string {
    return value === 'ACTIVE' ? 'Actif' : value.replaceAll('_', ' ');
  }

  protected statusTone(value: string): CnpmBadgeTone {
    return value === 'ACTIVE' ? 'success' : 'neutral';
  }

  /** Libellé humain du secteur ; `null` restitue « Non renseigné ». */
  protected sectorLabel(value: string | null): string {
    return resolveSectorLabel(value);
  }

  /** Vrai lorsque le groupement porte un secteur exploitable pour la présentation. */
  protected hasSector(value: string | null): boolean {
    return value !== null && value.trim().length > 0;
  }

  /** Photo topique et stable du secteur ; `null` déclenche l'icône de repli. */
  protected sectorImage(value: string | null): string | null {
    return resolveSectorImage(value);
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(size: number): void {
    this.patch({ size: size === DEFAULT_PAGE_SIZE ? null : size, page: null });
  }

  protected goToFirstPage(): void {
    this.patch({ page: null });
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
