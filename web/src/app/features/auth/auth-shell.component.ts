import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
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
  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideChartColumnIncreasing,
    LucideFileChartColumn,
    LucideShieldCheck,
    LucideUsers,
  ],
  template: `
    <div class="cnpm-auth">
      <!-- Le formulaire vient en PREMIER dans le DOM : c'est la tâche principale, et son
           <h1> doit précéder le <h2> du panneau institutionnel. L'ordre visuel — panneau
           à gauche sur desktop — est rétabli par le placement en grille. -->
      <div class="cnpm-auth__side">
        <header class="cnpm-auth__topbar">
          <!-- Sortie du tunnel d'authentification vers le site public : une personne
               arrivée par erreur, ou qui renonce, doit pouvoir revenir à la vitrine. -->
          <a class="cnpm-auth__back" routerLink="/">
            <svg lucideArrowLeft aria-hidden="true"></svg>
            Retour au site
          </a>
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

        <main class="cnpm-auth__panel" id="contenu-principal">
          <ng-content />
        </main>

        <footer class="cnpm-auth__footer">
          <p class="cnpm-auth__legal">© CNPM — Tous droits réservés.</p>
          <p class="cnpm-auth__secure">
            <svg lucideShieldCheck aria-hidden="true"></svg> Une plateforme sécurisée par le CNPM
          </p>
        </footer>
      </div>

      <!-- Pas d'aria-hidden : ce panneau porte du sens — sur l'étape 2FA il explique
           pourquoi une seconde vérification est demandée. Le masquer priverait les
           lecteurs d'écran d'une information offerte aux voyants. -->
      <section class="cnpm-auth__visual" aria-labelledby="cnpm-auth-trust-title">
        <!-- Balise <img> et non fond CSS : le ratio est réservé avant chargement, la
             qualité reste maîtrisée et le chargement est déclaré. Alternative vide : toute
             l'information est portée par le texte adjacent, la décrire serait du bruit. -->
        <img
          class="cnpm-auth__photo"
          src="/assets/photos/cnpm-siege.webp"
          width="1672"
          height="941"
          alt=""
          fetchpriority="high"
          decoding="async"
        />

        <div class="cnpm-auth__visual-inner">
          <img
            class="cnpm-auth__logo"
            src="/assets/brand/logo-CNPM-lockup.png"
            width="276"
            height="137"
            alt="CNPM — Conseil National du Patronat du Mali"
          />

          <div class="cnpm-auth__trust">
            <h2 id="cnpm-auth-trust-title" class="cnpm-auth__trust-title">{{ trustTitle() }}</h2>
            <p class="cnpm-auth__trust-text">{{ trustText() }}</p>
          </div>

          <ul class="cnpm-auth__benefits" aria-label="Bénéfices de la plateforme CNPM">
            <li>
              <span aria-hidden="true"><svg lucideShieldCheck></svg></span>
              <div>
                <strong>Sécurité renforcée</strong
                ><small>Vos données sont protégées à chaque étape.</small>
              </div>
            </li>
            <li>
              <span aria-hidden="true"><svg lucideChartColumnIncreasing></svg></span>
              <div>
                <strong>Gestion simplifiée</strong
                ><small>Cotisations, paiements et documents centralisés.</small>
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
        </div>
      </section>
    </div>
  `,
  styleUrl: './auth-shell.component.scss',
})
export class AuthShellComponent {
  readonly trustTitle = input('Bienvenue dans votre espace CNPM');
  readonly trustText = input(
    'Accédez à votre espace pour gérer vos cotisations, documents et services membres en toute sécurité.',
  );
}
