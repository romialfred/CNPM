import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBell,
  LucideBuilding2,
  LucideCreditCard,
  LucideHouse,
  LucideMessageSquareText,
  LucideReceiptText,
  LucideUserRound,
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
    LucideMessageSquareText,
    LucideReceiptText,
    LucideUserRound,
  ],
  templateUrl: './member-portal-shell.component.html',
  styleUrl: './member-portal-shell.component.scss',
})
export class MemberPortalShellComponent {
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
    { label: 'Paiements', mobileLabel: 'Paiements', route: null, icon: 'payments' },
    { label: 'Reçus', mobileLabel: 'Reçus', route: '/member/receipts', icon: 'receipts' },
    {
      label: 'Requêtes',
      mobileLabel: 'Requêtes',
      route: '/member/requests',
      icon: 'requests',
    },
    {
      label: 'Documents',
      mobileLabel: 'Documents',
      route: '/member/documents',
      icon: 'receipts',
    },
    { label: 'Profil', mobileLabel: 'Profil', route: '/member/profile', icon: 'profile' },
    {
      label: 'Utilisateurs',
      mobileLabel: 'Utilisateurs',
      route: '/member/users',
      icon: 'profile',
    },
    { label: 'Avantages', mobileLabel: 'Avantages', route: null, icon: 'profile' },
  ];

  /**
   * La navigation mobile reste bornée à cinq destinations, comme l'exige le handoff.
   * Une destination encore indisponible ne doit toutefois jamais prendre la place
   * d'un écran réellement livré : les liens actifs sont donc prioritaires.
   */
  protected readonly mobileDestinations = this.destinations
    .filter((destination) => destination.route !== null)
    .slice(0, 5);
}
