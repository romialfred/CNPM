import { registerLocaleData } from '@angular/common';
import localeFrMl from '@angular/common/locales/fr-ML';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideCnpmIcons } from './design-system/icon/icon';

// `.claude/rules/ux-ui.md` impose le formatage `fr-ML`. Sans enregistrement explicite,
// Angular n'embarque que la locale `en-US` : tout pipe de formatage échoue à
// l'exécution (NG0701) et n'affiche rien — un chiffre manquant, pas une erreur visible.
registerLocaleData(localeFrMl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideCnpmIcons(),
    { provide: LOCALE_ID, useValue: 'fr-ML' },
  ],
};
