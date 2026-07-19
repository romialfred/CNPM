import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  type Data,
  type ParamMap,
} from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  EDITORIAL_GATEWAY,
  type EditorialGateway,
  type PublicDemoArticle,
  type PublicDemoEvent,
} from './editorial-gateway';
import { EditorialPage } from './editorial.page';

const ARTICLE: PublicDemoArticle = {
  slug: 'publication-editoriale',
  category: 'Repère',
  title: 'Publication éditoriale',
  summary: 'Résumé de la publication éditoriale.',
  body: ['Premier paragraphe.', 'Second paragraphe.'],
  publishedOn: '2026-07-08',
  readingMinutes: 2,
  fictionalDemo: true,
};

const EVENT: PublicDemoEvent = {
  id: 'evt-2026-09-17',
  kind: 'Atelier',
  title: 'Rendez-vous du réseau',
  summary: 'Inscription non ouverte.',
  startsOn: '2026-09-17T09:00:00Z',
  endsOn: '2026-09-17T11:00:00Z',
  location: 'Bamako',
  fictionalDemo: true,
};

class ControllableEditorialGateway implements EditorialGateway {
  readonly articles = new Subject<readonly PublicDemoArticle[]>();
  readonly article = new Subject<PublicDemoArticle | null>();
  readonly events = new Subject<readonly PublicDemoEvent[]>();

  listArticles(): Observable<readonly PublicDemoArticle[]> {
    return this.articles;
  }

  findArticle(): Observable<PublicDemoArticle | null> {
    return this.article;
  }

  listEvents(): Observable<readonly PublicDemoEvent[]> {
    return this.events;
  }
}

async function setup(mode: 'news' | 'article' | 'agenda', slug = '') {
  const gateway = new ControllableEditorialGateway();
  const data = new BehaviorSubject<Data>({ mode });
  const paramMap = new BehaviorSubject<ParamMap>(convertToParamMap({ slug }));
  const queryParamMap = new BehaviorSubject<ParamMap>(convertToParamMap({}));

  await TestBed.configureTestingModule({
    imports: [EditorialPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
        { path: 'membres', children: [] },
        { path: 'actualites', children: [] },
        { path: 'actualites/:slug', children: [] },
        { path: 'agenda', children: [] },
      ]),
      {
        provide: ActivatedRoute,
        useValue: { data, paramMap, queryParamMap },
      },
      { provide: EDITORIAL_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(EditorialPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('EditorialPage (PUB-009/PUB-010/PUB-011)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend un chargement identifiable et un titre de page unique', async () => {
    const { host } = await setup('news');
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelectorAll('.cnpm-skeleton')).toHaveLength(4);
  });

  it('affiche et relie les actualités publiées', async () => {
    const { fixture, gateway, host } = await setup('news');
    gateway.articles.next([ARTICLE]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain(ARTICLE.title);
    expect(host.querySelector<HTMLAnchorElement>('.news-card h3 a')?.getAttribute('href')).toBe(
      '/actualites/publication-editoriale',
    );
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe(
      'noindex,nofollow',
    );
  });

  it('rend le détail sans image, annonce sa portée et distingue l’absence', async () => {
    const found = await setup('article', ARTICLE.slug);
    found.gateway.article.next(ARTICLE);
    await found.fixture.whenStable();
    found.fixture.detectChanges();
    expect(found.host.querySelector('h1')?.textContent).toContain(ARTICLE.title);
    expect(found.host.querySelector('.editorial-article img')).toBeNull();
    expect(found.host.textContent).toContain('workflow éditorial EVT-004');

    TestBed.resetTestingModule();
    const missing = await setup('article', 'inconnue');
    missing.gateway.article.next(null);
    await missing.fixture.whenStable();
    missing.fixture.detectChanges();
    expect(missing.host.textContent).toContain('Actualité introuvable');
  });

  it('affiche l’agenda sans créer de destination d’inscription', async () => {
    const { fixture, gateway, host } = await setup('agenda');
    gateway.events.next([EVENT]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain(EVENT.title);
    expect(host.textContent).toContain('Inscription non ouverte');
    expect(host.querySelector('.event-card a, .event-card button')).toBeNull();
  });

  it('échoue sans repli silencieux lorsque la source est indisponible', async () => {
    const { fixture, gateway, host } = await setup('news');
    gateway.articles.error(new Error('indisponible'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Contenu temporairement indisponible');
    expect(host.querySelector('.news-card')).toBeNull();
  });
});
