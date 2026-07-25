import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MemberReceiptsAuthenticationError,
  MemberReceiptsNoMembershipError,
  type MemberReceipt,
  type MemberReceiptsGateway,
} from './member-receipts-gateway';

interface ReceiptResponse {
  readonly id: string;
  readonly receiptNumber: string;
  readonly transactionNumber: string;
  readonly referenceValue?: string | null;
  readonly exercise?: number | null;
  readonly channel: MemberReceipt['channel'];
  readonly amount: string;
  readonly currency: string;
  readonly paidAt?: string | null;
  readonly issuedAt?: string | null;
  readonly status: string;
}

interface ReceiptListResponse {
  readonly receipts: readonly ReceiptResponse[];
}

/** Adaptateur HTTP de « Mes reçus », sans repli vers des données locales. */
@Injectable()
export class HttpMemberReceiptsGateway implements MemberReceiptsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  list(): Observable<readonly MemberReceipt[]> {
    return this.http
      .get<ReceiptListResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/receipts'))
      .pipe(
        map((response) => response.receipts.map(mapReceipt)),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapReceipt(item: ReceiptResponse): MemberReceipt {
  return {
    id: item.id,
    receiptNumber: item.receiptNumber,
    transactionNumber: item.transactionNumber,
    referenceValue: item.referenceValue ?? null,
    exercise: item.exercise ?? null,
    channel: item.channel,
    amount: Number.parseFloat(item.amount),
    currency: item.currency,
    paidAt: item.paidAt ?? null,
    issuedAt: item.issuedAt ?? null,
    status: item.status,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new MemberReceiptsAuthenticationError();
    case 'not-found':
      return new MemberReceiptsNoMembershipError();
    default:
      return error;
  }
}
