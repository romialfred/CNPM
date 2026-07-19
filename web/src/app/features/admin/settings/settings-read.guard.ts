import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';

/**
 * Garde d'expérience pour BO-033. Le backend reste seul juge de
 * `ADMIN.REFERENTIAL.READ`; ce garde évite seulement d'ouvrir une rubrique absente
 * de la projection de session.
 */
export const settingsReadGuard: CanActivateFn = () => {
  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);
  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('ADMIN.REFERENTIAL.READ')
        ? true
        : router.createUrlTree(['/admin/dashboard']),
    ),
    // Une panne de projection ne devient pas un faux refus : l'API tranchera.
    catchError(() => of(true)),
  );
};
