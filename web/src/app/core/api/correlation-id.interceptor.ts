import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { CNPM_API_BASE_URL, isCnpmApiRequest } from './api.config';
import { CNPM_UUID_FACTORY } from './request-id';

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';

/**
 * La corrélation est ajoutée uniquement à l'API CNPM. Elle ne doit pas modifier les
 * appels d'actifs ou les échanges OIDC gérés par le futur client d'identité.
 */
export const correlationIdInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(CNPM_API_BASE_URL);
  if (!isCnpmApiRequest(request.url, baseUrl)) {
    return next(request);
  }

  const uuidFactory = inject(CNPM_UUID_FACTORY);
  const correlationId = request.headers.get(CORRELATION_ID_HEADER) ?? uuidFactory();
  return next(
    request.clone({
      setHeaders: { [CORRELATION_ID_HEADER]: correlationId },
    }),
  );
};
