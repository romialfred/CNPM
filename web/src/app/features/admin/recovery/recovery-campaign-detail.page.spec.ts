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
  RECOVERY_GATEWAY,
  RecoveryAccessError,
  type CampaignRow,
  type RecoveryGateway,
  type RecoveryPage,
} from './recovery-gateway';
import { RecoveryCampaignDetailPage } from './recovery-campaign-detail.page';

registerLocaleData(localeFrMl);

const CAMPAIGN: CampaignRow = {
  id: 'CMP-002',
  reference: 'REL-2026-002',
  label: 'Relance J+30 — PME cotisation 2026',
  segment: 'PME',
  scenario: 'Rappel ferme',
  channels: ['SMS'],
  status: 'RUNNING',
  scheduledAt: '2026-07-06T08:30:00+00:00',
  audience: 312,
  sent: 240,
  delivered: 226,
  openable: 0,
  opened: 0,
  exclusions: 27,
  duplicates: 9,
  missingConsents: 6,
  estimatedCost: 24_960,
  dedicatedToLargeContributors: false,
  pledgeCount: 3,
  pledgedAmount: 4_500_000,
};

const PAGE: RecoveryPage = {
  rows: { kind: 'campaigns', items: [CAMPAIGN] },
  totalItems: 1,
  segments: ['PME'],
  overview: {
    campaignsTotal: 1,
    running: 1,
    scheduled: 0,
    drafts: 0,
    audience: 312,
    sent: 240,
    delivered: 226,
    opened: 0,
    deliveryRate: 94.2,
    openRate: null,
    pledgeCount: 3,
    pledgedAmount: 4_500_000,
    conversionRate: 1.3,
    exclusions: 27,
    duplicates: 9,
    missingConsents: 6,
    estimatedCost: 24_960,
    failedDeliveries: 0,
  },
};

class ControllableGateway implements RecoveryGateway {
  readonly calls: Subject<RecoveryPage>[] = [];

  search(): Subject<RecoveryPage> {
    const subject = new Subject<RecoveryPage>();
    this.calls.push(subject);
    return subject;
  }

  get latest(): Subject<RecoveryPage> {
    return this.calls.at(-1)!;
  }
}

async function setup(id = CAMPAIGN.id) {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [RecoveryCampaignDetailPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: LOCALE_ID, useValue: 'fr-ML' },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
      { provide: RECOVERY_GATEWAY, useValue: gateway },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(RecoveryCampaignDetailPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('RecoveryCampaignDetailPage — BO-018', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend audience, contrôles et performance sans action de recouvrement', async () => {
    const { fixture, gateway, host } = await setup();
    expect(host.textContent).toContain('Chargement de la campagne');

    gateway.latest.next(PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (host.textContent ?? '').replaceAll(/\s+/g, ' ');
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(text).toContain('REL-2026-002');
    expect(text).toContain('4 500 000 FCFA');
    expect(text).toContain('Contrôles appliqués');
    expect(text).toContain('Actions de recouvrement non disponibles');
    expect(host.querySelector('.campaign-detail')?.querySelectorAll('button')).toHaveLength(0);
  });

  it('distingue une campagne absente', async () => {
    const { fixture, gateway, host } = await setup('CMP-ABSENTE');
    gateway.latest.next(PAGE);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Campagne introuvable');
  });

  it('distingue refus, contrat indisponible et panne récupérable', async () => {
    const forbidden = await setup();
    forbidden.gateway.latest.error(new RecoveryAccessError());
    await forbidden.fixture.whenStable();
    forbidden.fixture.detectChanges();
    expect(forbidden.host.textContent).toContain('Accès refusé');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('BO-018'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Détail indisponible en mode connecté');

    TestBed.resetTestingModule();
    const failure = await setup();
    failure.gateway.latest.error(new Error('panne'));
    await failure.fixture.whenStable();
    failure.fixture.detectChanges();
    expect(failure.host.textContent).toContain('La campagne n’a pas pu être chargée');
    failure.host.querySelector<HTMLButtonElement>('.campaign-detail button')?.click();
    await failure.fixture.whenStable();
    expect(failure.gateway.calls).toHaveLength(2);
  });
});
