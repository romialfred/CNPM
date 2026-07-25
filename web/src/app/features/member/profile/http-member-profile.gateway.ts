import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MemberProfileAuthenticationError,
  MemberProfileValidationError,
  type MemberProfile,
  type MemberProfileGateway,
} from './member-profile-gateway';

interface ProfileResponse {
  readonly displayName: string;
  readonly email: string;
  readonly organization?: string | null;
  readonly jobTitle?: string | null;
  readonly phone?: string | null;
  readonly avatarDataUri?: string | null;
  readonly avatarUpdatedAt?: string | null;
}

/** Adaptateur HTTP du profil membre, sans repli vers des données locales. */
@Injectable()
export class HttpMemberProfileGateway implements MemberProfileGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  load(): Observable<MemberProfile> {
    return this.http
      .get<ProfileResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/profile'))
      .pipe(map(mapProfile), catchError((error: unknown) => throwError(() => mapDomainError(error))));
  }

  updateAvatar(contentType: string, base64: string): Observable<MemberProfile> {
    return this.http
      .put<ProfileResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/profile/avatar'), {
        contentType,
        base64,
      })
      .pipe(map(mapProfile), catchError((error: unknown) => throwError(() => mapDomainError(error))));
  }

  deleteAvatar(): Observable<MemberProfile> {
    return this.http
      .delete<ProfileResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/profile/avatar'))
      .pipe(map(mapProfile), catchError((error: unknown) => throwError(() => mapDomainError(error))));
  }
}

function mapProfile(item: ProfileResponse): MemberProfile {
  return {
    displayName: item.displayName,
    email: item.email,
    organization: item.organization ?? null,
    jobTitle: item.jobTitle ?? null,
    phone: item.phone ?? null,
    avatarDataUri: item.avatarDataUri ?? null,
    avatarUpdatedAt: item.avatarUpdatedAt ?? null,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new MemberProfileAuthenticationError();
    case 'conflict':
    case 'validation':
    case 'business-rule':
      return new MemberProfileValidationError(error.message);
    default:
      return error;
  }
}
