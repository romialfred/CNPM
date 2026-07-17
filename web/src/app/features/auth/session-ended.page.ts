import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../design-system/button/button.component';
import { ErrorStateComponent } from '../../design-system/error-state/error-state.component';
import { AuthShellComponent } from './auth-shell.component';

/**
 * AUTH-008 — session terminée (`/auth/session-ended`).
 *
 * Écran de la ligne « Session expirée » de `loading-empty-error.md` : explication et
 * unique action « se reconnecter ». Il n'a pas de fiche dédiée ; sa composition suit
 * le pattern normatif des états, réutilise le cadre d'authentification et l'état
 * d'erreur `session-ended`.
 *
 * La règle veut « ne jamais afficher une page blanche » : atteindre ce chemin après
 * l'expiration d'une session doit produire une page qui explique et propose de se
 * reconnecter, pas un écran vide ni une redirection muette.
 */
@Component({
  selector: 'cnpm-session-ended-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AuthShellComponent, ErrorStateComponent, ButtonComponent],
  template: `
    <cnpm-auth-shell
      trustTitle="Votre session est protégée"
      trustText="Les sessions expirent après une période d’inactivité pour protéger vos données. Reconnectez-vous pour reprendre là où vous étiez."
    >
      <div class="cnpm-session-ended">
        <cnpm-error-state variant="session-ended" titleAs="h1">
          <cnpm-button variant="primary" routerLink="/auth/login">Se reconnecter</cnpm-button>
        </cnpm-error-state>
      </div>
    </cnpm-auth-shell>
  `,
  styles: `
    .cnpm-session-ended {
      display: flex;
      justify-content: center;
    }
  `,
})
export class SessionEndedPage {}
