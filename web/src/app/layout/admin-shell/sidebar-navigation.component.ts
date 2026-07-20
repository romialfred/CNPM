import { AsyncPipe } from '@angular/common';
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
import { adminNavGroupOfRoute, visibleAdminNav, visibleAdminNavTree } from './admin-nav';
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
    AsyncPipe,
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
  protected readonly identity = this.session.identity;

  private readonly router = inject(Router);

  /**
   * Groupes que l'utilisateur a refermés.
   *
   * L'état est inversé — on retient les fermetures, pas les ouvertures — pour que tout
   * soit déplié à l'arrivée. Une navigation dont les rubriques sont cachées par défaut
   * oblige à ouvrir chaque groupe pour savoir ce qu'il contient.
   */
  private readonly closedGroups = signal<ReadonlySet<string>>(new Set());

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
    return groupId === this.activeGroup() || !this.closedGroups().has(groupId);
  }

  protected toggleGroup(groupId: string): void {
    this.closedGroups.update((closed) => {
      const next = new Set(closed);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  protected readonly hasPending = computed(() =>
    this.navigation().some((entry) => entry.pending),
  );

  protected groupOfRoute = adminNavGroupOfRoute;
}
