import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';

/**
 * Garde d'expérience de BO-038 pour la permission consultative `OPS.MONITOR.READ`.
 *
 * Cette projection de session masque aussi l'accès direct quand le droit manque ou
 * ne peut pas être vérifié. Elle n'accorde aucune capacité `INTEGRATION.*` et ne
 * remplace jamais le contrôle d'autorisation du futur endpoint backend.
 */
export const integrationsReadGuard: CanActivateFn = () => {
  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);

  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('OPS.MONITOR.READ')
        ? true
        : router.createUrlTree(['/admin/dashboard']),
    ),
    catchError(() => of(router.createUrlTree(['/admin/dashboard']))),
  );
};
