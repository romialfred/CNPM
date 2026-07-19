import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  LucideChartColumnIncreasing,
  LucideFileChartColumn,
  LucideShieldCheck,
  LucideUsers,
} from '@lucide/angular';

/**
 * Cadre minimal des écrans d'authentification (PublicShell minimal de AUTH-001).
 *
 * Deux zones sur desktop — message de confiance et contenu — ; sous 1024 px
 * l'illustration secondaire disparaît, sous 768 px le contenu reste seul. Le PNG de
 * marque fourni par le commanditaire est utilisé en attendant le futur SVG officiel.
 */
@Component({
  selector: 'cnpm-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideChartColumnIncreasing, LucideFileChartColumn, LucideShieldCheck, LucideUsers],
  template: `
    <div class="cnpm-auth">
      <header class="cnpm-auth__topbar">
        <img
          class="cnpm-auth__logo"
          src="/assets/brand/logo-CNPM-lockup.png"
          alt="CNPM — Conseil National du Patronat du Mali"
        />
        <!-- À décider (UX-DEC-007) : les langues publiques ne sont pas arbitrées.
             Tant qu'une seule est disponible, la langue est affichée en texte plutôt
             qu'en contrôle : un sélecteur à option unique est focalisable et annoncé
             comme actionnable alors qu'il ne peut rien changer. -->
        <div class="cnpm-auth__lang" aria-label="Langue de l'interface">
          <span class="cnpm-auth__lang-value" aria-current="true">FR</span>
          <span class="cnpm-auth__lang-unavailable" aria-disabled="true" title="Non disponible"
            >EN</span
          >
        </div>
      </header>

      <main class="cnpm-auth__main" id="contenu-principal">
        <!-- Le formulaire vient en premier dans le DOM : c'est la tâche principale, et
             son <h1> doit précéder le <h2> du message de confiance. L'ordre visuel
             (message à gauche sur desktop) est rétabli en CSS. -->
        <section class="cnpm-auth__panel">
          <ng-content />
        </section>
        <!-- Pas d'aria-hidden : ce message porte du sens — sur l'étape 2FA il explique
             pourquoi une seconde vérification est demandée. Le masquer priverait les
             lecteurs d'écran d'une information offerte aux voyants.
             Titre réellement balisé : rendu en <p> stylé plus gros que le <h1> de la
             page, ce texte était un titre visuel sans sémantique. -->
        <section class="cnpm-auth__trust" aria-labelledby="cnpm-auth-trust-title">
          <h2 id="cnpm-auth-trust-title" class="cnpm-auth__trust-title">{{ trustTitle() }}</h2>
          <span class="cnpm-auth__accent" aria-hidden="true"></span>
          <p class="cnpm-auth__trust-text">{{ trustText() }}</p>
          <ul class="cnpm-auth__benefits" aria-label="Bénéfices de la plateforme CNPM">
            <li>
              <span aria-hidden="true"><svg lucideShieldCheck></svg></span>
              <div>
                <strong>Sécurité renforcée</strong
                ><small>Vos données sont protégées par une authentification en deux étapes.</small>
              </div>
            </li>
            <li>
              <span aria-hidden="true"><svg lucideChartColumnIncreasing></svg></span>
              <div>
                <strong>Gestion simplifiée</strong
                ><small>Suivez cotisations, paiements et documents depuis un même espace.</small>
              </div>
            </li>
            <li>
              <span aria-hidden="true"><svg lucideUsers></svg></span>
              <div>
                <strong>Portail membre dédié</strong
                ><small>Un espace personnalisé pour chaque entreprise membre.</small>
              </div>
            </li>
            <li>
              <span aria-hidden="true"><svg lucideFileChartColumn></svg></span>
              <div>
                <strong>Reporting &amp; insights</strong
                ><small>Des indicateurs clairs pour suivre votre activité.</small>
              </div>
            </li>
          </ul>
        </section>
      </main>

      <footer class="cnpm-auth__footer">
        <p class="cnpm-auth__legal">© CNPM — Tous droits réservés.</p>
        <p class="cnpm-auth__secure">
          <svg lucideShieldCheck aria-hidden="true"></svg> Une plateforme sécurisée par le CNPM
        </p>
      </footer>
    </div>
  `,
  styleUrl: './auth-shell.component.scss',
})
export class AuthShellComponent {
  readonly trustTitle = input('Connectez-vous à votre espace CNPM');
  readonly trustText = input(
    'Accédez à votre espace pour gérer vos cotisations, documents et services membres.',
  );
}
