import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OidcSessionService } from '../../core/auth/oidc-session.service';

/**
 * Retour de la redirection Keycloak (`/auth/callback`).
 *
 * Écran de transition : il échange le code d'autorisation contre un jeton, puis conduit
 * à la destination d'origine. En cas d'échec (code absent, `state` inattendu, échange
 * refusé), il ramène à la connexion sans laisser l'utilisateur sur une page morte.
 * Aucune donnée n'est affichée ; aucun secret ne transite par l'URL au-delà du code,
 * lequel est à usage unique.
 */
@Component({
  selector: 'cnpm-oidc-callback-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="cnpm-oidc-callback" role="status" aria-live="polite">
      <p>{{ message() }}</p>
    </section>
  `,
  styles: `
    .cnpm-oidc-callback {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 40vh;
      padding: var(--cnpm-space-6);
      color: var(--cnpm-color-text-secondary);
      font-size: var(--cnpm-font-size-md);
    }
  `,
})
export class OidcCallbackPage {
  private readonly session = inject(OidcSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly message = signal('Connexion en cours…');

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    void this.complete({
      code: params.get('code'),
      state: params.get('state'),
      error: params.get('error'),
    });
  }

  private async complete(params: {
    code: string | null;
    state: string | null;
    error: string | null;
  }): Promise<void> {
    try {
      const target = await this.session.handleCallback(params);
      await this.router.navigateByUrl(target);
    } catch {
      this.message.set('La connexion n’a pas abouti. Redirection…');
      await this.router.navigate(['/auth/login'], { queryParams: { erreur: 'callback' } });
    }
  }
}
