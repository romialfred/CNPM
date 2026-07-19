import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../../core/api/api.config';
import { SESSION_GATEWAY } from '../../../../layout/admin-shell/session-gateway';

/** Garde d'affordance ; le backend reste l'unique frontière d'autorisation. */
export const contributionGenerateGuard: CanActivateFn = () => {
  if (inject(CNPM_DATA_MODE) === 'demo') return true;

  const router = inject(Router);
  return inject(SESSION_GATEWAY).identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('CONTRIBUTION.GENERATE')
        ? true
        : router.createUrlTree(['/admin/contributions']),
    ),
    catchError(() => of(router.createUrlTree(['/admin/contributions']))),
  );
};

