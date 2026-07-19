import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  GroupAccessError,
  GroupNotFoundError,
  type GroupsGateway,
  type ProfessionalGroup,
  type ProfessionalGroupPage,
  type ProfessionalGroupQuery,
} from './groups-gateway';

interface ProfessionalGroupResponse {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly sectorCode?: string | null;
  readonly status: string;
  readonly version: number;
}

interface ProfessionalGroupPageResponse {
  readonly items: readonly ProfessionalGroupResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/** Adaptateur des deux opérations GROUP en lecture seule, sans repli vers la démo. */
@Injectable()
export class HttpGroupsGateway implements GroupsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  list(query: ProfessionalGroupQuery): Observable<ProfessionalGroupPage> {
    const params = new HttpParams()
      .set('page', String(Math.max(0, query.page - 1)))
      .set('size', String(query.pageSize));

    return this.http
      .get<ProfessionalGroupPageResponse>(buildCnpmApiUrl(this.baseUrl, 'professional-groups'), {
        params,
      })
      .pipe(
        map((response) => ({
          rows: response.items.map(mapProfessionalGroup),
          totalItems: response.totalElements,
        })),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }

  get(id: string): Observable<ProfessionalGroup> {
    return this.http
      .get<ProfessionalGroupResponse>(
        buildCnpmApiUrl(this.baseUrl, `professional-groups/${encodeURIComponent(id)}`),
      )
      .pipe(
        map(mapProfessionalGroup),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapProfessionalGroup(response: ProfessionalGroupResponse): ProfessionalGroup {
  return {
    id: response.id,
    code: response.code,
    name: response.name,
    sectorCode: response.sectorCode ?? null,
    status: response.status,
    version: response.version,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) return error;
  if (error.category === 'authorization') return new GroupAccessError();
  if (error.category === 'not-found') return new GroupNotFoundError();
  return error;
}
