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
  /**
   * Identifiants valides mais second facteur PAS ENCORE activé (première connexion) :
   * l'accès complet est bloqué et l'application conduit à l'enrôlement forcé. Traduit le
   * scénario « à la connexion, si 2FA non activé → afficher automatiquement la popup ».
   * En production, ce forçage est porté par Keycloak (ADR-003) ; ici l'issue pilote le
   * parcours applicatif/démo.
   */
  | { readonly outcome: 'enrollment-required' }
  | { readonly outcome: 'invalid' }
  /** Identité connue mais accès refusé (compte suspendu, espace non autorisé). */
  | { readonly outcome: 'forbidden' };

export type VerificationResult =
  | { readonly outcome: 'authenticated'; readonly redirectTo: string }
  | { readonly outcome: 'invalid-code' };

/**
 * Défi d'enrôlement TOTP présenté à la première connexion.
 *
 * Le secret et le QR proviennent du fournisseur d'identité (Keycloak, ADR-003) :
 * l'application ne les FABRIQUE ni ne les STOCKE, elle ne fait qu'afficher ce que la
 * source lui remet. `qrImage` est une image prête à peindre (data URI), jamais le secret
 * brut ; `manualKey` est la même clé sous forme saisissable, pour les lecteurs qui ne
 * peuvent pas scanner. C'est pourquoi aucune bibliothèque de génération de QR ne vit
 * côté client : la génération appartient à Keycloak.
 */
export interface TotpEnrollment {
  readonly enrollmentId: string;
  /** Image du QR, data URI. Fournie par Keycloak ; l'app ne l'encode pas. */
  readonly qrImage: string;
  /** Clé à saisir manuellement dans l'application d'authentification. */
  readonly manualKey: string;
  /** Émetteur affiché dans l'application d'authentification, par ex. « CNPM ». */
  readonly issuer: string;
  /** Compte auquel le facteur est rattaché (adresse ou identifiant). */
  readonly account: string;
}

/**
 * Résultat de l'activation. `invalid-code` n'est pas une erreur technique : c'est un
 * code qui ne correspond pas, et l'écran le distingue d'une panne pour proposer la
 * bonne suite (ressaisir vs réessayer plus tard).
 */
export type TotpActivationResult =
  | { readonly outcome: 'activated'; readonly redirectTo: string }
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

  /**
   * Ouvre un enrôlement TOTP. La destination après activation ne dépend pas de cette
   * étape mais de `activateTotp`, à qui `space` est passé.
   */
  beginTotpEnrollment(): Observable<TotpEnrollment>;

  /** Confirme l'activation avec le premier code produit par l'application d'authentification. */
  activateTotp(
    enrollmentId: string,
    code: string,
    space: AuthSpace,
  ): Observable<TotpActivationResult>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
