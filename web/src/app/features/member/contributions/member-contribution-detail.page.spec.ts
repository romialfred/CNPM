import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { MemberContributionDetailPage } from './member-contribution-detail.page';
import {
  MEMBER_CONTRIBUTIONS_GATEWAY,
  MemberContributionNotFoundError,
  type MemberContributionDetail,
  type MemberContributionPage,
  type MemberContributionsGateway,
} from './member-contributions-gateway';

const DETAIL: MemberContributionDetail = {
  id: 'demo-contribution-2026-01',
  reference: 'DEMO-COT-2026-001',
  exercise: 2026,
  issuedOn: '2026-01-15',
  dueDate: '2026-09-30',
  calledAmount: 180000,
  paidAmount: 60000,
  outstandingAmount: 120000,
  currency: 'XOF',
  status: 'PARTIELLE',
  amountOriginNote: 'Valeur fictive fournie sans aucun calcul réglementaire.',
  adjustments: [
    {
      reference: 'DEMO-AJ-2026-001',
      direction: 'CREDIT',
      amount: 15000,
      currency: 'XOF',
      reason: 'Ajustement fictif expliqué',
      recordedOn: '2026-02-03',
    },
  ],
  schedule: [
    {
      id: 'demo-installment-01',
      label: 'Échéance fictive 1 sur 1',
      dueDate: '2026-09-30',
      expectedAmount: 180000,
      paidAmount: 60000,
      outstandingAmount: 120000,
      currency: 'XOF',
      status: 'PARTIELLE',
    },
  ],
};

class ActivatedRouteStub {
  private readonly params = new BehaviorSubject(convertToParamMap({ id: DETAIL.id }));
  private readonly queries = new BehaviorSubject(convertToParamMap({ page: '2', taille: '3' }));
  readonly paramMap = this.params.asObservable();
  readonly queryParamMap = this.queries.asObservable();
  readonly snapshot = { paramMap: this.params.value, queryParamMap: this.queries.value };
}

class ControllableGateway implements MemberContributionsGateway {
  readonly response = new Subject<MemberContributionDetail>();
  loadedId = '';

  list(): Subject<MemberContributionPage> {
    return new Subject<MemberContributionPage>();
  }

  loadDetail(id: string): Subject<MemberContributionDetail> {
    this.loadedId = id;
    return this.response;
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [MemberContributionDetailPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useClass: ActivatedRouteStub },
      { provide: MEMBER_CONTRIBUTIONS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(MemberContributionDetailPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('MemberContributionDetailPage — MP-003', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('charge l’identifiant de route et conserve la requête de retour', async () => {
    const { gateway, host } = await setup();
    expect(gateway.loadedId).toBe(DETAIL.id);
    expect(host.textContent).toContain('Chargement de la cotisation fictive');
    expect(
      host.querySelector<HTMLAnchorElement>('.member-contribution-detail__back')?.href,
    ).toContain('page=2');
  });

  it('rend le détail, l’échéancier et les ajustements fournis sans recalcul officiel', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.response.next(DETAIL);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.textContent).toContain(DETAIL.reference);
    expect(host.textContent).toContain('Origine du montant');
    expect(host.textContent).toContain('Ajustement fictif expliqué');
    expect(host.textContent).toContain('Échéance fictive 1 sur 1');
    expect(host.querySelectorAll('table caption')).toHaveLength(2);
    expect(host.querySelector('.member-contribution-detail__cards article dl')).not.toBeNull();
    expect(host.textContent).toContain('ne sont pas recomposées');
    expect(host.textContent).not.toMatch(/taux de|tranche de|catégorie tarifaire/i);
  });

  it('laisse les actions sensibles focalisables mais neutralisées et documentées', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.response.next(DETAIL);
    await fixture.whenStable();
    fixture.detectChanges();

    const actions = Array.from(
      host.querySelectorAll<HTMLButtonElement>('.member-contribution-detail__actions button'),
    );
    expect(actions).toHaveLength(2);
    expect(actions.map((action) => action.getAttribute('aria-disabled'))).toEqual(['true', 'true']);
    expect(actions[0].getAttribute('aria-describedby')).toBe('document-unavailable-reason');
    expect(host.textContent).toContain('DEC-008');
    expect(host.textContent).toContain('DEC-005');
  });

  it('distingue une référence absente d’une erreur récupérable', async () => {
    const missing = await setup();
    missing.gateway.response.error(new MemberContributionNotFoundError('absente'));
    await missing.fixture.whenStable();
    missing.fixture.detectChanges();
    expect(missing.host.textContent).toContain('Cotisation introuvable');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.response.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('Le détail n’a pas pu être chargé');
    expect(failed.host.textContent).toContain('Réessayer');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.response.error(new UnavailableHttpFeatureError('MP-003'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Détail temporairement indisponible');
  });
});
