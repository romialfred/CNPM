import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PublicShellComponent } from '../public-shell.component';
import { HOME_GATEWAY, type PublicHighlights } from './home-gateway';

type PageState = 'loading' | 'ready';

/**
 * PUB-001 — Accueil public CNPM.
 *
 * Le contenu institutionnel provient du site public du CNPM (cnpm.ml) : identité,
 * mission et structure. Rien n'est inventé — les sections prévues par la fiche dont
 * la source manque (actualités, témoignages, partenaires, newsletter) ne sont pas
 * rendues plutôt que d'être remplies de contenu fabriqué.
 */
@Component({
  selector: 'cnpm-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PublicShellComponent, ButtonComponent, RouterLink, DecimalPipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly gateway = inject(HOME_GATEWAY);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly state = signal<PageState>('loading');
  protected readonly highlights = signal<PublicHighlights | null>(null);

  /**
   * Identité institutionnelle, reprise du site public du CNPM.
   *
   * Source : cnpm.ml — « Une Union de Groupements d'Employeurs pour la défense et
   * l'intérêt des entreprises du Mali ». La signature « Invest In Mali » figure sur
   * le logo officiel (docs/00-sources/logo-CNPM.png).
   */
  protected readonly institution = {
    title: 'La maison des entrepreneurs du Mali',
    baseline:
      'Une union de groupements d’employeurs pour la défense et l’intérêt des entreprises du Mali.',
  };

  /**
   * Structure du CNPM, telle que publiée sur cnpm.ml.
   *
   * Les groupements et conseils régionaux sont décrits sans en énumérer la liste :
   * l'annuaire n'est pas publié et inventer des membres serait fabriquer une donnée
   * institutionnelle.
   */
  protected readonly structure = [
    {
      id: 'groupements',
      title: 'Groupements professionnels',
      text: 'Les entreprises adhèrent par branche d’activité, au sein de groupements professionnels.',
    },
    {
      id: 'regions',
      title: 'Conseils patronaux de région',
      text: 'Le réseau régional relaie l’action du CNPM au plus près des entreprises.',
    },
    {
      id: 'services',
      title: 'Services aux membres',
      text: 'Cotisations, documents, requêtes et attestations sont gérés depuis l’espace membre.',
    },
  ];

  constructor() {
    this.title.setTitle('Conseil National du Patronat du Mali');
    this.meta.updateTag({
      name: 'description',
      content: this.institution.baseline,
    });
    this.gateway.loadHighlights().subscribe((highlights) => {
      this.highlights.set(highlights);
      this.state.set('ready');
    });
  }
}
