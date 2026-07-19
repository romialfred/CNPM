import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  ENROLLMENTS_GATEWAY,
  EnrollmentAccessError,
  type EnrollmentPage,
  type EnrollmentPageQuery,
  type EnrollmentsGateway,
} from './enrollments-gateway';
import { EnrollmentsPage } from './enrollments.page';

class ControllableGateway implements Pick<EnrollmentsGateway, 'list'> {
  readonly calls: { query: EnrollmentPageQuery; result: Subject<EnrollmentPage> }[] = [];

  list(query: EnrollmentPageQuery): Subject<EnrollmentPage> {
    const result = new Subject<EnrollmentPage>();
    this.calls.push({ query, result });
    return result;
  }

  get latest(): Subject<EnrollmentPage> {
    return this.calls[this.calls.length - 1].result;
  }
}

function routeStub(values: Record<string, string> = {}) {
  const query = convertToParamMap(values);
  return {
    queryParamMap: new BehaviorSubject(query).asObservable(),
    snapshot: { queryParamMap: query },
  };
}

async function setup(query: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [EnrollmentsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: routeStub(query) },
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
            permissions: ['ENROLLMENT.CREATE', 'ENROLLMENT.REVIEW', 'ENROLLMENT.APPROVE'],
          }),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(EnrollmentsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return {
    fixture,
    gateway,
    host: fixture.nativeElement as HTMLElement,
    router: TestBed.inject(Router),
  };
}

describe('EnrollmentsPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit page et size dans l URL et affiche un squelette fidèle', async () => {
    const { gateway, host } = await setup({ page: '2', size: '50' });
    expect(gateway.calls[0].query).toEqual({ page: 2, pageSize: 50 });
    expect(host.querySelector('.cnpm-skeleton--table')).not.toBeNull();
  });

  it('distingue une collection vide d une panne récupérable', async () => {
    const empty = await setup();
    empty.gateway.latest.next({ rows: [], totalItems: 0, totalPages: 0 });
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun dossier d’enrôlement');

    TestBed.resetTestingModule();
    const failure = await setup();
    failure.gateway.latest.error(new Error('panne'));
    await failure.fixture.whenStable();
    failure.fixture.detectChanges();
    expect(failure.host.querySelector('.cnpm-error--recoverable')).not.toBeNull();
    expect(failure.host.textContent).toContain('Réessayer');
  });

  it('rend un 403 sans proposer une relance inutile', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new EnrollmentAccessError());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.querySelector('.cnpm-error--forbidden')).not.toBeNull();
    expect(host.textContent).not.toContain('Réessayer');
  });

  it('ouvre BO-010 en préservant le contexte page et size', async () => {
    const { fixture, gateway, host, router } = await setup({ page: '2', size: '10' });
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    gateway.latest.next({
      rows: [
        {
          id: '10000000-0000-4000-8000-000000000001',
          caseNumber: 'ENR-DEMO-0001',
          organizationId: '20000000-0000-4000-8000-000000000001',
          channel: 'DEMO',
          status: 'SUBMITTED',
          submittedAt: '2026-07-18T08:15:00Z',
          assignedTo: null,
          version: 1,
        },
      ],
      totalItems: 1,
      totalPages: 1,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const mobileCards = host.querySelector('.cnpm-enrollments__cards');
    expect(mobileCards).not.toBeNull();
    expect(mobileCards?.textContent).toContain('ENR-DEMO-0001');
    expect(mobileCards?.textContent).toContain('20000000-0000-4000-8000-000000000001');

    const button = mobileCards?.querySelector('button');
    button?.click();

    expect(navigate).toHaveBeenCalledWith(
      ['/admin/enrollments', '10000000-0000-4000-8000-000000000001', 'review'],
      { queryParamsHandling: 'preserve' },
    );
  });
});
