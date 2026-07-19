import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';

/**
 * Garde d'expérience pour BO-024/025. Le backend reste la frontière de sécurité ;
 * ce garde évite seulement d'ouvrir une rubrique absente de la session courante.
 */
export const groupReadGuard: CanActivateFn = () => {
  const session = inject(SESSION_GATEWAY);
  const router = inject(Router);
  return session.identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('GROUP.READ')
        ? true
        : router.createUrlTree(['/admin/dashboard']),
    ),
    // Une panne de projection de session ne se transforme pas en faux refus : l'API
    // garde l'opération et la page rendra son état normalisé.
    catchError(() => of(true)),
  );
};
