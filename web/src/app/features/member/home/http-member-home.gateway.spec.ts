import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpMemberHomeGateway } from './http-member-home.gateway';
import { MemberHomeAccessError, MemberHomeNoMembershipError } from './member-home-gateway';

describe('HttpMemberHomeGateway', () => {
  let gateway: HttpMemberHomeGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberHomeGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberHomeGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('charge le tableau de bord et convertit les montants sans flottant de contrat', async () => {
    const result = firstValueFrom(gateway.load());
    const request = http.expectOne((c) => c.url.endsWith('/portal/dashboard'));
    expect(request.request.method).toBe('GET');
    request.flush({
      identity: {
        organization: 'Sahel Agro',
        memberCode: 'PORTAL-0001',
        category: 'ENTREPRISE',
        status: 'ACTIVE',
        memberSince: '2021-03-15',
      },
      calledTotal: '500000.00',
      settledTotal: '350000.00',
      outstandingTotal: '150000.00',
      overdueAmount: '50000.00',
      nextDueDate: '2026-09-30',
      lastPayment: { amount: '150000.00', currency: 'XOF', paidAt: '2026-07-24T10:00:00Z' },
      paymentCount: 3,
      receiptCount: 2,
      exercises: [{ year: 2026, called: '500000.00', settled: '350000.00', outstanding: '150000.00' }],
    });

    const dashboard = await result;
    expect(dashboard.identity.status).toBe('ACTIVE');
    expect(dashboard.outstandingTotal).toBe(150000);
    expect(dashboard.lastPayment?.amount).toBe(150000);
    expect(dashboard.exercises[0].outstanding).toBe(150000);
  });

  it('normalise un statut d’adhésion inconnu en « dormante »', async () => {
    const result = firstValueFrom(gateway.load());
    http.expectOne((c) => c.url.endsWith('/portal/dashboard')).flush({
      identity: {
        organization: 'Sahel Agro',
        memberCode: 'PORTAL-0001',
        category: 'ENTREPRISE',
        status: 'PENDING',
        memberSince: null,
      },
      calledTotal: '0',
      settledTotal: '0',
      outstandingTotal: '0',
      overdueAmount: '0',
      nextDueDate: null,
      lastPayment: null,
      paymentCount: 0,
      receiptCount: 0,
      exercises: [],
    });
    const dashboard = await result;
    expect(dashboard.identity.status).toBe('DORMANT');
    expect(dashboard.lastPayment).toBeNull();
  });

  it('traduit un 404 en « aucune adhésion » et un 403 en « accès refusé »', async () => {
    const notFound = firstValueFrom(gateway.load());
    http.expectOne((c) => c.url.endsWith('/portal/dashboard')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Aucune adhésion.',
        correlationId: '40000000-0000-4000-8000-000000000003',
      },
      { status: 404, statusText: 'Not Found' },
    );
    await expect(notFound).rejects.toBeInstanceOf(MemberHomeNoMembershipError);

    const forbidden = firstValueFrom(gateway.load());
    http.expectOne((c) => c.url.endsWith('/portal/dashboard')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 403,
        code: 'ACCESS_DENIED',
        message: 'Accès refusé.',
        correlationId: '40000000-0000-4000-8000-000000000004',
      },
      { status: 403, statusText: 'Forbidden' },
    );
    await expect(forbidden).rejects.toBeInstanceOf(MemberHomeAccessError);
  });
});
