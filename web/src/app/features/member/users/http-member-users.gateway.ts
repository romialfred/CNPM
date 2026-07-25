import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MemberUsersAuthenticationError,
  MemberUsersNoMembershipError,
  type MemberUser,
  type MemberUsersGateway,
} from './member-users-gateway';

interface UserResponse {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly roleLabel: string;
  readonly status: MemberUser['status'];
  readonly lastActivityAt?: string | null;
}

interface UserPageResponse {
  readonly items: readonly UserResponse[];
}

/** Adaptateur HTTP des utilisateurs de l'organisation, sans repli vers des données locales. */
@Injectable()
export class HttpMemberUsersGateway implements MemberUsersGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  list(): Observable<readonly MemberUser[]> {
    return this.http
      .get<UserPageResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/users?page=0&size=100'))
      .pipe(
        map((response) => response.items.map(mapUser)),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapUser(item: UserResponse): MemberUser {
  return {
    id: item.id,
    displayName: item.displayName,
    email: item.email,
    roleLabel: item.roleLabel,
    status: item.status,
    lastActivityAt: item.lastActivityAt ?? null,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new MemberUsersAuthenticationError();
    case 'not-found':
      return new MemberUsersNoMembershipError();
    default:
      return error;
  }
}
