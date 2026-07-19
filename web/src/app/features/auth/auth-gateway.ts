import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** Espace d'authentification choisi ; modifie la destination, pas les libellés de sécurité. */
export type AuthSpace = 'admin' | 'member';

export interface CredentialsRequest {
  readonly space: AuthSpace;
  readonly email: string;
  readonly password: string;
  /** Consentement explicite à mémoriser l'appareil ; jamais implicite. */
  readonly rememberDevice: boolean;
}

/** Résultat neutre : ne révèle jamais si l'adresse existe (pattern 2FA du handoff). */
export type CredentialsResult =
  | { readonly outcome: 'mfa-required'; readonly challengeId: string }
  | { readonly outcome: 'invalid' }
  /** Identité connue mais accès refusé (compte suspendu, espace non autorisé). */
  | { readonly outcome: 'forbidden' };

export type VerificationResult =
  | { readonly outcome: 'authenticated'; readonly redirectTo: string }
  | { readonly outcome: 'invalid-code' };

/**
 * Port d'authentification consommé par les pages AUTH-001.
 *
 * L'implémentation réelle (Keycloak OIDC/PKCE ou endpoint dédié) reste à câbler ;
 * le choix de la mécanique — page de connexion Keycloak hébergée vs formulaire natif
 * relayé — est une décision technique ouverte (voir open-decisions). Les pages ne
 * dépendent que de ce port, jamais d'un transport concret.
 */
export interface AuthGateway {
  submitCredentials(request: CredentialsRequest): Observable<CredentialsResult>;
  /**
   * `space` est indispensable ici : sans lui l'adaptateur ne peut pas honorer la
   * destination annoncée par `AuthSpace` et renvoie une cible unique, quel que soit
   * l'espace choisi à l'étape identifiants.
   */
  verifyCode(challengeId: string, code: string, space: AuthSpace): Observable<VerificationResult>;
  resendCode(challengeId: string): Observable<void>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
