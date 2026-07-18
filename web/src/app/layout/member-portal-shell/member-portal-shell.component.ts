import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  protected readonly destinations: readonly MemberPortalDestination[] = [
    { label: 'Accueil', mobileLabel: 'Accueil', route: '/member/home', icon: 'home' },
    {
      label: 'Cotisations / Paiements',
      mobileLabel: 'Cotisations',
      route: null,
      icon: 'payments',
    },
    { label: 'Reçus', mobileLabel: 'Reçus', route: null, icon: 'receipts' },
    { label: 'Requêtes', mobileLabel: 'Requêtes', route: null, icon: 'requests' },
    { label: 'Profil', mobileLabel: 'Profil', route: null, icon: 'profile' },
  ];
}
