import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_REQUESTS_GATEWAY,
  type MemberRequestType,
} from './member-requests-gateway';
import { REQUEST_TYPE_LABELS } from './member-request-labels';

const REQUEST_TYPES: readonly MemberRequestType[] = ['INFORMATION', 'DOCUMENT', 'CLAIM', 'OTHER'];

/**
 * Espace membre — « Nouvelle requête » (MP-010) : soumission réelle d'une requête.
 *
 * <p>La création est idempotente côté serveur (clé d'idempotence). Une saisie non soumise est
 * protégée à la navigation par {@link pendingMemberRequestChangesGuard}.
 */
@Component({
  selector: 'cnpm-new-member-request-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MemberPortalShellComponent,
    PageHeaderComponent,
    AlertComponent,
    ButtonComponent,
  ],
  templateUrl: './new-member-request.page.html',
  styleUrl: './new-member-request.page.scss',
})
export class NewMemberRequestPage {
  private readonly gateway = inject(MEMBER_REQUESTS_GATEWAY);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly title = inject(Title);

  protected readonly types = REQUEST_TYPES;
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<MemberRequestType | ''>('', Validators.required),
    subject: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(255),
    ]),
    description: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(4000),
    ]),
  });

  constructor() {
    this.title.setTitle('Nouvelle requête — Espace membre CNPM');
  }

  protected typeLabel(type: MemberRequestType): string {
    return REQUEST_TYPE_LABELS[type];
  }

  /** Appelé par le guard : autorise la sortie si rien n'est en cours de saisie ou déjà soumis. */
  confirmNavigation(): boolean {
    if (this.submitted() || this.form.pristine) {
      return true;
    }
    return window.confirm(
      'Votre requête n’est pas envoyée. Quitter cette page perdra votre saisie. Continuer ?',
    );
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.gateway
      .create({
        type: value.type as MemberRequestType,
        subject: value.subject,
        description: value.description,
      })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (detail) => {
          this.submitted.set(true);
          this.submitting.set(false);
          this.toasts.success(`Requête ${detail.reference} envoyée à la CNPM.`);
          void this.router.navigate(['/member/requests', detail.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set(
            'Votre requête n’a pas pu être envoyée. Vos saisies sont conservées ; réessayez.',
          );
        },
      });
  }
}
