import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarNavigationComponent } from './sidebar-navigation.component';
import { TopBarComponent } from './top-bar.component';

/**
 * Cadre des écrans d'administration — `AdminShell` (LAY-001).
 *
 * États du catalogue : `expanded`, `collapsed`, `mobile-drawer`. Le shell n'assemble
 * que la disposition ; la barre latérale (NAV-001) et la barre supérieure (NAV-002)
 * sont des composants distincts, comme le veut le catalogue.
 *
 * Dimensions imposées par `.claude/rules/ux-ui.md` — sidebar 252 px, topbar 72 px,
 * marge de page 28 px — lues dans les tokens et jamais réécrites en dur.
 */
@Component({
  selector: 'cnpm-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Échap est écouté au niveau du document, non sur le cadre : posé sur un élément
  // non focalisable, l'écouteur ne verrait que les touches remontées d'un descendant
  // focalisé, et Échap resterait sans effet dès que le focus sort du tiroir.
  host: { '(document:keydown.escape)': 'closeDrawer()' },
  imports: [SidebarNavigationComponent, TopBarComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  private readonly router = inject(Router);

  /** Barre réduite au rail d'icônes — état `collapsed`. */
  protected readonly collapsed = signal(false);
  /** Tiroir de navigation sous 1024 px — état `mobile-drawer`. */
  protected readonly drawerOpen = signal(false);

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  protected toggleDrawer(): void {
    this.drawerOpen.update((value) => !value);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  /**
   * La recherche du bandeau cible la liste des membres, seule collection existante.
   * Le terme part dans l'URL : la vue reste partageable et le filtre survit au
   * rechargement, comme l'exige `frontend-angular.md`.
   */
  protected runSearch(term: string): void {
    this.closeDrawer();
    void this.router.navigate(['/admin/members'], {
      queryParams: { q: term || null, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
