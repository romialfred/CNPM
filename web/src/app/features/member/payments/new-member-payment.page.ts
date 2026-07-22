import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type ValidatorFn,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap, take } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_PAYMENTS_GATEWAY,
  type PaymentInitiationResult,
  type PaymentOperator,
} from './member-payments-gateway';
import { PAYMENT_OPERATORS, type PaymentOperatorDescriptor } from './payment-operators';

type PageState = 'loading' | 'ready' | 'unavailable' | 'error';
type WizardStep = 1 | 2 | 3 | 4;

const PHONE_PATTERN = /^(?:\+?223)?[\s.-]?[0-9](?:[\s.-]?[0-9]){7,}$/;
const CARD_PATTERN = /^(?:\d[\s]?){16}$/;
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CVC_PATTERN = /^\d{3,4}$/;

/**
 * MP-004 — règlement d'une cotisation par opérateur (Orange Money, Wave, MTN MoMo, Visa).
 *
 * Parcours COMPLET en quatre étapes (cotisation → moyen → coordonnées → confirmation),
 * puis une issue honnête : aucune passerelle opérateur n'étant branchée, rien n'est
 * débité. Aucune donnée sensible ne quitte le navigateur — pour une carte, seuls les
 * quatre derniers chiffres et le nom du porteur sont transmis à l'initiation.
 */
