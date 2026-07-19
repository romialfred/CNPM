import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  OrganizationAccessError,
  OrganizationConflictError,
  OrganizationNotFoundError,
  OrganizationValidationError,
  type Organization,
  type OrganizationPage,
  type OrganizationQuery,
  type OrganizationsGateway,
  type OrganizationUpdate,
} from './organizations-gateway';

interface OrganizationViewResponse {
  readonly id: string;
  readonly legalName: string;
  readonly tradeName?: string | null;
  readonly organizationType: string;
  readonly sectorCode?: string | null;
  readonly status: string;
  readonly riskLevel: string;
  readonly version: number;
}

interface OrganizationPageResponse {
  readonly items: readonly OrganizationViewResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages?: number;
}

const API_SORT_KEYS: Readonly<Record<string, string>> = {
  legalName: 'legalName',
  status: 'status',
};

/** Adaptateur du contrat OpenAPI `organizations`, sans repli silencieux vers la démo. */
@Injectable()
export class HttpOrganizationsGateway implements OrganizationsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  search(query: OrganizationQuery): Observable<OrganizationPage> {
    return defer(() => {
      let params = new HttpParams()
        .set('page', String(Math.max(0, query.page - 1)))
        .set('size', String(query.pageSize));

      if (query.search.trim()) {
        params = params.set('search', query.search.trim());
      }
      if (query.status) {
        params = params.set('status', query.status);
      }
      if (query.organizationType?.trim()) {
        params = params.set('organizationType', query.organizationType.trim());
      }
      if (query.sectorCode?.trim()) {
        params = params.set('sectorCode', query.sectorCode.trim());
      }
      if (query.sort) {
        const apiKey = API_SORT_KEYS[query.sort.key];
        if (!apiKey) {
          throw new UnsupportedOrganizationsSortError(query.sort.key);
        }
        params = params.set('sort', `${apiKey},${query.sort.direction}`);
      }

      return this.http
        .get<OrganizationPageResponse>(buildCnpmApiUrl(this.baseUrl, 'organizations'), { params })
        .pipe(
          map((response) => ({
            rows: response.items.map(mapOrganization),
            totalItems: response.totalElements,
          })),
          catchError((error: unknown) => throwError(() => mapDomainError(error))),
        );
    });
  }

  get(id: string): Observable<Organization> {
    return this.http
      .get<OrganizationViewResponse>(
        buildCnpmApiUrl(this.baseUrl, `organizations/${encodeURIComponent(id)}`),
      )
      .pipe(
        map(mapOrganization),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }

  update(
    id: string,
    expectedVersion: number,
    changes: OrganizationUpdate,
  ): Observable<Organization> {
    const headers = new HttpHeaders().set('If-Match', String(expectedVersion));
    return this.http
      .patch<OrganizationViewResponse>(
        buildCnpmApiUrl(this.baseUrl, `organizations/${encodeURIComponent(id)}`),
        changes,
        { headers },
      )
      .pipe(
        map(mapOrganization),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapOrganization(item: OrganizationViewResponse): Organization {
  return {
    id: item.id,
    legalName: item.legalName,
    tradeName: item.tradeName ?? null,
    organizationType: item.organizationType,
    sectorCode: item.sectorCode ?? null,
    status: item.status,
    riskLevel: item.riskLevel,
    version: item.version,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authorization':
      return new OrganizationAccessError();
    case 'not-found':
      return new OrganizationNotFoundError();
    case 'conflict':
      return new OrganizationConflictError();
    case 'validation':
    case 'business-rule':
      return new OrganizationValidationError(error.message);
    default:
      return error;
  }
}

export class UnsupportedOrganizationsSortError extends Error {
  constructor(readonly sortKey: string) {
    super(`Le contrat API ne prend pas en charge le tri BO-005 « ${sortKey} ».`);
    this.name = 'UnsupportedOrganizationsSortError';
  }
}
