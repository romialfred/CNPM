import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, take } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { memberRequestCategoryLabel } from './member-request-presenter';
import {
  MEMBER_REQUESTS_GATEWAY,
  type MemberRequestCategory,
  type MemberRequestKind,
  type SimulatedMemberAttachment,
} from './member-requests-gateway';
import {
  formatSimulatedAttachmentSize,
  MAX_SIMULATED_ATTACHMENTS,
  selectSimulatedAttachments,
} from './simulated-attachment';

const CATEGORIES: readonly MemberRequestCategory[] = [
  'DEMO_INFORMATION',
  'DEMO_DOCUMENT',
  'DEMO_PORTAL',
  'DEMO_CLAIM',
];

/** MP-010 — création locale et strictement fictive d'une requête membre. */
@Component({
  selector: 'cnpm-new-member-request-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MemberPortalShellComponent,
    AlertComponent,
    ButtonComponent,
    ErrorStateComponent,
    InlineErrorSummaryComponent,
    PageHeaderComponent,
  ],
  templateUrl: './new-member-request.page.html',
  styleUrl: './new-member-request.page.scss',
})
export class NewMemberRequestPage {
  private readonly gateway = inject(MEMBER_REQUESTS_GATEWAY);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly demoMode = inject(CNPM_DATA_MODE) === 'demo';
  protected readonly categories = CATEGORIES;
  protected readonly maxAttachments = MAX_SIMULATED_ATTACHMENTS;
  protected readonly form = this.formBuilder.group({
    kind: this.formBuilder.control<MemberRequestKind | ''>('', Validators.required),
    category: this.formBuilder.control<MemberRequestCategory | ''>('', Validators.required),
    subject: this.formBuilder.control('', [trimmedRequired, Validators.maxLength(160)]),
    description: this.formBuilder.control('', [
      trimmedRequired,
      trimmedMinLength(20),
      Validators.maxLength(2000),
    ]),
  });
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly attachments = signal<readonly SimulatedMemberAttachment[]>([]);
  protected readonly attachmentError = signal<string | null>(null);
  private navigationAllowed = false;

  protected formErrors(): readonly CnpmFieldError[] {
    if (!this.submitted()) return [];
    const errors: CnpmFieldError[] = [];
    const controls = this.form.controls;
    if (controls.kind.invalid) {
      errors.push({ fieldId: 'new-request-kind', message: 'Choisissez le type de dossier.' });
    }
    if (controls.category.invalid) {
      errors.push({
        fieldId: 'new-request-category',
        message: 'Choisissez une catégorie fictive.',
      });
    }
    if (controls.subject.hasError('required')) {
      errors.push({ fieldId: 'new-request-subject', message: 'Saisissez un objet.' });
    } else if (controls.subject.hasError('maxlength')) {
      errors.push({
        fieldId: 'new-request-subject',
        message: 'Limitez l’objet à 160 caractères.',
      });
    }
    if (controls.description.hasError('required')) {
      errors.push({ fieldId: 'new-request-description', message: 'Décrivez votre demande.' });
    } else if (controls.description.hasError('minlengthTrimmed')) {
      errors.push({
        fieldId: 'new-request-description',
        message: 'Décrivez la demande en au moins 20 caractères.',
      });
    } else if (controls.description.hasError('maxlength')) {
      errors.push({
        fieldId: 'new-request-description',
        message: 'Limitez la description à 2 000 caractères.',
      });
    }
    return errors;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.submitError.set(null);
    this.form.markAllAsTouched();
    if (!this.demoMode || this.form.invalid || this.submitting()) return;

    const values = this.form.getRawValue();
    if (!values.kind || !values.category) return;
    this.submitting.set(true);
    this.gateway
      .create({
        kind: values.kind,
        category: values.category,
        subject: values.subject.trim(),
        description: values.description.trim(),
        attachments: this.attachments(),
      })
      .pipe(
        take(1),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (created) => {
          this.navigationAllowed = true;
          this.form.markAsPristine();
          void this.router.navigate(['/member/requests', created.id], {
            queryParams: { created: '1' },
          });
        },
        error: () => {
          this.submitError.set(
            'La création locale a échoué. Votre saisie et les métadonnées simulées sont conservées.',
          );
        },
      });
  }

  protected selectFiles(input: HTMLInputElement): void {
    const selection = selectSimulatedAttachments(
      input.files,
      this.attachments().length,
      'new-member-request-attachment',
    );
    if (selection.accepted.length > 0) {
      this.attachments.update((current) => [...current, ...selection.accepted]);
      this.form.markAsDirty();
    }
    this.attachmentError.set(selection.error);
    input.value = '';
  }

  protected removeAttachment(id: string): void {
    this.attachments.update((current) => current.filter((attachment) => attachment.id !== id));
    this.attachmentError.set(null);
    this.form.markAsDirty();
  }

  protected categoryLabel = memberRequestCategoryLabel;
  protected formatAttachmentSize = formatSimulatedAttachmentSize;

  confirmNavigation(): boolean {
    if (
      this.navigationAllowed ||
      this.submitting() ||
      (!this.form.dirty && this.attachments().length === 0)
    ) {
      return true;
    }
    return globalThis.confirm('Quitter sans conserver cette requête fictive ?');
  }
}

function trimmedRequired(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

function trimmedMinLength(minimum: number) {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    control.value.trim().length >= minimum ? null : { minlengthTrimmed: { minimum } };
}
