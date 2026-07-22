import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MemberDetailAccessError,
  type MemberDetail,
  type MemberDetailGateway,
  MemberDetailNotFoundError,
} from './member-detail-gateway';

/**
 * Adaptateur HTTP de la fiche membre 360° (BO-003 ;
 * {@code GET /organizations/{id}/member-detail}). {@code id} est l'identifiant d'organisation
 * transmis par la liste des membres.
 *
 * <p>Le backend assemble la fiche : l'adaptateur transmet la projection sans recalcul. Un refus
 * d'habilitation (403) devient {@link MemberDetailAccessError}, une organisation inconnue (404)
 * {@link MemberDetailNotFoundError} — l'écran distingue « accès refusé » et « introuvable »
 * d'une panne, et n'invite pas à réessayer ce qui ne se réessaie pas.
 */
@Injectable()
export class HttpMemberDetailGateway implements MemberDetailGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  load(id: string): Observable<MemberDetail> {
    return this.http
      .get<MemberDetail>(
        buildCnpmApiUrl(this.baseUrl, `organizations/${encodeURIComponent(id)}/member-detail`),
      )
      .pipe(
        catchError((error: unknown) =>
          throwError(() => {
            if (error instanceof CnpmApiError && error.category === 'authorization') {
              return new MemberDetailAccessError();
            }
            if (error instanceof CnpmApiError && error.category === 'not-found') {
              return new MemberDetailNotFoundError();
            }
            return error;
          }),
        ),
      );
  }
}
