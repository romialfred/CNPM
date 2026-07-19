import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  afterRenderEffect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  LucideArrowRight,
  LucideChevronRight,
  LucideClock,
  LucideLogIn,
  LucideMail,
  LucideMapPin,
  LucideMenu,
  LucidePhone,
  LucideX,
} from '@lucide/angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CNPM_ICON_SIZE } from '../../design-system/icon/icon';

/** Ancre de section réellement rendue par la page hôte. */
export interface PublicNavSection {
  readonly id: string;
  readonly label: string;
}

/** Coordonnées préfiltrées et publiables d'une vitrine membre. */
export interface PublicFooterContact {
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly hours?: string;
}

/**
 * LAY-003 / NAV-003 — cadre institutionnel commun aux pages publiques.
 *
 * Le logo est l'actif officiel versionné dans `docs/00-sources`, copié à l'identique
 * dans les assets Web. Les destinations publiques non implémentées (adhésion et
 * pages légales) ne deviennent jamais des liens factices.
 */
@Component({
  selector: 'cnpm-public-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideArrowRight,
    LucideChevronRight,
    LucideClock,
    LucideLogIn,
    LucideMail,
    LucideMapPin,
    LucideMenu,
    LucidePhone,
    LucideX,
  ],
  template: `
    <div class="cnpm-public" [class.cnpm-public--menu-open]="menuOpen()">
      <a class="cnpm-public__skip-link" href="#contenu-principal">Aller au contenu</a>

      <header class="cnpm-public__header">
        <div class="cnpm-public__bar">
          <div class="cnpm-public__brand">
            <a
              class="cnpm-public__brand-link"
              routerLink="/"
              aria-label="Conseil National du Patronat du Mali — accueil"
            >
              <span class="cnpm-public__logo-frame" aria-hidden="true">
                <img
                  class="cnpm-public__logo"
                  src="/assets/brand/logo-CNPM.png"
                  width="300"
                  height="212"
                  alt=""
                  decoding="async"
                />
              </span>
            </a>
            @if (memberBadge(); as badge) {
              <p class="cnpm-public__member">{{ badge }}</p>
            }
          </div>

          <nav
            class="cnpm-public__nav cnpm-public__nav--desktop"
            [attr.aria-label]="memberBadge() ? 'Sections de la vitrine' : 'Navigation principale'"
          >
            <a
              class="cnpm-public__nav-link"
              routerLink="/"
              routerLinkActive="cnpm-public__nav-link--active"
              [routerLinkActiveOptions]="{ exact: true }"
              ariaCurrentWhenActive="page"
            >
              Accueil
            </a>
            <a
              class="cnpm-public__nav-link"
              routerLink="/le-cnpm"
              routerLinkActive="cnpm-public__nav-link--active"
              ariaCurrentWhenActive="page"
            >
              Le CNPM
            </a>
            <a
              class="cnpm-public__nav-link"
              routerLink="/services"
              routerLinkActive="cnpm-public__nav-link--active"
              ariaCurrentWhenActive="page"
            >
              Services
            </a>
            <a
              class="cnpm-public__nav-link"
              routerLink="/membres"
              routerLinkActive="cnpm-public__nav-link--active"
              [routerLinkActiveOptions]="{ exact: true }"
              ariaCurrentWhenActive="page"
            >
              Annuaire
            </a>
            <a
              class="cnpm-public__nav-link"
              routerLink="/actualites"
              routerLinkActive="cnpm-public__nav-link--active"
              ariaCurrentWhenActive="page"
            >
              Actualités
            </a>
            <a
              class="cnpm-public__nav-link"
              routerLink="/agenda"
              routerLinkActive="cnpm-public__nav-link--active"
              ariaCurrentWhenActive="page"
            >
              Agenda
            </a>
            @for (section of sections(); track section.id) {
              <a class="cnpm-public__nav-link" [href]="'#' + section.id">{{ section.label }}</a>
            }
            <a class="cnpm-public__portal-link" routerLink="/auth/login">
              <svg lucideLogIn [size]="iconSize.compact" aria-hidden="true"></svg>
              Accéder au portail membre
            </a>
          </nav>

          <button
            #menuButton
            class="cnpm-public__menu-button"
            type="button"
            aria-controls="navigation-mobile"
            [attr.aria-expanded]="menuOpen()"
            [attr.aria-label]="menuOpen() ? 'Fermer la navigation principale' : 'Ouvrir le menu'"
            (click)="openMenu()"
          >
            <svg lucideMenu [size]="iconSize.navigation" aria-hidden="true"></svg>
            <span>Menu</span>
          </button>
        </div>

        @if (menuOpen()) {
          <div class="cnpm-public__drawer-layer" (mousedown)="closeFromBackdrop($event)">
            <section
              #drawer
              class="cnpm-public__drawer"
              id="navigation-mobile"
              role="dialog"
              aria-modal="true"
              aria-labelledby="navigation-mobile-title"
              (keydown)="onDrawerKeydown($event)"
            >
              <div class="cnpm-public__drawer-header">
                <div>
                  <p class="cnpm-public__drawer-kicker">Navigation</p>
                  <h2 class="cnpm-public__drawer-title" id="navigation-mobile-title">
                    Site du CNPM
                  </h2>
                </div>
                <button
                  class="cnpm-public__drawer-close"
                  type="button"
                  aria-label="Fermer le menu"
                  (click)="closeMenu()"
                >
                  <svg lucideX [size]="iconSize.navigation" aria-hidden="true"></svg>
                </button>
              </div>

              <nav
                class="cnpm-public__drawer-nav"
                [attr.aria-label]="memberBadge() ? 'Sections de la vitrine' : 'Navigation mobile'"
              >
                <a class="cnpm-public__drawer-link" routerLink="/" (click)="closeMenu()">
                  <span>Accueil</span>
                  <svg lucideChevronRight [size]="iconSize.compact" aria-hidden="true"></svg>
                </a>
                <a class="cnpm-public__drawer-link" routerLink="/le-cnpm" (click)="closeMenu()">
                  <span>Le CNPM</span>
                  <svg lucideChevronRight [size]="iconSize.compact" aria-hidden="true"></svg>
                </a>
                <a class="cnpm-public__drawer-link" routerLink="/services" (click)="closeMenu()">
                  <span>Services</span>
                  <svg lucideChevronRight [size]="iconSize.compact" aria-hidden="true"></svg>
                </a>
                <a class="cnpm-public__drawer-link" routerLink="/membres" (click)="closeMenu()">
                  <span>Annuaire</span>
                  <svg lucideChevronRight [size]="iconSize.compact" aria-hidden="true"></svg>
                </a>
                <a class="cnpm-public__drawer-link" routerLink="/actualites" (click)="closeMenu()">
                  <span>Actualités</span>
                  <svg lucideChevronRight [size]="iconSize.compact" aria-hidden="true"></svg>
                </a>
                <a class="cnpm-public__drawer-link" routerLink="/agenda" (click)="closeMenu()">
                  <span>Agenda</span>
                  <svg lucideChevronRight [size]="iconSize.compact" aria-hidden="true"></svg>
                </a>
                @for (section of sections(); track section.id) {
                  <a
                    class="cnpm-public__drawer-link"
                    [href]="'#' + section.id"
                    (click)="closeMenu()"
                  >
                    <span>{{ section.label }}</span>
                    <svg lucideChevronRight [size]="iconSize.compact" aria-hidden="true"></svg>
                  </a>
                }
              </nav>

              <a class="cnpm-public__drawer-portal" routerLink="/auth/login" (click)="closeMenu()">
                <svg lucideLogIn [size]="iconSize.control" aria-hidden="true"></svg>
                Accéder au portail membre
              </a>
            </section>
          </div>
        }
      </header>

      <main
        class="cnpm-public__main"
        id="contenu-principal"
        [attr.inert]="menuOpen() ? '' : null"
        [attr.aria-hidden]="menuOpen() ? 'true' : null"
      >
        <ng-content />
      </main>

      <footer
        class="cnpm-public__footer"
        [attr.inert]="menuOpen() ? '' : null"
        [attr.aria-hidden]="menuOpen() ? 'true' : null"
      >
        @if (contact(); as info) {
          <section
            class="cnpm-public__contact-band"
            id="contact-vitrine"
            aria-labelledby="pied-contact"
          >
            <div class="cnpm-public__contact-inner">
              <div>
                <p class="cnpm-public__footer-eyebrow">Coordonnées publiées avec consentement</p>
                <h2 class="cnpm-public__contact-title" id="pied-contact">Contacter l'entreprise</h2>
              </div>
              <ul class="cnpm-public__contact">
                @if (info.phone) {
                  <li>
                    <svg lucidePhone [size]="iconSize.compact" aria-hidden="true"></svg>
                    <a [href]="'tel:' + info.phone">{{ info.phone }}</a>
                  </li>
                }
                @if (info.email) {
                  <li>
                    <svg lucideMail [size]="iconSize.compact" aria-hidden="true"></svg>
                    <a [href]="'mailto:' + info.email">{{ info.email }}</a>
                  </li>
                }
                @if (info.address) {
                  <li>
                    <svg lucideMapPin [size]="iconSize.compact" aria-hidden="true"></svg>
                    <span>{{ info.address }}</span>
                  </li>
                }
                @if (info.hours) {
                  <li>
                    <svg lucideClock [size]="iconSize.compact" aria-hidden="true"></svg>
                    <span>{{ info.hours }}</span>
                  </li>
                }
              </ul>
            </div>
          </section>
        }

        <section class="cnpm-public__portal-band" aria-labelledby="pied-portail">
          <div class="cnpm-public__portal-band-inner">
            <div>
              <p class="cnpm-public__footer-eyebrow">Un espace sécurisé pour les membres</p>
              <h2 class="cnpm-public__portal-title" id="pied-portail">
                Retrouvez vos démarches et documents en un seul endroit
              </h2>
            </div>
            <a class="cnpm-public__portal-band-link" routerLink="/auth/login">
              Ouvrir le portail membre
              <svg lucideArrowRight [size]="iconSize.control" aria-hidden="true"></svg>
            </a>
          </div>
        </section>

        <div class="cnpm-public__footer-main">
          <section class="cnpm-public__footer-brand" aria-labelledby="pied-cnpm">
            <span class="cnpm-public__footer-logo-frame" aria-hidden="true">
              <img
                class="cnpm-public__footer-logo"
                src="/assets/brand/logo-CNPM.png"
                width="300"
                height="212"
                alt=""
                loading="lazy"
                decoding="async"
              />
            </span>
            <h2 class="cnpm-public__visually-hidden" id="pied-cnpm">
              Conseil National du Patronat du Mali
            </h2>
            <p>
              Une union de groupements d'employeurs au service des entreprises et du développement
              économique du Mali.
            </p>
          </section>

          <nav class="cnpm-public__footer-nav" aria-label="Navigation du pied de page">
            <h2 class="cnpm-public__footer-title">Parcourir</h2>
            <ul>
              <li><a routerLink="/">Accueil</a></li>
              <li><a routerLink="/le-cnpm">Le CNPM</a></li>
              <li><a routerLink="/services">Services</a></li>
              <li><a routerLink="/membres">Annuaire des membres</a></li>
              <li><a routerLink="/actualites">Actualités</a></li>
              <li><a routerLink="/agenda">Agenda</a></li>
              @for (section of sections(); track section.id) {
                <li>
                  <a [href]="'#' + section.id">{{ section.label }}</a>
                </li>
              }
            </ul>
          </nav>

          <section class="cnpm-public__footer-access" aria-labelledby="pied-acces">
            <h2 class="cnpm-public__footer-title" id="pied-acces">Accès membre</h2>
            <p>
              Cotisations, reçus, requêtes et services numériques sont accessibles après connexion.
            </p>
            <a routerLink="/auth/login">Se connecter au portail</a>
          </section>

          <section class="cnpm-public__footer-pending" aria-labelledby="pied-information">
            <h2 class="cnpm-public__footer-title" id="pied-information">Information publique</h2>
            <p>
              L'adhésion en ligne et les pages légales seront reliées dès publication de leurs
              destinations officielles.
            </p>
          </section>
        </div>

        <div class="cnpm-public__legal-bar">
          <p>
            <abbr title="Conseil National du Patronat du Mali">CNPM</abbr> © 2026 — Tous droits
            réservés.
          </p>
          <ul aria-label="Documents légaux en attente de publication">
            <li>Mentions légales</li>
            <li>Politique de confidentialité</li>
            <li>Conditions d'utilisation</li>
          </ul>
        </div>
      </footer>
    </div>
  `,
  styleUrls: ['./public-shell.component.scss', './public-shell.footer.scss'],
})
export class PublicShellComponent {
  readonly sections = input<readonly PublicNavSection[]>([]);
  readonly memberBadge = input<string | null>(null);
  readonly contact = input<PublicFooterContact | null>(null);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly menuOpen = signal(false);

  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');
  private previousBodyOverflow = '';

