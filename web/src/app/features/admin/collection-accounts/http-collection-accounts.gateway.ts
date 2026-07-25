import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, tap, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import {
  CollectionAccountConflictError,
  CollectionAccountNotFoundError,
  CollectionAccountsAccessError,
  CollectionAccountsAuthenticationError,
  CollectionAccountValidationError,
  type CollectionAccount,
  type CollectionAccountInput,
  type CollectionAccountsGateway,
} from './collection-accounts-gateway';

interface CollectionAccountResponse {
  readonly id: string;
  readonly channel: CollectionAccount['channel'];
  readonly label: string;
  readonly accountHolder: string;
  readonly accountIdentifier: string;
  readonly bankName?: string | null;
  readonly instructions?: string | null;
  readonly status: CollectionAccount['status'];
  readonly approvedAt?: string | null;
  readonly createdAt?: string | null;
}

interface CollectionAccountListResponse {
  readonly accounts: readonly CollectionAccountResponse[];
}

/** Adaptateur HTTP des comptes d'encaissement, sans repli vers des données locales. */
@Injectable()
export class HttpCollectionAccountsGateway implements CollectionAccountsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly idempotencyKeys = inject(IdempotencyKeyService);

  list(): Observable<readonly CollectionAccount[]> {
    return this.http.get<CollectionAccountListResponse>(this.collectionUrl()).pipe(
      map((response) => response.accounts.map(mapAccount)),
      catchError((error: unknown) => throwError(() => mapDomainError(error))),
    );
  }

  create(input: CollectionAccountInput): Observable<CollectionAccount> {
    return defer(() => {
      const body = {
        channel: input.channel,
        label: input.label.trim(),
        accountHolder: input.accountHolder.trim(),
        accountIdentifier: input.accountIdentifier.trim(),
        ...(input.bankName?.trim() ? { bankName: input.bankName.trim() } : {}),
        ...(input.instructions?.trim() ? { instructions: input.instructions.trim() } : {}),
      };
      const commandId = JSON.stringify(['collection-account-create', body]);
      const headers = this.idempotentHeaders(commandId);

      return this.http.post<CollectionAccountResponse>(this.collectionUrl(), body, { headers }).pipe(
        map(mapAccount),
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

  approve(id: string): Observable<CollectionAccount> {
    return this.command(id, `${encodeURIComponent(id)}/approve`, ['collection-account-approve', id]);
  }

  disable(id: string, reason: string): Observable<CollectionAccount> {
    return this.command(
      id,
      `${encodeURIComponent(id)}/disable`,
      ['collection-account-disable', id, reason.trim()],
      { reason: reason.trim() },
    );
  }

  private command(
    id: string,
    path: string,
    command: readonly unknown[],
    body: unknown = {},
  ): Observable<CollectionAccount> {
    return defer(() => {
      const commandId = JSON.stringify(command);
      const headers = this.idempotentHeaders(commandId);
      return this.http
        .post<CollectionAccountResponse>(
          buildCnpmApiUrl(this.baseUrl, `collection-accounts/${path}`),
          body,
          { headers },
        )
        .pipe(
          map(mapAccount),
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
    return buildCnpmApiUrl(this.baseUrl, 'collection-accounts');
  }
}

function mapAccount(item: CollectionAccountResponse): CollectionAccount {
  return {
    id: item.id,
    channel: item.channel,
    label: item.label,
    accountHolder: item.accountHolder,
    accountIdentifier: item.accountIdentifier,
    bankName: item.bankName ?? null,
    instructions: item.instructions ?? null,
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
      return new CollectionAccountsAuthenticationError();
    case 'authorization':
      return new CollectionAccountsAccessError();
    case 'not-found':
      return new CollectionAccountNotFoundError();
    case 'conflict':
      return new CollectionAccountConflictError(error.message);
    case 'validation':
    case 'business-rule':
      return new CollectionAccountValidationError(error.message, error.problem.fieldErrors ?? []);
    default:
      return error;
  }
}
