import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { SESSION_GATEWAY } from '../../layout/admin-shell/session-gateway';

/**
 * Garde d'expérience : le backend reste la frontière de sécurité. Une session
 * explicitement absente retourne à la connexion ; une panne de lecture ne se fait pas
 * passer pour une expiration et laisse les états d'erreur des pages s'afficher.
 */
export const adminSessionGuard: CanActivateFn = (_route, state) => {
  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);
  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity
        ? true
        : router.createUrlTree(['/auth/login'], { queryParams: { retour: state.url } }),
    ),
    catchError(() => of(true)),
  );
};
