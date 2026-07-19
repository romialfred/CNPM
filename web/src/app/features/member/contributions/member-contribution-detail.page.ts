import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type { DataTableColumn } from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { contributionStatusLabel, contributionStatusTone } from './member-contribution-presenter';
import {
  MEMBER_CONTRIBUTIONS_GATEWAY,
  MemberContributionNotFoundError,
  type MemberContributionAdjustment,
  type MemberContributionInstallment,
} from './member-contributions-gateway';

type ContributionDetailState = 'loading' | 'ready' | 'not-found' | 'unavailable' | 'error';

/** MP-003 — détail et échéancier d'une cotisation, strictement en lecture seule. */
@Component({
  selector: 'cnpm-member-contribution-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-contribution-detail.page.html',
  styleUrl: './member-contribution-detail.page.scss',
})
export class MemberContributionDetailPage {
  private readonly gateway = inject(MEMBER_CONTRIBUTIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly pageHeader = viewChild(PageHeaderComponent);

  protected readonly installmentColumns: readonly DataTableColumn[] = [
    { key: 'label', label: 'Échéance fictive' },
    { key: 'dueDate', label: 'Date' },
    { key: 'expectedAmount', label: 'Montant fourni' },
    { key: 'paidAmount', label: 'Affecté' },
    { key: 'outstandingAmount', label: 'Solde fourni' },
    { key: 'status', label: 'Statut' },
  ];
  protected readonly adjustmentColumns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence fictive' },
    { key: 'recordedOn', label: 'Date' },
    { key: 'direction', label: 'Sens' },
    { key: 'amount', label: 'Montant fourni' },
    { key: 'reason', label: 'Explication' },
  ];

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({
    id: this.params().get('id') ?? '',
    retry: this.retryTick(),
  }));

  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.loadDetail(id).pipe(
          map((detail) => ({ kind: 'ready' as const, detail })),
          catchError((error: unknown) =>
            of(
              error instanceof MemberContributionNotFoundError
                ? { kind: 'not-found' as const }
                : error instanceof UnavailableHttpFeatureError
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

  protected readonly state = computed<ContributionDetailState>(() => this.result().kind);
  protected readonly detail = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.detail : null;
  });
  protected readonly backQueryParams = computed(() => {
    const map = this.queryParams();
    return Object.fromEntries(map.keys.map((key) => [key, map.get(key)]));
  });

  protected readonly statusLabel = contributionStatusLabel;
  protected readonly statusTone = contributionStatusTone;
  protected readonly installmentKey = (item: MemberContributionInstallment): string => item.id;
  protected readonly adjustmentKey = (item: MemberContributionAdjustment): string => item.reference;

  constructor() {
    effect(() => {
      if (this.state() === 'ready') {
        afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
      }
    });
  }

  protected adjustmentDirection(direction: MemberContributionAdjustment['direction']): string {
    return direction === 'CREDIT' ? 'Crédit fictif' : 'Débit fictif';
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }
}
