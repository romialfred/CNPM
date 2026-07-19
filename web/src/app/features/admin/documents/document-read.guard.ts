import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';

/** Affordance BO-023 ; le backend reste l’unique frontière de permission et de périmètre. */
export const documentReadGuard: CanActivateFn = () => {
  if (inject(CNPM_DATA_MODE) === 'demo') return true;
  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);
  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('DOCUMENT.READ')
        ? true
        : router.createUrlTree(['/admin/dashboard']),
    ),
    catchError(() => of(router.createUrlTree(['/admin/dashboard']))),
  );
};
