import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  type EditableMemberCore,
  MemberEditAccessError,
  MemberEditConflictError,
  type MemberEditGateway,
  MemberEditNotFoundError,
  type MemberCoreUpdate,
  MemberEditValidationError,
} from './member-edit-gateway';

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

/**
 * Adaptateur HTTP de BO-004.
 *
 * Le nom de feature reste « membre » parce que la route et le parcours le sont ; le
 * transport emploie le contrat `organizations`, seul read/write-model R0 qui porte
 * les quatre champs descriptifs modifiables.
 */
@Injectable()
export class HttpMemberEditGateway implements MemberEditGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  load(id: string): Observable<EditableMemberCore> {
    return this.http
      .get<OrganizationViewResponse>(
        buildCnpmApiUrl(this.baseUrl, `organizations/${encodeURIComponent(id)}`),
      )
      .pipe(
        map(mapMemberCore),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }

  update(
    id: string,
    expectedVersion: number,
    changes: MemberCoreUpdate,
  ): Observable<EditableMemberCore> {
    const headers = new HttpHeaders().set('If-Match', String(expectedVersion));
    return this.http
      .patch<OrganizationViewResponse>(
        buildCnpmApiUrl(this.baseUrl, `organizations/${encodeURIComponent(id)}`),
        changes,
        { headers },
      )
      .pipe(
        map(mapMemberCore),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapMemberCore(response: OrganizationViewResponse): EditableMemberCore {
  return {
    id: response.id,
    legalName: response.legalName,
    tradeName: response.tradeName ?? null,
    organizationType: response.organizationType,
    sectorCode: response.sectorCode ?? null,
    status: response.status,
    riskLevel: response.riskLevel,
    version: response.version,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authorization':
      return new MemberEditAccessError();
    case 'not-found':
      return new MemberEditNotFoundError();
    case 'conflict':
      return new MemberEditConflictError();
    case 'validation':
    case 'business-rule':
      return new MemberEditValidationError(error.message);
    default:
      return error;
  }
}
