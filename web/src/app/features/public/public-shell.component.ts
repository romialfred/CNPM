import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import {
  LucideClock,
  LucideGlobe,
  LucideMail,
  LucideMapPin,
  LucideMessageCircle,
  LucidePhone,
  LucideSend,
  LucideShare2,
} from '@lucide/angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CNPM_ICON_SIZE } from '../../design-system/icon/icon';

/** Ancre de section proposée par la page hôte à la navigation principale. */
export interface PublicNavSection {
  readonly id: string;
  readonly label: string;
}

/**
 * Coordonnées affichées au pied de page.
 *
 * Le cadre public ne connaît pas la vitrine : il reçoit des libellés déjà filtrés.
 * La règle de consentement (`docs/12-member-showcase/requirements.md`) est appliquée
 * en amont — le pied de page ne peut donc pas publier des coordonnées que la page a
 * écartées, puisqu'il ne les reçoit tout simplement pas.
 */
export interface PublicFooterContact {
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly hours?: string;
}

/**
 * Cadre commun des pages publiques : `PublicHeader` et `PublicFooter`.
 *
 * Toutes les rubriques enrichies sont facultatives et désactivées par défaut : la
 * page d'accueil (PUB-001) conserve exactement l'en-tête et le pied de page qu'elle
 * avait. Une vitrine membre les active en fournissant ses ancres et ses coordonnées.
 *
 * Aucune destination inerte n'est rendue. Les rubriques publiques prévues par le
 * handoff (adhésion, annuaire, actualités) et les pages légales n'existent pas encore :
 * elles sont rendues en texte, jamais en lien mort — un lien qui ne mène nulle part est
 * un défaut, pas un espace réservé.
 */
