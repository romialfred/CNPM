import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucidePanelLeftClose, LucidePanelLeftOpen, LucideX } from '@lucide/angular';
import { catchError, map, of } from 'rxjs';
import { CNPM_ICON_SIZE } from '../../design-system/icon/icon';
import { AdminNavIconComponent } from './admin-nav-icon.component';
import { visibleAdminNav } from './admin-nav';
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
  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly identity = this.session.identity;
}
