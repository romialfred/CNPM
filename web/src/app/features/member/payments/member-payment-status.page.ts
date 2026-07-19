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
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  memberPaymentChannelLabel,
  memberPaymentStatusLabel,
  memberPaymentStatusTone,
} from './member-payment-presenter';
import {
  MEMBER_PAYMENTS_GATEWAY,
  MemberPaymentNotFoundError,
  type MemberPaymentStatusStep,
} from './member-payments-gateway';

type PaymentStatusViewState = 'loading' | 'ready' | 'not-found' | 'unavailable' | 'error';

/** MP-005 — suivi d'un scénario, sans confondre état local et confirmation financière. */
@Component({
  selector: 'cnpm-member-payment-status-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-payment-status.page.html',
  styleUrl: './member-payment-status.page.scss',
})
export class MemberPaymentStatusPage {
  private readonly gateway = inject(MEMBER_PAYMENTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly pageHeader = viewChild(PageHeaderComponent);

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
        this.gateway.loadStatus(id).pipe(
          map((detail) => ({ kind: 'ready' as const, detail })),
          catchError((error: unknown) =>
            of(
              error instanceof MemberPaymentNotFoundError
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

  protected readonly state = computed<PaymentStatusViewState>(() => this.result().kind);
  protected readonly detail = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.detail : null;
  });
  protected readonly createdLocally = computed(
    () => this.queryParams().get('source') === 'simulation',
  );
  protected readonly statusLabel = memberPaymentStatusLabel;
  protected readonly statusTone = memberPaymentStatusTone;
  protected readonly channelLabel = memberPaymentChannelLabel;
  protected readonly stepKey = (step: MemberPaymentStatusStep): string => step.id;

  constructor() {
    effect(() => {
      if (this.state() === 'ready') {
        afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
      }
    });
  }

  protected refresh(): void {
    this.retryTick.update((tick) => tick + 1);
  }
}
