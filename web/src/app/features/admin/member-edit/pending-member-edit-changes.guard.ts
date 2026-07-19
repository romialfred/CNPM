import type { CanDeactivateFn } from '@angular/router';
import type { MemberEditPage } from './member-edit.page';

export const pendingMemberEditChangesGuard: CanDeactivateFn<MemberEditPage> = (page) =>
  page.confirmNavigation();
