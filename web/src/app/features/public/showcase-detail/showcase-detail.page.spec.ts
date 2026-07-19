import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  type Data,
  type ParamMap,
} from '@angular/router';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SHOWCASE_GATEWAY,
  type MemberShowcase,
  type PublicShowcasePage,
  type PublicShowcaseQuery,
  type ShowcaseGateway,
  type ShowcaseResult,
} from '../showcase/showcase-gateway';
import { ShowcaseDetailPage } from './showcase-detail.page';

const PUBLISHED: MemberShowcase = {
  slug: 'atelier-kanu-demonstration',
  name: 'Atelier Kanu — démonstration',
  tagline: 'Scénario fictif de service',
  sector: 'Services numériques',
  location: 'Localisation fictive',
  employeeRange: 'Donnée fictive non publiée',
  foundedYear: 2026,
  legalForm: 'Structure fictive',
  verificationStatus: 'PENDING',
  verifiedAt: null,
  memberSince: '2026 — démonstration',
  summary: 'Vitrine fictive.',
  heroVisual: {
    shape: 'grid',
    alt: 'Illustration vectorielle fictive.',
    label: 'Illustration fictive',
  },
  contacts: {},
  contactConsent: null,
  activities: [
    {
      id: 'diagnostic-pilote',
      title: 'Diagnostic pilote fictif',
      description: 'Activité entièrement inventée.',
      icon: 'studies',
    },
  ],
  projects: [
    {
      id: 'parcours-pilote-2026',
      title: 'Parcours pilote 2026 — réalisation fictive',
      summary: 'Réalisation entièrement inventée, sans client ni résultat réels.',
      category: 'Démonstration',
      visual: {
        shape: 'grid',
        alt: 'Illustration vectorielle, et non photographie.',
        label: 'Parcours fictif',
      },
    },
  ],
  gallery: [],
  certifications: [],
  partners: [],
  testimonials: [],
  brochureAvailable: false,
  isDemoContent: true,
  publicationStatus: 'PUBLISHED',
  seoTitle: 'Atelier Kanu — démonstration',
  seoDescription: 'Démonstration.',
  allowIndexing: false,
};

class ControllableGateway implements ShowcaseGateway {
  readonly calls: { slug: string; result: Subject<ShowcaseResult> }[] = [];

  listPublished(query: PublicShowcaseQuery): Observable<PublicShowcasePage> {
    return of({
      items: [],
      page: query.page,
      pageSize: query.pageSize,
      totalItems: 0,
      totalPages: 0,
    });
  }

  findBySlug(slug: string): Observable<ShowcaseResult> {
    const result = new Subject<ShowcaseResult>();
    this.calls.push({ slug, result });
    return result;
  }

  get latest(): Subject<ShowcaseResult> {
    return this.calls[this.calls.length - 1].result;
  }
}

interface SetupOptions {
  readonly mode?: 'activities' | 'project';
  readonly slug?: string;
  readonly projectId?: string;
}

async function setup(options: SetupOptions = {}) {
  const gateway = new ControllableGateway();
  const data = new BehaviorSubject<Data>({ mode: options.mode ?? 'activities' });
  const params = new BehaviorSubject<ParamMap>(
    convertToParamMap({
      slug: options.slug ?? PUBLISHED.slug,
      ...(options.projectId ? { id: options.projectId } : {}),
    }),
  );
  const route = { data, paramMap: params };

  await TestBed.configureTestingModule({
    imports: [ShowcaseDetailPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
        { path: 'membres', children: [] },
        { path: 'membres/:slug', children: [] },
        { path: 'membres/:slug/activites', children: [] },
        { path: 'membres/:slug/realisations/:id', children: [] },
      ]),
      { provide: ActivatedRoute, useValue: route },
      { provide: SHOWCASE_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ShowcaseDetailPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

async function publish(
  fixture: ReturnType<typeof TestBed.createComponent<ShowcaseDetailPage>>,
  gateway: ControllableGateway,
  showcase: MemberShowcase = PUBLISHED,
): Promise<void> {
  gateway.latest.next({ outcome: 'published', showcase });
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('ShowcaseDetailPage (PUB-007/PUB-008)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche des squelettes fidèles pendant la lecture de la vitrine publiée', async () => {
    const { host, gateway } = await setup();
    expect(gateway.calls[0].slug).toBe(PUBLISHED.slug);
    expect(host.querySelectorAll('.cnpm-skeleton')).toHaveLength(4);
    expect(host.textContent).toContain('Chargement');
  });

  it('rend les activités et lie chaque réalisation à son URL PUB-008 stable', async () => {
    const { fixture, gateway, host } = await setup();
    await publish(fixture, gateway);

    expect(host.querySelector('h1')?.textContent).toContain('Activités et réalisations');
    expect(host.textContent).toContain('Diagnostic pilote fictif');
    expect(host.textContent).toContain('Parcours pilote 2026 — réalisation fictive');
    expect(host.querySelector('.cnpm-showcase-detail__content img')).toBeNull();
    expect(host.querySelector('.cnpm-showcase-detail__project-link')?.getAttribute('href')).toBe(
      '/membres/atelier-kanu-demonstration/realisations/parcours-pilote-2026',
    );
  });

  it('sélectionne la réalisation publiée et pose une canonical non indexable en démo', async () => {
    const { fixture, gateway, host } = await setup({
      mode: 'project',
      projectId: 'parcours-pilote-2026',
    });
    await publish(fixture, gateway);

    expect(host.querySelector('h1')?.textContent).toContain('Parcours pilote 2026');
    expect(host.textContent).toContain('aucune photographie');
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toContain(
      '/membres/atelier-kanu-demonstration/realisations/parcours-pilote-2026',
    );
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe(
      'noindex,nofollow',
    );
  });

  it('ne révèle aucun contenu lorsque la vitrine n’est pas publiée', async () => {
    const { fixture, gateway, host } = await setup({
      mode: 'project',
      projectId: 'parcours-pilote-2026',
    });
    gateway.latest.next({ outcome: 'not-public', status: 'DRAFT' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Vitrine non publiée');
    expect(host.textContent).not.toContain('Parcours pilote 2026');
  });

  it('distingue une vitrine absente d’une réalisation absente', async () => {
    const missingShowcase = await setup({ slug: 'inconnue' });
    missingShowcase.gateway.latest.next({ outcome: 'not-found' });
    await missingShowcase.fixture.whenStable();
    missingShowcase.fixture.detectChanges();
    expect(missingShowcase.host.textContent).toContain('Vitrine introuvable');

    TestBed.resetTestingModule();
    const missingProject = await setup({ mode: 'project', projectId: 'inconnue' });
    await publish(missingProject.fixture, missingProject.gateway);
    expect(missingProject.host.textContent).toContain('Réalisation introuvable');
  });

  it('distingue les sections réellement vides', async () => {
    const { fixture, gateway, host } = await setup();
    await publish(fixture, gateway, { ...PUBLISHED, activities: [], projects: [] });

    expect(host.textContent).toContain('Aucune activité publiée');
    expect(host.textContent).toContain('Aucune réalisation publiée');
  });

  it('rend l’erreur récupérable et relance la même lecture', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new Error('indisponible'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Le contenu est indisponible');
    const retry = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Réessayer'),
    )!;
    retry.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(gateway.calls).toHaveLength(2);
    expect(gateway.calls[1].slug).toBe(PUBLISHED.slug);
  });
});
