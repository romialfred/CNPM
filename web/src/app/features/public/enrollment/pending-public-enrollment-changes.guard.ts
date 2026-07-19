import type { CanDeactivateFn } from '@angular/router';
import type { PublicEnrollmentPage } from './public-enrollment.page';

/** Bloque une sortie Angular tant que la saisie locale n'a pas été arbitrée. */
export const pendingPublicEnrollmentChangesGuard: CanDeactivateFn<PublicEnrollmentPage> = (page) =>
  page.confirmNavigation();
