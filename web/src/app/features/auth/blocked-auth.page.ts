import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideCircleAlert, LucideKeyRound, LucideShieldAlert } from '@lucide/angular';
import { ButtonComponent } from '../../design-system/button/button.component';
import { AuthShellComponent } from './auth-shell.component';

export interface BlockedAuthContent {
  readonly screenId: 'AUTH-003' | 'AUTH-004' | 'AUTH-005' | 'AUTH-006' | 'AUTH-007';
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly decision: string;
}

/**
 * État fermé des parcours IAM dont la destination n'est pas encore arbitrée.
 *
 * Ces routes complètent le plan de navigation sans simuler un flux de sécurité :
 * aucun formulaire, secret, QR, code de secours ou appel réseau n'est exposé tant
 * que UX-DEC-011 et le fournisseur d'identité ne sont pas configurés.
 */
@Component({
  selector: 'cnpm-blocked-auth-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideCircleAlert,
    LucideKeyRound,
    LucideShieldAlert,
    ButtonComponent,
    AuthShellComponent,
  ],
  template: `
    <cnpm-auth-shell
      trustTitle="Une identité numérique sous contrôle"
      trustText="Les parcours sensibles restent fermés tant que leurs méthodes, canaux et règles de sécurité n'ont pas été validés par le CNPM."
    >
      <article class="blocked-auth" aria-labelledby="blocked-auth-title">
        <div class="blocked-auth__heading">
          <span class="blocked-auth__icon" aria-hidden="true"><svg lucideKeyRound></svg></span>
          <div>
            <p class="blocked-auth__eyebrow">{{ content.eyebrow }}</p>
            <h1 id="blocked-auth-title">{{ content.title }}</h1>
          </div>
        </div>

        <p class="blocked-auth__description">{{ content.description }}</p>

        <section class="blocked-auth__status" aria-labelledby="blocked-auth-status-title">
          <svg lucideCircleAlert aria-hidden="true"></svg>
          <div>
            <h2 id="blocked-auth-status-title">Configuration requise</h2>
            <p>{{ content.decision }}</p>
          </div>
        </section>

        <div class="blocked-auth__assurance">
          <svg lucideShieldAlert aria-hidden="true"></svg>
          <p>
            <strong>Aucune opération n'est simulée.</strong>
            Aucune donnée, clé secrète ou demande de récupération n'est saisie, transmise ou
            conservée sur cet écran.
          </p>
        </div>

        <cnpm-button [routerLink]="'/auth/login'" [block]="true">
          Retour à la connexion
        </cnpm-button>

        <p class="blocked-auth__reference">
          Référence {{ content.screenId }} · Décision UX-DEC-011 ouverte
        </p>
      </article>
    </cnpm-auth-shell>
  `,
  styleUrl: './blocked-auth.page.scss',
})
export class BlockedAuthPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly content = this.route.snapshot.data['blockedAuth'] as BlockedAuthContent;
}
