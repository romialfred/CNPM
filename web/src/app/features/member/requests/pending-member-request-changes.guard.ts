import type { CanDeactivateFn } from '@angular/router';
import type { NewMemberRequestPage } from './new-member-request.page';

/** Protège une saisie locale non soumise lors d'une navigation Angular. */
export const pendingMemberRequestChangesGuard: CanDeactivateFn<NewMemberRequestPage> = (
  component,
) => component.confirmNavigation();
