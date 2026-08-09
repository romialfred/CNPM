import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpMemberReceiptsGateway } from './http-member-receipts.gateway';
import { MemberReceiptsNoMembershipError } from './member-receipts-gateway';

describe('HttpMemberReceiptsGateway', () => {
  let gateway: HttpMemberReceiptsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberReceiptsGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberReceiptsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('charge les reçus et convertit le montant sans flottant de contrat', async () => {
    const result = firstValueFrom(gateway.list());
    const request = http.expectOne((c) => c.url.endsWith('/portal/receipts'));
    expect(request.request.method).toBe('GET');
    request.flush({
      receipts: [
        {
          id: 'r1',
          receiptNumber: 'COGEF-REC-00000001',
          transactionNumber: 'COGEF-PAY-00000001',
          referenceValue: 'COGEF-COT-2026-000001',
          exercise: 2026,
          channel: 'ORANGE_MONEY',
          amount: '150000.00',
          currency: 'XOF',
          paidAt: '2026-07-24T10:00:00Z',
          issuedAt: '2026-07-25T09:00:00Z',
          status: 'ISSUED',
        },
      ],
    });

    const receipts = await result;
    expect(receipts[0].amount).toBe(150000);
    expect(receipts[0].receiptNumber).toBe('COGEF-REC-00000001');
    expect(receipts[0].status).toBe('ISSUED');
  });

  it('traduit un 404 en « aucune adhésion rattachée »', async () => {
    const result = firstValueFrom(gateway.list());
    http.expectOne((c) => c.url.endsWith('/portal/receipts')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Aucune adhésion n’est rattachée à ce compte.',
        correlationId: '40000000-0000-4000-8000-000000000002',
      },
      { status: 404, statusText: 'Not Found' },
    );
    await expect(result).rejects.toBeInstanceOf(MemberReceiptsNoMembershipError);
  });
});
