import { registerLocaleData } from '@angular/common';
import localeFrMl from '@angular/common/locales/fr-ML';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { CNPM_ACCESS_TOKEN } from './core/api/access-token';
import { provideCnpmApi, readCnpmRuntimeConfig } from './core/api/api.config';
import { apiProblemInterceptor } from './core/api/api-problem.interceptor';
import { bearerAuthInterceptor } from './core/api/bearer.interceptor';
import { correlationIdInterceptor } from './core/api/correlation-id.interceptor';
import { CNPM_OIDC_CONFIG, readOidcConfig } from './core/auth/oidc.config';
import { NativeSessionStore } from './core/auth/native-session.store';
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
    // Configuration OIDC lue du même bloc runtime, remplaçable au déploiement. L'URI de
    // redirection dérive de l'origine et doit correspondre à celle enregistrée côté Keycloak.
    {
      provide: CNPM_OIDC_CONFIG,
      useFactory: () =>
        readOidcConfig(
          (globalThis as Record<string, unknown>)['__CNPM_RUNTIME_CONFIG__'],
          globalThis.location?.origin ?? '',
        ),
    },
    // Le jeton d'accès vient de la session NATIVE (AUTH-DEC-020), alimentée après un second
    // facteur validé. En démo, aucune session n'est ouverte : le fournisseur renvoie `null`
    // et l'intercepteur Bearer n'ajoute rien.
    {
      provide: CNPM_ACCESS_TOKEN,
      useFactory: () => {
        const session = inject(NativeSessionStore);
        return () => session.current();
      },
    },
    provideCnpmIcons(),
    { provide: LOCALE_ID, useValue: 'fr-ML' },
  ],
};
