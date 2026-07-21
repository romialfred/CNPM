import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, map, type Observable, of, startWith } from 'rxjs';
import { AlertComponent } from '../../design-system/alert/alert.component';
import { ButtonComponent } from '../../design-system/button/button.component';
import { DialogComponent } from '../../design-system/dialog/dialog.component';
import { OtpInputComponent } from '../../design-system/otp-input/otp-input.component';
import { AUTH_GATEWAY, type TotpEnrollment } from './auth-gateway';
import { AuthFlowStore } from './auth-flow.store';

type EnrollmentState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly enrollment: TotpEnrollment }
  | { readonly kind: 'error' };

/**
 * AUTH-007 — Enrôlement du second facteur à la première connexion.
 *
 * Popup PREMIUM et FORCÉE : `cnpm-dialog` en `dismissible=false`, on ne l'écarte pas
 * d'un clic. C'est la traduction de l'exigence « bloquer l'accès tant que le 2FA n'est
 * pas activé ». La seule sortie explicite est la déconnexion — l'utilisateur n'est
 * jamais piégé sans issue.
 *
 * Fidèle à ADR-003 : le secret et le QR viennent du fournisseur d'identité (Keycloak),
 * l'application ne les fabrique ni ne les stocke. Elle affiche ce que le port lui remet
 * et confirme l'activation avec le premier code produit par l'application
 * d'authentification (Microsoft Authenticator, ou toute application TOTP).
 */
@Component({
  selector: 'cnpm-two-factor-enrollment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DialogComponent,
    OtpInputComponent,
    ButtonComponent,
    AlertComponent,
  ],
  templateUrl: './two-factor-enrollment.page.html',
  styleUrl: './two-factor-enrollment.page.scss',
})
export class TwoFactorEnrollmentPage {
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly flow = inject(AuthFlowStore);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);

  /** Espace où conduire après activation ; suit le défi en cours, défaut « membre ». */
  private readonly space = this.flow.activeChallenge()?.space ?? 'member';

  private readonly otpField = viewChild<OtpInputComponent>('otpField');

  protected readonly submitting = signal(false);
  protected readonly codeError = signal<string | undefined>(undefined);
  protected readonly copied = signal(false);

  /**
   * Codes de secours affichés APRÈS activation réussie : l'utilisateur doit les conserver
   * avant d'entrer dans l'application. Tant qu'ils sont présents, on ne redirige pas.
   */
  protected readonly recoveryCodes = signal<readonly string[] | null>(null);
  private readonly pendingRedirect = signal<string | null>(null);

  /** Défi d'enrôlement obtenu de la source ; chargement / prêt / erreur. */
  protected readonly state = toSignal(
    this.gateway.beginTotpEnrollment().pipe(
      map((enrollment): EnrollmentState => ({ kind: 'ready', enrollment })),
      catchError((): Observable<EnrollmentState> => of({ kind: 'error' })),
      startWith<EnrollmentState>({ kind: 'loading' }),
    ),
    { initialValue: { kind: 'loading' } as EnrollmentState },
  );

  protected readonly enrollment = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.enrollment : null;
  });

  protected readonly form = this.fb.group({
    code: this.fb.control('', [Validators.required, Validators.pattern(/^\d{6}$/u)]),
  });

  protected async copyManualKey(): Promise<void> {
    const key = this.enrollment()?.manualKey;
    if (!key) {
      return;
    }
    try {
      await navigator.clipboard?.writeText(key.replace(/\s+/gu, ''));
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Le presse-papiers peut être refusé : la clé reste lisible et saisissable à la
      // main. On n'affiche pas d'erreur pour un confort optionnel.
    }
  }

  protected activate(): void {
    if (this.submitting()) {
      return;
    }
    const enrollment = this.enrollment();
    if (!enrollment) {
      return;
    }
    if (this.form.invalid) {
      this.form.controls.code.markAsTouched();
      this.codeError.set('Saisissez le code à six chiffres.');
      return;
    }
    this.submitting.set(true);
    this.codeError.set(undefined);
    this.gateway.activateTotp(enrollment.enrollmentId, this.form.getRawValue().code, this.space).subscribe({
      next: (result) => {
        this.submitting.set(false);
        if (result.outcome === 'activated') {
          if (result.recoveryCodes && result.recoveryCodes.length > 0) {
            // On montre d'abord les codes de secours ; l'entrée dans l'app attend leur
            // sauvegarde explicite. Aucune redirection tant qu'ils ne sont pas confirmés.
            this.recoveryCodes.set(result.recoveryCodes);
            this.pendingRedirect.set(result.redirectTo);
            return;
          }
          void this.router.navigateByUrl(result.redirectTo);
          return;
        }
        // Code refusé : on vide la saisie et on ramène le focus, sans quitter la popup.
        this.codeError.set('Code incorrect. Vérifiez l’heure de votre téléphone et réessayez.');
        this.form.controls.code.reset('');
        afterNextRender(() => this.otpField()?.focusFirstCell(), { injector: this.injector });
      },
      error: () => {
        this.submitting.set(false);
        this.codeError.set('L’activation a échoué. Réessayez dans un instant.');
      },
    });
  }

  /** Après avoir noté ses codes de secours, l'utilisateur entre dans l'application. */
  protected continueToApp(): void {
    const target = this.pendingRedirect();
    if (target) {
      void this.router.navigateByUrl(target);
    }
  }

  protected signOut(): void {
    void this.router.navigate(['/auth/login']);
  }
}
