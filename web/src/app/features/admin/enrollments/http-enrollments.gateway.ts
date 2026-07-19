import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, tap, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import {
  EnrollmentAccessError,
  EnrollmentConflictError,
  EnrollmentNotFoundError,
  EnrollmentValidationError,
  type EnrollmentApplication,
  type EnrollmentApproval,
  type EnrollmentPage,
  type EnrollmentPageQuery,
  type EnrollmentRejection,
  type EnrollmentsGateway,
  type EnrollmentStatus,
} from './enrollments-gateway';

interface EnrollmentApplicationResponse {
  readonly id: string;
  readonly caseNumber: string;
  readonly organizationId: string;
  readonly channel: string;
  readonly status: string;
  readonly submittedAt?: string | null;
  readonly assignedTo?: string | null;
  readonly version: number;
}

interface EnrollmentApplicationPageResponse {
  readonly items: readonly EnrollmentApplicationResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

const ENROLLMENT_STATUSES = new Set<EnrollmentStatus>([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'COMPLEMENT_REQUIRED',
  'APPROVED',
  'REJECTED',
]);

/** Adaptateur HTTP de BO-008 et BO-010, sans repli silencieux vers les fixtures. */
@Injectable()
export class HttpEnrollmentsGateway implements EnrollmentsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly idempotencyKeys = inject(IdempotencyKeyService);

  list(query: EnrollmentPageQuery): Observable<EnrollmentPage> {
    const params = new HttpParams()
      .set('page', String(Math.max(0, query.page - 1)))
      .set('size', String(query.pageSize));
    return this.http
      .get<EnrollmentApplicationPageResponse>(
        buildCnpmApiUrl(this.baseUrl, 'enrollment-applications'),
        { params },
      )
      .pipe(
        map((response) => ({
          rows: response.items.map(mapEnrollment),
          totalItems: response.totalElements,
          totalPages: response.totalPages,
        })),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }

  get(id: string): Observable<EnrollmentApplication> {
    return this.http.get<EnrollmentApplicationResponse>(this.applicationUrl(id)).pipe(
      map(mapEnrollment),
      catchError((error: unknown) => throwError(() => mapDomainError(error))),
    );
  }

  startReview(id: string): Observable<EnrollmentApplication> {
    return this.post(id, 'start-review', null);
  }

  requestComplement(id: string, comment: string): Observable<EnrollmentApplication> {
    return this.post(id, 'request-complement', { comment });
  }

  approve(id: string, input: EnrollmentApproval): Observable<EnrollmentApplication> {
    return defer(() => {
      const commandId = approvalCommandId(id, input);
      const idempotencyKey = this.idempotencyKeys.getOrCreate(commandId);
      const headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);

      return this.http
        .post<EnrollmentApplicationResponse>(this.actionUrl(id, 'approve'), input, { headers })
        .pipe(
          map(mapEnrollment),
          tap(() => this.idempotencyKeys.release(commandId)),
          catchError((error: unknown) => {
            // Une panne temporaire conserve la même clé pour un véritable rejeu de la
            // commande. Une réponse terminale libère l'intention.
            if (!(error instanceof CnpmApiError) || !error.retryable) {
              this.idempotencyKeys.release(commandId);
            }
            return throwError(() => mapDomainError(error));
          }),
        );
    });
  }

  reject(id: string, input: EnrollmentRejection): Observable<EnrollmentApplication> {
    return this.post(id, 'reject', input);
  }

  private post(
    id: string,
    action: 'start-review' | 'request-complement' | 'reject',
    body: unknown,
  ): Observable<EnrollmentApplication> {
    return this.http.post<EnrollmentApplicationResponse>(this.actionUrl(id, action), body).pipe(
      map(mapEnrollment),
      catchError((error: unknown) => throwError(() => mapDomainError(error))),
    );
  }

  private applicationUrl(id: string): string {
    return buildCnpmApiUrl(this.baseUrl, `enrollment-applications/${encodeURIComponent(id)}`);
  }

  private actionUrl(id: string, action: string): string {
    return `${this.applicationUrl(id)}/${action}`;
  }
}

function mapEnrollment(item: EnrollmentApplicationResponse): EnrollmentApplication {
  if (!ENROLLMENT_STATUSES.has(item.status as EnrollmentStatus)) {
    throw new UnknownEnrollmentStatusError(item.status);
  }
  return {
    id: item.id,
    caseNumber: item.caseNumber,
    organizationId: item.organizationId,
    channel: item.channel,
    status: item.status as EnrollmentStatus,
    submittedAt: item.submittedAt ?? null,
    assignedTo: item.assignedTo ?? null,
    version: item.version,
  };
}

function approvalCommandId(id: string, input: EnrollmentApproval): string {
  return [
    'enrollment-approve',
    id,
    input.membershipNumber.trim(),
    input.categoryCode.trim(),
    input.comment?.trim() ?? '',
  ].join(':');
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authorization':
      return new EnrollmentAccessError();
    case 'not-found':
      return new EnrollmentNotFoundError();
    case 'conflict':
      return new EnrollmentConflictError();
    case 'validation':
    case 'business-rule':
      return new EnrollmentValidationError(error.message);
    default:
      return error;
  }
}

export class UnknownEnrollmentStatusError extends Error {
  constructor(readonly status: string) {
    super(`Statut d’enrôlement inconnu : ${status}`);
    this.name = 'UnknownEnrollmentStatusError';
  }
}
