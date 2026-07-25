import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MemberDirectoryAuthenticationError,
  type DirectoryOrganization,
  type MemberDirectoryGateway,
} from './member-directory.gateway';

interface OrganizationResponse {
  readonly id: string;
  readonly name: string;
  readonly sector: string;
  readonly category: string;
  readonly memberSince?: string | null;
}

interface DirectoryPageResponse {
  readonly items: readonly OrganizationResponse[];
}

/** Adaptateur HTTP de l'annuaire des membres, sans repli vers des données locales. */
@Injectable()
export class HttpMemberDirectoryGateway implements MemberDirectoryGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  list(search: string): Observable<readonly DirectoryOrganization[]> {
    const query = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    return this.http
      .get<DirectoryPageResponse>(
        buildCnpmApiUrl(this.baseUrl, `portal/directory?page=0&size=100${query}`),
      )
      .pipe(
        map((response) => response.items.map(mapOrganization)),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapOrganization(item: OrganizationResponse): DirectoryOrganization {
  return {
    id: item.id,
    name: item.name,
    sector: item.sector,
    category: item.category,
    memberSince: item.memberSince ?? null,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  if (error.category === 'authentication') {
    return new MemberDirectoryAuthenticationError();
  }
  return error;
}
