import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  CONTRIBUTIONS_GATEWAY,
  ContributionsAccessError,
  QUARTER_LABELS,
  type ContributionCallQuery,
  type ContributionCallRow,
  type ContributionCallStatus,
} from './contributions-gateway';

const STATUS_LABELS: Readonly<Record<ContributionCallStatus, string>> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PARTIAL: 'Partiellement payé',
  SETTLED: 'Encaissé',
  OVERDUE: 'En retard',
};

const STATUS_TONES: Readonly<Record<ContributionCallStatus, CnpmBadgeTone>> = {
  DRAFT: 'neutral',
  PENDING: 'info',
  PARTIAL: 'warning',
  SETTLED: 'success',
  OVERDUE: 'error',
};

const DETAIL_QUERY: ContributionCallQuery = {
  search: '',
  fiscalYear: null,
  quarter: null,
  status: null,
  sort: null,
  page: 1,
  pageSize: 50,
};

type DetailState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly call: ContributionCallRow }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'forbidden' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'error' };

/** BO-013 — fiche consultative d'un appel, en lecture seule. */
@Component({
  selector: 'cnpm-contribution-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    AdminShellComponent,
    BadgeComponent,
    ButtonComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './contribution-detail.page.html',
  styleUrl: './contribution-detail.page.scss',
})
export class ContributionDetailPage {
  private readonly gateway = inject(CONTRIBUTIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly retryTick = signal(0);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  private readonly result = toSignal(
    toObservable(this.retryTick).pipe(
      switchMap(() =>
        this.gateway.searchCalls(DETAIL_QUERY).pipe(
          map((page): DetailState => {
            const call = page.rows.find((item) => item.id === this.id);
            return call ? { kind: 'ready', call } : { kind: 'not-found' };
          }),
          catchError((error: unknown) => {
            if (error instanceof ContributionsAccessError) {
              return of<DetailState>({ kind: 'forbidden' });
            }
            if (error instanceof UnavailableHttpFeatureError) {
              return of<DetailState>({ kind: 'unavailable' });
            }
            return of<DetailState>({ kind: 'error' });
          }),
          startWith<DetailState>({ kind: 'loading' }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' } as DetailState },
  );

  protected readonly state = computed(() => this.result());
  protected readonly call = computed(() => {
    const state = this.result();
    return state.kind === 'ready' ? state.call : null;
  });
  protected readonly settledShare = computed(() => {
    const call = this.call();
    if (!call || call.calledAmount <= 0) return 0;
    return Math.min(100, ((call.paidAmount + call.adjustmentAmount) / call.calledAmount) * 100);
  });

  protected statusLabel(status: ContributionCallStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: ContributionCallStatus): CnpmBadgeTone {
    return STATUS_TONES[status];
  }

  protected periodLabel(call: ContributionCallRow): string {
    return `${QUARTER_LABELS[call.quarter]} · exercice ${call.fiscalYear}`;
  }

  protected retry(): void {
    this.retryTick.update((value) => value + 1);
  }
}
