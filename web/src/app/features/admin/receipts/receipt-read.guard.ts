import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';

/**
 * Garde d'affordance de BO-016. Le mode démo est un registre local sans action ; le
 * mode HTTP exige `RECEIPT.READ`. Une panne de projection ferme l'accès, tandis que
 * le backend reste la frontière de sécurité et de périmètre.
 */
export const receiptReadGuard: CanActivateFn = () => {
  if (inject(CNPM_DATA_MODE) === 'demo') return true;

  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);
  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('RECEIPT.READ')
        ? true
        : router.createUrlTree(['/admin/dashboard']),
    ),
    catchError(() => of(router.createUrlTree(['/admin/dashboard']))),
  );
};
