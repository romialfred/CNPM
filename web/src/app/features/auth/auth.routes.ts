import type { Routes } from '@angular/router';
import { AUTH_GATEWAY } from './auth-gateway';
import { DemoAuthGateway } from './demo-auth.gateway';

/**
 * Routes AUTH-001, chargées à la demande.
 *
 * Le port `AUTH_GATEWAY` est fourni ici avec l'adaptateur de démonstration
 * déterministe. Le remplacer par l'adaptateur Keycloak réel ne touchera que ce
 * point d'assemblage, jamais les pages.
 */
export const authRoutes: Routes = [
  {
    path: 'auth',
    providers: [{ provide: AUTH_GATEWAY, useClass: DemoAuthGateway }],
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
