import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE } from '../../../../core/api/api.config';
import { SESSION_GATEWAY } from '../../../../layout/admin-shell/session-gateway';
import {
  RECOVERY_GATEWAY,
  type RecoveryGateway,
  type RecoveryPortfolioCase,
  type RecoveryPortfolioPage as RecoveryPortfolioPageData,
} from '../recovery-gateway';
import { RecoveryPortfolioPage } from './recovery-portfolio.page';

const CASES: readonly RecoveryPortfolioCase[] = [
  {
    id: 'demo-recovery-case-0001',
    reference: 'DEMO-DOSSIER-0001',
    memberCode: 'DEMO-MEMBRE-0001',
    organization: 'Organisation Démo Alpha',
    agentLabel: 'Agent Démo Recouvrement',
    segment: 'Retard 31–60 jours',
    campaignReference: 'DEMO-CAMP-0001',
    campaignLabel: 'Campagne Démo Alpha',
    status: 'ACTIVE',
    outstandingAmount: 1_250_000,
    daysOverdue: 45,
    nextActionKind: 'EMAIL',
    nextActionAt: '2026-07-19T08:30:00Z',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'AUTHORIZED_DEMO',
    suspension: null,
    promise: null,
    calendarBucket: 'Aujourd’hui',
  },
  {
    id: 'demo-recovery-case-0002',
    reference: 'DEMO-DOSSIER-0002',
    memberCode: 'DEMO-MEMBRE-0002',
    organization: 'Organisation Démo Bêta',
    agentLabel: 'Agent Démo Recouvrement',
    segment: 'Promesse active',
    campaignReference: 'DEMO-CAMP-0002',
    campaignLabel: 'Campagne Démo Bêta',
    status: 'SUSPENDED',
    outstandingAmount: 250_000,
    daysOverdue: 15,
    nextActionKind: 'MEETING',
    nextActionAt: '2026-07-20T10:00:00Z',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'NOT_APPLICABLE',
    suspension: {
      kind: 'PROMISE',
      suspendedAt: '2026-07-18T09:00:00Z',
      reasonLabel: 'Promesse active — suivi suspendu',
    },
    promise: {
      amount: 250_000,
      dueDate: '2026-07-25',
      comment: 'Promesse fictive de démonstration.',
      status: 'PENDING',
    },
    calendarBucket: 'Suivi suspendu',
  },
];

const DATA: RecoveryPortfolioPageData = {
  items: CASES,
  totalItems: CASES.length,
  segments: ['Promesse active', 'Retard 31–60 jours'],
  overview: {
    assignedCases: 2,
    activeCases: 1,
    suspendedCases: 1,
    activePromises: 1,
    outstandingAmount: 1_500_000,
    contactRate: 42.5,
    conversionRate: 18.75,
    recoveredAmount: 1_250_000,
    estimatedCost: 18_500,
    averageDelayDays: 4.2,
  },
};

const gateway = (load = () => of(DATA)): RecoveryGateway => ({
  search: () => NEVER,
  searchPortfolio: load,
});

async function setup(
  recoveryGateway: RecoveryGateway = gateway(),
  initialUrl = '/',
): Promise<{ fixture: ComponentFixture<RecoveryPortfolioPage>; router: Router }> {
  await TestBed.configureTestingModule({
    imports: [RecoveryPortfolioPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: RECOVERY_GATEWAY, useValue: recoveryGateway },
      { provide: CNPM_DATA_MODE, useValue: 'demo' },
      { provide: SESSION_GATEWAY, useValue: { identity: of(null) } },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  await router.navigateByUrl(initialUrl);
  const fixture = TestBed.createComponent(RecoveryPortfolioPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, router };
}

describe('RecoveryPortfolioPage — BO-020', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend le portefeuille consultatif et les métriques REL-007 sans score', async () => {
    const { fixture } = await setup(gateway(), '/?selection=demo-recovery-case-0002');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Organisation Démo Bêta');
    expect(root.textContent).toContain('Taux de contact');
    expect(root.textContent).toContain('Promesse fictive de démonstration.');
    expect(root.textContent).toContain('aucun score ne sanctionne ni ne classe un membre');
    expect(root.querySelectorAll('[data-score]')).toHaveLength(0);
    expect(root.querySelectorAll('.recovery-portfolio-page__locked-actions button')).toHaveLength(
      4,
    );
    expect(
      root.querySelectorAll(
        '.recovery-portfolio-page__locked-actions button[aria-disabled="true"]',
      ),
    ).toHaveLength(4);
    expect(root.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]')).toHaveLength(0);
  });

  it('focalise le détail et applique ensemble les filtres dans l’URL', async () => {
    const { fixture, router } = await setup();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    [...buttons].find((button) => button.textContent?.includes('Examiner'))?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).toContain('selection=demo-recovery-case-0001');
    expect((fixture.nativeElement as HTMLElement).ownerDocument.activeElement?.id).toBe(
      'recovery-portfolio-detail-title',
    );

    const segment = fixture.nativeElement.querySelector(
      '#recovery-portfolio-segment',
    ) as HTMLSelectElement;
    segment.value = 'Promesse active';
    segment.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).not.toContain('segment=Promesse%20active');

    [...(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)]
      .find((button) => button.textContent?.includes('Appliquer'))
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).toContain('segment=Promesse%20active');
    expect(router.url).not.toContain('selection=');
  });

  it('ramène une page hors plage sur la dernière page disponible', async () => {
    const { fixture, router } = await setup(gateway(), '/?page=99');

    expect(router.url).not.toContain('page=99');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Organisation Démo Alpha');
  });

  it('rend chargement, vide, erreur et indisponibilité HTTP', async () => {
    const loading = await setup(gateway(() => NEVER));
    expect(loading.fixture.nativeElement.textContent).toContain('Chargement du portefeuille');
    TestBed.resetTestingModule();

    const empty = await setup(gateway(() => of({ ...DATA, items: [], totalItems: 0 })));
    expect(empty.fixture.nativeElement.textContent).toContain('Aucun dossier fictif affecté');
    TestBed.resetTestingModule();

    const error = await setup(gateway(() => throwError(() => new Error('temporaire'))));
    expect(error.fixture.nativeElement.textContent).toContain('n’a pas pu être chargé');
    TestBed.resetTestingModule();

    const unavailable = await setup({ search: () => NEVER });
    expect(unavailable.fixture.nativeElement.textContent).toContain(
      'Portefeuille indisponible en mode HTTP',
    );
  });
});
