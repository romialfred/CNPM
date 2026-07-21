import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CNPM_OIDC_CONFIG, oidcEndpoints } from './oidc.config';
import { createPkcePair, randomToken } from './pkce';

/** Réponse du point `token` de Keycloak (RFC 6749). */
interface TokenResponse {
  readonly access_token: string;
  readonly refresh_token?: string;
  readonly expires_in: number;
}

/** Ce que le navigateur met de côté le temps de la redirection, jamais un jeton. */
interface PendingAuthorization {
  readonly verifier: string;
  readonly state: string;
  readonly targetUrl: string;
}

const STORAGE_KEY = 'cnpm.oidc.pending';
/** Marge avant expiration : on considère le jeton mort un peu avant l'heure réelle. */
const EXPIRY_SKEW_MS = 15_000;

/**
 * Client OIDC Authorization Code + PKCE face à Keycloak (ADR-003).
 *
 * L'application ne relaie AUCUN mot de passe : la connexion se fait par redirection vers
 * la page hébergée par Keycloak, qui gère aussi l'enrôlement TOTP obligatoire. Au retour,
 * le code d'autorisation est échangé contre un jeton avec le vérificateur PKCE.
 *
 * Les jetons vivent EN MÉMOIRE, jamais dans `localStorage` : un jeton persistant est une
 * cible d'attaque XSS. Seuls le vérificateur et le `state` transitent par `sessionStorage`
 * le temps de la redirection — aucun secret durable.
 *
 * Le `state` est vérifié au retour : un code présenté avec un `state` inattendu est un
 * rejeu ou une injection, et il est rejeté (protection CSRF, RFC 6749 §10.12).
 */
@Injectable({ providedIn: 'root' })
export class OidcSessionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CNPM_OIDC_CONFIG);

  private readonly accessToken = signal<string | null>(null);
  private readonly refreshToken = signal<string | null>(null);
  private readonly expiresAt = signal<number>(0);

  /** Vrai lorsqu'un jeton valide (non expiré) est détenu. */
  readonly authenticated = signal(false);

  /** Jeton d'accès courant, ou `null` s'il est absent ou expiré. Alimente l'intercepteur. */
  currentAccessToken(): string | null {
    const token = this.accessToken();
    if (!token || Date.now() >= this.expiresAt() - EXPIRY_SKEW_MS) {
      return null;
    }
    return token;
  }

  /** URL d'autorisation Keycloak. Séparée pour être testable sans redirection réelle. */
  buildAuthorizeUrl(challenge: string, state: string): string {
    const params = new HttpParams({
      fromObject: {
        response_type: 'code',
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        scope: this.config.scope,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      },
    });
    return `${oidcEndpoints(this.config).authorize}?${params.toString()}`;
  }

  /**
   * Démarre la connexion : prépare PKCE et `state`, les met de côté, puis redirige vers
   * Keycloak. `redirect` est surchargeable pour les tests.
   */
  async login(targetUrl = '/', redirect: (url: string) => void = defaultRedirect): Promise<void> {
    const pair = await createPkcePair();
    const state = randomToken();
    this.stash({ verifier: pair.verifier, state, targetUrl });
    redirect(this.buildAuthorizeUrl(pair.challenge, state));
  }

  /**
   * Traite le retour de Keycloak : valide le `state`, échange le code contre un jeton.
   * Renvoie l'URL cible d'origine. Lève si le `state` ne correspond pas ou si l'échange
   * échoue — le composant de callback traduit alors l'échec en écran de connexion.
   */
  async handleCallback(params: {
    readonly code?: string | null;
    readonly state?: string | null;
    readonly error?: string | null;
  }): Promise<string> {
    const pending = this.readStash();
    this.clearStash();
    if (params.error) {
      throw new Error(`Échec de l'autorisation : ${params.error}`);
    }
    if (!params.code || !pending || params.state !== pending.state) {
      throw new Error('Réponse d’autorisation invalide ou non sollicitée.');
    }
    const body = new HttpParams({
      fromObject: {
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        code: params.code,
        redirect_uri: this.config.redirectUri,
        code_verifier: pending.verifier,
      },
    });
    const response = await firstValueFrom(
      this.http.post<TokenResponse>(oidcEndpoints(this.config).token, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
    this.storeTokens(response);
    return pending.targetUrl;
  }

  /** Rafraîchit le jeton d'accès. Vide la session si le rafraîchissement est refusé. */
  async refresh(): Promise<boolean> {
    const token = this.refreshToken();
    if (!token) {
      return false;
    }
    const body = new HttpParams({
      fromObject: {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        refresh_token: token,
      },
    });
    try {
      const response = await firstValueFrom(
        this.http.post<TokenResponse>(oidcEndpoints(this.config).token, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
      this.storeTokens(response);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  /** Vide la session locale et redirige vers la fin de session Keycloak. */
  logout(redirect: (url: string) => void = defaultRedirect): void {
    this.clearSession();
    const params = new HttpParams({
      fromObject: {
        client_id: this.config.clientId,
        post_logout_redirect_uri: this.config.postLogoutRedirectUri,
      },
    });
    redirect(`${oidcEndpoints(this.config).endSession}?${params.toString()}`);
  }

  private storeTokens(response: TokenResponse): void {
    this.accessToken.set(response.access_token);
    this.refreshToken.set(response.refresh_token ?? null);
    this.expiresAt.set(Date.now() + response.expires_in * 1000);
    this.authenticated.set(true);
  }

  private clearSession(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.expiresAt.set(0);
    this.authenticated.set(false);
  }

  private stash(pending: PendingAuthorization): void {
    globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(pending));
  }

  private readStash(): PendingAuthorization | null {
    const raw = globalThis.sessionStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as PendingAuthorization;
      return parsed.verifier && parsed.state ? parsed : null;
    } catch {
      return null;
    }
  }

  private clearStash(): void {
    globalThis.sessionStorage?.removeItem(STORAGE_KEY);
  }
}

/** Redirection par défaut du navigateur, isolée pour être remplacée en test. */
function defaultRedirect(url: string): void {
  globalThis.location?.assign(url);
}
