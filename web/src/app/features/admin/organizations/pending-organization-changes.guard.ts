import type { CanDeactivateFn } from '@angular/router';
import type { OrganizationEditPage } from './organization-edit.page';

export const pendingOrganizationChangesGuard: CanDeactivateFn<OrganizationEditPage> = (page) =>
  page.confirmNavigation();
