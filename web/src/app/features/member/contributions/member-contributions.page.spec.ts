import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_CONTRIBUTIONS_GATEWAY,
  type MemberContributionPage,
  type MemberContributionQuery,
  type MemberContributionsGateway,
} from './member-contributions-gateway';
import { MemberContributionsPage } from './member-contributions.page';

const READY_PAGE: MemberContributionPage = {
  items: [
    {
      id: 'demo-contribution-2026-01',
      reference: 'DEMO-COT-2026-001',
      exercise: 2026,
      dueDate: '2026-09-30',
      calledAmount: 180000,
      paidAmount: 60000,
      outstandingAmount: 120000,
      currency: 'XOF',
      status: 'PARTIELLE',
    },
  ],
  page: 2,
  size: 3,
  totalElements: 6,
  totalPages: 2,
  availableExercises: [2026, 2025, 2024],
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

class ControllableGateway implements MemberContributionsGateway {
  readonly calls: { query: MemberContributionQuery; response: Subject<MemberContributionPage> }[] =
    [];

  list(query: MemberContributionQuery): Subject<MemberContributionPage> {
    const response = new Subject<MemberContributionPage>();
    this.calls.push({ query, response });
    return response;
  }

  loadDetail(): Subject<never> {
    return new Subject<never>();
  }

  get latest(): Subject<MemberContributionPage> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [MemberContributionsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: MEMBER_CONTRIBUTIONS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(MemberContributionsPage);
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

describe('MemberContributionsPage — MP-002', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit filtres, tri et pagination depuis l’URL et annonce le chargement', async () => {
    const { gateway, host } = await setup({
      statut: 'PARTIELLE',
      exercice: '2026',
      tri: 'reference',
      ordre: 'asc',
      page: '2',
      taille: '3',
    });
    expect(gateway.calls[0].query).toEqual({
      status: 'PARTIELLE',
      exercise: 2026,
      sort: 'reference',
      direction: 'asc',
      page: 2,
      size: 3,
    });
    expect(host.textContent).toContain('Chargement des cotisations fictives');
  });

  it('rend la table et les fiches mobiles avec une seule h1 et des données explicitement fictives', async () => {
    const { fixture, gateway, host } = await setup({ page: '2', taille: '3' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('table caption')?.textContent).toContain('Cotisations fictives');
    expect(host.textContent).toContain('DEMO-COT-2026-001');
    expect(host.textContent).toContain('120');
    expect(host.textContent).toContain('données 100 % fictives');
    expect(host.querySelector('.member-contributions__mobile-list article dl')).not.toBeNull();
    expect(host.querySelector('a[href*="demo-contribution-2026-01"]')).not.toBeNull();
    expect(host.textContent).not.toMatch(/taux de|tranche de|catégorie tarifaire/i);
  });

  it('partage les changements de filtres et page dans l’URL', async () => {
    const { fixture, gateway, host, navigate } = await setup({ page: '2', taille: '3' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    const status = host.querySelector<HTMLSelectElement>('#contribution-status');
    if (status) {
      status.value = 'REGLEE';
      status.dispatchEvent(new Event('change'));
    }
    button(host, 'Appliquer')?.click();
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: expect.objectContaining({ statut: 'REGLEE', page: 1 }),
      queryParamsHandling: 'merge',
    });

    host.querySelector<HTMLButtonElement>('button[aria-label="Page précédente"]')?.click();
    expect(navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { page: 1 },
      queryParamsHandling: 'merge',
    });
  });

  it('distingue aucun résultat, collection vide et erreur récupérable', async () => {
    const filtered = await setup({ statut: 'EN_RETARD' });
    filtered.gateway.latest.next({
      ...READY_PAGE,
      items: [],
      totalElements: 0,
      totalPages: 0,
      page: 1,
    });
    await filtered.fixture.whenStable();
    filtered.fixture.detectChanges();
    expect(filtered.host.textContent).toContain('Aucune cotisation ne correspond');

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
    expect(empty.host.textContent).toContain('Aucune cotisation à afficher');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(button(failed.host, 'Réessayer')).toBeDefined();

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('MP-002'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Consultation temporairement indisponible');
    expect(button(unavailable.host, 'Réessayer')).toBeUndefined();
  });
});
