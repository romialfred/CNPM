import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { CNPM_API_BASE_URL, isCnpmApiRequest } from './api.config';
import { mapHttpError } from './api-problem';
import { CORRELATION_ID_HEADER } from './correlation-id.interceptor';

/** Normalise les erreurs de l'API sans exposer un corps technique ou une stack trace. */
export const apiProblemInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(CNPM_API_BASE_URL);
  if (!isCnpmApiRequest(request.url, baseUrl)) {
    return next(request);
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const correlationId = request.headers.get(CORRELATION_ID_HEADER) ?? '';
      return throwError(() => mapHttpError(error, correlationId));
    }),
  );
};
