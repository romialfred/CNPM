import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  ENROLLMENTS_GATEWAY,
  EnrollmentAccessError,
  EnrollmentNotFoundError,
  type EnrollmentApplication,
  type EnrollmentPage,
  type EnrollmentsGateway,
} from './enrollments-gateway';
import { EnrollmentReviewPage } from './enrollment-review.page';

const ENROLLMENT_ID = '10000000-0000-4000-8000-000000000001';
const UNDER_REVIEW: EnrollmentApplication = {
  id: ENROLLMENT_ID,
  caseNumber: 'ENR-DEMO-0001',
  organizationId: '20000000-0000-4000-8000-000000000001',
  channel: 'DEMO_ASSISTE',
  status: 'UNDER_REVIEW',
  submittedAt: '2026-07-18T08:15:00Z',
  assignedTo: '90000000-0000-4000-8000-000000000001',
  version: 2,
};

class ControllableGateway implements EnrollmentsGateway {
  readonly loads: Subject<EnrollmentApplication>[] = [];
  readonly startReviewResult = new Subject<EnrollmentApplication>();
  readonly complementResult = new Subject<EnrollmentApplication>();
  readonly approvalResult = new Subject<EnrollmentApplication>();
  readonly rejectionResult = new Subject<EnrollmentApplication>();
  readonly approve = vi.fn(() => this.approvalResult);
  readonly reject = vi.fn(() => this.rejectionResult);
  readonly requestComplement = vi.fn(() => this.complementResult);
  readonly startReview = vi.fn(() => this.startReviewResult);

  list(): Subject<EnrollmentPage> {
    return new Subject<EnrollmentPage>();
  }

  get(): Subject<EnrollmentApplication> {
    const result = new Subject<EnrollmentApplication>();
    this.loads.push(result);
    return result;
  }

  get latestLoad(): Subject<EnrollmentApplication> {
    return this.loads[this.loads.length - 1];
  }
}

function routeStub() {
  const params = convertToParamMap({ id: ENROLLMENT_ID });
  const query = convertToParamMap({ page: '2', size: '10' });
  return {
    paramMap: new BehaviorSubject(params).asObservable(),
    queryParamMap: new BehaviorSubject(query).asObservable(),
    snapshot: { paramMap: params, queryParamMap: query },
  };
}

async function setup(permissions: readonly string[] = ['ENROLLMENT.REVIEW', 'ENROLLMENT.APPROVE']) {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [EnrollmentReviewPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: routeStub() },
      { provide: ENROLLMENTS_GATEWAY, useValue: gateway },
      {
        provide: SESSION_GATEWAY,
        useValue: {
          identity: of({
            displayName: 'Validateur de démonstration',
            roleLabel: 'VALIDATEUR_ENROLEMENT',
            exerciseLabel: null,
            notificationCount: null,
            demoMode: true,
            permissions,
          }),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(EnrollmentReviewPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

function button(host: HTMLElement, label: string): HTMLButtonElement {
  const result = Array.from(host.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(label),
  );
  if (!result) {
    throw new Error(`Bouton introuvable : ${label}`);
  }
  return result;
}

describe('EnrollmentReviewPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('couvre chargement, 403 et 404 sans page blanche', async () => {
    const loading = await setup();
    expect(loading.host.querySelectorAll('.cnpm-skeleton').length).toBe(2);

    loading.gateway.latestLoad.error(new EnrollmentAccessError());
    await loading.fixture.whenStable();
    loading.fixture.detectChanges();
    expect(loading.host.querySelector('.cnpm-error--forbidden')).not.toBeNull();

    TestBed.resetTestingModule();
    const missing = await setup();
    missing.gateway.latestLoad.error(new EnrollmentNotFoundError());
    await missing.fixture.whenStable();
    missing.fixture.detectChanges();
    expect(missing.host.querySelector('.cnpm-error--not-found')).not.toBeNull();
  });

  it('n affiche que des décisions permises par la session informative', async () => {
    const { fixture, gateway, host } = await setup(['ENROLLMENT.REVIEW']);
    gateway.latestLoad.next(UNDER_REVIEW);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Demander un complément');
    expect(host.textContent).not.toContain('Approuver');
    expect(host.textContent).not.toContain('Rejeter');
  });

  it('bloque une approbation vide et focalise un résumé relié aux champs', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latestLoad.next(UNDER_REVIEW);
    await fixture.whenStable();
    fixture.detectChanges();

    button(host, 'Approuver').click();
    fixture.detectChanges();
    button(host, 'Approuver et activer').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.approve).not.toHaveBeenCalled();
    expect(host.querySelector('.cnpm-error-summary')).not.toBeNull();
    expect(host.textContent).toContain('Le numéro d’adhésion est obligatoire');
    expect(host.textContent).toContain('Le code catégorie est obligatoire');
  });

  it('transmet les valeurs explicites du décideur puis affiche l état retourné', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latestLoad.next(UNDER_REVIEW);
    await fixture.whenStable();
    fixture.detectChanges();

    button(host, 'Approuver').click();
    fixture.detectChanges();
    const membership = host.querySelector<HTMLInputElement>('#approval-membership-number');
    const category = host.querySelector<HTMLInputElement>('#approval-category-code');
    if (!membership || !category) {
      throw new Error('Champs d’approbation introuvables');
    }
    membership.value = '  CNPM-DEMO-2026-001  ';
    membership.dispatchEvent(new Event('input'));
    category.value = '  CAT-DEMO  ';
    category.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    button(host, 'Approuver et activer').click();
    expect(gateway.approve).toHaveBeenCalledWith(ENROLLMENT_ID, {
      membershipNumber: 'CNPM-DEMO-2026-001',
      categoryCode: 'CAT-DEMO',
    });

    gateway.approvalResult.next({ ...UNDER_REVIEW, status: 'APPROVED', version: 3 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Action enregistrée');
    expect(host.textContent).toContain('Approuvé');
    expect(host.textContent).toContain('Aucune transition de contrôle');
  });

  it('ne fabrique ni échéance ni nomenclature dans une demande ou un rejet', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latestLoad.next(UNDER_REVIEW);
    await fixture.whenStable();
    fixture.detectChanges();

    button(host, 'Demander un complément').click();
    fixture.detectChanges();
    expect(host.textContent).toContain('Aucune échéance automatique');

    button(host, 'Rejeter').click();
    fixture.detectChanges();
    expect(host.textContent).toContain('Aucune nomenclature officielle de motifs');
  });
});
