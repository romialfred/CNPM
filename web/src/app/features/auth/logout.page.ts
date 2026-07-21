import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NativeSessionStore } from '../../core/auth/native-session.store';
import { AuthFlowStore } from './auth-flow.store';

/**
 * Déconnexion : termine la session applicative et ramène à l'écran de connexion.
 *
 * En démo, aucun jeton n'est détenu côté client — la sortie se résume à revenir à la
 * connexion. En authentification native (AUTH-DEC-020), c'est ici que le jeton applicatif
 * sera purgé ; aucune redirection vers un fournisseur externe (Keycloak est abandonné).
 */
@Component({
  selector: 'cnpm-logout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="cnpm-logout" role="status">Déconnexion en cours…</p>
  `,
  styles: `
    .cnpm-logout {
      margin: 0;
      padding: var(--cnpm-space-8);
      text-align: center;
      color: var(--cnpm-color-text-muted);
    }
  `,
})
export class LogoutPage {
  private readonly router = inject(Router);
  private readonly flow = inject(AuthFlowStore);
  private readonly session = inject(NativeSessionStore);

  constructor() {
    // Purge le jeton applicatif en mémoire et l'état d'authentification transitoire.
    this.session.clear();
    this.flow.clear();
    void this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}
