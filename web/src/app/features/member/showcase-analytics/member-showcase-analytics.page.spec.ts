import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_SHOWCASE_ANALYTICS_GATEWAY,
  type MemberShowcaseAnalyticsGateway,
  type ShowcaseAnalyticsQuery,
  type ShowcaseAnalyticsSnapshot,
} from './member-showcase-analytics.gateway';
import { MemberShowcaseAnalyticsPage } from './member-showcase-analytics.page';

const READY_SNAPSHOT: ShowcaseAnalyticsSnapshot = {
  generatedOn: '2026-07-18',
  aggregation: 'DAILY',
  privacyMode: 'ANONYMOUS_AGGREGATES_ONLY',
  days: [
    { date: '2026-07-16', views: 12, contactActions: 0 },
    { date: '2026-07-17', views: 18, contactActions: 0 },
    { date: '2026-07-18', views: 15, contactActions: 0 },
  ],
};
const NINETY_DAY_SNAPSHOT: ShowcaseAnalyticsSnapshot = {
  ...READY_SNAPSHOT,
  days: Array.from({ length: 90 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 3, 20 + index)).toISOString().slice(0, 10),
    views: index + 1,
    contactActions: 0,
  })),
};

class ActivatedRouteStub {
  private readonly subject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  readonly queryParamMap;
  readonly snapshot;

  constructor(params: Record<string, string>) {
    this.subject = new BehaviorSubject(convertToParamMap(params));
    this.queryParamMap = this.subject.asObservable();
    this.snapshot = { queryParamMap: this.subject.value };
  }
}

class ControllableGateway implements MemberShowcaseAnalyticsGateway {
  readonly calls: {
    query: ShowcaseAnalyticsQuery;
    response: Subject<ShowcaseAnalyticsSnapshot | null>;
  }[] = [];

  load(query: ShowcaseAnalyticsQuery): Subject<ShowcaseAnalyticsSnapshot | null> {
    const response = new Subject<ShowcaseAnalyticsSnapshot | null>();
    this.calls.push({ query, response });
    return response;
  }

  get latest(): Subject<ShowcaseAnalyticsSnapshot | null> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [MemberShowcaseAnalyticsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: MEMBER_SHOWCASE_ANALYTICS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(MemberShowcaseAnalyticsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, navigate, host: fixture.nativeElement as HTMLElement };
}

describe('MemberShowcaseAnalyticsPage — MP-017', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit la période et la présentation depuis l’URL', async () => {
    const { gateway, host } = await setup({ period: '90d', display: 'table' });
    expect(gateway.calls[0].query).toEqual({ period: '90d' });
    expect(host.textContent).toContain('Chargement des agrégats fictifs');
  });

  it('rend les agrégats sans suivi individuel et porte noindex', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(READY_SNAPSHOT);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.showcase-analytics h1')).toBe(document.activeElement);
    expect(host.textContent).toContain('45');
    expect(host.textContent).toContain('Suivi désactivé dans la démonstration');
    expect(host.querySelector('table caption')?.textContent).toContain('sans identifiant visiteur');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex,nofollow');
    expect(
      host.querySelectorAll('a[href^="http"], a[href^="mailto"], a[href^="tel"]'),
    ).toHaveLength(0);
    expect(host.textContent).not.toMatch(
      /SOMACOP|BICIM|RCCM|NIF|adresse IP|cookie analytique actif/i,
    );
  });

  it('conserve période et présentation dans l’URL partageable', async () => {
    const { fixture, gateway, host, navigate } = await setup();
    gateway.latest.next(READY_SNAPSHOT);
    await fixture.whenStable();
    fixture.detectChanges();

    const period = host.querySelector<HTMLSelectElement>('#showcase-analytics-period');
    if (!period) throw new Error('Sélecteur de période absent');
    period.value = '7d';
    period.dispatchEvent(new Event('change'));
    const tableButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (item) => item.textContent?.includes('Tableau'),
    );
    tableButton?.click();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { period: '7d' },
      queryParamsHandling: 'merge',
    });
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { display: 'table' },
      queryParamsHandling: 'merge',
    });
  });

  it('trace 7 colonnes sur 7 jours et un sous-ensemble cohérent de 30 jours sur 90', async () => {
    const week = await setup({ period: '7d' });
    week.gateway.latest.next({ ...READY_SNAPSHOT, days: NINETY_DAY_SNAPSHOT.days.slice(-7) });
    await week.fixture.whenStable();
    week.fixture.detectChanges();
    expect(week.host.querySelectorAll('.showcase-analytics__bar')).toHaveLength(7);

    TestBed.resetTestingModule();
    const quarter = await setup({ period: '90d' });
    quarter.gateway.latest.next(NINETY_DAY_SNAPSHOT);
    await quarter.fixture.whenStable();
    quarter.fixture.detectChanges();

    expect(quarter.host.querySelectorAll('.showcase-analytics__bar')).toHaveLength(30);
    expect(quarter.host.querySelectorAll('tbody tr')).toHaveLength(30);
    expect(quarter.host.textContent).toContain(
      '30 derniers jours tracés sur 90 jours sélectionnés',
    );
    expect(quarter.host.textContent).toContain(
      'Les 60 jours antérieurs ne sont ni tracés ni inclus dans les métriques affichées.',
    );
    const total = quarter.host.querySelector('.showcase-analytics__metrics article strong');
    expect(total?.textContent?.replace(/\D/g, '')).toBe('2265');
  });

  it('distingue vide, erreur et indisponibilité HTTP', async () => {
    const empty = await setup();
    empty.gateway.latest.next(null);
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun agrégat disponible');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('Les statistiques n’ont pas pu être chargées');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('MP-017'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Statistiques indisponibles en mode HTTP');
  });
});
