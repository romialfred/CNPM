import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MembersAccessError,
  type MemberQuery,
  type MemberRow,
  type MemberStatus,
  type MembersGateway,
  type MembersPage,
} from './members-gateway';

interface MembershipViewResponse {
  readonly id: string;
  readonly membershipNumber: string;
  readonly organizationId: string;
  readonly organizationLegalName: string;
  readonly categoryCode: string;
  readonly status: string;
  readonly joinedAt?: string | null;
  readonly version: number;
  readonly primaryGroupCode?: string | null;
  readonly primaryGroupName?: string | null;
  readonly primaryContactName?: string | null;
  readonly primaryContactEmail?: string | null;
  readonly primaryContactPhone?: string | null;
}

interface MembershipPageResponse {
  readonly items: readonly MembershipViewResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages?: number;
}

const STATUS_VALUES = new Set<MemberStatus>(['ACTIVE', 'DORMANT', 'PROSPECT']);
const API_SORT_KEYS: Readonly<Record<string, string>> = {
  code: 'membershipNumber',
  organization: 'organizationLegalName',
  status: 'status',
  group: 'primaryGroupName',
};

/**
 * Adaptateur HTTP R0 de BO-002.
 *
 * Les colonnes financières et d'activité restent volontairement `null` : le contrat
 * MEMBER ne doit pas lire directement COT/PAY et ADR-006 n'est pas encore acceptée.
 * Aucun zéro fictif ne vient donc faire croire à une absence de dette ou de paiement.
 */
@Injectable()
export class HttpMembersGateway implements MembersGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  search(query: MemberQuery): Observable<MembersPage> {
    return defer(() => {
      const sort = this.mapSort(query);
      let params = new HttpParams()
        .set('page', String(Math.max(0, query.page - 1)))
        .set('size', String(query.pageSize));

      if (query.search.trim()) {
        params = params.set('search', query.search.trim());
      }
      if (query.status) {
        params = params.set('status', query.status);
      }
      if (query.category) {
        params = params.set('categoryCode', query.category);
      }
      if (query.group) {
        params = params.set('groupCode', query.group);
      }
      if (sort) {
        params = params.set('sort', sort);
      }

      return this.http
        .get<MembershipPageResponse>(buildCnpmApiUrl(this.baseUrl, 'memberships'), { params })
        .pipe(
          map((response) => ({
            rows: response.items.map((item) => this.mapRow(item)),
            totalItems: response.totalElements,
            overview: null,
            // Le contrat R0 ne livre pas de facettes globales. Les déduire de la page
            // courante rendrait les filtres incomplets et trompeurs.
            categories: null,
            groups: null,
            supportedSortKeys: Object.keys(API_SORT_KEYS),
          })),
          catchError((error: unknown) =>
            throwError(() =>
              error instanceof CnpmApiError && error.category === 'authorization'
                ? new MembersAccessError()
                : error,
            ),
          ),
        );
    });
  }

  private mapSort(query: MemberQuery): string | null {
    if (!query.sort) {
      return null;
    }
    const apiKey = API_SORT_KEYS[query.sort.key];
    if (!apiKey) {
      throw new UnsupportedMembersSortError(query.sort.key);
    }
    return `${apiKey},${query.sort.direction}`;
  }

  private mapRow(item: MembershipViewResponse): MemberRow {
    return {
      id: item.id,
      organizationId: item.organizationId,
      code: item.membershipNumber,
      organization: item.organizationLegalName,
      category: item.categoryCode,
      group: item.primaryGroupName ?? null,
      contactName: item.primaryContactName ?? null,
      contactPhone: item.primaryContactPhone ?? null,
      contactEmail: item.primaryContactEmail ?? null,
      due: null,
      paid: null,
      status: this.mapStatus(item.status),
      lastActivity: null,
      isLargeContributor: null,
    };
  }

  private mapStatus(value: string): MemberStatus {
    if (STATUS_VALUES.has(value as MemberStatus)) {
      return value as MemberStatus;
    }
    throw new UnknownMembershipStatusError(value);
  }
}

export class UnsupportedMembersSortError extends Error {
  constructor(readonly sortKey: string) {
    super(`Le contrat API ne prend pas en charge le tri BO-002 « ${sortKey} ».`);
    this.name = 'UnsupportedMembersSortError';
  }
}

export class UnknownMembershipStatusError extends Error {
  constructor(readonly status: string) {
    super(`Le statut d'adhésion « ${status} » n'est pas reconnu par BO-002.`);
    this.name = 'UnknownMembershipStatusError';
  }
}
