import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../../core/api/api.config';
import { SESSION_GATEWAY } from '../../../../layout/admin-shell/session-gateway';

/** En HTTP, BO-015 exige le droit d'enregistrer avant même d'exposer le dépôt. */
export const bankStatementImportGuard: CanActivateFn = () => {
  if (inject(CNPM_DATA_MODE) === 'demo') return true;
  const router = inject(Router);
  return inject(SESSION_GATEWAY).identity.pipe(
    take(1),
    map((identity) =>
      identity?.permissions.includes('PAYMENT.RECORD')
        ? true
        : router.createUrlTree(['/admin/payments/reconciliation']),
    ),
    catchError(() => of(router.createUrlTree(['/admin/payments/reconciliation']))),
  );
};

