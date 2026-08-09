import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpPaymentInstructionsGateway } from './http-payment-instructions.gateway';
import { PaymentInstructionsNoMembershipError } from './payment-instructions-gateway';

describe('HttpPaymentInstructionsGateway', () => {
  let gateway: HttpPaymentInstructionsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpPaymentInstructionsGateway,
      ],
    });
    gateway = TestBed.inject(HttpPaymentInstructionsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('charge références validées et comptes actifs depuis /portal/payment-instructions', async () => {
    const result = firstValueFrom(gateway.load());
    const request = http.expectOne((candidate) =>
      candidate.url.endsWith('/portal/payment-instructions'),
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      references: [{ id: 'r1', referenceValue: 'CNPM-COT-2026-000001', exercise: 2026 }],
      collectionAccounts: [
        {
          id: 'a1',
          channel: 'ORANGE_MONEY',
          label: 'Compte principal CNPM',
          accountHolder: 'COGEF',
          accountIdentifier: '+22370000000',
          bankName: null,
          instructions: null,
        },
      ],
    });

    const instructions = await result;
    expect(instructions.references[0].referenceValue).toBe('CNPM-COT-2026-000001');
    expect(instructions.collectionAccounts[0].channel).toBe('ORANGE_MONEY');
  });

  it('traduit un 404 en « aucune adhésion rattachée »', async () => {
    const result = firstValueFrom(gateway.load());
    http.expectOne((candidate) => candidate.url.endsWith('/portal/payment-instructions')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Aucune adhésion n’est rattachée à ce compte.',
        correlationId: '40000000-0000-4000-8000-000000000001',
      },
      { status: 404, statusText: 'Not Found' },
    );
    await expect(result).rejects.toBeInstanceOf(PaymentInstructionsNoMembershipError);
  });
});