@Component({
  selector: 'cnpm-public-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucidePhone,
    LucideMail,
    LucideMapPin,
    LucideClock,
    LucideGlobe,
    LucideMessageCircle,
    LucideShare2,
    LucideSend,
  ],
  template: `
    <div class="cnpm-public">
      <header class="cnpm-public__header">
        <div class="cnpm-public__bar">
          <div class="cnpm-public__brand">
            <!-- L'emblème officiel est isolé de l'actif source (texte matriciel illisible
                 à cette taille) ; la raison sociale est composée en texte réel, net et
                 redimensionnable. Le nom accessible du lien reste porté par aria-label,
                 y compris lorsque le bloc texte est masqué sur petit écran. -->
            <a
              class="cnpm-public__brand-link"
              routerLink="/"
              aria-label="Conseil National du Patronat du Mali — accueil"
            >
              <span class="cnpm-public__emblem" aria-hidden="true"></span>
              <span class="cnpm-public__lockup" aria-hidden="true">
                <span class="cnpm-public__wordmark-name">
                  Conseil National du Patronat du Mali
                </span>
                <span class="cnpm-public__wordmark-tagline">Invest In Mali</span>
              </span>
            </a>
            @if (memberBadge(); as badge) {
              <p class="cnpm-public__member">{{ badge }}</p>
            }
          </div>

          <nav class="cnpm-public__nav" aria-label="Navigation principale">
            <a
              class="cnpm-public__nav-link"
              routerLink="/"
              routerLinkActive="cnpm-public__nav-link--active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              Accueil
            </a>
            <!-- Ancres fournies par la page : elles ne désignent que des sections
                 réellement rendues. -->
            @for (section of sections(); track section.id) {
              <a class="cnpm-public__nav-link" [href]="'#' + section.id">{{ section.label }}</a>
            }
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
        @if (contact(); as info) {
          <div class="cnpm-public__footer-main" id="contact-vitrine">
            <section class="cnpm-public__footer-col" aria-labelledby="pied-contact">
              <h2 class="cnpm-public__footer-title" id="pied-contact">Nous contacter</h2>
              <ul class="cnpm-public__contact">
                @if (info.phone) {
                  <li class="cnpm-public__contact-item">
                    <svg lucidePhone [size]="iconSize.compact" aria-hidden="true"></svg>
                    <span class="cnpm-public__contact-label">Téléphone</span>
                    <a class="cnpm-public__contact-value" [href]="'tel:' + info.phone">
                      {{ info.phone }}
                    </a>
                  </li>
                }
                @if (info.email) {
                  <li class="cnpm-public__contact-item">
                    <svg lucideMail [size]="iconSize.compact" aria-hidden="true"></svg>
                    <span class="cnpm-public__contact-label">Courriel</span>
                    <a class="cnpm-public__contact-value" [href]="'mailto:' + info.email">
                      {{ info.email }}
                    </a>
                  </li>
                }
                @if (info.address) {
                  <li class="cnpm-public__contact-item">
                    <svg lucideMapPin [size]="iconSize.compact" aria-hidden="true"></svg>
                    <span class="cnpm-public__contact-label">Adresse</span>
                    <span class="cnpm-public__contact-value">{{ info.address }}</span>
                  </li>
                }
                @if (info.hours) {
                  <li class="cnpm-public__contact-item">
                    <svg lucideClock [size]="iconSize.compact" aria-hidden="true"></svg>
                    <span class="cnpm-public__contact-label">Horaires</span>
                    <span class="cnpm-public__contact-value">{{ info.hours }}</span>
                  </li>
                }
              </ul>
            </section>

            <!-- Plan schématique. Aucun fournisseur cartographique n'est intégré et
                 aucune coordonnée géographique n'est publiée : le repère situe le
                 quartier, il ne prétend pas géolocaliser l'entreprise. -->
            <div class="cnpm-public__map">
              <svg
                class="cnpm-public__map-art"
                viewBox="0 0 320 200"
                role="img"
                aria-label="Plan schématique du quartier d’implantation, sans localisation précise."
                preserveAspectRatio="xMidYMid slice"
              >
                <g fill="none" stroke="currentColor" stroke-width="2" opacity=".35">
                  <path d="M0 60h320M0 132h320M78 0v200M212 0v200" />
                  <path d="M0 10 L120 200M320 24 L196 200" opacity=".7" />
                </g>
                <g fill="currentColor" opacity=".18">
                  <rect x="92" y="74" width="46" height="42" rx="4" />
                  <rect x="152" y="74" width="46" height="42" rx="4" />
                  <rect x="92" y="146" width="46" height="34" rx="4" />
                </g>
                <g fill="currentColor">
                  <path
                    d="M160 66c-11 0-20 9-20 20 0 15 20 34 20 34s20-19 20-34c0-11-9-20-20-20zm0 27a7 7 0 110-14 7 7 0 010 14z"
                  />
                </g>
              </svg>
              <p class="cnpm-public__map-caption">
                Plan indicatif&nbsp;: il ne remplace pas un itinéraire.
              </p>
            </div>

            <section class="cnpm-public__footer-col" aria-labelledby="pied-suivre">
              <h2 class="cnpm-public__footer-title" id="pied-suivre">Suivez-nous</h2>
              <!-- Les comptes de l'entreprise ne sont pas déclarés : les canaux sont
                   annoncés, sans lien fabriqué vers un profil qui n'existe peut-être pas. -->
              <ul class="cnpm-public__social">
                <li class="cnpm-public__social-item">
                  <svg lucideGlobe [size]="iconSize.compact" aria-hidden="true"></svg>
                  Site web
                </li>
                <li class="cnpm-public__social-item">
                  <svg lucideMessageCircle [size]="iconSize.compact" aria-hidden="true"></svg>
                  Réseaux sociaux
                </li>
                <li class="cnpm-public__social-item">
                  <svg lucideShare2 [size]="iconSize.compact" aria-hidden="true"></svg>
                  Réseau professionnel
                </li>
              </ul>
              <p class="cnpm-public__footer-text">
                Envie de collaborer&nbsp;? Écrivez-nous, nous répondons sous 48&nbsp;heures ouvrées.
              </p>
              @if (contact()?.email; as address) {
                <a class="cnpm-public__footer-cta" [href]="'mailto:' + address">Nous contacter</a>
              }
            </section>

            <section class="cnpm-public__footer-col" aria-labelledby="pied-newsletter">
              <h2 class="cnpm-public__footer-title" id="pied-newsletter">Restez informé</h2>
              <p class="cnpm-public__footer-text">
                Recevez les actualités de l’entreprise et ses appels à partenariat.
              </p>
              <form class="cnpm-public__newsletter" (submit)="subscribe($event)">
                <label class="cnpm-public__newsletter-label" for="cnpm-newsletter-email">
                  Votre adresse e-mail
                </label>
                <div class="cnpm-public__newsletter-row">
                  <input
                    class="cnpm-public__newsletter-input"
                    id="cnpm-newsletter-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    inputmode="email"
                    placeholder="nom@exemple.ml"
                  />
                  <button class="cnpm-public__newsletter-submit" type="submit">
                    <svg lucideSend [size]="iconSize.compact" aria-hidden="true"></svg>
                    S’inscrire
                  </button>
                </div>
              </form>
              <p class="cnpm-public__footer-note" role="status" aria-live="polite">
                @if (subscribed()) {
                  Démonstration&nbsp;: aucune inscription n’a été enregistrée.
                }
              </p>
            </section>
          </div>
        }

        <div class="cnpm-public__legal-bar">
          <p class="cnpm-public__copyright">
            <abbr title="Conseil National du Patronat du Mali">CNPM</abbr>
            <span>© 2026 CNPM — Tous droits réservés.</span>
          </p>
          <!-- Pages légales non publiées : rendues en texte, pas en liens morts. -->
          <ul class="cnpm-public__legal-links">
            <li>Mentions légales</li>
            <li>Politique de confidentialité</li>
            <li>Conditions d’utilisation</li>
          </ul>
          <p class="cnpm-public__legal">
            Conseil National du Patronat du Mali. Les contenus des vitrines membres relèvent de la
            responsabilité de chaque entreprise membre. Les pages légales seront publiées avec la
            mise en service.
          </p>
        </div>
      </footer>
    </div>
  `,
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {
  /** Ancres de section proposées dans la navigation principale. */
  readonly sections = input<readonly PublicNavSection[]>([]);
  /** Mention d'adhésion affichée près du mot-symbole, sur une vitrine membre. */
  readonly memberBadge = input<string | null>(null);
  /** Coordonnées publiables ; `null` retire toute la zone de contact du pied de page. */
  readonly contact = input<PublicFooterContact | null>(null);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly subscribed = signal(false);

  /**
   * Inscription à l'infolettre.
   *
   * Aucun service d'envoi n'est raccordé. Plutôt que de laisser croire à un
   * enregistrement, la confirmation annonce explicitement la démonstration : une
   * fausse confirmation ferait attendre des messages qui n'arriveraient jamais.
   */
  protected subscribe(event: Event): void {
    event.preventDefault();
    this.subscribed.set(true);
  }
}
