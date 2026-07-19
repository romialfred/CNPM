import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_REQUESTS_GATEWAY,
  type MemberRequestPage,
  type MemberRequestQuery,
  type MemberRequestsGateway,
} from './member-requests-gateway';
import { MemberRequestsPage } from './member-requests.page';

const READY_PAGE: MemberRequestPage = {
  items: [
    {
      id: 'demo-member-request-1',
      reference: 'DEMO-REQ-MEMBRE-2026-0006',
      kind: 'REQUEST',
      category: 'DEMO_DOCUMENT',
      subject: 'Comprendre une pièce demandée dans le scénario',
      status: 'WAITING_MEMBER',
      createdAt: '2026-07-18T09:20:00Z',
      updatedAt: '2026-07-19T08:45:00Z',
      targetAt: '2026-07-22T16:00:00Z',
      slaState: 'DUE_SOON',
    },
  ],
  page: 2,
  size: 5,
  totalElements: 6,
  totalPages: 2,
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

class ControllableGateway implements MemberRequestsGateway {
  readonly calls: { query: MemberRequestQuery; response: Subject<MemberRequestPage> }[] = [];

  list(query: MemberRequestQuery): Subject<MemberRequestPage> {
    const response = new Subject<MemberRequestPage>();
    this.calls.push({ query, response });
    return response;
  }

  create(): Subject<never> {
    return new Subject<never>();
  }

  loadDetail(): Subject<never> {
    return new Subject<never>();
  }

  addMessage(): Subject<never> {
    return new Subject<never>();
  }

  get latest(): Subject<MemberRequestPage> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [MemberRequestsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: MEMBER_REQUESTS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(MemberRequestsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, navigate, host: fixture.nativeElement as HTMLElement };
}

function button(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(host.querySelectorAll('button')).find((item) =>
    item.textContent?.includes(label),
  );
}

describe('MemberRequestsPage — MP-009', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit recherche, filtres, tri et pagination depuis l’URL', async () => {
    const { gateway, host } = await setup({
      q: 'délai',
      statut: 'IN_PROGRESS',
      type: 'CLAIM',
      tri: 'targetAt',
      ordre: 'asc',
      page: '2',
      taille: '5',
    });
    expect(gateway.calls[0].query).toEqual({
      search: 'délai',
      status: 'IN_PROGRESS',
      kind: 'CLAIM',
      sort: 'targetAt',
      direction: 'asc',
      page: 2,
      size: 5,
    });
    expect(host.textContent).toContain('Chargement des requêtes fictives');
  });

  it('rend table et fiches mobiles sans transmettre de note interne', async () => {
    const { fixture, gateway, host } = await setup({ page: '2', taille: '5' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('table caption')?.textContent).toContain('Requêtes et réclamations');
    expect(host.textContent).toContain('DEMO-REQ-MEMBRE-2026-0006');
    expect(host.querySelector('.member-requests__mobile-list article dl')).not.toBeNull();
    expect(host.textContent).toContain('aucune note interne n’est transmise');
    expect(host.textContent).not.toContain('strictement interne');
  });

  it('conserve les changements de filtres et de page dans l’URL', async () => {
    const { fixture, gateway, host, navigate } = await setup({ page: '2', taille: '5' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    const search = host.querySelector<HTMLInputElement>('#member-request-search');
    if (!search) throw new Error('Champ de recherche absent');
    search.value = '  document fictif  ';
    search.dispatchEvent(new Event('input'));
    const kind = host.querySelector<HTMLSelectElement>('#member-request-kind');
    if (!kind) throw new Error('Filtre type absent');
    kind.value = 'REQUEST';
    kind.dispatchEvent(new Event('change'));
    button(host, 'Appliquer')?.click();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: expect.objectContaining({
        q: 'document fictif',
        type: 'REQUEST',
        page: 1,
      }),
      queryParamsHandling: 'merge',
    });
  });

  it('distingue aucun résultat, collection vide, erreur et contrat HTTP indisponible', async () => {
    const filtered = await setup({ q: 'absent' });
    filtered.gateway.latest.next({
      ...READY_PAGE,
      items: [],
      totalElements: 0,
      totalPages: 0,
      page: 1,
    });
    await filtered.fixture.whenStable();
    filtered.fixture.detectChanges();
    expect(filtered.host.textContent).toContain('Aucun dossier ne correspond');

    TestBed.resetTestingModule();
    const empty = await setup();
    empty.gateway.latest.next({
      ...READY_PAGE,
      items: [],
      totalElements: 0,
      totalPages: 0,
      page: 1,
    });
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucune requête fictive');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(button(failed.host, 'Réessayer')).toBeDefined();

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('MP-009'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Requêtes indisponibles en mode HTTP');
  });
});
