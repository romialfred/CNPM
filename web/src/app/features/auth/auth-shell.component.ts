import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cadre minimal des écrans d'authentification (PublicShell minimal de AUTH-001).
 *
 * Deux zones sur desktop — message de confiance et contenu — ; sous 1024 px
 * l'illustration secondaire disparaît, sous 768 px le contenu reste seul. Le logo
 * est rendu en mot-symbole texte : l'actif vectoriel officiel est une décision
 * ouverte (UX-DEC-002) et ne doit pas être inventé.
 */
@Component({
  selector: 'cnpm-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cnpm-auth">
      <header class="cnpm-auth__topbar">
        <!-- Le nom complet est donné en texte plutôt que par un aria-label : ARIA
             interdit de nommer un élément de rôle générique comme <span>, et le
             support des lecteurs d'écran n'y est pas garanti. L'abréviation reste le
             mot-symbole visible ; l'actif vectoriel officiel est une décision ouverte
             (UX-DEC-002) et ne doit pas être inventé. -->
        <p class="cnpm-auth__wordmark">
          <abbr title="Conseil National du Patronat du Mali">CNPM</abbr>
        </p>
        <!-- À décider (UX-DEC-007) : les langues publiques ne sont pas arbitrées.
             Tant qu'une seule est disponible, la langue est affichée en texte plutôt
             qu'en contrôle : un sélecteur à option unique est focalisable et annoncé
             comme actionnable alors qu'il ne peut rien changer. -->
        <p class="cnpm-auth__lang">
          <span class="cnpm-auth__lang-label">Langue :</span>
          <span class="cnpm-auth__lang-value">Français</span>
        </p>
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
          <p class="cnpm-auth__trust-text">{{ trustText() }}</p>
        </section>
      </main>

      <footer class="cnpm-auth__footer">
        <p class="cnpm-auth__legal">
          Conseil National du Patronat du Mali — accès réservé aux utilisateurs autorisés.
        </p>
      </footer>
    </div>
  `,
  styleUrl: './auth-shell.component.scss',
})
export class AuthShellComponent {
  readonly trustTitle = input('Plateforme institutionnelle sécurisée');
  readonly trustText = input(
    'Accédez à votre espace pour gérer vos cotisations, documents et services membres.',
  );
}
