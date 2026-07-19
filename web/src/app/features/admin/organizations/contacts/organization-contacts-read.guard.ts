import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { SESSION_GATEWAY } from '../../../../layout/admin-shell/session-gateway';

/** BO-007 : projection UX fail-closed de la permission serveur MEMBER.READ. */
export const organizationContactsReadGuard: CanActivateFn = () => {
  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);
  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('MEMBER.READ')
        ? true
        : router.createUrlTree(['/admin/dashboard']),
    ),
    catchError(() => of(router.createUrlTree(['/admin/dashboard']))),
  );
};
