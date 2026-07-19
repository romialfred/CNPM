import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  INTEGRATIONS_GATEWAY,
  IntegrationsAccessError,
  type IntegrationLogEntry,
  type IntegrationPartner,
  type IntegrationsGateway,
  type IntegrationsQuery,
  type IntegrationsSnapshot,
} from './integrations-gateway';
import { IntegrationsPage } from './integrations.page';

const PARTNER: IntegrationPartner = {
  id: 'demo-integration-test',
  name: 'Partenaire Test',
  purpose: 'Flux de test',
  channelLabel: 'Canal de test',
  environmentLabel: 'Bac à sable',
  health: 'HEALTHY',
  contractVersion: 'v1-2026',
  authorization: 'DOCUMENTED',
  authorizationLabel: 'Autorisation de test documentée',
  externalMappings: 2,
  sourceLabel: 'Jeu synthétique Test',
  qualityLabel: 'Contrôlée',
  lastCheckAt: '2026-07-19T10:42:00Z',
  lastCheckLabel: '19 juillet 2026, 10:42',
  lastExchangeAt: '2026-07-19T10:35:00Z',
  lastExchangeLabel: '19 juillet 2026, 10:35',
  successRate24h: 100,
  events24h: 3,
  statusDetail: 'Scénario opérationnel.',
};

const LOG: IntegrationLogEntry = {
  id: 'demo-log-test',
  occurredAt: '2026-07-19T10:35:00Z',
  occurredAtLabel: '19 juillet 2026, 10:35',
  partnerId: PARTNER.id,
  partnerName: PARTNER.name,
  direction: 'INBOUND',
  exchangeLabel: 'Import',
  outcome: 'SUCCESS',
  correlationLabel: 'CNPM-INT-TEST',
  contractVersion: 'v1-2026',
  provenanceLabel: 'Jeu synthétique Test',
  qualityLabel: 'Conforme',
  detail: 'Aucune charge utile conservée.',
};

const SNAPSHOT: IntegrationsSnapshot = {
  partners: [PARTNER],
  logs: [LOG],
  summary: {
    totalPartners: 1,
    healthyPartners: 1,
    attentionPartners: 0,
    blockedPartners: 0,
    events24h: 3,
    failedEvents24h: 0,
  },
  totalPartners: 1,
  totalLogs: 1,
  updatedAt: '2026-07-19T10:42:00Z',
  updatedAtLabel: '19 juillet 2026, 10:42',
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

  setParams(params: Record<string, string>): void {
    this.subject.next(convertToParamMap(params));
  }
}

class IntegrationsStub implements IntegrationsGateway {
  readonly calls: {
    readonly query: IntegrationsQuery;
    readonly response: Subject<IntegrationsSnapshot>;
  }[] = [];

  load(query: IntegrationsQuery): Subject<IntegrationsSnapshot> {
    const response = new Subject<IntegrationsSnapshot>();
    this.calls.push({ query, response });
    return response;
  }

  get latest(): Subject<IntegrationsSnapshot> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new IntegrationsStub();
  const activatedRoute = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [IntegrationsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: activatedRoute },
      { provide: INTEGRATIONS_GATEWAY, useValue: gateway },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(IntegrationsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return {
    fixture,
    gateway,
    navigate,
    host: fixture.nativeElement as HTMLElement,
    activatedRoute,
  };
}

function buttonByText(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
    button.textContent?.includes(label),
  );
}

