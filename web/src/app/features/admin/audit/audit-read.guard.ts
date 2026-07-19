import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';

/**
 * Garde d'expérience de BO-032 pour `AUDIT.READ`.
 *
 * Il évite d'ouvrir une destination absente de la projection de session, mais ne
 * remplace jamais `PERM_AUDIT.READ` côté backend. Si cette projection est
 * indisponible, l'appel API reste autorisé à partir et rendra son 401/403 normalisé.
 */
export const auditReadGuard: CanActivateFn = () => {
  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);
  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('AUDIT.READ')
        ? true
        : router.createUrlTree(['/admin/dashboard']),
    ),
    catchError(() => of(true)),
  );
};
