import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertComponent } from '../../design-system/alert/alert.component';
import { ButtonComponent } from '../../design-system/button/button.component';
import { OfflineNoticeComponent } from '../../design-system/offline-notice/offline-notice.component';
import { OtpInputComponent } from '../../design-system/otp-input/otp-input.component';
import { AuthShellComponent } from './auth-shell.component';
import { AUTH_GATEWAY } from './auth-gateway';
import { AuthFlowStore } from './auth-flow.store';

type VerifyState = 'idle' | 'submitting' | 'error' | 'success' | 'expired';

const RESEND_DELAY_SECONDS = 30;

/**
 * AUTH-001 — étape vérification renforcée (2FA).
 *
 * Sans défi actif, la page bascule en état « session expirée » et propose de
 * reprendre la connexion, plutôt que d'exposer un formulaire inopérant. Le délai de
 * renvoi est affiché sans annonce vocale à chaque seconde ; seule la disponibilité du
 * renvoi est annoncée.
 */
@Component({
  selector: 'cnpm-verify-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthShellComponent,
    OtpInputComponent,
    ButtonComponent,
    AlertComponent,
    OfflineNoticeComponent,
  ],
  templateUrl: './verify.page.html',
  styleUrl: './verify.page.scss',
})
export class VerifyPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly flow = inject(AuthFlowStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly otpField = viewChild<OtpInputComponent>('otpField');

  protected readonly state = signal<VerifyState>(
    this.flow.activeChallenge() ? 'idle' : 'expired',
  );
  protected readonly resendCountdown = signal(RESEND_DELAY_SECONDS);
  protected readonly canResend = computed(() => this.resendCountdown() === 0);
  /** Nombre de renvois effectués ; rend chaque annonce distincte de la précédente. */
  private readonly resendCount = signal(0);

  /**
   * Message d'annonce du renvoi, distinct de la disponibilité du bouton.
   *
   * Le rang de l'envoi est mentionné à partir du deuxième : une région live n'annonce
   * qu'une mutation, et réécrire un texte identique n'en produirait aucune. Le rang
   * est une information utile — l'utilisateur sait quel code fait foi — plutôt qu'un
   * artifice destiné à forcer l'annonce.
   */
  protected readonly resendAnnouncement = computed(() => {
    const count = this.resendCount();
    if (count === 0) {
      return '';
    }
    return count === 1
      ? 'Un nouveau code a été envoyé.'
      : `Un nouveau code a été envoyé (envoi n° ${count}). Seul le dernier code reçu est valide.`;
  });

  /**
   * Motif d'indisponibilité du bouton de renvoi, lu à la demande.
   *
   * Porté par `aria-describedby` et non par le nom accessible : interpoler le décompte
   * dans un `aria-label` réécrirait le nom du bouton chaque seconde, sur un élément
   * focalisable. La description n'est restituée qu'à la prise de focus, une fois.
   */
  protected readonly resendHint = computed(() =>
    this.canResend() ? '' : 'Un nouveau code ne peut être demandé qu’après le délai indiqué.',
  );

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6)]],
  });

  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    if (this.state() !== 'expired') {
      this.startCountdown();
      // Focus initial sur le premier champ pertinent, en miroir de l'écran
      // d'identifiants : sans cela l'utilisateur clavier arrive sur le `body`.
      afterNextRender(() => this.otpField()?.focusFirstCell());
    }
    this.destroyRef.onDestroy(() => this.stopCountdown());
  }

  protected codeError(): string | undefined {
    return this.state() === 'error' ? 'Code invalide. Vérifiez-le et réessayez.' : undefined;
  }

  protected submit(): void {
    const challenge = this.flow.activeChallenge();
    if (!challenge) {
      this.state.set('expired');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.state.set('submitting');
    this.gateway.verifyCode(challenge.id, this.form.getRawValue().code).subscribe((result) => {
      if (result.outcome === 'authenticated') {
        this.state.set('success');
        this.flow.clear();
        // Laisse le temps aux lecteurs d'écran d'annoncer le succès avant de rediriger.
        setTimeout(() => void this.router.navigateByUrl(result.redirectTo), 900);
        return;
      }
      this.form.reset({ code: '' });
      this.state.set('error');
      // Le focus repart sur la première case : sans cela il resterait sur un bouton
      // neutralisé et l'utilisateur devrait retabuler pour ressaisir le code.
      this.otpField()?.focusFirstCell();
    });
  }

  protected resend(): void {
    const challenge = this.flow.activeChallenge();
    if (!challenge || !this.canResend()) {
      return;
    }
    this.gateway.resendCode(challenge.id).subscribe(() => {
      // Annonce explicite : vider la région live n'annoncerait rien, l'utilisateur
      // n'aurait aucune confirmation que le code est reparti. Le compteur rend chaque
      // message distinct : réécrire la même chaîne ne déclencherait aucune émission
      // (égalité Object.is du signal), donc aucune annonce dès le second renvoi.
      this.resendCount.update((count) => count + 1);
      this.startCountdown();
      this.otpField()?.focusFirstCell();
    });
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.resendCountdown.set(RESEND_DELAY_SECONDS);
    this.timer = setInterval(() => {
      const next = this.resendCountdown() - 1;
      this.resendCountdown.set(Math.max(0, next));
      if (next <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