  constructor() {
    afterRenderEffect(() => {
      if (this.menuOpen()) {
        this.drawer()?.nativeElement.querySelector<HTMLElement>('button, a[href]')?.focus();
      }
    });
    inject(DestroyRef).onDestroy(() => this.restoreBodyScroll());
  }

  protected openMenu(): void {
    if (this.menuOpen()) {
      return;
    }
    this.previousBodyOverflow = this.document.body.style.overflow;
    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
    this.menuOpen.set(true);
  }

  protected closeMenu(restoreFocus = true): void {
    if (!this.menuOpen()) {
      return;
    }
    this.menuOpen.set(false);
    this.restoreBodyScroll();
    if (restoreFocus) {
      Promise.resolve().then(() => this.menuButton().nativeElement.focus());
    }
  }

  protected closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeMenu();
    }
  }

  protected onDrawerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }

    const drawer = this.drawer()?.nativeElement;
    const focusable = drawer
      ? Array.from(
          drawer.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => !element.hasAttribute('hidden'))
      : [];
    if (focusable.length === 0) {
      event.preventDefault();
      drawer?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && (active === first || !drawer?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private restoreBodyScroll(): void {
    if (this.previousBodyOverflow) {
      this.renderer.setStyle(this.document.body, 'overflow', this.previousBodyOverflow);
    } else {
      this.renderer.removeStyle(this.document.body, 'overflow');
    }
  }
}
