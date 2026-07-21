import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { CNPM_DATA_MODE } from '../../core/api/api.config';
import { AUTH_GATEWAY } from './auth-gateway';
import { DemoAuthGateway } from './demo-auth.gateway';
import { UnavailableAuthGateway } from './unavailable-auth.gateway';
import type { BlockedAuthContent } from './blocked-auth.page';

const BLOCKED_AUTH_SCREENS = {
  method: {
    screenId: 'AUTH-003',
    eyebrow: 'Vérification renforcée',
    title: 'Choix de la méthode 2FA',
    description:
      "Le choix d'une autre méthode sera disponible après validation des facteurs autorisés pour votre profil.",
    decision: 'Méthodes alternatives et codes de secours à valider par la DSI et la Sécurité.',
  },
  forgot: {
    screenId: 'AUTH-004',
    eyebrow: 'Accès au compte',
    title: 'Mot de passe oublié',
    description:
      "La récupération sera activée lorsque le CNPM aura choisi le parcours du fournisseur d'identité et son canal d'assistance.",
    decision:
      'Destination Keycloak ou parcours CNPM natif, ainsi que le canal de support, à arbitrer.',
  },
  reset: {
    screenId: 'AUTH-005',
    eyebrow: 'Accès au compte',
    title: 'Réinitialiser le mot de passe',
    description:
      "Aucun jeton de réinitialisation n'est accepté par l'application tant que le flux d'identité n'est pas provisionné.",
    decision:
      "Cycle de vie, durée et validation des jetons à porter par le fournisseur d'identité.",
  },
  activate: {
    screenId: 'AUTH-006',
    eyebrow: 'Première connexion',
    title: 'Activation du compte',
    description:
      "L'activation en libre-service reste fermée jusqu'au raccordement du fournisseur d'identité et des invitations CNPM.",
    decision: "Canal d'invitation, preuve d'identité et durée du lien à valider.",
  },
} as const satisfies Record<string, BlockedAuthContent>;

/**
 * Routes AUTH-001, chargées à la demande.
 *
 * Le profil démo utilise l'adaptateur déterministe. Le profil HTTP reste fermé tant
 * que le client OIDC/PKCE Keycloak n'est pas livré ; aucun mot de passe n'est relayé
 * vers une API native improvisée.
 */
export const authRoutes: Routes = [
  {
    path: '',
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
        path: 'verify/method',
        loadComponent: () => import('./blocked-auth.page').then((module) => module.BlockedAuthPage),
        title: 'Méthode de vérification — CNPM',
        data: { blockedAuth: BLOCKED_AUTH_SCREENS.method },
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./blocked-auth.page').then((module) => module.BlockedAuthPage),
        title: 'Mot de passe oublié — CNPM',
        data: { blockedAuth: BLOCKED_AUTH_SCREENS.forgot },
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./blocked-auth.page').then((module) => module.BlockedAuthPage),
        title: 'Réinitialiser le mot de passe — CNPM',
        data: { blockedAuth: BLOCKED_AUTH_SCREENS.reset },
      },
      {
        path: 'activate',
        loadComponent: () => import('./blocked-auth.page').then((module) => module.BlockedAuthPage),
        title: 'Activer le compte — CNPM',
        data: { blockedAuth: BLOCKED_AUTH_SCREENS.activate },
      },
      {
        // AUTH-007 : enrôlement du second facteur à la première connexion. En mode démo,
        // le port fournit un défi jouable ; en mode HTTP, il reste indisponible tant que
        // le client OIDC/PKCE Keycloak n'est pas livré, et la popup l'annonce proprement.
        path: '2fa-enrollment',
        loadComponent: () =>
          import('./two-factor-enrollment.page').then((m) => m.TwoFactorEnrollmentPage),
        title: 'Enrôlement 2FA — CNPM',
      },
      {
        // Retour de la redirection OIDC Keycloak : échange le code contre un jeton.
        path: 'callback',
        loadComponent: () =>
          import('./oidc-callback.page').then((m) => m.OidcCallbackPage),
        title: 'Connexion — CNPM',
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
