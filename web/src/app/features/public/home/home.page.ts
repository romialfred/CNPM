import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
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
  LucideFileText,
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
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { PublicShellComponent, type PublicNavSection } from '../public-shell.component';
import { HOME_GATEWAY, type PublicHighlights } from './home-gateway';

type PageState = 'loading' | 'ready' | 'empty' | 'error';

/** PUB-001 — accueil public institutionnel et point d'entrée du portail membre. */
@Component({
  selector: 'cnpm-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
    LucideFileText,
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

  protected readonly navSections = computed<readonly PublicNavSection[]>(() => {
    const sections: PublicNavSection[] = [
      { id: 'services', label: 'Le CNPM' },
      { id: 'modules', label: 'Services' },
      { id: 'chiffres', label: 'Chiffres clés' },
    ];
    if (this.highlights()?.news.some((item) => item.fictionalDemo)) {
      sections.push({ id: 'actualites', label: 'Actualités' });
    }
    return sections;
  });

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

  protected readonly benefits = [
    {
      id: 'representation',
      title: 'Représentation et plaidoyer',
      text: 'Porter la voix des entreprises et défendre leurs intérêts dans un cadre structuré.',
    },
    {
      id: 'accompagnement',
      title: 'Accompagnement et services',
      text: 'Simplifier les démarches courantes et rendre les services plus faciles à suivre.',
    },
    {
      id: 'reseau',
      title: 'Réseau et opportunités',
      text: 'Relier groupements, conseils régionaux et entreprises autour d’un réseau commun.',
    },
    {
      id: 'information',
      title: 'Information économique',
      text: 'Mettre à disposition des repères utiles dans un espace numérique cohérent.',
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
