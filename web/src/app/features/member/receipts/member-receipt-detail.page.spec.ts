import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_RECEIPTS_GATEWAY,
  MemberReceiptNotFoundError,
  type MemberReceiptDetail,
  type MemberReceiptPage,
  type MemberReceiptsGateway,
} from './member-receipts-gateway';
import { MemberReceiptDetailPage } from './member-receipt-detail.page';

const DETAIL: MemberReceiptDetail = {
  id: 'demo-receipt-preview-2026-001',
  reference: 'DEMO-APERCU-2026-001',
  periodLabel: 'Période fictive 2026',
  amountXof: 150000,
  scenarioDate: '2026-06-18',
  status: 'DEMONSTRATION_AVAILABLE',
  sourceDisclosure: 'Source : scénario fictif local. Aucune donnée ne provient du CNPM.',
  paymentDisclosure: 'Aucune transaction ni confirmation CNPM ne sont reproduites.',
  proofDisclosure: 'Aucun PDF, QR, cachet ou signature n’est généré.',
};

class ActivatedRouteStub {
  private readonly params = new BehaviorSubject(convertToParamMap({ id: DETAIL.id }));
  private readonly queries = new BehaviorSubject(convertToParamMap({ q: '2026', taille: '5' }));
  readonly paramMap = this.params.asObservable();
  readonly queryParamMap = this.queries.asObservable();
  readonly snapshot = { paramMap: this.params.value, queryParamMap: this.queries.value };
}

class ControllableGateway implements MemberReceiptsGateway {
  readonly response = new Subject<MemberReceiptDetail>();
  loadedId = '';

  list(): Subject<MemberReceiptPage> {
    return new Subject<MemberReceiptPage>();
  }

  loadDetail(id: string): Subject<MemberReceiptDetail> {
    this.loadedId = id;
    return this.response;
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [MemberReceiptDetailPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useClass: ActivatedRouteStub },
      { provide: MEMBER_RECEIPTS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(MemberReceiptDetailPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('MemberReceiptDetailPage — MP-008', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('charge l’identifiant et conserve la requête de retour', async () => {
    const { gateway, host } = await setup();
    expect(gateway.loadedId).toBe(DETAIL.id);
    expect(host.textContent).toContain('Chargement de l’aperçu du reçu');
    const back = host.querySelector<HTMLAnchorElement>('.member-receipt-detail__back');
    expect(back?.href).toContain('q=2026');
    expect(back?.href).toContain('taille=5');
  });

  it('rend un résumé textuel fictif et les disclosures de provenance', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.response.next(DETAIL);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.textContent).toContain('APERÇU DE DÉMONSTRATION');
    expect(host.textContent).toContain(DETAIL.reference);
    expect(host.textContent).toMatch(/150(?:,|\s)000 FCFA/);
    expect(host.textContent).toContain('Source : scénario fictif local');
    expect(host.textContent).toContain('Aucun PDF, QR, cachet ou signature');
  });

  it('n’expose aucune action ni actif de preuve officielle', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.response.next(DETAIL);
    await fixture.whenStable();
    fixture.detectChanges();

    const actions = Array.from(host.querySelectorAll('button, a')).map((item) =>
      item.textContent?.trim(),
    );
    expect(actions).not.toEqual(
      expect.arrayContaining(['Télécharger', 'Partager', 'Émettre', 'Vérifier']),
    );
    expect(host.querySelector('[data-qr], .qr-code, .signature, .stamp')).toBeNull();
  });

  it('distingue absence, erreur et indisponibilité HTTP', async () => {
    const missing = await setup();
    missing.gateway.response.error(new MemberReceiptNotFoundError(DETAIL.id));
    await missing.fixture.whenStable();
    missing.fixture.detectChanges();
    expect(missing.host.textContent).toContain('Aperçu introuvable');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.response.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('L’aperçu n’a pas pu être chargé');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.response.error(new UnavailableHttpFeatureError('MP-008'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Aperçu indisponible en mode HTTP');
  });
});
