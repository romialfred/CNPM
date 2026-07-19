import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE } from '../../../../core/api/api.config';
import { SESSION_GATEWAY } from '../../../../layout/admin-shell/session-gateway';
import {
  RECOVERY_GATEWAY,
  type RecoveryActionRow,
  type RecoveryActionsPage as RecoveryActionsPageData,
  type RecoveryGateway,
} from '../recovery-gateway';
import { RecoveryActionsPage } from './recovery-actions.page';

const ACTIONS: readonly RecoveryActionRow[] = [
  {
    id: 'demo-recovery-action-0001',
    reference: 'CNPM-ACTION-0001',
    memberCode: 'CNPM-MEMBRE-0001',
    organization: 'Organisation Alpha',
    agentLabel: 'Agent de recouvrement',
    kind: 'EMAIL',
    status: 'DUE_TODAY',
    scheduledAt: '2026-07-19T08:30:00Z',
    campaignReference: 'CNPM-CAMP-0001',
    campaignLabel: 'Campagne Alpha',
    segment: 'Retard 31–60 jours',
    contactDisclosure: 'Contact masqué',
    communicationAuthorization: 'AUTHORIZED_DEMO',
    suspension: null,
    promise: null,
    executionAvailable: false,
  },
  {
    id: 'demo-recovery-action-0002',
    reference: 'CNPM-ACTION-0002',
    memberCode: 'CNPM-MEMBRE-0002',
    organization: 'Organisation Bêta',
    agentLabel: 'Agent de recouvrement',
    kind: 'MEETING',
    status: 'SUSPENDED',
    scheduledAt: '2026-07-20T10:00:00Z',
    campaignReference: 'CNPM-CAMP-0002',
    campaignLabel: 'Campagne Bêta',
    segment: 'Promesse active',
    contactDisclosure: 'Contact masqué',
    communicationAuthorization: 'NOT_APPLICABLE',
    suspension: {
      kind: 'PROMISE',
      suspendedAt: '2026-07-18T09:00:00Z',
      reasonLabel: 'Promesse active — relance suspendue',
    },
    promise: {
      amount: 250_000,
      dueDate: '2026-07-25',
      comment: 'Promesse consignée au dossier.',
      status: 'PENDING',
    },
    executionAvailable: false,
  },
];

const DATA: RecoveryActionsPageData = {
  items: ACTIONS,
  totalItems: ACTIONS.length,
  overview: { total: 2, dueToday: 1, overdue: 0, suspended: 1, blockedNoConsent: 0 },
};

const gateway = (load = () => of(DATA)): RecoveryGateway => ({
  search: () => NEVER,
  searchActions: load,
});

async function setup(
  recoveryGateway: RecoveryGateway = gateway(),
  initialUrl = '/',
): Promise<{ fixture: ComponentFixture<RecoveryActionsPage>; router: Router }> {
  await TestBed.configureTestingModule({
    imports: [RecoveryActionsPage],
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
  const fixture = TestBed.createComponent(RecoveryActionsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, router };
}

describe('RecoveryActionsPage — BO-019', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend uniquement une consultation aux contacts masqués', async () => {
    const { fixture } = await setup(gateway(), '/?selection=demo-recovery-action-0002');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Organisation Bêta');
    expect(root.textContent).toContain('Contact masqué');
    expect(root.textContent).toContain('Promesse consignée au dossier.');
    expect(root.querySelectorAll('.recovery-actions-page__locked-actions button')).toHaveLength(4);
    expect(
      root.querySelectorAll('.recovery-actions-page__locked-actions button[aria-disabled="true"]'),
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
    expect(router.url).toContain('selection=demo-recovery-action-0001');
    expect((fixture.nativeElement as HTMLElement).ownerDocument.activeElement?.id).toBe(
      'recovery-action-detail-title',
    );

    const status = fixture.nativeElement.querySelector(
      '#recovery-action-status',
    ) as HTMLSelectElement;
    status.value = 'SUSPENDED';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).not.toContain('statut=SUSPENDED');

    [...(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)]
      .find((button) => button.textContent?.includes('Appliquer'))
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).toContain('statut=SUSPENDED');
    expect(router.url).not.toContain('selection=');
  });

  it('ramène une page hors plage sur la dernière page disponible', async () => {
    const { fixture, router } = await setup(gateway(), '/?page=99');

    expect(router.url).not.toContain('page=99');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Organisation Alpha');
  });

  it('rend chargement, vide, erreur et indisponibilité HTTP', async () => {
    const loading = await setup(gateway(() => NEVER));
    expect(loading.fixture.nativeElement.textContent).toContain('Chargement de la file');
    TestBed.resetTestingModule();

    const empty = await setup(gateway(() => of({ ...DATA, items: [], totalItems: 0 })));
    expect(empty.fixture.nativeElement.textContent).toContain('Aucune action dans la file');
    TestBed.resetTestingModule();

    const error = await setup(gateway(() => throwError(() => new Error('temporaire'))));
    expect(error.fixture.nativeElement.textContent).toContain('n’a pas pu être chargée');
    TestBed.resetTestingModule();

    const unavailable = await setup({ search: () => NEVER });
    expect(unavailable.fixture.nativeElement.textContent).toContain(
      'File indisponible',
    );
  });
});
