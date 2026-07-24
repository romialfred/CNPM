import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertComponent } from '../../design-system/alert/alert.component';
import { ButtonComponent } from '../../design-system/button/button.component';
import { AUTH_GATEWAY, type AuthSpace } from './auth-gateway';
import { AuthFlowStore } from './auth-flow.store';
import { AuthShellComponent } from './auth-shell.component';

type SetPasswordState = 'idle' | 'submitting' | 'error' | 'success';

/** Longueur minimale, alignée sur le serveur (AUTH-DEC-027). */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Activation d'un compte et récupération d'accès (processus d'enrôlement étape 18,
 * PRT-001 « le membre peut récupérer son accès sans intervention manuelle abusive »).
 *
 * Le titulaire pose lui-même son mot de passe : l'administration n'a émis qu'un lien à
 * usage unique et n'a jamais connu le secret. La page sert les deux routes — `activate`
 * pour un compte neuf, `reset-password` pour une récupération — car le geste est le même ;
 * seuls les libellés changent, pour ne pas annoncer une « réinitialisation » à quelqu'un
 * qui n'a jamais eu de mot de passe.
 *
 * Le jeton vient de l'URL du lien reçu et n'est jamais réaffiché : le montrer à l'écran
 * l'exposerait aux captures et aux regards par-dessus l'épaule.
 */
@Component({
  selector: 'cnpm-set-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent, ButtonComponent, AlertComponent],
  templateUrl: './set-password.page.html',
  styleUrl: './set-password.page.scss',
})
export class SetPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly flow = inject(AuthFlowStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly minLength = MIN_PASSWORD_LENGTH;
  protected readonly state = signal<SetPasswordState>('idle');

  /** `activation` distingue la première mise en service d'une récupération d'accès. */
  protected readonly activation = this.route.snapshot.data['activation'] === true;

  /**
   * Jeton porté par le lien reçu. Sans lui, aucun formulaire n'est présenté : proposer une
   * saisie qui ne pourra jamais aboutir n'aide personne.
   */
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  protected readonly hasToken = this.token.trim().length > 0;

  /**
   * Identité et espace portés par le lien, pour enchaîner AUTOMATIQUEMENT après la pose du
   * mot de passe : connexion → enrôlement du second facteur, sans ressaisie (exigence du
   * commanditaire). Absents d'un ancien lien, on retombe sur l'écran de succès classique.
   */
  private readonly login = this.route.snapshot.queryParamMap.get('login') ?? '';
  private readonly space: AuthSpace =
    this.route.snapshot.queryParamMap.get('space') === 'admin' ? 'admin' : 'member';

  protected readonly form = this.fb.group({
    password: this.fb.control('', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]),
    confirmation: this.fb.control('', [Validators.required]),
  });

  protected readonly title = this.activation
    ? 'Activez votre compte'
    : 'Choisissez un nouveau mot de passe';

  protected readonly intro = this.activation
    ? 'Votre compte est créé. Choisissez le mot de passe qui vous servira à vous connecter.'
    : 'Choisissez le mot de passe qui remplacera le précédent.';

  protected submit(): void {
    const password = this.form.controls.password.value;
    const confirmation = this.form.controls.confirmation.value;

    if (this.form.invalid || password !== confirmation || this.state() === 'submitting') {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('submitting');
    this.gateway
      .setPassword(this.token, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterPasswordSet(password),
        error: () => this.state.set('error'),
      });
  }

  /**
   * Après la pose du mot de passe, on enchaîne directement : connexion avec l'identité
   * portée par le lien, puis enrôlement du second facteur. Le titulaire ne ressaisit rien.
   * Faute d'identité dans le lien (ancien format), on affiche l'écran de succès habituel.
   */
  private afterPasswordSet(password: string): void {
    if (!this.login) {
      this.state.set('success');
      return;
    }
    this.gateway
      .submitCredentials({
        space: this.space,
        email: this.login,
        password,
        rememberDevice: false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result.outcome === 'enrollment-required' || result.outcome === 'mfa-required') {
            this.flow.startChallenge(result.challengeId, this.space);
            // Compte neuf : le second facteur n'est jamais enrôlé, on va droit à l'enrôlement.
            const target =
              result.outcome === 'enrollment-required' ? '/auth/2fa-enrollment' : '/auth/verify';
            void this.router.navigate([target]);
            return;
          }
          // Cas résiduels (identité refusée, etc.) : le mot de passe est bien posé, on
          // renvoie vers la connexion plutôt que de laisser l'utilisateur sans issue.
          this.state.set('success');
        },
        error: () => this.state.set('success'),
      });
  }

  protected goToLogin(): void {
    void this.router.navigate(['/auth/login']);
  }

  /** Vrai lorsque les deux saisies diffèrent ET que l'utilisateur a quitté le champ. */
  protected confirmationMismatch(): boolean {
    const { password, confirmation } = this.form.controls;
    return confirmation.touched && confirmation.value !== password.value;
  }
}
