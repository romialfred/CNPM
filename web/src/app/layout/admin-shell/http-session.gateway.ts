import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, of, shareReplay, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../core/api/api.config';
import { CnpmApiError } from '../../core/api/api-problem';
import type { SessionGateway, SessionIdentity } from './session-gateway';

interface CurrentUserResponse {
  readonly subject: string;
  readonly username: string | null;
  readonly email: string | null;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

/** Adaptateur du shell vers la projection de session sécurisée `GET /auth/me`. */
@Injectable()
export class HttpSessionGateway implements SessionGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  /**
   * Le shell contient deux consommateurs (sidebar et topbar). `shareReplay` garantit
   * une seule lecture de session sans conserver de jeton ni dupliquer la requête.
   */
  readonly identity: Observable<SessionIdentity | null> = defer(() =>
    this.http.get<CurrentUserResponse>(buildCnpmApiUrl(this.baseUrl, 'auth/me')),
  ).pipe(
    map((user) => ({
      displayName: user.username ?? user.email ?? user.subject,
      roleLabel: user.roles.length > 0 ? user.roles.join(' · ') : 'Aucun rôle attribué',
      // Le contrat courant ne fournit ni exercice actif ni agrégat de notifications.
      exerciseLabel: null,
      notificationCount: null,
      demoMode: false,
      permissions: user.permissions,
    })),
    catchError((error: unknown) =>
      error instanceof CnpmApiError && error.category === 'authentication'
        ? of(null)
        : throwError(() => error),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );
}
