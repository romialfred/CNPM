import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';

/**
 * Garde d'expérience de BO-021/022. Le mode démo est un bac à sable sans mutation
 * réseau ; en mode HTTP, la projection de session doit porter `REQUEST.READ`.
 * Le backend reste dans tous les cas la frontière de sécurité et de périmètre.
 */
export const requestReadGuard: CanActivateFn = () => {
  if (inject(CNPM_DATA_MODE) === 'demo') return true;

  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);
  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('REQUEST.READ')
        ? true
        : router.createUrlTree(['/admin/dashboard']),
    ),
    catchError(() => of(router.createUrlTree(['/admin/dashboard']))),
  );
};
