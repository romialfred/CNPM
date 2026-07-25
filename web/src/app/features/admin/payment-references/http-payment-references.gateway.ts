import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, tap, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import {
  PaymentReferenceConflictError,
  PaymentReferenceNotFoundError,
  PaymentReferencesAccessError,
  PaymentReferencesAuthenticationError,
  PaymentReferenceValidationError,
  type PaymentReference,
  type PaymentReferenceInput,
  type PaymentReferencesGateway,
} from './payment-references-gateway';

interface PaymentReferenceResponse {
  readonly id: string;
  readonly membershipId: string;
  readonly membershipNumber?: string | null;
  readonly organizationName?: string | null;
  readonly referenceValue: string;
  readonly exercise?: number | null;
  readonly status: PaymentReference['status'];
  readonly approvedAt?: string | null;
  readonly createdAt?: string | null;
}

interface PaymentReferenceListResponse {
  readonly references: readonly PaymentReferenceResponse[];
}

/** Adaptateur HTTP des références de paiement, sans repli vers des données locales. */
@Injectable()
export class HttpPaymentReferencesGateway implements PaymentReferencesGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly idempotencyKeys = inject(IdempotencyKeyService);

  list(): Observable<readonly PaymentReference[]> {
    return this.http.get<PaymentReferenceListResponse>(this.collectionUrl()).pipe(
      map((response) => response.references.map(mapReference)),
      catchError((error: unknown) => throwError(() => mapDomainError(error))),
    );
  }

  generate(input: PaymentReferenceInput): Observable<PaymentReference> {
    return defer(() => {
      const body = { membershipId: input.membershipId, exercise: input.exercise };
      const commandId = JSON.stringify(['payment-reference-generate', body]);
      const headers = this.idempotentHeaders(commandId);

      return this.http
        .post<PaymentReferenceResponse>(this.collectionUrl(), body, { headers })
        .pipe(
          map(mapReference),
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

  validate(id: string): Observable<PaymentReference> {
    return this.command(`${encodeURIComponent(id)}/validate`, ['payment-reference-validate', id]);
  }

  revoke(id: string, reason: string): Observable<PaymentReference> {
    return this.command(
      `${encodeURIComponent(id)}/revoke`,
      ['payment-reference-revoke', id, reason.trim()],
      { reason: reason.trim() },
    );
  }

  private command(
    path: string,
    command: readonly unknown[],
    body: unknown = {},
  ): Observable<PaymentReference> {
    return defer(() => {
      const commandId = JSON.stringify(command);
      const headers = this.idempotentHeaders(commandId);
      return this.http
        .post<PaymentReferenceResponse>(
          buildCnpmApiUrl(this.baseUrl, `payment-references/${path}`),
          body,
          { headers },
        )
        .pipe(
          map(mapReference),
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

  private collectionUrl(): string {
    return buildCnpmApiUrl(this.baseUrl, 'payment-references');
  }
}

function mapReference(item: PaymentReferenceResponse): PaymentReference {
  return {
    id: item.id,
    membershipId: item.membershipId,
    membershipNumber: item.membershipNumber ?? null,
    organizationName: item.organizationName ?? null,
    referenceValue: item.referenceValue,
    exercise: item.exercise ?? null,
    status: item.status,
    approvedAt: item.approvedAt ?? null,
    createdAt: item.createdAt ?? null,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new PaymentReferencesAuthenticationError();
    case 'authorization':
      return new PaymentReferencesAccessError();
    case 'not-found':
      return new PaymentReferenceNotFoundError();
    case 'conflict':
      return new PaymentReferenceConflictError(error.message);
    case 'validation':
    case 'business-rule':
      return new PaymentReferenceValidationError(error.message, error.problem.fieldErrors ?? []);
    default:
      return error;
  }
}
