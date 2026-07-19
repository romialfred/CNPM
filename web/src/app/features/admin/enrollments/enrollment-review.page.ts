import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
} from '@angular/forms';
import { ActivatedRoute, RouterLink, type Params } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCheckCircle,
  LucideClipboardCheck,
  LucideRefreshCw,
  LucideXCircle,
} from '@lucide/angular';
import { catchError, map, type Observable, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  ENROLLMENTS_GATEWAY,
  EnrollmentAccessError,
  EnrollmentConflictError,
  EnrollmentNotFoundError,
  EnrollmentValidationError,
  type EnrollmentApplication,
  type EnrollmentStatus,
} from './enrollments-gateway';

type ReviewScreenState = 'loading' | 'ready' | 'error' | 'forbidden' | 'notFound';
type ReviewAction = 'complement' | 'approve' | 'reject';

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

const WORKFLOW_GUIDANCE: Readonly<Record<EnrollmentStatus, string>> = {
  DRAFT: 'Le dossier doit être soumis par son créateur avant tout contrôle.',
  SUBMITTED: 'Le dossier est prêt à être pris en charge par un contrôleur habilité.',
  UNDER_REVIEW:
    'Le contrôle est ouvert. Une demande de complément ou une décision peut être enregistrée selon vos permissions.',
  COMPLEMENT_REQUIRED:
    'Une nouvelle soumission du demandeur est attendue. Aucune échéance n’est affichée : le SLA reste à arbitrer.',
  APPROVED: 'La décision d’approbation est enregistrée. Le dossier est dans un état terminal.',
  REJECTED: 'La décision de rejet est enregistrée. Le dossier est dans un état terminal.',
};

/** BO-010 — contrôle et décision sur un dossier d'enrôlement. */
@Component({
  selector: 'cnpm-enrollment-review-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ErrorStateComponent,
    InlineErrorSummaryComponent,
    PageHeaderComponent,
    SkeletonComponent,
    LucideArrowLeft,
    LucideCheckCircle,
    LucideClipboardCheck,
    LucideRefreshCw,
    LucideXCircle,
  ],
  templateUrl: './enrollment-review.page.html',
  styleUrl: './enrollment-review.page.scss',
})
export class EnrollmentReviewPage {
  private readonly gateway = inject(ENROLLMENTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SESSION_GATEWAY);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly activeAction = signal<ReviewAction | null>(null);
  protected readonly actionPending = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  private readonly resourceGoneId = signal<string | null>(null);
  private readonly replacement = signal<EnrollmentApplication | null>(null);
  private readonly retryTick = signal(0);

