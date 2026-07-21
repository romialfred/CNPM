import { describe, expect, it } from 'vitest';
import { oidcEndpoints, readOidcConfig } from './oidc.config';

describe('OIDC config', () => {
  it('dérive des valeurs par défaut sûres depuis l’origine', () => {
    const config = readOidcConfig({}, 'https://app.cnpm.ml');
    expect(config.clientId).toBe('cnpm-web');
    expect(config.scope).toContain('openid');
    expect(config.redirectUri).toBe('https://app.cnpm.ml/auth/callback');
    expect(config.postLogoutRedirectUri).toBe('https://app.cnpm.ml/auth/login');
  });

  it('respecte les valeurs fournies par le bloc runtime', () => {
    const config = readOidcConfig(
      {
        oidc: {
          issuer: 'https://iam.cnpm.ml/realms/cnpm',
          clientId: 'cnpm-portail',
          scope: 'openid email',
          redirectUri: 'https://app.cnpm.ml/retour',
        },
      },
      'https://app.cnpm.ml',
    );
    expect(config.issuer).toBe('https://iam.cnpm.ml/realms/cnpm');
    expect(config.clientId).toBe('cnpm-portail');
    expect(config.scope).toBe('openid email');
    expect(config.redirectUri).toBe('https://app.cnpm.ml/retour');
  });

  it('construit les points d’accès Keycloak à partir de l’émetteur', () => {
    const endpoints = oidcEndpoints({
      issuer: 'https://iam.cnpm.ml/realms/cnpm/',
      clientId: 'cnpm-web',
      redirectUri: 'x',
      postLogoutRedirectUri: 'y',
      scope: 'openid',
    });
    expect(endpoints.authorize).toBe(
      'https://iam.cnpm.ml/realms/cnpm/protocol/openid-connect/auth',
    );
    expect(endpoints.token).toBe(
      'https://iam.cnpm.ml/realms/cnpm/protocol/openid-connect/token',
    );
    expect(endpoints.endSession).toBe(
      'https://iam.cnpm.ml/realms/cnpm/protocol/openid-connect/logout',
    );
  });
});
