import { registerLocaleData } from '@angular/common';
import localeFrMl from '@angular/common/locales/fr-ML';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideCnpmApi } from './core/api/api.config';
import { apiProblemInterceptor } from './core/api/api-problem.interceptor';
import { correlationIdInterceptor } from './core/api/correlation-id.interceptor';
import { provideCnpmIcons } from './design-system/icon/icon';

// `.claude/rules/ux-ui.md` impose le formatage `fr-ML`. Sans enregistrement explicite,
// Angular n'embarque que la locale `en-US` : tout pipe de formatage échoue à
// l'exécution (NG0701) et n'affiche rien — un chiffre manquant, pas une erreur visible.
registerLocaleData(localeFrMl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideCnpmApi(),
    provideHttpClient(withInterceptors([correlationIdInterceptor, apiProblemInterceptor])),
    provideCnpmIcons(),
    { provide: LOCALE_ID, useValue: 'fr-ML' },
  ],
};
