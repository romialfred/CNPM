import type { CanDeactivateFn } from '@angular/router';
import type { EnrollmentFormPage } from './enrollment-form.page';

/** Empêche toute navigation Angular tant que l'utilisateur n'a pas arbitré ses saisies. */
export const pendingEnrollmentChangesGuard: CanDeactivateFn<EnrollmentFormPage> = (component) =>
  component.confirmNavigation();
