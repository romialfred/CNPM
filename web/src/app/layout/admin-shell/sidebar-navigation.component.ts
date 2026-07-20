import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideChevronDown,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucideX,
} from '@lucide/angular';
import { catchError, filter, map, of, startWith } from 'rxjs';
import { CNPM_ICON_SIZE } from '../../design-system/icon/icon';
import { AdminNavIconComponent } from './admin-nav-icon.component';
import {
  adminNavAccentOfRoute,
  visibleAdminNav,
  visibleAdminNavTree,
} from './admin-nav';
import { SESSION_GATEWAY } from './session-gateway';

/**
 * Navigation latérale d'administration — `SidebarNavigation` (NAV-001).
 *
 * États du catalogue : `expanded`, `collapsed`, `mobile`. Le composant ne décide
 * d'aucun de ces états — il les reçoit et signale les demandes de changement. Le
 * cadre (`AdminShell`) reste seul propriétaire de la disposition.
 */
@Component({
  selector: 'cnpm-sidebar-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    AdminNavIconComponent,
    LucideChevronDown,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucideX,
  ],
  templateUrl: './sidebar-navigation.component.html',
  styleUrl: './sidebar-navigation.component.scss',
})
export class SidebarNavigationComponent {
  private readonly session = inject(SESSION_GATEWAY);

  readonly collapsed = input(false);

  readonly collapseToggle = output<void>();
  readonly drawerClose = output<void>();

  protected readonly navigation = toSignal(
    this.session.identity.pipe(
      map((identity) => visibleAdminNav(identity?.permissions ?? [])),
      catchError(() => of(visibleAdminNav([]))),
    ),
    { initialValue: visibleAdminNav([]) },
  );

  /** Même filtrage que `navigation`, en conservant les groupes. */
  protected readonly tree = toSignal(
    this.session.identity.pipe(
      map((identity) => visibleAdminNavTree(identity?.permissions ?? [])),
      catchError(() => of(visibleAdminNavTree([]))),
    ),
    { initialValue: visibleAdminNavTree([]) },
  );

  protected readonly iconSize = CNPM_ICON_SIZE;

  private readonly router = inject(Router);

  /**
   * Groupes que l'utilisateur a ouverts.
   *
   * Tout déplier demandait 968 px de hauteur pour 502 disponibles sur un écran de
   * 760 px : la colonne défilait, ce que le client refuse. Vingt-trois lignes ne tiennent
   * pas dans cette place, même à 26 px chacune. Les groupes sont donc repliés, et ce sont
   * leurs cinq intitulés qui restent tous visibles — ce que la demande exige réellement.
   * Le groupe de l'écran ouvert se déplie de lui-même.
   */
  private readonly openedGroups = signal<ReadonlySet<string>>(new Set());

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Groupe de l'écran ouvert : il reste déplié, même si l'utilisateur l'avait fermé. */
  protected readonly activeGroup = computed(() => {
    const url = this.currentUrl().split('?')[0];
    return this.tree()
      .filter((node) => node.kind === 'group')
      .map((node) => (node.kind === 'group' ? node.group : null))
      .find((group) => group?.entries.some((entry) => url.startsWith(entry.route)))?.id;
  });

  protected isOpen(groupId: string): boolean {
    return groupId === this.activeGroup() || this.openedGroups().has(groupId);
  }

  protected toggleGroup(groupId: string): void {
    this.openedGroups.update((opened) => {
      const next = new Set(opened);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  protected readonly hasPending = computed(() => this.navigation().some((entry) => entry.pending));


  /**
   * Classe d'accent d'un domaine.
   *
   * Le préfixe vit ici, à un seul endroit : le gabarit ne compose plus de nom de classe
   * et n'écrit surtout aucun identifiant de domaine en dur.
   */
  protected accentClassOfGroup(groupId: string): string {
    return `cnpm-nav-accent--${groupId}`;
  }

  /**
   * Classe d'accent d'une destination, dérivée des données de navigation.
   *
   * Indispensable en mode réduit : les libellés y sont masqués, le pictogramme reste
   * seul à identifier la rubrique, et sa couleur est alors la seule distinction entre
   * domaines. Sans accent déclaré, aucune classe n'est posée — le repli de
   * `sidebar-navigation.component.scss` (`--cnpm-chrome-text-muted`) prend le relais.
   */
  protected accentClassOfRoute(route: string): string {
    const accent = adminNavAccentOfRoute(route);
    return accent ? this.accentClassOfGroup(accent) : '';
  }
}
