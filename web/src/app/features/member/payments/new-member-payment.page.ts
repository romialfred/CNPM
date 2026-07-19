import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap, take } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { memberPaymentChannelLabel } from './member-payment-presenter';
import {
  MEMBER_PAYMENTS_GATEWAY,
  type MemberPaymentChannel,
} from './member-payments-gateway';

const CHANNELS: readonly MemberPaymentChannel[] = [
  'MOBILE_MONEY_PREVIEW',
  'BANK_TRANSFER_PREVIEW',
  'CASH_DECLARATION_PREVIEW',
];

type PreparationState = 'loading' | 'ready' | 'unavailable' | 'error';

/** MP-004 — préparation bornée, sans ordre ni transaction de paiement. */
@Component({
  selector: 'cnpm-new-member-payment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MemberPortalShellComponent,
    AlertComponent,
    ButtonComponent,
    ErrorStateComponent,
    InlineErrorSummaryComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './new-member-payment.page.html',
  styleUrl: './new-member-payment.page.scss',
})
export class NewMemberPaymentPage {
  private readonly gateway = inject(MEMBER_PAYMENTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly pageHeader = viewChild(PageHeaderComponent);

  protected readonly channels = CHANNELS;
  protected readonly channelLabel = memberPaymentChannelLabel;
  protected readonly form = this.formBuilder.nonNullable.group({
    contributionId: ['', Validators.required],
    channel: ['' as MemberPaymentChannel | '', Validators.required],
    simulationAcknowledged: [false, Validators.requiredTrue],
  });
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal(false);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly retryTick = signal(0);
  private readonly optionsResult = toSignal(
    toObservable(this.retryTick).pipe(
      switchMap(() =>
        this.gateway.listContributionOptions().pipe(
          map((options) => ({ kind: 'ready' as const, options })),
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

  protected readonly state = computed<PreparationState>(() => this.optionsResult().kind);
  protected readonly options = computed(() => {
    const result = this.optionsResult();
    return result.kind === 'ready' ? result.options : [];
  });
  protected readonly selectedContribution = computed(() =>
    this.options().find((option) => option.id === this.formValue().contributionId),
  );
  protected readonly formErrors = computed<readonly CnpmFieldError[]>(() => {
    this.formValue();
    if (!this.submitted()) return [];
    const errors: CnpmFieldError[] = [];
    if (this.form.controls.contributionId.invalid) {
      errors.push({ fieldId: 'payment-contribution', message: 'Choisissez une cotisation.' });
    }
    if (this.form.controls.channel.invalid) {
      errors.push({ fieldId: 'payment-channel-mobile-money', message: 'Choisissez un canal de règlement.' });
    }
    if (this.form.controls.simulationAcknowledged.invalid) {
      errors.push({
        fieldId: 'payment-simulation-acknowledgement',
        message: 'Confirmez avoir compris qu’aucun montant ne sera prélevé.',
      });
    }
    return errors;
  });

  constructor() {
    effect(() => {
      const requested = this.params().get('contribution') ?? '';
      const valid = this.options().some((option) => option.id === requested);
      const next = valid ? requested : '';
      if (this.form.controls.contributionId.value !== next) {
        this.form.controls.contributionId.setValue(next, { emitEvent: false });
      }
    });

    effect(() => {
      if (this.state() === 'ready') {
        afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
      }
    });

    this.form.controls.contributionId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((contribution) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { contribution: contribution || null },
          queryParamsHandling: 'merge',
        });
      });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected submit(): void {
    this.submitted.set(true);
    this.submitError.set(false);
    if (this.form.invalid || this.submitting()) return;
    const value = this.form.getRawValue();
    if (!value.channel || !value.simulationAcknowledged) return;

    this.submitting.set(true);
    this.gateway
      .prepareDemo({
        contributionId: value.contributionId,
        channel: value.channel,
        simulationAcknowledged: true,
      })
      .pipe(take(1))
      .subscribe({
        next: (detail) => {
          this.submitting.set(false);
          void this.router.navigate(['/member/payments', detail.id, 'status'], {
            queryParams: { source: 'creation' },
          });
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set(true);
        },
      });
  }
}
