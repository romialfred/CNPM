import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  ReceiptsRegistryAccessError,
  ReceiptsRegistryAuthenticationError,
  type IssuedReceipt,
  type ReceiptsRegistryGateway,
} from './receipts-registry-gateway';

interface ReceiptResponse {
  readonly id: string;
  readonly receiptNumber: string;
  readonly transactionNumber?: string | null;
  readonly referenceValue?: string | null;
  readonly organizationName?: string | null;
  readonly channel?: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly issuedAt?: string | null;
  readonly status: string;
}

interface ReceiptListResponse {
  readonly receipts: readonly ReceiptResponse[];
}

/** Adaptateur HTTP des reçus, sans repli vers des données locales. */
@Injectable()
export class HttpReceiptsRegistryGateway implements ReceiptsRegistryGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  list(): Observable<readonly IssuedReceipt[]> {
    return this.http
      .get<ReceiptListResponse>(buildCnpmApiUrl(this.baseUrl, 'receipts'))
      .pipe(
        map((response) => response.receipts.map(mapReceipt)),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapReceipt(item: ReceiptResponse): IssuedReceipt {
  return {
    id: item.id,
    receiptNumber: item.receiptNumber,
    transactionNumber: item.transactionNumber ?? null,
    referenceValue: item.referenceValue ?? null,
    organizationName: item.organizationName ?? null,
    channel: item.channel ?? null,
    amount: Number.parseFloat(item.amount),
    currency: item.currency,
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
      return new ReceiptsRegistryAuthenticationError();
    case 'authorization':
      return new ReceiptsRegistryAccessError();
    default:
      return error;
  }
}
