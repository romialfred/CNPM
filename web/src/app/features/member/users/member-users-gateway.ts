import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberUserStatus = 'ACTIVE' | 'INACTIVE';
export type MemberUserSort = 'displayLabel' | 'roleLabel' | 'lastActivityOn';

/**
 * Métadonnées consultatives auto-scopées de MP-014.
 *
 * Aucun sujet Keycloak, permission fine, secret MFA, jeton, session, IP ou attribut
 * d’audit n’est exposé. Les rôles restent des libellés indicatifs, non attribuables.
 */
export interface MemberUserSummary {
  readonly id: string;
  readonly reference: `CNPM-USR-${string}`;
  readonly displayLabel: string;
  readonly email: `${string}@sahel-agro.example`;
  readonly roleLabel: string;
  readonly status: MemberUserStatus;
  readonly lastActivityOn: string | null;
}

export interface MemberUserQuery {
  readonly search: string;
  readonly status?: MemberUserStatus;
  readonly sort: MemberUserSort;
  readonly direction: 'asc' | 'desc';
  readonly page: number;
  readonly size: number;
}

export interface MemberUserPage {
  readonly items: readonly MemberUserSummary[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface MemberUsersGateway {
  list(query: MemberUserQuery): Observable<MemberUserPage>;
}

export const MEMBER_USERS_GATEWAY = new InjectionToken<MemberUsersGateway>('MEMBER_USERS_GATEWAY');
