import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpPaymentReferencesGateway } from './http-payment-references.gateway';
import {
  PaymentReferenceConflictError,
  PaymentReferencesAccessError,
} from './payment-references-gateway';

const REFERENCE = {
  id: '10000000-0000-4000-8000-000000000001',
  membershipId: 'b2222222-0000-4000-8000-000000000001',
  membershipNumber: 'COGEF-2022-0001',
  organizationName: 'Société de test',
  referenceValue: 'COGEF-COT-2026-000001',
  exercise: 2026,
  status: 'PENDING_VALIDATION',
  approvedAt: null,
  createdAt: '2026-07-24T00:00:00Z',
};

describe('HttpPaymentReferencesGateway', () => {
  let gateway: HttpPaymentReferencesGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpPaymentReferencesGateway,
      ],
    });
    gateway = TestBed.inject(HttpPaymentReferencesGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('liste les références depuis /payment-references', async () => {
    const result = firstValueFrom(gateway.list());
    const request = http.expectOne((candidate) => candidate.url.endsWith('/payment-references'));
    expect(request.request.method).toBe('GET');
    request.flush({ references: [REFERENCE] });

    const references = await result;
    expect(references).toHaveLength(1);
    expect(references[0].referenceValue).toBe('COGEF-COT-2026-000001');
    expect(references[0].status).toBe('PENDING_VALIDATION');
  });

  it('génère une référence avec une clé d’idempotence', async () => {
    const result = firstValueFrom(
      gateway.generate({ membershipId: REFERENCE.membershipId, exercise: 2026 }),
    );
    const request = http.expectOne((candidate) => candidate.url.endsWith('/payment-references'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBeTruthy();
    request.flush(REFERENCE);
    await result;
  });

  it('traduit un 409 en conflit lors d’une validation', async () => {
    const result = firstValueFrom(gateway.validate(REFERENCE.id));
    http
      .expectOne((candidate) => candidate.url.endsWith(`/payment-references/${REFERENCE.id}/validate`))
      .flush(
        {
          timestamp: '2026-07-24T08:00:00Z',
          status: 409,
          code: 'STATE_CONFLICT',
          message: 'Seule une référence en attente peut être validée.',
          correlationId: '40000000-0000-4000-8000-000000000001',
        },
        { status: 409, statusText: 'Conflict' },
      );
    await expect(result).rejects.toBeInstanceOf(PaymentReferenceConflictError);
  });

  it('traduit un 403 en accès refusé lors d’une révocation', async () => {
    const result = firstValueFrom(gateway.revoke(REFERENCE.id, 'Cotisant radié'));
    http
      .expectOne((candidate) => candidate.url.endsWith(`/payment-references/${REFERENCE.id}/revoke`))
      .flush(
        {
          timestamp: '2026-07-24T08:00:00Z',
          status: 403,
          code: 'FORBIDDEN',
          message: 'Permission insuffisante.',
          correlationId: '40000000-0000-4000-8000-000000000002',
        },
        { status: 403, statusText: 'Forbidden' },
      );
    await expect(result).rejects.toBeInstanceOf(PaymentReferencesAccessError);
  });
});
