import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBadgeCheck,
  LucideBriefcaseBusiness,
  LucideBuilding2,
  LucideChartColumnIncreasing,
  LucideLandmark,
  LucideNetwork,
  LucideReceiptText,
  LucideRoute,
  LucideShieldCheck,
  LucideUsers,
  LucideWorkflow,
} from '@lucide/angular';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  type CnpmTileAccent,
  FeatureTileComponent,
} from '../../../design-system/feature-tile/feature-tile.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { PublicShellComponent } from '../public-shell.component';
import { HOME_GATEWAY, type PublicHighlights } from './home-gateway';

type PageState = 'loading' | 'ready' | 'empty' | 'error';

/** PUB-001 — accueil public institutionnel et point d'entrée du portail membre. */
@Component({
  selector: 'cnpm-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FeatureTileComponent,
    ButtonComponent,
    DecimalPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    PublicShellComponent,
    RouterLink,
    SkeletonComponent,
    LucideArrowRight,
    LucideBadgeCheck,
    LucideBriefcaseBusiness,
    LucideBuilding2,
    LucideChartColumnIncreasing,
      LucideLandmark,
    LucideNetwork,
    LucideReceiptText,
    LucideRoute,
    LucideShieldCheck,
    LucideUsers,
    LucideWorkflow,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss', './home.preview.scss', './home.sections.scss'],
})
export class HomePage {
  private readonly gateway = inject(HOME_GATEWAY);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly state = signal<PageState>('loading');
  protected readonly highlights = signal<PublicHighlights | null>(null);
  protected readonly chartBars = [42, 58, 50, 70, 64, 82, 74, 92];


  protected readonly institution = {
    title: 'La plateforme digitale du Conseil National du Patronat du Mali',
    baseline:
      'Une union de groupements d’employeurs pour la défense et l’intérêt des entreprises du Mali.',
  };

  protected readonly promises: readonly { id: string; label: string; accent: CnpmTileAccent }[] = [
    { id: 'representer', label: 'Représenter les entreprises', accent: 'indigo' },
    { id: 'defendre', label: 'Défendre leurs intérêts', accent: 'teal' },
    { id: 'faciliter', label: 'Faciliter les démarches', accent: 'sky' },
    { id: 'connecter', label: 'Connecter pour développer', accent: 'amber' },
  ];

  /**
   * Accent d'un chiffre clé.
   *
   * Comme pour les axes d'action, la couleur distingue les tuiles sans rien signifier :
   * un taux de recouvrement en ambre n'est pas une alerte.
   */
  protected metricAccent(id: string): CnpmTileAccent {
    const parIndicateur: Readonly<Record<string, CnpmTileAccent>> = {
      membres: 'indigo',
      actifs: 'teal',
      cotisations: 'blue',
      recouvrement: 'sky',
      recus: 'amber',
    };
    return parIndicateur[id] ?? 'indigo';
  }

  /**
   * Les accents distinguent les axes d'action sans leur prêter de sens : ils viennent de
   * la palette catégorielle du handoff, prévue exactement pour cela. Aucun ne signale un
   * statut — la couleur ne porte donc jamais d'information seule (WCAG 2.2 AA).
   */
  protected readonly benefits: readonly {
    id: string;
    title: string;
    text: string;
    accent: CnpmTileAccent;
    image: string;
  }[] = [
    {
      id: 'representation',
      title: 'Représentation et plaidoyer',
      text: 'Porter la voix des entreprises et défendre leurs intérêts dans un cadre structuré.',
      accent: 'indigo',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=640&q=70',
    },
    {
      id: 'accompagnement',
      title: 'Accompagnement et services',
      text: 'Simplifier les démarches courantes et rendre les services plus faciles à suivre.',
      accent: 'teal',
      image: 'https://images.unsplash.com/photo-1568234928966-359c35dd8327?auto=format&fit=crop&w=640&q=70',
    },
    {
      id: 'reseau',
      title: 'Réseau et opportunités',
      text: 'Relier groupements, conseils régionaux et entreprises autour d’un réseau commun.',
      accent: 'sky',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=640&q=70',
    },
    {
      id: 'information',
      title: 'Information économique',
      text: 'Mettre à disposition des repères utiles dans un espace numérique cohérent.',
      accent: 'amber',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=640&q=70',
    },
  ];

  /**
   * Illustrations : photographies réelles du Mali (Wikimedia Commons, libres de droits),
   * servies en local depuis `public/assets/tiles/`. Crédits et licences dans
   * `assets/tiles/CREDITS.md`. L'attribut `alt` reste vide : l'image est décorative,
   * le titre voisin porte le sens.
   */
  protected readonly modules = [
    {
      id: 'cotisations',
      title: 'Cotisations',
      text: 'Suivre les appels et la situation de paiement.',
      image: '/assets/tiles/cotisations-bceao.jpg',
    },
    {
      id: 'requetes',
      title: 'Requêtes',
      text: 'Créer et suivre une demande adressée au CNPM.',
      image: '/assets/tiles/requetes-marche.jpg',
    },
    {
      id: 'recus',
      title: 'Reçus',
      text: 'Retrouver les documents disponibles après émission.',
      image: '/assets/tiles/recus-arche-bamako.jpg',
    },
    {
      id: 'reporting',
      title: 'Tableaux de bord',
      text: 'Consulter des indicateurs adaptés à son espace.',
      image: '/assets/tiles/reporting-aci2000.jpg',
    },
    {
      id: 'vitrine',
      title: 'Vitrine publique',
      text: 'Valoriser une entreprise selon les règles de publication.',
      image: '/assets/tiles/vitrine-djenne.jpg',
    },
  ];

  /**
   * Photographie d'une actualité, choisie selon son sujet.
   *
   * Le rattachement vit ici et non dans le port : l'illustration relève de la
   * présentation, une autre page pourrait illustrer la même actualité autrement.
   * Le texte alternatif décrit la scène, il ne répète pas le titre déjà lu juste après.
   */
  protected newsPhoto(id: string): { src: string; alt: string } {
    const parSujet: Readonly<Record<string, { src: string; alt: string }>> = {
      'prise-en-main': {
        src: '/assets/photos/atelier-portail.webp',
        alt: 'Un intervenant commente un tableau de bord projeté devant des participants réunis en salle.',
      },
      'services-numeriques': {
        src: '/assets/photos/services-numeriques.webp',
        alt: 'Quatre collaborateurs consultent ensemble un portail numérique sur écran, tablette et ordinateur portable.',
      },
      reseau: {
        src: '/assets/photos/reseau-entreprises.webp',
        alt: 'Un intervenant désigne une carte régionale reliant le Mali à ses pays voisins.',
      },
    };
    return parSujet[id] ?? parSujet['prise-en-main'];
  }

  constructor() {
    this.title.setTitle('Conseil National du Patronat du Mali');
    this.meta.updateTag({ name: 'description', content: this.institution.baseline });
    this.loadHighlights();
  }

  protected loadHighlights(): void {
    this.state.set('loading');
    this.gateway
      .loadHighlights()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (highlights) => {
          this.highlights.set(highlights);
          this.state.set(highlights.metrics.length === 0 ? 'empty' : 'ready');
        },
        error: () => {
          this.highlights.set(null);
          this.state.set('error');
        },
      });
  }
}
