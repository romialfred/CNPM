import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, tap, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import {
  PaymentsRecordingAccessError,
  PaymentsRecordingAuthenticationError,
  PaymentsRecordingConflictError,
  PaymentsRecordingValidationError,
  type PaymentsRecordingGateway,
  type RecordedPayment,
  type RecordPaymentInput,
} from './payments-recording-gateway';

interface PaymentResponse {
  readonly id: string;
  readonly transactionNumber: string;
  readonly referenceValue?: string | null;
  readonly membershipNumber?: string | null;
  readonly organizationName?: string | null;
  readonly channel: RecordedPayment['channel'];
  readonly amount: string;
  readonly currency: string;
  readonly paidAt?: string | null;
  readonly status: string;
}

interface PaymentListResponse {
  readonly payments: readonly PaymentResponse[];
}

/** Adaptateur HTTP des encaissements, sans repli vers des données locales. */
@Injectable()
export class HttpPaymentsRecordingGateway implements PaymentsRecordingGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly idempotencyKeys = inject(IdempotencyKeyService);

  list(): Observable<readonly RecordedPayment[]> {
    return this.http.get<PaymentListResponse>(this.collectionUrl()).pipe(
      map((response) => response.payments.map(mapPayment)),
      catchError((error: unknown) => throwError(() => mapDomainError(error))),
    );
  }

  record(input: RecordPaymentInput): Observable<RecordedPayment> {
    return defer(() => {
      const body = {
        referenceId: input.referenceId,
        channel: input.channel,
        amount: input.amount,
        ...(input.paidAt ? { paidAt: input.paidAt } : {}),
        ...(input.providerTransactionId ? { providerTransactionId: input.providerTransactionId } : {}),
      };
      const commandId = JSON.stringify(['payment-record', body]);
      const headers = new HttpHeaders().set(
        'Idempotency-Key',
        this.idempotencyKeys.getOrCreate(commandId),
      );

      return this.http.post<PaymentResponse>(this.collectionUrl(), body, { headers }).pipe(
        map(mapPayment),
        tap(() => this.idempotencyKeys.release(commandId)),
        catchError((error: unknown) => {
          if (!(error instanceof CnpmApiError) || !error.retryable) {
            this.idempotencyKeys.release(commandId);
          }
          return throwError(() => mapDomainError(error));
        }),
      );
    });
  }

  private collectionUrl(): string {
    return buildCnpmApiUrl(this.baseUrl, 'payments');
  }
}

function mapPayment(item: PaymentResponse): RecordedPayment {
  return {
    id: item.id,
    transactionNumber: item.transactionNumber,
    referenceValue: item.referenceValue ?? null,
    membershipNumber: item.membershipNumber ?? null,
    organizationName: item.organizationName ?? null,
    channel: item.channel,
    amount: Number.parseFloat(item.amount),
    currency: item.currency,
    paidAt: item.paidAt ?? null,
    status: item.status,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new PaymentsRecordingAuthenticationError();
    case 'authorization':
      return new PaymentsRecordingAccessError();
    case 'conflict':
      return new PaymentsRecordingConflictError(error.message);
    case 'validation':
    case 'business-rule':
      return new PaymentsRecordingValidationError(error.message);
    default:
      return error;
  }
}
