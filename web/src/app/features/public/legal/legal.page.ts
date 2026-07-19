import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LucideClock3, LucideFileWarning, LucideShieldAlert } from '@lucide/angular';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { PublicShellComponent } from '../public-shell.component';

type LegalDocumentSlug = 'mentions-legales' | 'confidentialite' | 'conditions-utilisation';

interface LegalSection {
  readonly title: string;
  readonly description: string;
}

interface LegalDocument {
  readonly slug: LegalDocumentSlug;
  readonly shortTitle: string;
  readonly title: string;
  readonly summary: string;
  readonly sections: readonly LegalSection[];
}

const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    slug: 'mentions-legales',
    shortTitle: 'Mentions légales',
    title: 'Mentions légales',
    summary:
      'Les informations nécessaires à la publication des mentions légales ne sont pas encore disponibles. Cette page indique leur statut sans les remplacer.',
    sections: [
      {
        title: 'Éditeur et responsabilité de publication',
        description:
          'L’identité de l’éditeur du service et de la personne responsable de la publication n’est pas encore publiée.',
      },
      {
        title: 'Hébergement de production',
        description:
          'Les informations relatives à l’hébergement du service ne sont pas encore publiées. Aucun prestataire, pays d’hébergement ou engagement de service n’est affiché en remplacement.',
      },
      {
        title: 'Coordonnées institutionnelles',
        description:
          'Aucune coordonnée institutionnelle destinée aux messages du public n’est actuellement publiée. Le formulaire Contact reste une démonstration locale sans transmission.',
      },
    ],
  },
  {
    slug: 'confidentialite',
    shortTitle: 'Confidentialité',
    title: 'Politique de confidentialité',
    summary:
      'La politique de confidentialité officielle, versionnée et approuvée n’est pas encore publiée. Cette page de statut ne la remplace pas.',
    sections: [
      {
        title: 'Version et périmètre',
        description:
          'La version applicable, sa date d’entrée en vigueur et le périmètre des traitements ne sont pas encore publiés.',
      },
      {
        title: 'Conservation des données',
        description:
          'Les durées de conservation ne sont pas encore publiées. Aucun délai générique n’est affiché en remplacement.',
      },
      {
        title: 'Consentements et traceurs',
        description:
          'Les modalités de consentement, de mise à jour et d’utilisation éventuelle de traceurs ne sont pas encore publiées. Aucun traceur marketing n’est simulé par cette page.',
      },
    ],
  },
  {
    slug: 'conditions-utilisation',
    shortTitle: 'Conditions d’utilisation',
    title: 'Conditions d’utilisation',
    summary:
      'Les conditions opposables d’accès et d’utilisation de la plateforme n’ont pas été remises. Aucun engagement contractuel n’est créé par ce contenu de démonstration.',
    sections: [
      {
        title: 'Périmètre et acceptation',
        description:
          'Les services couverts, les utilisateurs concernés et les modalités d’acceptation ne sont pas publiés dans une version juridique approuvée.',
      },
      {
        title: 'Responsabilités et recours',
        description:
          'Les responsabilités, limitations, voies de recours et canaux d’assistance ne sont pas encore publiés. Cette page ne propose aucune clause de remplacement.',
      },
      {
        title: 'Droit applicable et entrée en vigueur',
        description:
          'Le droit applicable, l’autorité compétente, la version et la date d’effet devront être publiés dans le document validé.',
      },
    ],
  },
];

/** PUB-016 — statut de publication des documents juridiques, sans contenu juridique inventé. */
@Component({
  selector: 'cnpm-legal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideClock3, LucideFileWarning, LucideShieldAlert, PublicShellComponent, RouterLink],
  templateUrl: './legal.page.html',
  styleUrls: ['./legal.page.scss', './legal.states.scss', './legal.responsive.scss'],
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(PageSeoService);
  private readonly injector = inject(Injector);
  private readonly pageTitle = viewChild<ElementRef<HTMLElement>>('pageTitle');

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly documents = LEGAL_DOCUMENTS;
  protected readonly current = signal<LegalDocument | null>(null);
  protected readonly requestedSlugLabel = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const slug = params.get('document') ?? '';
      const document = LEGAL_DOCUMENTS.find((candidate) => candidate.slug === slug) ?? null;
      const boundedSlug = boundRequestedSlug(slug);
      this.requestedSlugLabel.set(boundedSlug);
      this.current.set(document);
      this.seo.apply({
        title: document ? `${document.title} — CNPM` : 'Document légal introuvable — CNPM',
        description: document
          ? `Statut de publication du document « ${document.title} » de la plateforme CNPM.`
          : 'Le document légal demandé ne correspond à aucune page déclarée.',
        robots: 'noindex,nofollow',
        canonicalPath: `/legal/${document?.slug ?? boundedSlug}`,
      });
      afterNextRender(() => this.pageTitle()?.nativeElement.focus(), { injector: this.injector });
    });
  }
}

function boundRequestedSlug(slug: string): string {
  const normalized = slug.trim() || 'non renseignée';
  const characters = Array.from(normalized);
  return characters.length <= 56 ? normalized : `${characters.slice(0, 53).join('')}…`;
}
