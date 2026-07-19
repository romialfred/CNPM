import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { PublicShellComponent } from '../public-shell.component';

type ContactField = 'fullName' | 'organization' | 'email' | 'subject' | 'message';

const FIELD_LABELS: Readonly<Record<ContactField, string>> = {
  fullName: 'Nom',
  organization: 'Organisation',
  email: 'Adresse e-mail',
  subject: 'Objet',
  message: 'Message',
};

const trimmedRequired: ValidatorFn = (
  control: AbstractControl<unknown>,
): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

/** PUB-014 — formulaire de contact vérifié localement, sans transmission ni persistance. */
@Component({
  selector: 'cnpm-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    ErrorStateComponent,
    InlineErrorSummaryComponent,
    PublicShellComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './contact.page.html',
  styleUrls: ['./contact.page.scss', './contact.assurance.scss', './contact.responsive.scss'],
})
export class ContactPage {
  private readonly document = inject(DOCUMENT);
  private readonly dataMode = inject(CNPM_DATA_MODE);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly seo = inject(PageSeoService);
  private readonly injector = inject(Injector);
  private readonly pageTitle = viewChild<ElementRef<HTMLElement>>('pageTitle');
  private readonly successPanel = viewChild<ElementRef<HTMLElement>>('successPanel');

  protected readonly isDemo = this.dataMode === 'demo';
  protected readonly attempted = signal(false);
  protected readonly errors = signal<readonly CnpmFieldError[]>([]);
  protected readonly localCheckComplete = signal(false);

  protected readonly form = this.fb.group({
    fullName: ['', [trimmedRequired, Validators.maxLength(120)]],
    organization: ['', [Validators.maxLength(255)]],
    email: ['', [trimmedRequired, Validators.email, Validators.maxLength(320)]],
    subject: ['', [trimmedRequired, Validators.maxLength(160)]],
    message: ['', [trimmedRequired, Validators.maxLength(2000)]],
  });

  constructor() {
    this.seo.apply({
      title: 'Contact — CNPM',
      description:
        'Formulaire de contact du CNPM, vérifié dans le navigateur sans conservation de coordonnées.',
      robots: 'noindex,nofollow',
      canonicalPath: '/contact',
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.localCheckComplete.set(false);
      if (this.attempted()) {
        this.errors.set(this.collectErrors());
      }
    });

    afterNextRender(() => this.pageTitle()?.nativeElement.focus(), { injector: this.injector });
  }

  protected fieldId(field: ContactField): string {
    return `contact-${field}`;
  }

  protected helperId(field: ContactField): string {
    return `contact-${field}-aide`;
  }

  protected errorId(field: ContactField): string {
    return `contact-${field}-erreur`;
  }

  protected errorFor(field: ContactField): string | null {
    if (!this.attempted()) {
      return null;
    }
    const control = this.form.controls[field];
    if (!control.invalid) {
      return null;
    }
    if (control.hasError('required')) {
      return `${FIELD_LABELS[field]} : renseignez une valeur.`;
    }
    if (control.hasError('email')) {
      return 'Adresse e-mail : utilisez un format valide.';
    }
    return `${FIELD_LABELS[field]} : la valeur est trop longue.`;
  }

  protected describedBy(field: ContactField): string {
    const helper = this.helperId(field);
    return this.errorFor(field) ? `${helper} ${this.errorId(field)}` : helper;
  }

  protected invalidAttr(field: ContactField): string | null {
    return this.errorFor(field) ? 'true' : null;
  }

  protected focusErrorField(event: Event): void {
    const target = event.target as HTMLElement | null;
    const link = target?.closest<HTMLAnchorElement>('a[href^="#"]');
    const fieldId = link?.hash.slice(1);
    if (!fieldId) {
      return;
    }
    const field = this.document.getElementById(decodeURIComponent(fieldId));
    if (!field) {
      return;
    }
    event.preventDefault();
    field.focus();
  }

  protected checkLocally(): void {
    this.attempted.set(true);
    this.form.markAllAsTouched();
    const errors = this.collectErrors();
    this.errors.set(errors);
    this.localCheckComplete.set(false);
    if (errors.length > 0) {
      return;
    }

    // Les valeurs ne sont ni envoyées, ni copiées dans un service, ni conservées :
    // le contrôle local se termine par leur effacement immédiat.
    this.form.reset();
    this.attempted.set(false);
    this.errors.set([]);
    this.localCheckComplete.set(true);
    afterNextRender(() => this.successPanel()?.nativeElement.focus(), { injector: this.injector });
  }

  protected clear(): void {
    this.form.reset();
    this.attempted.set(false);
    this.errors.set([]);
    this.localCheckComplete.set(false);
  }

  private collectErrors(): readonly CnpmFieldError[] {
    return (Object.keys(FIELD_LABELS) as ContactField[]).flatMap((field) => {
      const message = this.errorFor(field);
      return message ? [{ fieldId: this.fieldId(field), message }] : [];
    });
  }
}
