import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBriefcaseBusiness,
  LucideBuilding2,
  LucideChartNoAxesCombined,
  LucideFileCheck2,
  LucideHandshake,
  LucideLandmark,
  LucideMessagesSquare,
  LucideNetwork,
  LucideReceiptText,
  LucideShieldCheck,
  LucideUsers,
} from '@lucide/angular';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { PublicShellComponent } from '../public-shell.component';

type InstitutionalMode = 'about' | 'services';

/** PUB-002 / PUB-003 — présentation institutionnelle et catalogue de services. */
@Component({
  selector: 'cnpm-institutional-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    LucideArrowRight,
    LucideBriefcaseBusiness,
    LucideBuilding2,
    LucideChartNoAxesCombined,
    LucideFileCheck2,
    LucideHandshake,
    LucideLandmark,
    LucideMessagesSquare,
    LucideNetwork,
    LucideReceiptText,
    LucideShieldCheck,
    LucideUsers,
    PublicShellComponent,
    RouterLink,
  ],
  templateUrl: './institutional.page.html',
  styleUrls: ['./institutional.page.scss', './institutional.responsive.scss'],
})
export class InstitutionalPage {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(PageSeoService);
  private readonly injector = inject(Injector);
  private readonly pageTitle = viewChild<ElementRef<HTMLElement>>('pageTitle');

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly mode = computed<InstitutionalMode>(() =>
    this.route.snapshot.data['mode'] === 'services' ? 'services' : 'about',
  );

  protected readonly roles = [
    {
      title: 'Représentation et plaidoyer',
      text: 'Porter la voix des entreprises et défendre leurs intérêts dans un cadre structuré.',
    },
    {
      title: 'Accompagnement et services',
      text: 'Faciliter l’accès aux démarches et aux informations utiles pour les membres.',
    },
    {
      title: 'Réseau et opportunités',
      text: 'Relier groupements, entreprises et conseils régionaux autour d’un réseau commun.',
    },
    {
      title: 'Information économique',
      text: 'Rendre les repères et indicateurs plus faciles à consulter dans les espaces autorisés.',
    },
  ];

  protected readonly services = [
    {
      title: 'Cotisations et échéanciers',
      text: 'Consulter les appels, les montants fournis et les échéances depuis l’espace membre.',
      label: 'Espace sécurisé',
    },
    {
      title: 'Reçus et documents',
      text: 'Retrouver les documents rendus disponibles après les validations prévues.',
      label: 'Lecture contrôlée',
    },
    {
      title: 'Requêtes et réclamations',
      text: 'Créer une demande, suivre son statut et poursuivre les échanges dans un fil partagé.',
      label: 'Suivi membre',
    },
    {
      title: 'Profil de l’entreprise',
      text: 'Centraliser les informations de l’organisation selon les droits du représentant.',
      label: 'Accès habilité',
    },
    {
      title: 'Annuaire des membres',
      text: 'Découvrir uniquement les vitrines que leurs propriétaires ont choisi de publier.',
      label: 'Publication consentie',
    },
    {
      title: 'Pilotage et tableaux de bord',
      text: 'Présenter des indicateurs adaptés au rôle, avec provenance et périmètre explicites.',
      label: 'Données autorisées',
    },
  ];

  constructor() {
    const isServices = this.mode() === 'services';
    this.seo.apply({
      title: isServices ? 'Services numériques — CNPM' : 'Le CNPM — Présentation',
      description: isServices
        ? 'Présentation de démonstration des services numériques destinés aux membres.'
        : 'Présentation sobre du rôle et de la plateforme digitale du CNPM.',
      robots: 'noindex,nofollow',
      canonicalPath: isServices ? '/services' : '/le-cnpm',
    });
    afterNextRender(() => this.pageTitle()?.nativeElement.focus(), { injector: this.injector });
  }
}
