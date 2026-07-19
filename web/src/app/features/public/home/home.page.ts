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
import {
  type CnpmSceneName,
  SceneComponent,
} from '../../../design-system/scene/scene.component';
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
    SceneComponent,
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

  protected readonly promises = [
    { id: 'representer', label: 'Représenter les entreprises' },
    { id: 'defendre', label: 'Défendre leurs intérêts' },
    { id: 'faciliter', label: 'Faciliter les démarches' },
    { id: 'connecter', label: 'Connecter pour développer' },
  ];

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
  }[] = [
    {
      id: 'representation',
      title: 'Représentation et plaidoyer',
      text: 'Porter la voix des entreprises et défendre leurs intérêts dans un cadre structuré.',
      accent: 'indigo',
    },
    {
      id: 'accompagnement',
      title: 'Accompagnement et services',
      text: 'Simplifier les démarches courantes et rendre les services plus faciles à suivre.',
      accent: 'teal',
    },
    {
      id: 'reseau',
      title: 'Réseau et opportunités',
      text: 'Relier groupements, conseils régionaux et entreprises autour d’un réseau commun.',
      accent: 'sky',
    },
    {
      id: 'information',
      title: 'Information économique',
      text: 'Mettre à disposition des repères utiles dans un espace numérique cohérent.',
      accent: 'amber',
    },
  ];

  protected readonly modules = [
    {
      id: 'cotisations',
      title: 'Cotisations',
      text: 'Suivre les appels et la situation de paiement.',
    },
    { id: 'requetes', title: 'Requêtes', text: 'Créer et suivre une demande adressée au CNPM.' },
    { id: 'recus', title: 'Reçus', text: 'Retrouver les documents disponibles après émission.' },
    {
      id: 'reporting',
      title: 'Tableaux de bord',
      text: 'Consulter des indicateurs adaptés à son espace.',
    },
    {
      id: 'vitrine',
      title: 'Vitrine publique',
      text: 'Valoriser une entreprise selon les règles de publication.',
    },
  ];

  /**
   * Illustration d'une actualité, choisie selon son sujet.
   *
   * Le rattachement vit ici et non dans le port : la scène relève de la présentation,
   * une autre page pourrait illustrer la même actualité autrement.
   */
  protected newsScene(id: string): CnpmSceneName {
    return (
      { 'prise-en-main': 'training', 'services-numeriques': 'digital', reseau: 'network' } as const
    )[id as 'prise-en-main' | 'services-numeriques' | 'reseau'] ?? 'assembly';
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
