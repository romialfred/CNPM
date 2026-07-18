import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { CNPM_DATA_MODE } from '../../core/api/api.config';
import { AUTH_GATEWAY } from './auth-gateway';
import { DemoAuthGateway } from './demo-auth.gateway';
import { UnavailableAuthGateway } from './unavailable-auth.gateway';

/**
 * Routes AUTH-001, chargées à la demande.
 *
 * Le profil démo utilise l'adaptateur déterministe. Le profil HTTP reste fermé tant
 * que le client OIDC/PKCE Keycloak n'est pas livré ; aucun mot de passe n'est relayé
 * vers une API native improvisée.
 */
export const authRoutes: Routes = [
  {
    path: 'auth',
    providers: [
      DemoAuthGateway,
      UnavailableAuthGateway,
      {
        provide: AUTH_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoAuthGateway)
            : inject(UnavailableAuthGateway),
      },
    ],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login.page').then((m) => m.LoginPage),
        title: 'Connexion — CNPM',
      },
      {
        path: 'verify',
        loadComponent: () => import('./verify.page').then((m) => m.VerifyPage),
        title: 'Vérification — CNPM',
      },
      {
        // AUTH-008 : atteint après expiration de session. Aucun garde de gateway —
        // c'est un écran d'information, pas une étape d'authentification.
        path: 'session-ended',
        loadComponent: () => import('./session-ended.page').then((m) => m.SessionEndedPage),
        title: 'Session expirée — CNPM',
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];
