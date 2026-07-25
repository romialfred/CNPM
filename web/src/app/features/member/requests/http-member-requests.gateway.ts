import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, tap, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import {
  MemberRequestNotFoundError,
  MemberRequestsAuthenticationError,
  type CreateMemberRequestInput,
  type MemberRequestDetail,
  type MemberRequestMessage,
  type MemberRequestPage,
  type MemberRequestsGateway,
  type MemberRequestSummary,
} from './member-requests-gateway';

interface SummaryResponse {
  readonly id: string;
  readonly reference: string;
  readonly type: MemberRequestSummary['type'];
  readonly subject: string;
  readonly status: MemberRequestSummary['status'];
  readonly priority: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface PageResponse {
  readonly items: readonly SummaryResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

interface MessageResponse {
  readonly id: string;
  readonly sender: MemberRequestMessage['sender'];
  readonly body: string;
  readonly createdAt: string;
}

interface DetailResponse extends SummaryResponse {
  readonly description: string;
  readonly conversation: readonly MessageResponse[];
}

/** Adaptateur HTTP de « Mes requêtes », sans repli vers des données locales. */
@Injectable()
export class HttpMemberRequestsGateway implements MemberRequestsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly idempotencyKeys = inject(IdempotencyKeyService);

  list(page: number, size: number): Observable<MemberRequestPage> {
    const params = `?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;
    return this.http
      .get<PageResponse>(buildCnpmApiUrl(this.baseUrl, `portal/requests${params}`))
      .pipe(
        map(mapPage),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }

  loadDetail(id: string): Observable<MemberRequestDetail> {
    return this.http
      .get<DetailResponse>(buildCnpmApiUrl(this.baseUrl, `portal/requests/${encodeURIComponent(id)}`))
      .pipe(
        map(mapDetail),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }

  create(input: CreateMemberRequestInput): Observable<MemberRequestDetail> {
    return defer(() => {
      const body = {
        type: input.type,
        subject: input.subject.trim(),
        description: input.description.trim(),
      };
      const commandId = JSON.stringify(['member-request-create', body]);
      const headers = new HttpHeaders().set(
        'Idempotency-Key',
        this.idempotencyKeys.getOrCreate(commandId),
      );
      return this.http
        .post<DetailResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/requests'), body, { headers })
        .pipe(
          map(mapDetail),
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

  addMessage(id: string, body: string): Observable<MemberRequestDetail> {
    return this.http
      .post<DetailResponse>(
        buildCnpmApiUrl(this.baseUrl, `portal/requests/${encodeURIComponent(id)}/messages`),
        { body: body.trim() },
      )
      .pipe(
        map(mapDetail),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapPage(response: PageResponse): MemberRequestPage {
  return {
    items: response.items.map(mapSummary),
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  };
}

function mapSummary(item: SummaryResponse): MemberRequestSummary {
  return {
    id: item.id,
    reference: item.reference,
    type: item.type,
    subject: item.subject,
    status: item.status,
    priority: item.priority,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapDetail(item: DetailResponse): MemberRequestDetail {
  return {
    ...mapSummary(item),
    description: item.description,
    conversation: item.conversation.map((message) => ({
      id: message.id,
      sender: message.sender,
      body: message.body,
      createdAt: message.createdAt,
    })),
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new MemberRequestsAuthenticationError();
    case 'not-found':
      return new MemberRequestNotFoundError();
    default:
      return error;
  }
}
