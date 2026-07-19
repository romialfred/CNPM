import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  RECEIPTS_GATEWAY,
  ReceiptAccessError,
  type ReceiptRegistryPage,
  type ReceiptRegistryRow,
  type ReceiptsGateway,
} from './receipts-gateway';
import { ReceiptsPage } from './receipts.page';

const ROW: ReceiptRegistryRow = {
  id: '60000000-0000-4000-8000-000000000001',
  demonstrationReference: 'CNPM-REC-TEST-0001',
  memberCode: 'MEM-2024-TEST',
  memberLabel: 'Entreprise Test',
  amount: 750_000,
  period: '2024-T1',
  channel: 'BANK_TRANSFER',
  issuedAt: '2024-03-10T10:00:00Z',
  status: 'ISSUED',
  paymentReference: 'PAY-CNPM-TEST-0001',
  paymentConfirmedAt: '2024-03-10T08:00:00Z',
  sourcePaymentStatus: 'CONFIRMED',
  supersedesReference: null,
  replacedByReference: null,
  deliveryState: 'NOT_SIMULATED',
};

const PAGE: ReceiptRegistryPage = {
  rows: [ROW],
  totalItems: 1,
  overview: { totalRecords: 1, issuedCount: 1, cancelledCount: 0, totalAmount: ROW.amount },
};

class ReceiptsStub implements ReceiptsGateway {
  readonly searches: Subject<ReceiptRegistryPage>[] = [];

  search(): Observable<ReceiptRegistryPage> {
    const subject = new Subject<ReceiptRegistryPage>();
    this.searches.push(subject);
    return subject;
  }
}

function activatedRoute(queryParams: Record<string, string> = {}) {
  const query = new BehaviorSubject(convertToParamMap(queryParams));
  return {
    queryParamMap: query.asObservable(),
    snapshot: { queryParamMap: query.value },
  };
}

async function setup(query: Record<string, string> = {}) {
  const gateway = new ReceiptsStub();
  await TestBed.configureTestingModule({
    imports: [ReceiptsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: CNPM_DATA_MODE, useValue: 'demo' },
      { provide: ActivatedRoute, useValue: activatedRoute(query) },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      { provide: RECEIPTS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ReceiptsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('BO-016 — registre des reçus', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend le chargement puis les métadonnées du port sans action officielle', async () => {
    const { fixture, gateway, host } = await setup();
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();

    gateway.searches[0].next(PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain(ROW.demonstrationReference);
    expect(host.textContent).toContain('1 enregistrement trouvé');
    expect(host.querySelector('table caption')?.textContent).toContain('Registre des reçus');
    expect(host.querySelector('a[download]')).toBeNull();
    expect(host.textContent).not.toContain('Émettre un reçu');
  });

  it.each([
    { label: 'empty', query: {}, error: null, expected: 'Aucun enregistrement accessible' },
    {
      label: 'no-result',
      query: { q: 'absent' },
      error: null,
      expected: 'Aucun enregistrement ne correspond',
    },
    {
      label: 'error',
      query: {},
      error: new Error('panne'),
      expected: 'Le registre n’a pas pu être chargé',
    },
    {
      label: 'forbidden',
      query: {},
      error: new ReceiptAccessError(),
      expected: 'Accès refusé au registre',
    },
    {
      label: 'unavailable',
      query: {},
      error: new UnavailableHttpFeatureError('BO-016'),
      expected: 'Registre indisponible en mode HTTP',
    },
  ])('rend l’état $label', async ({ query, error, expected }) => {
    const { fixture, gateway, host } = await setup(query as Record<string, string>);
    if (error) gateway.searches[0].error(error);
    else
      gateway.searches[0].next({
        rows: [],
        totalItems: 0,
        overview: { totalRecords: 0, issuedCount: 0, cancelledCount: 0, totalAmount: 0 },
      });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain(expected);
  });
});