  protected readonly complementForm = this.formBuilder.group({
    comment: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)]],
  });
  protected readonly approvalForm = this.formBuilder.group({
    membershipNumber: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)],
    ],
    categoryCode: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    comment: ['', [Validators.maxLength(2000)]],
  });
  protected readonly rejectionForm = this.formBuilder.group({
    reasonCode: ['', [Validators.maxLength(60)]],
    comment: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)]],
  });

  private readonly complementSubmitted = signal(false);
  private readonly approvalSubmitted = signal(false);
  private readonly rejectionSubmitted = signal(false);
  private readonly complementStatus = toSignal(
    this.complementForm.statusChanges.pipe(startWith(this.complementForm.status)),
  );
  private readonly approvalStatus = toSignal(
    this.approvalForm.statusChanges.pipe(startWith(this.approvalForm.status)),
  );
  private readonly rejectionStatus = toSignal(
    this.rejectionForm.statusChanges.pipe(startWith(this.rejectionForm.status)),
  );

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly enrollmentId = computed(() => this.params().get('id') ?? '');
  protected readonly listQueryParams = computed<Params>(() =>
    Object.fromEntries(
      this.query().keys.map((key) => {
        const values = this.query().getAll(key);
        return [key, values.length > 1 ? values : (values[0] ?? '')];
      }),
    ),
  );

  private readonly sessionIdentity = toSignal(
    this.session.identity.pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly canReview = computed(
    () => this.sessionIdentity()?.permissions.includes('ENROLLMENT.REVIEW') ?? false,
  );
  protected readonly canApprove = computed(
    () => this.sessionIdentity()?.permissions.includes('ENROLLMENT.APPROVE') ?? false,
  );

  private readonly fetchTrigger = computed(() => ({
    id: this.enrollmentId(),
    retry: this.retryTick(),
  }));
  private readonly loadResult = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.get(id).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) =>
            of(
              error instanceof EnrollmentAccessError
                ? { kind: 'forbidden' as const }
                : error instanceof EnrollmentNotFoundError
                  ? { kind: 'notFound' as const }
                  : { kind: 'error' as const },
            ),
          ),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly screenState = computed<ReviewScreenState>(() => {
    if (this.resourceGoneId() === this.enrollmentId()) {
      return 'notFound';
    }
    return this.loadResult().kind;
  });
  protected readonly application = computed(() => {
    const replacement = this.replacement();
    if (replacement?.id === this.enrollmentId()) {
      return replacement;
    }
    const result = this.loadResult();
    return result.kind === 'ready' ? result.data : null;
  });
  protected readonly pageTitle = computed(
    () => this.application()?.caseNumber ?? 'Revue d’un enrôlement',
  );

  protected readonly complementErrors = computed<readonly CnpmFieldError[]>(() => {
    this.complementStatus();
    const control = this.complementForm.controls.comment;
    return this.showError(control, this.complementSubmitted())
      ? [{ fieldId: 'complement-comment', message: this.requiredOrLength(control, 'Le motif') }]
      : [];
  });
  protected readonly approvalErrors = computed<readonly CnpmFieldError[]>(() => {
    this.approvalStatus();
    const errors: CnpmFieldError[] = [];
    const membership = this.approvalForm.controls.membershipNumber;
    const category = this.approvalForm.controls.categoryCode;
    const comment = this.approvalForm.controls.comment;
    if (this.showError(membership, this.approvalSubmitted())) {
      errors.push({
        fieldId: 'approval-membership-number',
        message: this.requiredOrLength(membership, 'Le numéro d’adhésion'),
      });
    }
    if (this.showError(category, this.approvalSubmitted())) {
      errors.push({
        fieldId: 'approval-category-code',
        message: this.requiredOrLength(category, 'Le code catégorie'),
      });
    }
    if (this.showError(comment, this.approvalSubmitted())) {
      errors.push({
        fieldId: 'approval-comment',
        message: 'Le commentaire dépasse 2 000 caractères.',
      });
    }
    return errors;
  });
  protected readonly rejectionErrors = computed<readonly CnpmFieldError[]>(() => {
    this.rejectionStatus();
    const errors: CnpmFieldError[] = [];
    const reasonCode = this.rejectionForm.controls.reasonCode;
    const comment = this.rejectionForm.controls.comment;
    if (this.showError(reasonCode, this.rejectionSubmitted())) {
      errors.push({
        fieldId: 'rejection-reason-code',
        message: 'Le code motif dépasse 60 caractères.',
      });
    }
    if (this.showError(comment, this.rejectionSubmitted())) {
      errors.push({
        fieldId: 'rejection-comment',
        message: this.requiredOrLength(comment, 'Le motif du rejet'),
      });
    }
    return errors;
  });

  protected statusLabel(status: EnrollmentStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: EnrollmentStatus): CnpmBadgeTone {
    return STATUS_TONES[status];
  }

  protected workflowGuidance(status: EnrollmentStatus): string {
    return WORKFLOW_GUIDANCE[status];
  }

  protected chooseAction(action: ReviewAction): void {
    if (this.actionPending()) {
      return;
    }
    this.activeAction.set(action);
    this.actionError.set(null);
    this.successMessage.set(null);
  }

  protected startReview(): void {
    const application = this.application();
    if (!application || application.status !== 'SUBMITTED' || !this.canReview()) {
      return;
    }
    this.runAction(
      this.gateway.startReview(application.id),
      'Le dossier est maintenant pris en charge pour contrôle.',
    );
  }

  protected submitComplement(): void {
    this.complementSubmitted.set(true);
    this.complementForm.markAllAsTouched();
    if (this.complementForm.invalid || !this.canReview()) {
      return;
    }
    const application = this.application();
    if (!application || application.status !== 'UNDER_REVIEW') {
      return;
    }
    this.runAction(
      this.gateway.requestComplement(
        application.id,
        this.complementForm.controls.comment.value.trim(),
      ),
      'La demande de complément est enregistrée, sans échéance automatique.',
    );
  }

  protected submitApproval(): void {
    this.approvalSubmitted.set(true);
    this.approvalForm.markAllAsTouched();
    if (this.approvalForm.invalid || !this.canApprove()) {
      return;
    }
    const application = this.application();
    if (!application || application.status !== 'UNDER_REVIEW') {
      return;
    }
    const values = this.approvalForm.getRawValue();
    const comment = values.comment.trim();
    this.runAction(
      this.gateway.approve(application.id, {
        membershipNumber: values.membershipNumber.trim(),
        categoryCode: values.categoryCode.trim(),
        ...(comment ? { comment } : {}),
      }),
      'L’approbation est enregistrée et l’adhésion a été activée par le backend.',
    );
  }

  protected submitRejection(): void {
    this.rejectionSubmitted.set(true);
    this.rejectionForm.markAllAsTouched();
    if (this.rejectionForm.invalid || !this.canApprove()) {
      return;
    }
    const application = this.application();
    if (!application || application.status !== 'UNDER_REVIEW') {
      return;
    }
    const values = this.rejectionForm.getRawValue();
    const reasonCode = values.reasonCode.trim();
    this.runAction(
      this.gateway.reject(application.id, {
        ...(reasonCode ? { reasonCode } : {}),
        comment: values.comment.trim(),
      }),
      'Le rejet motivé est enregistré.',
    );
  }

  protected retry(): void {
    this.replacement.set(null);
    this.resourceGoneId.set(null);
    this.actionError.set(null);
    this.successMessage.set(null);
    this.retryTick.update((value) => value + 1);
  }

  protected fieldInvalid(control: AbstractControl, submitted: boolean): boolean {
    return this.showError(control, submitted);
  }

  protected fieldError(errors: readonly CnpmFieldError[], fieldId: string): string | null {
    return errors.find((error) => error.fieldId === fieldId)?.message ?? null;
  }

  private runAction(request: Observable<EnrollmentApplication>, successMessage: string): void {
    this.actionPending.set(true);
    this.actionError.set(null);
    this.successMessage.set(null);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (application) => {
        this.replacement.set(application);
        this.activeAction.set(null);
        this.successMessage.set(successMessage);
        this.actionPending.set(false);
      },
      error: (error: unknown) => {
        this.actionPending.set(false);
        if (error instanceof EnrollmentNotFoundError) {
          this.resourceGoneId.set(this.enrollmentId());
          return;
        }
        if (error instanceof EnrollmentAccessError) {
          this.actionError.set(
            'Le backend a refusé cette action. Les permissions affichées par l’interface ne remplacent pas son contrôle.',
          );
          return;
        }
        if (error instanceof EnrollmentConflictError) {
          this.actionError.set(
            'Le dossier a changé d’état. Rechargez-le avant de prendre une nouvelle décision.',
          );
          return;
        }
        if (error instanceof EnrollmentValidationError) {
          this.actionError.set(error.message);
          return;
        }
        this.actionError.set('L’action n’a pas pu être enregistrée. Vous pouvez la réessayer.');
      },
    });
  }

  private showError(control: AbstractControl, submitted: boolean): boolean {
    return control.invalid && (submitted || control.touched);
  }

  private requiredOrLength(control: AbstractControl, label: string): string {
    return control.hasError('required') || control.hasError('pattern')
      ? `${label} est obligatoire.`
      : `${label} dépasse la longueur autorisée.`;
  }
}
