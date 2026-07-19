import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  AuditAccessError,
  AuditAuthenticationError,
  type AuditEventPage,
  type AuditEventQuery,
  type AuditGateway,
} from './audit-gateway';

/**
 * Adaptateur HTTP de BO-032.
 *
 * La vue utilise une pagination humaine (1…n), tandis que le contrat OpenAPI utilise
 * une pagination technique (0…n-1). Aucune autre requête, filtre ou opération
 * d'écriture n'est ajouté : l'endpoint disponible ne porte que `page` et `size`.
 */
@Injectable()
export class HttpAuditGateway implements AuditGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  search(query: AuditEventQuery): Observable<AuditEventPage> {
    return defer(() => {
      const params = new HttpParams()
        .set('page', String(Math.max(0, query.page - 1)))
        .set('size', String(query.size));

      return this.http
        .get<AuditEventPage>(buildCnpmApiUrl(this.baseUrl, 'audit-events'), { params })
        .pipe(
          catchError((error: unknown) => {
            if (error instanceof CnpmApiError && error.category === 'authentication') {
              return throwError(() => new AuditAuthenticationError());
            }
            if (error instanceof CnpmApiError && error.category === 'authorization') {
              return throwError(() => new AuditAccessError());
            }
            return throwError(() => error);
          }),
        );
    });
  }
}
