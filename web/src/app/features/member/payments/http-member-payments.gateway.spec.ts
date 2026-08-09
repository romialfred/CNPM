import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpMemberPaymentsGateway } from './http-member-payments.gateway';
import { MemberPaymentsNoMembershipError } from './member-payments-gateway';

describe('HttpMemberPaymentsGateway', () => {
  let gateway: HttpMemberPaymentsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberPaymentsGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberPaymentsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('charge l’historique et convertit le montant sans flottant de contrat', async () => {
    const result = firstValueFrom(gateway.list());
    const request = http.expectOne((c) => c.url.endsWith('/portal/payments'));
    expect(request.request.method).toBe('GET');
    request.flush({
      payments: [
        {
          id: 'p1',
          transactionNumber: 'COGEF-PAY-00000001',
          referenceValue: 'COGEF-COT-2026-000001',
          exercise: 2026,
          channel: 'ORANGE_MONEY',
          amount: '150000.00',
          currency: 'XOF',
          paidAt: '2026-07-24T10:00:00Z',
          confirmed: true,
          receiptNumber: 'COGEF-REC-00000001',
        },
      ],
    });

    const payments = await result;
    expect(payments[0].amount).toBe(150000);
    expect(payments[0].confirmed).toBe(true);
    expect(payments[0].receiptNumber).toBe('COGEF-REC-00000001');
  });

  it('traduit un 404 en « aucune adhésion rattachée »', async () => {
    const result = firstValueFrom(gateway.list());
    http.expectOne((c) => c.url.endsWith('/portal/payments')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Aucune adhésion n’est rattachée à ce compte.',
        correlationId: '40000000-0000-4000-8000-000000000001',
      },
      { status: 404, statusText: 'Not Found' },
    );
    await expect(result).rejects.toBeInstanceOf(MemberPaymentsNoMembershipError);
  });
});
