import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBell,
  LucideBuilding2,
  LucideCreditCard,
  LucideHouse,
  LucideMenu,
  LucideMessageSquareText,
  LucideReceiptText,
  LucideUserRound,
  LucideX,
} from '@lucide/angular';

interface MemberPortalDestination {
  readonly label: string;
  readonly mobileLabel: string;
  readonly route: string | null;
  readonly icon: 'home' | 'payments' | 'receipts' | 'requests' | 'profile';
}

@Component({
  selector: 'cnpm-member-portal-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideBell,
    LucideBuilding2,
    LucideCreditCard,
    LucideHouse,
    LucideMenu,
    LucideMessageSquareText,
    LucideReceiptText,
    LucideUserRound,
    LucideX,
  ],
  templateUrl: './member-portal-shell.component.html',
  styleUrls: ['./member-portal-shell.component.scss', './member-portal-shell.more-panel.scss'],
})
export class MemberPortalShellComponent {
  private readonly injector = inject(Injector);
  private readonly moreButton = viewChild<ElementRef<HTMLButtonElement>>('moreButton');
  private readonly morePanel = viewChild<ElementRef<HTMLElement>>('morePanel');

  readonly organization = input('Espace membre');
  readonly userName = input('Membre CNPM');
  readonly memberCode = input('');
  readonly notificationCount = input(3);

  protected readonly destinations: readonly MemberPortalDestination[] = [
    { label: 'Accueil', mobileLabel: 'Accueil', route: '/member/home', icon: 'home' },
    {
      label: 'Cotisations',
      mobileLabel: 'Cotisations',
      route: '/member/contributions',
      icon: 'payments',
    },
    { label: 'Reçus', mobileLabel: 'Reçus', route: '/member/receipts', icon: 'receipts' },
    {
      label: 'Requêtes',
      mobileLabel: 'Requêtes',
      route: '/member/requests',
      icon: 'requests',
    },
    {
      label: 'Annuaire',
      mobileLabel: 'Annuaire',
      route: '/member/directory',
      icon: 'profile',
    },
    {
      label: 'Documents',
      mobileLabel: 'Documents',
      route: '/member/documents',
      icon: 'receipts',
    },
    {
      label: 'Vitrine',
      mobileLabel: 'Vitrine',
      route: '/member/showcase/edit',
      icon: 'profile',
    },
    {
      label: 'Statistiques',
      mobileLabel: 'Stats',
      route: '/member/showcase/analytics',
      icon: 'payments',
    },
    { label: 'Profil', mobileLabel: 'Profil', route: '/member/profile', icon: 'profile' },
    {
      label: 'Utilisateurs',
      mobileLabel: 'Utilisateurs',
      route: '/member/users',
      icon: 'profile',
    },
  ];

  /**
   * Quatre accès fréquents restent fixes ; le cinquième emplacement ouvre « Plus ».
   * Tous les autres écrans livrés restent ainsi découvrables sans dépasser cinq
   * destinations dans la barre mobile normative.
   */
  protected readonly mobileDestinations = this.destinations
    .filter((destination) => destination.route !== null)
    .slice(0, 4);
  protected readonly moreDestinations = this.destinations
    .filter((destination) => destination.route !== null)
    .slice(4);
  protected readonly moreOpen = signal(false);

  protected toggleMore(): void {
    if (this.moreOpen()) {
      this.closeMore();
      return;
    }
    this.moreOpen.set(true);
    afterNextRender(
      () => {
        const panel = this.morePanel()?.nativeElement;
        panel?.querySelector<HTMLButtonElement>('.member-shell__more-close')?.focus();
      },
      { injector: this.injector },
    );
  }

  protected closeMore(restoreFocus = true): void {
    if (!this.moreOpen()) return;
    this.moreOpen.set(false);
    if (restoreFocus) {
      afterNextRender(() => this.moreButton()?.nativeElement.focus(), {
        injector: this.injector,
      });
    }
  }

  protected trapMorePanelFocus(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== 'Tab') return;
    const panel = this.morePanel()?.nativeElement;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (keyboardEvent.shiftKey && document.activeElement === first) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
      keyboardEvent.preventDefault();
      first.focus();
    }
  }
}
