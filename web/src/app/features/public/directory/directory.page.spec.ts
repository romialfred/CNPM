import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
  type Data,
  type ParamMap,
} from '@angular/router';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SHOWCASE_GATEWAY,
  type PublicShowcasePage,
  type PublicShowcaseQuery,
  type ShowcaseGateway,
  type ShowcaseResult,
} from '../showcase/showcase-gateway';
import { DirectoryPage } from './directory.page';

const READY: PublicShowcasePage = {
  items: [
    {
      slug: 'atelier-kanu-demonstration',
      name: 'Atelier Kanu — démonstration',
      tagline: 'Un scénario fictif pour les services numériques',
      sector: 'Services numériques',
      location: 'Bamako — localisation fictive',
      summary: 'Entreprise entièrement fictive créée pour valider l’annuaire public.',
      isDemoContent: true,
      publicationStatus: 'PUBLISHED',
    },
  ],
  page: 0,
  pageSize: 20,
  totalItems: 1,
  totalPages: 1,
};

class ControllableShowcaseGateway implements ShowcaseGateway {
  readonly calls: { query: PublicShowcaseQuery; result: Subject<PublicShowcasePage> }[] = [];

  listPublished(query: PublicShowcaseQuery): Observable<PublicShowcasePage> {
    const result = new Subject<PublicShowcasePage>();
    this.calls.push({ query, result });
    return result;
  }

  findBySlug(): Observable<ShowcaseResult> {
    return of({ outcome: 'not-found' });
  }

  get latest(): Subject<PublicShowcasePage> {
    return this.calls[this.calls.length - 1].result;
  }
}

interface SetupOptions {
  readonly mode?: 'directory' | 'search';
  readonly params?: Record<string, string>;
}

async function setup(options: SetupOptions = {}) {
  const gateway = new ControllableShowcaseGateway();
  const data = new BehaviorSubject<Data>({ mode: options.mode ?? 'directory' });
  const params = new BehaviorSubject<ParamMap>(convertToParamMap(options.params ?? {}));
  const route = {
    data,
    queryParamMap: params,
    snapshot: { data: data.value, queryParamMap: params.value },
  };

  await TestBed.configureTestingModule({
    imports: [DirectoryPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
        { path: 'membres/recherche', children: [] },
        { path: 'membres/:slug', children: [] },
      ]),
      { provide: ActivatedRoute, useValue: route },
      { provide: SHOWCASE_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DirectoryPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return {
    fixture,
    gateway,
    route,
    router: TestBed.inject(Router),
    host: fixture.nativeElement as HTMLElement,
  };
}

describe('DirectoryPage (PUB-004/PUB-005)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche une structure de chargement et distingue la page de recherche', async () => {
    const { host } = await setup({ mode: 'search' });

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.textContent).toContain('Rechercher un membre');
    expect(host.querySelector('form')).not.toBeNull();
    expect(host.querySelectorAll('.cnpm-skeleton')).toHaveLength(6);
  });

  it('rend uniquement la projection minimale et relie chaque résultat à PUB-006', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(READY);
    await fixture.whenStable();
    fixture.detectChanges();

    const card = host.querySelector('.cnpm-directory__card')!;
    expect(card.textContent).toContain('Atelier Kanu — démonstration');
    expect(card.textContent).toContain('Profil fictif de démonstration');
    expect(card.querySelector('img')).toBeNull();
    expect(card.textContent).not.toMatch(/téléphone|courriel|licence/i);
    expect(card.querySelector('a')?.getAttribute('href')).toBe(
      '/membres/atelier-kanu-demonstration',
    );
  });

  it('distingue l’annuaire vide de l’absence de résultat filtré', async () => {
    const empty = { ...READY, items: [], totalItems: 0, totalPages: 0 };
    const first = await setup();
    first.gateway.latest.next(empty);
    await first.fixture.whenStable();
    first.fixture.detectChanges();
    expect(first.host.textContent).toContain('Aucune vitrine publiée');

    TestBed.resetTestingModule();
    const filtered = await setup({ mode: 'search', params: { q: 'introuvable' } });
    filtered.gateway.latest.next(empty);
    await filtered.fixture.whenStable();
    filtered.fixture.detectChanges();
    expect(filtered.host.textContent).toContain('Aucun membre ne correspond');
    expect(filtered.host.textContent).toContain('Effacer les critères');
  });

  it('conserve q, sector, page et pageSize dans la requête issue de l’URL', async () => {
    const { gateway } = await setup({
      mode: 'search',
      params: { q: 'kanu', sector: 'Conseil', page: '2', pageSize: '6' },
    });

    expect(gateway.calls[0].query).toEqual({
      q: 'kanu',
      sector: 'Conseil',
      page: 2,
      pageSize: 6,
    });
  });

  it('ramène une page hors plage vers la dernière page disponible', async () => {
    const { fixture, gateway, router } = await setup({
      mode: 'search',
      params: { page: '999', pageSize: '6' },
    });
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    gateway.latest.next({
      ...READY,
      items: [],
      page: 999,
      pageSize: 6,
      totalItems: 8,
      totalPages: 2,
    });
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { page: 1 },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });

  it('met les critères dans l’URL à la soumission et remet la page à zéro', async () => {
    const { fixture, host, router } = await setup({ mode: 'search', params: { page: '3' } });
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const query = host.querySelector<HTMLInputElement>('#annuaire-q')!;
    const sector = host.querySelector<HTMLInputElement>('#annuaire-secteur')!;
    query.value = '  Kanu  ';
    query.dispatchEvent(new Event('input'));
    sector.value = 'Conseil';
    sector.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    host.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ q: 'Kanu', sector: 'Conseil', page: null }),
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('annonce une erreur récupérable puis relance la même requête', async () => {
    const { fixture, gateway, host } = await setup({ mode: 'search', params: { q: 'kanu' } });
    gateway.latest.error(new Error('indisponible'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('L’annuaire est indisponible');
    const retry = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Réessayer'),
    )!;
    retry.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(gateway.calls).toHaveLength(2);
  });
});
