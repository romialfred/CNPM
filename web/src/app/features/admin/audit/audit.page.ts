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
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type { DataTableColumn } from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  AUDIT_GATEWAY,
  AuditAccessError,
  AuditAuthenticationError,
  type AuditEvent,
  type AuditEventQuery,
} from './audit-gateway';

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 25;
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-ML', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

type AuditViewState = 'loading' | 'ready' | 'empty' | 'error' | 'authentication' | 'forbidden';

/**
 * BO-032 — journaux d'audit.
 *
 * Cette page est volontairement en lecture seule. Son périmètre s'arrête au contrat
 * `GET /audit-events?page&size` protégé par `PERM_AUDIT.READ` : aucun filtre temporel,
 * export, mécanisme d'alerte ou paramétrage de conservation n'est simulé dans la vue.
 */
@Component({
  selector: 'cnpm-audit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
  ],
  templateUrl: './audit.page.html',
  styleUrl: './audit.page.scss',
})
export class AuditPage {
  private readonly gateway = inject(AUDIT_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'createdAt', label: 'Horodatage' },
    { key: 'event', label: 'Événement' },
    { key: 'actor', label: 'Acteur' },
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Objet' },
    { key: 'hashes', label: 'Empreintes' },
    { key: 'correlation', label: 'Corrélation' },
  ];

  /** L'URL reste l'unique source de vérité de la pagination partageable. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly page = computed(() => {
    const value = Number(this.params().get('page'));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });

  protected readonly pageSize = computed(() => {
    const value = Number(this.params().get('size'));
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_PAGE_SIZE;
  });

  private readonly query = computed<AuditEventQuery>(() => ({
    page: this.page(),
    size: this.pageSize(),
  }));

  private readonly retryTick = signal(0);
  private readonly restoreResultsFocus = signal(false);
  private readonly journalTitle = viewChild<ElementRef<HTMLElement>>('journalTitle');
  private readonly fetchTrigger = computed(() => ({
    query: this.query(),
    retry: this.retryTick(),
  }));

  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.search(query).pipe(
          map((page) => ({ kind: 'ready' as const, page })),
          catchError((error: unknown) =>
            of(
              error instanceof AuditAuthenticationError
                ? { kind: 'authentication' as const }
                : error instanceof AuditAccessError
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
    return result.kind === 'ready' ? result.page : null;
  });

  protected readonly events = computed<readonly AuditEvent[]>(() => this.data()?.items ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalElements ?? 0);
  protected readonly state = computed<AuditViewState>(() => {
    const result = this.result();
    if (result.kind === 'loading') return 'loading';
    if (result.kind === 'error') return 'error';
    if (result.kind === 'authentication') return 'authentication';
    if (result.kind === 'forbidden') return 'forbidden';
    return result.page.items.length > 0 ? 'ready' : 'empty';
  });

  protected readonly rowKey = (event: AuditEvent): string => event.id;

  constructor() {
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
        queueMicrotask(() => this.journalTitle()?.nativeElement.focus());
      }
    });
  }

  protected formatTimestamp(value: string): string {
    return `${DATE_FORMATTER.format(new Date(value))} UTC`;
  }

  protected onPageChange(page: number): void {
    this.restoreResultsFocus.set(true);
    this.patchUrl({ page });
  }

  protected onPageSizeChange(size: number): void {
    this.restoreResultsFocus.set(true);
    this.patchUrl({ page: 1, size });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patchUrl(queryParams: Record<string, number>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
