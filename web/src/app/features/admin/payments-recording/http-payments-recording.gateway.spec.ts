import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpPaymentsRecordingGateway } from './http-payments-recording.gateway';
import { PaymentsRecordingConflictError } from './payments-recording-gateway';

const PAYMENT = {
  id: 'p1',
  transactionNumber: 'CNPM-PAY-00000001',
  referenceValue: 'CNPM-COT-2026-000001',
  membershipNumber: 'CNPM-2022-0001',
  organizationName: 'Société de test',
  channel: 'ORANGE_MONEY',
  amount: '150000.00',
  currency: 'XOF',
  paidAt: '2026-07-24T10:00:00Z',
  status: 'RECEIVED',
};

describe('HttpPaymentsRecordingGateway', () => {
  let gateway: HttpPaymentsRecordingGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpPaymentsRecordingGateway,
      ],
    });
    gateway = TestBed.inject(HttpPaymentsRecordingGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('convertit le montant décimal du contrat sans le faire transiter par un flottant', async () => {
    const result = firstValueFrom(gateway.list());
    const request = http.expectOne((candidate) => candidate.url.endsWith('/payments'));
    expect(request.request.method).toBe('GET');
    request.flush({ payments: [PAYMENT] });

    const payments = await result;
    expect(payments[0].amount).toBe(150000);
    expect(payments[0].organizationName).toBe('Société de test');
  });

  it('enregistre un encaissement avec une clé d’idempotence', async () => {
    const result = firstValueFrom(
      gateway.record({ referenceId: 'ref-1', channel: 'ORANGE_MONEY', amount: '150000.00' }),
    );
    const request = http.expectOne((candidate) => candidate.url.endsWith('/payments'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBeTruthy();
    request.flush(PAYMENT);
    await result;
  });

  it('confirme un encaissement et récupère le reçu et son jeton', async () => {
    const result = firstValueFrom(gateway.confirm('tx-1'));
    const request = http.expectOne((candidate) => candidate.url.endsWith('/payments/tx-1/confirm'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBeTruthy();
    request.flush({
      receipt: { id: 'r1', receiptNumber: 'CNPM-REC-00000001' },
      verificationToken: 'abcdef0123456789',
      created: true,
    });

    const confirmation = await result;
    expect(confirmation.receiptNumber).toBe('CNPM-REC-00000001');
    expect(confirmation.verificationToken).toBe('abcdef0123456789');
  });

  it('traduit un 409 en conflit d’état de la référence', async () => {
    const result = firstValueFrom(
      gateway.record({ referenceId: 'ref-1', channel: 'WAVE', amount: '1000.00' }),
    );
    http.expectOne((candidate) => candidate.url.endsWith('/payments')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 409,
        code: 'STATE_CONFLICT',
        message: 'Un encaissement ne peut être enregistré que contre une référence validée.',
        correlationId: '40000000-0000-4000-8000-000000000001',
      },
      { status: 409, statusText: 'Conflict' },
    );
    await expect(result).rejects.toBeInstanceOf(PaymentsRecordingConflictError);
  });
});
