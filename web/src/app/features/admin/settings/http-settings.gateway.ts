import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, tap, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import {
  ReferenceValueConflictError,
  ReferenceValueNotFoundError,
  ReferenceValuesAccessError,
  ReferenceValuesAuthenticationError,
  ReferenceValueValidationError,
  type ReferenceValue,
  type ReferenceValueInput,
  type ReferenceValuePage,
  type ReferenceValueQuery,
  type ReferenceValuesGateway,
  type ReferenceValueUpdate,
} from './settings-gateway';

interface ReferenceValueResponse {
  readonly id: string;
  readonly domain: string;
  readonly code: string;
  readonly label: string;
  readonly sortOrder: number;
  readonly active: boolean;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  readonly version: number;
}

interface ReferenceValuePageResponse {
  readonly items: readonly ReferenceValueResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages?: number;
}

/** Adaptateur HTTP de BO-033, sans repli silencieux vers les données locales. */
@Injectable()
export class HttpSettingsGateway implements ReferenceValuesGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly idempotencyKeys = inject(IdempotencyKeyService);

  list(query: ReferenceValueQuery): Observable<ReferenceValuePage> {
    let params = new HttpParams()
      .set('page', String(Math.max(0, query.page - 1)))
      .set('size', String(query.pageSize));
    if (query.domain?.trim()) {
      params = params.set('domain', query.domain.trim());
    }

    return this.http.get<ReferenceValuePageResponse>(this.collectionUrl(), { params }).pipe(
      map((response) => ({
        rows: response.items.map(mapReferenceValue),
        totalItems: response.totalElements,
        totalPages:
          response.totalPages ?? Math.ceil(response.totalElements / Math.max(response.size, 1)),
      })),
      catchError((error: unknown) => throwError(() => mapDomainError(error))),
    );
  }

  create(input: ReferenceValueInput): Observable<ReferenceValue> {
    return defer(() => {
      const normalizedInput: ReferenceValueInput = {
        domain: input.domain.trim(),
        code: input.code.trim(),
        label: input.label.trim(),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      };
      const commandId = createCommandId(normalizedInput);
      const headers = new HttpHeaders().set(
        'Idempotency-Key',
        this.idempotencyKeys.getOrCreate(commandId),
      );

      return this.http
        .post<ReferenceValueResponse>(this.collectionUrl(), normalizedInput, { headers })
        .pipe(
          map(mapReferenceValue),
          tap(() => this.idempotencyKeys.release(commandId)),
          catchError((error: unknown) => {
            // Une panne temporaire conserve la clé : le prochain envoi est un vrai rejeu.
            if (!(error instanceof CnpmApiError) || !error.retryable) {
              this.idempotencyKeys.release(commandId);
            }
            return throwError(() => mapDomainError(error));
          }),
        );
    });
  }

  update(
    id: string,
    expectedVersion: number,
    changes: ReferenceValueUpdate,
  ): Observable<ReferenceValue> {
    const headers = new HttpHeaders().set('If-Match', String(expectedVersion));
    return this.http
      .patch<ReferenceValueResponse>(
        buildCnpmApiUrl(this.baseUrl, `reference-values/${encodeURIComponent(id)}`),
        changes,
        { headers },
      )
      .pipe(
        map(mapReferenceValue),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }

  private collectionUrl(): string {
    return buildCnpmApiUrl(this.baseUrl, 'reference-values');
  }
}

function mapReferenceValue(item: ReferenceValueResponse): ReferenceValue {
  return {
    id: item.id,
    domain: item.domain,
    code: item.code,
    label: item.label,
    sortOrder: item.sortOrder,
    active: item.active,
    validFrom: item.validFrom ?? null,
    validTo: item.validTo ?? null,
    version: item.version,
  };
}

function createCommandId(input: ReferenceValueInput): string {
  return JSON.stringify([
    'reference-value-create',
    input.domain.trim(),
    input.code.trim(),
    input.label.trim(),
    input.sortOrder ?? 0,
    input.active ?? true,
  ]);
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new ReferenceValuesAuthenticationError();
    case 'authorization':
      return new ReferenceValuesAccessError();
    case 'not-found':
      return new ReferenceValueNotFoundError();
    case 'conflict':
      return new ReferenceValueConflictError();
    case 'validation':
    case 'business-rule':
      return new ReferenceValueValidationError(error.message, error.problem.fieldErrors ?? []);
    default:
      return error;
  }
}