describe('IntegrationsPage — BO-038', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit la vue et les filtres bornés depuis l’URL, puis annonce le chargement', async () => {
    const { gateway, host } = await setup({
      vue: 'journal',
      sens: 'INBOUND',
      q: 'x'.repeat(120),
    });

    expect(gateway.calls[0].query).toEqual({
      view: 'journal',
      health: 'all',
      direction: 'INBOUND',
      search: 'x'.repeat(80),
    });
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.textContent).toContain('Chargement des intégrations');
  });

  it('rend les statuts, versions, provenance et garde les opérations sensibles non exécutables', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(SNAPSHOT);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain(PARTNER.name);
    expect(host.textContent).toContain('Opérationnel');
    expect(host.textContent).toContain(PARTNER.contractVersion);
    expect(host.textContent).toContain(PARTNER.sourceLabel);
    expect(host.textContent).toContain('identifiant CNPM préservé');
    const liveRegion = host.querySelector<HTMLElement>('.cnpm-integrations__sr[role="status"]');
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    expect(liveRegion?.textContent).toContain('1 partenaire affiché sur 1');
    const panel = host.querySelector<HTMLElement>('#integrations-view-panel');
    expect(panel?.getAttribute('role')).toBe('tabpanel');
    for (const tab of host.querySelectorAll<HTMLElement>('[role="tab"]')) {
      expect(tab.getAttribute('aria-controls')).toBe('integrations-view-panel');
    }
    expect(host.textContent).toContain('Créer un webhook');
    expect(host.textContent).toContain('Rejouer un échange');
    expect(host.textContent).toContain('Faire tourner une clé');
    expect(host.textContent).toContain('Activer une intégration');
    expect(buttonByText(host, 'Créer un webhook')).toBeUndefined();
    expect(buttonByText(host, 'Rejouer un échange')).toBeUndefined();
    expect(buttonByText(host, 'Faire tourner une clé')).toBeUndefined();
    expect(buttonByText(host, 'Activer une intégration')).toBeUndefined();
  });

  it('conserve la vue, l’état et la recherche dans l’URL partageable', async () => {
    const { fixture, gateway, host, navigate } = await setup();
    gateway.latest.next(SNAPSHOT);
    await fixture.whenStable();
    fixture.detectChanges();

    const health = host.querySelector<HTMLSelectElement>('#integration-health')!;
    health.value = 'DEGRADED';
    health.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { etat: 'DEGRADED' },
      queryParamsHandling: 'merge',
    });

    const input = host.querySelector<HTMLInputElement>('#integration-search')!;
    input.value = ' partenaire alpha ';
    input.dispatchEvent(new Event('input'));
    host
      .querySelector<HTMLFormElement>('.cnpm-integrations__search')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { q: 'partenaire alpha' },
      queryParamsHandling: 'merge',
    });

    buttonByText(host, 'Journal technique')?.click();
    expect(navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { vue: 'journal', etat: null, sens: null, q: null },
      queryParamsHandling: 'merge',
    });
  });

  it('distingue absence de résultat, refus, panne et projection HTTP indisponible', async () => {
    const empty = await setup({ etat: 'DEGRADED' });
    empty.gateway.latest.next({ ...SNAPSHOT, partners: [] });
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun partenaire ne correspond');
    expect(
      empty.host.querySelector('.cnpm-integrations__sr[role="status"]')?.textContent,
    ).toContain('0 partenaires affichés sur 1');

    TestBed.resetTestingModule();
    const noData = await setup();
    noData.gateway.latest.next({ ...SNAPSHOT, partners: [], totalPartners: 0 });
    await noData.fixture.whenStable();
    noData.fixture.detectChanges();
    expect(noData.host.textContent).toContain('Aucune intégration supervisée');

    TestBed.resetTestingModule();
    const forbidden = await setup();
    forbidden.gateway.latest.error(new IntegrationsAccessError());
    await forbidden.fixture.whenStable();
    forbidden.fixture.detectChanges();
    expect(forbidden.host.textContent).toContain('Supervision non autorisée');
    expect(buttonByText(forbidden.host, 'Réessayer')).toBeUndefined();

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('BO-038'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Projection HTTP indisponible');
    expect(unavailable.host.textContent).toContain('Aucun jeu de substitution n’est affiché');
    expect(buttonByText(unavailable.host, 'Réessayer')).toBeUndefined();

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('incident fictif'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('La supervision n’a pas pu être chargée');
    expect(buttonByText(failed.host, 'Réessayer')).toBeDefined();
  });

  it('annonce l’état hors-ligne avant de proposer une reprise', async () => {
    const failed = await setup();
    globalThis.dispatchEvent(new Event('offline'));
    failed.gateway.latest.error(new Error('connexion coupée'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();

    expect(failed.host.textContent).toContain('Connexion indisponible');
    expect(failed.host.textContent).toContain('Rétablissez la connexion');
    expect(buttonByText(failed.host, 'Réessayer')).toBeDefined();
    globalThis.dispatchEvent(new Event('online'));
  });

  it('resynchronise la recherche lorsque l historique modifie l URL', async () => {
    const { fixture, gateway, host, activatedRoute } = await setup({ q: 'premier filtre' });
    expect(host.querySelector<HTMLInputElement>('#integration-search')?.value).toBe(
      'premier filtre',
    );

    activatedRoute.setParams({ q: 'retour navigateur' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.calls.at(-1)?.query.search).toBe('retour navigateur');
    expect(host.querySelector<HTMLInputElement>('#integration-search')?.value).toBe(
      'retour navigateur',
    );
  });
});
