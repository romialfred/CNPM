import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertComponent } from '../../design-system/alert/alert.component';
import { ButtonComponent } from '../../design-system/button/button.component';
import { CheckboxComponent } from '../../design-system/checkbox/checkbox.component';
import { OfflineNoticeComponent } from '../../design-system/offline-notice/offline-notice.component';
import { PasswordInputComponent } from '../../design-system/password-input/password-input.component';
import { TabsComponent, type CnpmTab } from '../../design-system/tabs/tabs.component';
import { TextInputComponent } from '../../design-system/text-input/text-input.component';
import { AuthShellComponent } from './auth-shell.component';
import { AUTH_GATEWAY, type AuthSpace } from './auth-gateway';
import { AuthFlowStore } from './auth-flow.store';

type FormState = 'idle' | 'submitting' | 'error' | 'forbidden' | 'unavailable';

/**
 * AUTH-001 — étape identifiants.
 *
 * Formulaire réactif typé ; aucun appel HTTP direct (le port `AUTH_GATEWAY` isole le
 * transport). Le retour d'erreur est neutre et relié au formulaire, ne révèle pas si
 * l'adresse existe, et préserve la saisie de l'email. Le mot de passe n'est jamais
 * placé dans l'URL, un log ou analytics.
 */
@Component({
  selector: 'cnpm-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AuthShellComponent,
    TabsComponent,
    TextInputComponent,
    PasswordInputComponent,
    CheckboxComponent,
    ButtonComponent,
    AlertComponent,
    OfflineNoticeComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly flow = inject(AuthFlowStore);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private readonly emailField = viewChild<TextInputComponent>('emailField');
  private readonly errorAlert = viewChild<ElementRef<HTMLElement>>('errorAlert');

  /** Identifiant de l'alerte, relié au formulaire par aria-describedby. */
  protected readonly errorAlertId = 'cnpm-login-error';

  /** Un échec est affiché : identifiants refusés ou accès non autorisé. */
  protected hasFailure(): boolean {
    return (
      this.state() === 'error' || this.state() === 'forbidden' || this.state() === 'unavailable'
    );
  }

  protected readonly spaces: readonly CnpmTab[] = [
    { id: 'admin', label: 'Espace administration' },
    { id: 'member', label: 'Espace membre' },
  ];

  protected readonly space = signal<string>('admin');
  protected readonly state = signal<FormState>('idle');
  /** Passe à vrai à la première tentative d'envoi ; borne les messages « requis ». */
  protected readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  constructor() {
    // Focus initial sur l'email (critère d'acceptation AUTH-001).
    afterNextRender(() => this.emailField()?.focusInput());
  }

  /**
   * Message d'erreur du champ e-mail.
   *
   * Un champ vide simplement traversé au clavier ne doit pas être signalé en erreur :
   * l'obligation n'est constatée qu'à la soumission. Le message distingue « requis »
   * de « format invalide » — annoncer « adresse invalide » sur un champ vide
   * décrirait un défaut que l'utilisateur n'a pas commis.
   */
  protected emailError(): string | undefined {
    const control = this.form.controls.email;
    if (!control.touched || control.valid) {
      return undefined;
    }
    if (control.hasError('required')) {
      return this.submitted() ? 'L’adresse e-mail est requise.' : undefined;
    }
    return 'Saisissez une adresse e-mail valide.';
  }

  protected passwordError(): string | undefined {
    const control = this.form.controls.password;
    if (!control.touched || control.valid) {
      return undefined;
    }
    return this.submitted() ? 'Le mot de passe est requis.' : undefined;
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.state.set('submitting');
    const { email, password, remember } = this.form.getRawValue();
    const space = this.space() as AuthSpace;
    this.gateway.submitCredentials({ space, email, password, rememberDevice: remember }).subscribe({
      next: (result) => {
        if (result.outcome === 'mfa-required') {
          this.flow.startChallenge(result.challengeId, space);
          void this.router.navigate(['/auth/verify']);
          return;
        }
        // Erreur neutre : la saisie de l'email est préservée, le mot de passe effacé.
        this.form.controls.password.reset('');
        this.state.set(result.outcome === 'forbidden' ? 'forbidden' : 'error');
        this.focusFailure();
      },
      error: () => {
        this.form.controls.password.reset('');
        this.state.set('unavailable');
        this.focusFailure();
      },
    });
  }

  private focusFailure(): void {
    afterNextRender(() => this.errorAlert()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}
