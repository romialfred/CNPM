import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideClipboardCheck, LucideEye, LucidePlus } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
} from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  ENROLLMENTS_GATEWAY,
  EnrollmentAccessError,
  type EnrollmentApplication,
  type EnrollmentPageQuery,
  type EnrollmentStatus,
} from './enrollments-gateway';

const PAGE_SIZES: readonly number[] = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;

const STATUS_LABELS: Readonly<Record<EnrollmentStatus, string>> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  UNDER_REVIEW: 'En cours de contrôle',
  COMPLEMENT_REQUIRED: 'Complément demandé',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

const STATUS_TONES: Readonly<Record<EnrollmentStatus, CnpmBadgeTone>> = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  COMPLEMENT_REQUIRED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

const COLUMNS: readonly DataTableColumn[] = [
  { key: 'caseNumber', label: 'Dossier' },
  { key: 'organizationId', label: 'Entreprise' },
  { key: 'channel', label: 'Canal' },
  { key: 'submittedAt', label: 'Soumis le' },
  { key: 'assignedTo', label: 'Contrôleur' },
  { key: 'status', label: 'Statut' },
  { key: 'actions', label: 'Actions' },
];

/** BO-008 — liste paginée des dossiers d'enrôlement. */
@Component({
  selector: 'cnpm-enrollments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    AdminShellComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    LucideClipboardCheck,
    LucideEye,
    LucidePlus,
  ],
  templateUrl: './enrollments.page.html',
  styleUrl: './enrollments.page.scss',
})
export class EnrollmentsPage {
  private readonly gateway = inject(ENROLLMENTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SESSION_GATEWAY);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly columns = COLUMNS;
  protected readonly pageSizes = PAGE_SIZES;

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly sessionIdentity = toSignal(
    this.session.identity.pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  protected readonly page = computed(() => {
    const value = Number(this.params().get('page'));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });
  protected readonly pageSize = computed(() => {
    const value = Number(this.params().get('size'));
    return PAGE_SIZES.includes(value) ? value : DEFAULT_PAGE_SIZE;
  });
  protected readonly canCreate = computed(
    () => this.sessionIdentity()?.permissions.includes('ENROLLMENT.CREATE') ?? false,
  );

  private readonly retryTick = signal(0);
  private readonly query = computed<EnrollmentPageQuery>(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
  }));
  private readonly fetchTrigger = computed(() => ({
    query: this.query(),
    retry: this.retryTick(),
  }));

  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.list(query).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) =>
            of(
              error instanceof EnrollmentAccessError
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

  protected readonly data = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data : null;
  });
  protected readonly rows = computed(() => this.data()?.rows ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalItems ?? 0);
  protected readonly tableState = computed<DataTableState>(() => {
    const result = this.result();
    if (result.kind === 'loading') {
      return 'loading';
    }
    if (result.kind === 'forbidden') {
      return 'forbidden';
    }
    if (result.kind === 'error') {
      return 'error';
    }
    if (result.data.rows.length > 0) {
      return 'ready';
    }
    return result.data.totalItems > 0 ? 'noResult' : 'empty';
  });

  protected readonly rowKey = (row: EnrollmentApplication): string => row.id;

  protected statusLabel(status: EnrollmentStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: EnrollmentStatus): CnpmBadgeTone {
    return STATUS_TONES[status];
  }

  protected onPageChange(page: number): void {
    this.patchUrl({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(pageSize: number): void {
    this.patchUrl({ size: pageSize === DEFAULT_PAGE_SIZE ? null : pageSize, page: null });
  }

  protected openReview(id: string): void {
    void this.router.navigate(['/admin/enrollments', id, 'review'], {
      queryParamsHandling: 'preserve',
    });
  }

  protected retry(): void {
    this.retryTick.update((value) => value + 1);
  }

  private patchUrl(queryParams: Record<string, number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
