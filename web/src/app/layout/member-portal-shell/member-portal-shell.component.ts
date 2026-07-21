import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBell,
  LucideBookUser,
  LucideBuilding2,
  LucideChartNoAxesCombined,
  LucideCreditCard,
  LucideFolderArchive,
  LucideIdCard,
  LucideLayoutDashboard,
  LucideMenu,
  LucideMessageSquareText,
  LucideNewspaper,
  LucideReceiptText,
  LucideStore,
  LucideUsersRound,
  LucideWallet,
  LucideX,
} from '@lucide/angular';

/** Pictogramme d'une entrée de navigation membre. */
type MemberNavIcon =
  | 'dashboard'
  | 'contributions'
  | 'payments'
  | 'receipts'
  | 'documents'
  | 'requests'
  | 'cnpm'
  | 'directory'
  | 'showcase'
  | 'analytics'
  | 'profile'
  | 'users';

interface MemberPortalDestination {
  readonly label: string;
  readonly route: string;
  readonly icon: MemberNavIcon;
  /** `exact: true` n'active le lien que sur son URL propre ; par défaut (non-exact) un lien
   *  reste actif sur ses écrans enfants. Seul le tableau de bord l'exige ici : `/member/home`
   *  n'est le préfixe d'aucune autre route. Vitrine et Statistiques, elles, restent
   *  mutuellement exclusives SANS `exact` — ne partageant que le préfixe `/member/showcase`,
   *  elles diffèrent sur le dernier segment, que `routerLinkActive` compare segment par
   *  segment. */
  readonly exact?: boolean;
}

interface MemberNavGroup {
  readonly title: string;
  readonly links: readonly MemberPortalDestination[];
}

/**
 * Cadre de l'espace membre — sa navigation lui est DÉDIÉE, à la première personne.
 *
 * Contrairement au back-office, le membre est chez lui : la barre latérale gauche regroupe
 * ses données personnelles (« Mon espace »), ses accès à la vie du CNPM (« Le CNPM ») et
 * son compte (« Mon compte »). Sous 1024 px, cette même barre devient un tiroir modal
 * (focus piégé, Échap, défilement verrouillé, focus restauré), comme l'exige WCAG 2.2 AA.
 */
@Component({
  selector: 'cnpm-member-portal-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscape($event)',
    // `keydown` générique plutôt que `keydown.tab` : la liaison `.tab` d'Angular ne
    // correspond qu'à Tab SANS modificateur (Maj+Tab devient « shift.tab »). Piéger le
    // focus dans les deux sens impose donc d'écouter toute frappe et de filtrer sur Tab.
    '(document:keydown)': 'trapDrawerFocus($event)',
    '(window:resize)': 'synchroniseViewport()',
  },
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideBell,
    LucideBookUser,
    LucideBuilding2,
    LucideChartNoAxesCombined,
    LucideCreditCard,
    LucideFolderArchive,
    LucideIdCard,
    LucideLayoutDashboard,
    LucideMenu,
    LucideMessageSquareText,
    LucideNewspaper,
    LucideReceiptText,
    LucideStore,
    LucideUsersRound,
    LucideWallet,
    LucideX,
  ],
  templateUrl: './member-portal-shell.component.html',
  styleUrl: './member-portal-shell.component.scss',
})
export class MemberPortalShellComponent implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previouslyFocused: HTMLElement | null = null;
  private previousBodyOverflow = '';
  private bodyScrollLocked = false;

  readonly organization = input('Espace membre');
  readonly userName = input('Membre CNPM');
  readonly memberCode = input('');
  /**
   * Compteur de notifications. Défaut à 0 : aucun flux de notifications n'est encore
   * raccordé, afficher un nombre serait une donnée inventée — et la pastille dépense du
   * rouge de marque, réservé aux signaux réellement critiques. La pastille n'apparaît donc
   * que si un appelant fournit un compte réel (> 0).
   */
  readonly notificationCount = input(0);

  /** Tiroir de navigation sous 1024 px. Sur desktop, la barre latérale est permanente. */
  protected readonly drawerOpen = signal(false);

  /**
   * Navigation à la voix du membre. « Le CNPM » réunit les accès institutionnels : ses
   * actualités, l'annuaire, la vitrine publique et ses statistiques de visibilité.
   */
  protected readonly navGroups: readonly MemberNavGroup[] = [
    {
      title: 'Mon espace',
      links: [
        { label: 'Tableau de bord', route: '/member/home', icon: 'dashboard', exact: true },
        { label: 'Mes cotisations', route: '/member/contributions', icon: 'contributions' },
        { label: 'Mes paiements', route: '/member/payments', icon: 'payments' },
        { label: 'Mes reçus', route: '/member/receipts', icon: 'receipts' },
        { label: 'Mes documents', route: '/member/documents', icon: 'documents' },
        { label: 'Mes requêtes', route: '/member/requests', icon: 'requests' },
      ],
    },
    {
      title: 'Le CNPM',
      links: [
        { label: 'Actualités & informations', route: '/member/cnpm', icon: 'cnpm' },
        { label: 'Annuaire des membres', route: '/member/directory', icon: 'directory' },
        { label: 'Ma vitrine', route: '/member/showcase/edit', icon: 'showcase' },
        { label: 'Statistiques', route: '/member/showcase/analytics', icon: 'analytics' },
      ],
    },
    {
      title: 'Mon compte',
      links: [
        { label: 'Profil', route: '/member/profile', icon: 'profile' },
        { label: 'Utilisateurs', route: '/member/users', icon: 'users' },
      ],
    },
  ];

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

  protected closeDrawer(options?: { focusFallback?: boolean }): void {
    if (!this.drawerOpen()) return;

    this.drawerOpen.set(false);
    this.restoreBodyScroll();

    const focusFallback = options?.focusFallback ?? false;
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    queueMicrotask(() => {
      if (focusFallback) {
        // Fermeture provoquée par un passage en desktop : le déclencheur (bouton menu)
        // devient `display:none`, lui rendre le focus le perdrait sur `<body>`. On le
        // pose donc sur la barre latérale, désormais permanente et visible.
        this.firstSidebarTarget()?.focus();
        return;
      }
      target?.focus();
    });
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
    if (keyboardEvent.key !== 'Tab') return;

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
    if (globalThis.innerWidth >= 1024 && this.drawerOpen()) {
      this.closeDrawer({ focusFallback: true });
    }
  }

  ngOnDestroy(): void {
    this.restoreBodyScroll();
  }

  /** Premier élément focalisable de la barre latérale, cible de repli du focus. */
  private firstSidebarTarget(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(
      '.member-shell__sidebar a[href], .member-shell__sidebar button:not([disabled])',
    );
  }

  private drawerFocusableElements(): HTMLElement[] {
    const sidebar = this.host.nativeElement.querySelector<HTMLElement>('.member-shell__sidebar');
    if (!sidebar) return [];

    const selector = ['a[href]', 'button:not([disabled])', '[tabindex]:not([tabindex="-1"])'].join(
      ',',
    );

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