@Component({
  selector: 'cnpm-new-member-payment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MemberPortalShellComponent,
    AlertComponent,
    ButtonComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './new-member-payment.page.html',
  styleUrl: './new-member-payment.page.scss',
})
export class NewMemberPaymentPage {
  private readonly gateway = inject(MEMBER_PAYMENTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly operators = PAYMENT_OPERATORS;
  protected readonly steps = [
    { n: 1 as const, label: 'Cotisation' },
    { n: 2 as const, label: 'Moyen de paiement' },
    { n: 3 as const, label: 'Coordonnées' },
    { n: 4 as const, label: 'Confirmation' },
  ];

  protected readonly step = signal<WizardStep>(1);
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal(false);
  protected readonly result = signal<PaymentInitiationResult | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    contributionId: ['', Validators.required],
    operator: ['' as PaymentOperator | '', Validators.required],
    phone: [''],
    cardNumber: [''],
    cardExpiry: [''],
    cardCvc: [''],
    cardHolder: [''],
  });

  // `getRawValue()` est entièrement typé (formulaire non-nullable) ; on le recalcule à
  // chaque émission, là où `valueChanges` typerait chaque champ comme possiblement absent.
  private readonly formChanges = toSignal(this.form.valueChanges, { initialValue: null });
  protected readonly value = computed(() => {
    this.formChanges();
    return this.form.getRawValue();
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

  protected readonly state = computed<PageState>(() => this.optionsResult().kind);
  protected readonly options = computed(() => {
    const result = this.optionsResult();
    return result.kind === 'ready' ? result.options : [];
  });

  protected readonly selectedContribution = computed(() =>
    this.options().find((option) => option.id === this.value().contributionId),
  );
  protected readonly selectedOperator = computed<PaymentOperatorDescriptor | undefined>(() =>
    this.operators.find((operator) => operator.id === this.value().operator),
  );
  protected readonly isCard = computed(() => this.selectedOperator()?.kind === 'card');
  protected readonly isMobile = computed(() => this.selectedOperator()?.kind === 'mobile-money');
  protected readonly amountXof = computed(
    () => this.selectedContribution()?.outstandingAmountXof ?? 0,
  );

  /** Aperçu de carte, dérivé de la saisie (jamais persisté). */
  protected readonly cardPreviewNumber = computed(() => {
    const digits = this.value().cardNumber.replace(/\D/g, '').padEnd(16, '•').slice(0, 16);
    return (digits.match(/.{1,4}/g) ?? []).join(' ');
  });
  protected readonly cardPreviewHolder = computed(
    () => this.value().cardHolder.trim().toUpperCase() || 'PRÉNOM NOM',
  );
  protected readonly cardPreviewExpiry = computed(() => this.value().cardExpiry.trim() || 'MM/AA');

  constructor() {
    // La cotisation peut être pré-sélectionnée par l'URL (bouton « Payer » depuis une cotisation).
    const requested = this.route.snapshot.queryParamMap.get('contribution') ?? '';
    if (requested) {
      this.form.controls.contributionId.setValue(requested, { emitEvent: false });
    }

    // Le moyen choisi pilote les validateurs : Mobile Money exige un numéro, la carte
    // exige ses quatre champs. Changer d'opérateur repart d'une saisie propre.
    this.form.controls.operator.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((operator) => {
        const kind = this.operators.find((item) => item.id === operator)?.kind;
        this.setValidators('phone', kind === 'mobile-money' ? [Validators.required, Validators.pattern(PHONE_PATTERN)] : []);
        this.setValidators('cardNumber', kind === 'card' ? [Validators.required, Validators.pattern(CARD_PATTERN)] : []);
        this.setValidators('cardExpiry', kind === 'card' ? [Validators.required, Validators.pattern(EXPIRY_PATTERN)] : []);
        this.setValidators('cardCvc', kind === 'card' ? [Validators.required, Validators.pattern(CVC_PATTERN)] : []);
        this.setValidators('cardHolder', kind === 'card' ? [Validators.required] : []);
      });
  }

  private setValidators(
    control: 'phone' | 'cardNumber' | 'cardExpiry' | 'cardCvc' | 'cardHolder',
    validators: ValidatorFn[],
  ): void {
    const field = this.form.controls[control];
    field.setValidators(validators);
    field.updateValueAndValidity({ emitEvent: false });
  }

  /** Groupe la saisie de la carte par blocs de quatre chiffres. */
  protected onCardNumberInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    const grouped = (raw.match(/.{1,4}/g) ?? []).join(' ');
    this.form.controls.cardNumber.setValue(grouped);
  }

  protected onExpiryInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
    this.form.controls.cardExpiry.setValue(formatted);
  }

  protected chooseOperator(operator: PaymentOperator): void {
    this.form.controls.operator.setValue(operator);
  }

  protected isStepValid(step: WizardStep): boolean {
    switch (step) {
      case 1:
        return this.form.controls.contributionId.valid;
      case 2:
        return this.form.controls.operator.valid;
      case 3:
        return this.isMobile()
          ? this.form.controls.phone.valid
          : this.form.controls.cardNumber.valid &&
              this.form.controls.cardExpiry.valid &&
              this.form.controls.cardCvc.valid &&
              this.form.controls.cardHolder.valid;
      default:
        return true;
    }
  }

  protected next(): void {
    const current = this.step();
    if (!this.isStepValid(current)) {
      this.markStepTouched(current);
      return;
    }
    if (current < 4) {
      this.step.set((current + 1) as WizardStep);
    }
  }

  protected back(): void {
    const current = this.step();
    if (current > 1) {
      this.step.set((current - 1) as WizardStep);
    }
  }

  protected goToStep(step: WizardStep): void {
    // On ne saute vers l'avant que si toutes les étapes précédentes sont valides.
    if (step <= this.step() || this.allValidUpTo(step - 1)) {
      this.step.set(step);
    }
  }

  private allValidUpTo(step: number): boolean {
    for (let i = 1 as WizardStep; i <= step; i = (i + 1) as WizardStep) {
      if (!this.isStepValid(i)) return false;
    }
    return true;
  }

  private markStepTouched(step: WizardStep): void {
    const byStep: Record<WizardStep, string[]> = {
      1: ['contributionId'],
      2: ['operator'],
      3: this.isMobile()
        ? ['phone']
        : ['cardNumber', 'cardExpiry', 'cardCvc', 'cardHolder'],
      4: [],
    };
    for (const name of byStep[step]) {
      this.form.get(name)?.markAsTouched();
    }
  }

  protected fieldInvalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.touched || this.submitted());
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected pay(): void {
    this.submitted.set(true);
    this.submitError.set(false);
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.operator) return;

    this.submitting.set(true);
    this.gateway
      .initiatePayment({
        contributionId: raw.contributionId,
        operator: raw.operator,
        phone: this.isMobile() ? raw.phone.trim() : undefined,
        cardLast4: this.isCard() ? raw.cardNumber.replace(/\D/g, '').slice(-4) : undefined,
        cardHolder: this.isCard() ? raw.cardHolder.trim() : undefined,
      })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.result.set(result);
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set(true);
        },
      });
  }

  protected restart(): void {
    this.result.set(null);
    this.submitted.set(false);
    this.step.set(1);
  }
}
