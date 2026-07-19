import { registerLocaleData } from '@angular/common';
import localeFrMl from '@angular/common/locales/fr-ML';
import { LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  CONTRIBUTIONS_GATEWAY,
  ContributionsAccessError,
  type ContributionCallsPage,
  type ContributionsGateway,
} from './contributions-gateway';
import { ContributionDetailPage } from './contribution-detail.page';

registerLocaleData(localeFrMl);

const CALL = {
  id: 'call-0001',
  reference: 'APP-2024-T1-0001',
  memberCode: 'MBR-0101',
  memberName: 'Sahel Agro SA',
  fiscalYear: '2024',
  quarter: 'T1' as const,
  calledAmount: 12_500_000,
  paidAmount: 12_000_000,
  adjustmentAmount: 250_000,
  outstandingAmount: 250_000,
  dueDate: '2024-03-31',
  pastDue: true,
  status: 'OVERDUE' as const,
};

const PAGE: ContributionCallsPage = {
  rows: [CALL],
  totalItems: 1,
  overview: {
    callsIssued: 1,
    calledTotal: CALL.calledAmount,
    collectedTotal: CALL.paidAmount,
    outstandingTotal: CALL.outstandingAmount,
    recoveryRate: 96,
  },
  fiscalYears: ['2024'],
  asOf: '2024-06-30',
};

class ControllableGateway implements ContributionsGateway {
  readonly calls: Subject<ContributionCallsPage>[] = [];

  searchCalls(): Subject<ContributionCallsPage> {
    const subject = new Subject<ContributionCallsPage>();
    this.calls.push(subject);
    return subject;
  }

  get latest(): Subject<ContributionCallsPage> {
    return this.calls.at(-1)!;
  }
}

async function setup(id = CALL.id) {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [ContributionDetailPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: LOCALE_ID, useValue: 'fr-ML' },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
      },
      { provide: CONTRIBUTIONS_GATEWAY, useValue: gateway },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ContributionDetailPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('ContributionDetailPage — BO-013', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend une fiche cohérente sans action financière', async () => {
    const { fixture, gateway, host } = await setup();
    expect(host.textContent).toContain('Chargement de la cotisation');

    gateway.latest.next(PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (host.textContent ?? '').replaceAll(/\s+/g, ' ');
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(text).toContain('APP-2024-T1-0001');
    expect(text).toContain('12 500 000');
    expect(text).toContain('appelé =');
    expect(text).toContain('Actions financières non disponibles');
    expect(host.querySelector('.contribution-detail')?.querySelectorAll('button')).toHaveLength(0);
    expect(host.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('98');
  });

  it('distingue une référence absente', async () => {
    const { fixture, gateway, host } = await setup('call-absent');
    gateway.latest.next(PAGE);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Cotisation introuvable');
  });

  it('distingue refus, contrat HTTP indisponible et erreur récupérable', async () => {
    const forbidden = await setup();
    forbidden.gateway.latest.error(new ContributionsAccessError());
    await forbidden.fixture.whenStable();
    forbidden.fixture.detectChanges();
    expect(forbidden.host.textContent).toContain('Accès refusé');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('BO-013'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Détail indisponible en mode connecté');

    TestBed.resetTestingModule();
    const failure = await setup();
    failure.gateway.latest.error(new Error('panne'));
    await failure.fixture.whenStable();
    failure.fixture.detectChanges();
    expect(failure.host.textContent).toContain('La cotisation n’a pas pu être chargée');
    failure.host.querySelector<HTMLButtonElement>('.contribution-detail button')?.click();
    await failure.fixture.whenStable();
    expect(failure.gateway.calls).toHaveLength(2);
  });
});
