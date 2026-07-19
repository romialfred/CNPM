import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_RECEIPTS_GATEWAY,
  type MemberReceiptDetail,
  type MemberReceiptPage,
  type MemberReceiptQuery,
  type MemberReceiptsGateway,
} from './member-receipts-gateway';
import { MemberReceiptsPage } from './member-receipts.page';

const READY_PAGE: MemberReceiptPage = {
  items: [
    {
      id: 'demo-receipt-preview-2025-002',
      reference: 'DEMO-APERCU-2025-002',
      periodLabel: 'Période fictive 2025',
      amountXof: 180000,
      scenarioDate: '2025-12-20',
      status: 'DEMONSTRATION_CANCELLED',
    },
  ],
  page: 2,
  size: 5,
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

class ControllableGateway implements MemberReceiptsGateway {
  readonly calls: { query: MemberReceiptQuery; response: Subject<MemberReceiptPage> }[] = [];

  list(query: MemberReceiptQuery): Subject<MemberReceiptPage> {
    const response = new Subject<MemberReceiptPage>();
    this.calls.push({ query, response });
    return response;
  }

  loadDetail(): Subject<MemberReceiptDetail> {
    return new Subject<MemberReceiptDetail>();
  }

  get latest(): Subject<MemberReceiptPage> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [MemberReceiptsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: MEMBER_RECEIPTS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(MemberReceiptsPage);
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

describe('MemberReceiptsPage — MP-007', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit recherche, statut, exercice, tri et pagination depuis l’URL', async () => {
    const { gateway, host } = await setup({
      q: '2025',
      statut: 'DEMONSTRATION_CANCELLED',
      exercice: '2025',
      tri: 'amountXof',
      ordre: 'asc',
      page: '2',
      taille: '5',
    });
    expect(gateway.calls[0].query).toEqual({
      search: '2025',
      status: 'DEMONSTRATION_CANCELLED',
      exercise: 2025,
      sort: 'amountXof',
      direction: 'asc',
      page: 2,
      size: 5,
    });
    expect(host.textContent).toContain('Chargement des aperçus de reçus fictifs');
  });

  it('rend table et fiches mobiles comme aperçus sans valeur probante', async () => {
    const { fixture, gateway, host } = await setup({ page: '2', taille: '5' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('table caption')?.textContent).toContain('Aperçus de reçus fictifs');
    expect(host.textContent).toContain('DEMO-APERCU-2025-002');
    expect(host.querySelector('.member-receipts__mobile-list article dl')).not.toBeNull();
    expect(host.textContent).toContain('aucune preuve officielle');
    expect(host.textContent).not.toContain('REC-2025');
  });

  it('conserve les filtres appliqués dans l’URL', async () => {
    const { fixture, gateway, host, navigate } = await setup({ page: '2', taille: '5' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    const search = host.querySelector<HTMLInputElement>('#member-receipt-search');
    if (!search) throw new Error('Recherche absente');
    search.value = '  DEMO-APERCU  ';
    search.dispatchEvent(new Event('input'));
    const exercise = host.querySelector<HTMLSelectElement>('#member-receipt-exercise');
    if (!exercise) throw new Error('Exercice absent');
    exercise.value = '2025';
    exercise.dispatchEvent(new Event('change'));
    button(host, 'Appliquer')?.click();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: expect.objectContaining({ q: 'DEMO-APERCU', exercice: 2025, page: 1 }),
      queryParamsHandling: 'merge',
    });
  });

  it('distingue aucun résultat, vide, erreur et indisponibilité HTTP', async () => {
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
    expect(filtered.host.textContent).toContain('Aucun aperçu ne correspond');

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
    expect(empty.host.textContent).toContain('Aucun aperçu de reçu');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(button(failed.host, 'Réessayer')).toBeDefined();

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('MP-007'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Reçus indisponibles en mode HTTP');
  });
});
