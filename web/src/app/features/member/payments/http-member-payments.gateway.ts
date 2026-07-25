import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MemberPaymentsAuthenticationError,
  MemberPaymentsNoMembershipError,
  type MemberPayment,
  type MemberPaymentsGateway,
} from './member-payments-gateway';

interface PaymentResponse {
  readonly id: string;
  readonly transactionNumber: string;
  readonly referenceValue?: string | null;
  readonly exercise?: number | null;
  readonly channel: MemberPayment['channel'];
  readonly amount: string;
  readonly currency: string;
  readonly paidAt?: string | null;
  readonly confirmed: boolean;
  readonly receiptNumber?: string | null;
}

interface PaymentListResponse {
  readonly payments: readonly PaymentResponse[];
}

/** Adaptateur HTTP de « Mes paiements », sans repli vers des données locales. */
@Injectable()
export class HttpMemberPaymentsGateway implements MemberPaymentsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  list(): Observable<readonly MemberPayment[]> {
    return this.http
      .get<PaymentListResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/payments'))
      .pipe(
        map((response) => response.payments.map(mapPayment)),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapPayment(item: PaymentResponse): MemberPayment {
  return {
    id: item.id,
    transactionNumber: item.transactionNumber,
    referenceValue: item.referenceValue ?? null,
    exercise: item.exercise ?? null,
    channel: item.channel,
    amount: Number.parseFloat(item.amount),
    currency: item.currency,
    paidAt: item.paidAt ?? null,
    confirmed: item.confirmed,
    receiptNumber: item.receiptNumber ?? null,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new MemberPaymentsAuthenticationError();
    case 'not-found':
      return new MemberPaymentsNoMembershipError();
    default:
      return error;
  }
}
