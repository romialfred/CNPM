import { registerLocaleData } from '@angular/common';
import localeFrMl from '@angular/common/locales/fr-ML';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideCnpmApi, readCnpmRuntimeConfig } from './core/api/api.config';
import { apiProblemInterceptor } from './core/api/api-problem.interceptor';
import { bearerAuthInterceptor } from './core/api/bearer.interceptor';
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
    // `runtime-config.js` est remplaçable au déploiement sans recompiler le bundle.
    // S'il manque, `provideCnpmApi` ferme en mode HTTP ; aucun échec réseau ne
    // déclenche un repli vers les fixtures.
    provideCnpmApi(readCnpmRuntimeConfig()),
    // Ordre voulu : corrélation puis jeton (préparation de la requête sortante), enfin
    // la normalisation d'erreur, qui doit voir la réponse de toutes les requêtes émises.
    provideHttpClient(
      withInterceptors([correlationIdInterceptor, bearerAuthInterceptor, apiProblemInterceptor]),
    ),
    provideCnpmIcons(),
    { provide: LOCALE_ID, useValue: 'fr-ML' },
  ],
};
