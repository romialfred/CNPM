import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
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
  host: {
    '(document:keydown.escape)': 'handleEscape($event)',
    '(document:keydown.tab)': 'trapDrawerFocus($event)',
    '(window:resize)': 'synchroniseViewport()',
  },
  imports: [SidebarNavigationComponent, TopBarComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previouslyFocused: HTMLElement | null = null;
  private previousBodyOverflow = '';
  private bodyScrollLocked = false;

  /** Barre réduite au rail d'icônes — état `collapsed`. */
  protected readonly collapsed = signal(false);
  /** Tiroir de navigation sous 1024 px — état `mobile-drawer`. */
  protected readonly drawerOpen = signal(false);

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  protected toggleDrawer(): void {
    if (this.drawerOpen()) {
      this.closeDrawer();
      return;
    }

    const document = this.host.nativeElement.ownerDocument;
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.bodyScrollLocked = true;
    this.drawerOpen.set(true);

    queueMicrotask(() => {
      if (!this.drawerOpen()) return;
      const initialFocus = this.host.nativeElement.querySelector<HTMLElement>(
        '[data-drawer-initial-focus]',
      );
      (initialFocus ?? this.drawerFocusableElements()[0])?.focus();
    });
  }

  protected closeDrawer(): void {
    if (!this.drawerOpen()) return;

    this.drawerOpen.set(false);
    this.restoreBodyScroll();

    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    queueMicrotask(() => target?.focus());
  }

  protected handleEscape(event: Event): void {
    if (!this.drawerOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    this.closeDrawer();
  }

  protected trapDrawerFocus(event: Event): void {
    if (!this.drawerOpen()) return;
    const keyboardEvent = event as KeyboardEvent;

    const focusable = this.drawerFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const document = this.host.nativeElement.ownerDocument;
    const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const movingBeforeStart = keyboardEvent.shiftKey && activeIndex <= 0;
    const movingAfterEnd = !keyboardEvent.shiftKey && activeIndex === focusable.length - 1;
    const focusIsOutside = activeIndex === -1;

    if (movingBeforeStart) {
      event.preventDefault();
      focusable.at(-1)?.focus();
    } else if (movingAfterEnd || focusIsOutside) {
      event.preventDefault();
      focusable[0].focus();
    }
  }

  protected synchroniseViewport(): void {
    if (globalThis.innerWidth >= 1024) this.closeDrawer();
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

  ngOnDestroy(): void {
    this.restoreBodyScroll();
  }

  private drawerFocusableElements(): HTMLElement[] {
    const sidebar = this.host.nativeElement.querySelector<HTMLElement>('.cnpm-admin__sidebar');
    if (!sidebar) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return [...sidebar.querySelectorAll<HTMLElement>(selector)].filter((element) => {
      const style = globalThis.getComputedStyle(element);
      return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  private restoreBodyScroll(): void {
    if (!this.bodyScrollLocked) return;
    this.host.nativeElement.ownerDocument.body.style.overflow = this.previousBodyOverflow;
    this.bodyScrollLocked = false;
  }
}
