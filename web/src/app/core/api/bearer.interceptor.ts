import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { CNPM_ACCESS_TOKEN } from './access-token';
import { CNPM_API_BASE_URL, isCnpmApiRequest } from './api.config';

/**
 * Ajoute `Authorization: Bearer <jeton>` aux seuls appels de l'API CNPM.
 *
 * Trois gardes, chacune évitant une fuite ou une régression :
 *
 * - la cible : seul le domaine de l'API CNPM reçoit le jeton. Les échanges OIDC avec
 *   Keycloak et les requêtes d'actifs ne doivent JAMAIS le porter — un jeton d'API
 *   envoyé à un tiers est une fuite ;
 * - l'en-tête déjà présent : si un appelant a posé son propre `Authorization`
 *   (rafraîchissement, cas particulier), on ne l'écrase pas ;
 * - l'absence de session : sans jeton, aucun en-tête n'est ajouté. La démo, qui n'ouvre
 *   pas de session, continue exactement comme avant.
 *
 * Le jeton est lu À CHAQUE requête via {@link CNPM_ACCESS_TOKEN}, jamais mémorisé : un
 * jeton rafraîchi doit prendre effet immédiatement.
 */
export const bearerAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(CNPM_API_BASE_URL);
  if (!isCnpmApiRequest(request.url, baseUrl)) {
    return next(request);
  }
  if (request.headers.has('Authorization')) {
    return next(request);
  }
  const token = inject(CNPM_ACCESS_TOKEN)();
  if (!token) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
