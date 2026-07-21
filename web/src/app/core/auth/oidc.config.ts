import { InjectionToken } from '@angular/core';

/**
 * Configuration OIDC du client public CNPM.
 *
 * Lue au démarrage depuis `__CNPM_RUNTIME_CONFIG__.oidc`, remplaçable au déploiement
 * sans recompiler. Aucune valeur sensible : un client public n'a pas de secret, la
 * sécurité repose sur PKCE et l'URI de redirection enregistrée côté Keycloak.
 */
export interface OidcConfig {
  /** Émetteur, par ex. `https://iam.cnpm.ml/realms/cnpm`. Sans barre finale. */
  readonly issuer: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly postLogoutRedirectUri: string;
  /** Portées demandées ; `openid` est obligatoire. */
  readonly scope: string;
}

export const CNPM_OIDC_CONFIG = new InjectionToken<OidcConfig>('CNPM_OIDC_CONFIG');

/** Points d'accès dérivés de l'émetteur, sans découverte réseau au démarrage. */
export function oidcEndpoints(config: OidcConfig): {
  authorize: string;
  token: string;
  endSession: string;
} {
  const base = `${config.issuer.replace(/\/+$/u, '')}/protocol/openid-connect`;
  return {
    authorize: `${base}/auth`,
    token: `${base}/token`,
    endSession: `${base}/logout`,
  };
}

/**
 * Construit la configuration à partir du bloc runtime et de l'origine courante.
 *
 * L'URI de redirection est dérivée de l'origine : elle DOIT correspondre à celle
 * enregistrée dans Keycloak, faute de quoi l'échange est refusé. `origin` est passé en
 * paramètre pour rester testable sans dépendre de `window`.
 */
export function readOidcConfig(runtime: unknown, origin: string): OidcConfig {
  const source =
    isRecord(runtime) && isRecord(runtime['oidc']) ? (runtime['oidc'] as Record<string, unknown>) : {};
  const issuer = typeof source['issuer'] === 'string' ? source['issuer'] : '';
  const clientId = typeof source['clientId'] === 'string' ? source['clientId'] : 'cnpm-web';
  const scope = typeof source['scope'] === 'string' ? source['scope'] : 'openid profile email';
  return {
    issuer,
    clientId,
    scope,
    redirectUri:
      typeof source['redirectUri'] === 'string'
        ? source['redirectUri']
        : `${origin}/auth/callback`,
    postLogoutRedirectUri:
      typeof source['postLogoutRedirectUri'] === 'string'
        ? source['postLogoutRedirectUri']
        : `${origin}/auth/login`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
