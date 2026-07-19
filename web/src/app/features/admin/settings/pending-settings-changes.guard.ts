import type { CanDeactivateFn } from '@angular/router';
import type { SettingsPage } from './settings.page';

/** Garde d'expérience ; la route BO-033 doit l'enregistrer à son point d'assemblage. */
export const pendingSettingsChangesGuard: CanDeactivateFn<SettingsPage> = (page) =>
  page.confirmNavigation();
