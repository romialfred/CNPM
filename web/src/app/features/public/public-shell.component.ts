import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Cadre commun des pages publiques : `PublicHeader` et `PublicFooter`.
 *
 * Ne contient que des destinations réellement implémentées. Les rubriques publiques
 * prévues par le handoff (adhésion, annuaire, actualités) n'existent pas encore :
 * les afficher produirait des liens inertes, ce qui est un défaut et non un espace
 * réservé. Le logo officiel reste une décision ouverte (UX-DEC-002) et n'est pas
 * inventé ; le mot-symbole est rendu en texte.
 */
@Component({
  selector: 'cnpm-public-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="cnpm-public">
      <header class="cnpm-public__header">
        <div class="cnpm-public__bar">
          <a class="cnpm-public__wordmark" routerLink="/">
            <abbr title="Conseil National du Patronat du Mali">CNPM</abbr>
          </a>
          <nav class="cnpm-public__nav" aria-label="Navigation principale">
            <a
              class="cnpm-public__nav-link"
              routerLink="/"
              routerLinkActive="cnpm-public__nav-link--active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              Accueil
            </a>
            <a
              class="cnpm-public__nav-link cnpm-public__nav-link--cta"
              routerLink="/auth/login"
              routerLinkActive="cnpm-public__nav-link--active"
            >
              Espace membre
            </a>
          </nav>
        </div>
      </header>

      <main class="cnpm-public__main" id="contenu-principal">
        <ng-content />
      </main>

      <footer class="cnpm-public__footer">
        <p class="cnpm-public__legal">
          Conseil National du Patronat du Mali. Les contenus des vitrines membres
          relèvent de la responsabilité de chaque entreprise membre.
        </p>
      </footer>
    </div>
  `,
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {}
