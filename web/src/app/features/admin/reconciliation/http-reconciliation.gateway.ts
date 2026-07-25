import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, tap, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import {
  ReconciliationAccessError,
  ReconciliationAuthenticationError,
  ReconciliationConflictError,
  ReconciliationValidationError,
  type ImportSummary,
  type ReconciliationCase,
  type ReconciliationGateway,
  type StatementImportRequest,
} from './reconciliation-gateway';

interface CaseResponse {
  readonly id: string;
  readonly bookingDate?: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly referenceText?: string | null;
  readonly matchScore?: string | null;
  readonly status: ReconciliationCase['status'];
  readonly matchedReferenceValue?: string | null;
  readonly membershipNumber?: string | null;
  readonly organizationName?: string | null;
  readonly paymentTransactionNumber?: string | null;
}

interface CaseListResponse {
  readonly cases: readonly CaseResponse[];
}

interface ImportSummaryResponse {
  readonly statementRef: string;
  readonly importedLines: number;
  readonly matched: number;
  readonly unmatched: number;
  readonly duplicates: number;
}

/** Adaptateur HTTP du rapprochement, sans repli vers des données locales. */
@Injectable()
export class HttpReconciliationGateway implements ReconciliationGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly idempotencyKeys = inject(IdempotencyKeyService);

  list(): Observable<readonly ReconciliationCase[]> {
    return this.http
      .get<CaseListResponse>(buildCnpmApiUrl(this.baseUrl, 'reconciliations'))
      .pipe(
        map((response) => response.cases.map(mapCase)),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }

  importStatement(request: StatementImportRequest): Observable<ImportSummary> {
    return defer(() => {
      const commandId = JSON.stringify(['statement-import', request.statementRef]);
      const headers = this.idempotentHeaders(commandId);
      return this.http
        .post<ImportSummaryResponse>(
          buildCnpmApiUrl(this.baseUrl, 'bank-statements/import'),
          request,
          { headers },
        )
        .pipe(
          map((response) => ({ ...response })),
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

  decide(caseId: string, decision: 'CONFIRM' | 'REJECT', reason: string): Observable<void> {
    return defer(() => {
      const commandId = JSON.stringify(['reconciliation-decide', caseId, decision]);
      const headers = this.idempotentHeaders(commandId);
      return this.http
        .post(
          buildCnpmApiUrl(this.baseUrl, `reconciliations/${encodeURIComponent(caseId)}/decide`),
          { decision, reason },
          { headers },
        )
        .pipe(
          map(() => undefined),
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

  private idempotentHeaders(commandId: string): HttpHeaders {
    return new HttpHeaders().set('Idempotency-Key', this.idempotencyKeys.getOrCreate(commandId));
  }
}

function mapCase(item: CaseResponse): ReconciliationCase {
  return {
    id: item.id,
    bookingDate: item.bookingDate ?? null,
    amount: Number.parseFloat(item.amount),
    currency: item.currency,
    referenceText: item.referenceText ?? null,
    matchScore: item.matchScore != null ? Number.parseFloat(item.matchScore) : null,
    status: item.status,
    matchedReferenceValue: item.matchedReferenceValue ?? null,
    membershipNumber: item.membershipNumber ?? null,
    organizationName: item.organizationName ?? null,
    paymentTransactionNumber: item.paymentTransactionNumber ?? null,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new ReconciliationAuthenticationError();
    case 'authorization':
      return new ReconciliationAccessError();
    case 'conflict':
      return new ReconciliationConflictError(error.message);
    case 'validation':
    case 'business-rule':
      return new ReconciliationValidationError(error.message);
    default:
      return error;
  }
}
