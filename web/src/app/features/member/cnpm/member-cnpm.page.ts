import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBookUser,
  LucideFolderArchive,
  LucideMessageSquareText,
  LucideStore,
} from '@lucide/angular';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';

/** Un accès rapide vers un écran réel de l'espace membre. */
interface MemberCnpmShortcut {
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly icon: 'directory' | 'showcase' | 'requests' | 'documents';
}

/**
 * « Le CNPM » — le point d'entrée institutionnel de l'espace membre.
 *
 * La page n'invente aucune actualité : sans flux officiel raccordé, la section reste en
 * état vide honnête (aucune communication fabriquée). Elle rassemble en revanche les
 * accès réels du membre à la vie du réseau, tous pointant vers des écrans existants.
 */
@Component({
  selector: 'cnpm-member-cnpm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideBookUser,
    LucideFolderArchive,
    LucideMessageSquareText,
    LucideStore,
    EmptyStateComponent,
    PageHeaderComponent,
    MemberPortalShellComponent,
  ],
  templateUrl: './member-cnpm.page.html',
  styleUrl: './member-cnpm.page.scss',
})
export class MemberCnpmPage {
  protected readonly shortcuts: readonly MemberCnpmShortcut[] = [
    {
      label: 'Annuaire des membres',
      description: 'Explorez le réseau des entreprises adhérentes et leurs opportunités.',
      route: '/member/directory',
      icon: 'directory',
    },
    {
      label: 'Ma vitrine',
      description: 'Mettez à jour la page publique de votre organisation.',
      route: '/member/showcase/edit',
      icon: 'showcase',
    },
    {
      label: 'Mes requêtes',
      description: 'Adressez une demande au CNPM et suivez ses réponses.',
      route: '/member/requests',
      icon: 'requests',
    },
    {
      label: 'Mes documents',
      description: 'Retrouvez vos attestations et pièces partagées.',
      route: '/member/documents',
      icon: 'documents',
    },
  ];
}
