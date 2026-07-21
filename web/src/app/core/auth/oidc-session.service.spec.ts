import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CNPM_OIDC_CONFIG, type OidcConfig } from './oidc.config';
import { OidcSessionService } from './oidc-session.service';

const CONFIG: OidcConfig = {
  issuer: 'https://iam.cnpm.ml/realms/cnpm',
  clientId: 'cnpm-web',
  redirectUri: 'https://app.cnpm.ml/auth/callback',
  postLogoutRedirectUri: 'https://app.cnpm.ml/auth/login',
  scope: 'openid profile email',
};
const TOKEN_URL = 'https://iam.cnpm.ml/realms/cnpm/protocol/openid-connect/token';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: CNPM_OIDC_CONFIG, useValue: CONFIG },
    ],
  });
  return {
    service: TestBed.inject(OidcSessionService),
    controller: TestBed.inject(HttpTestingController),
  };
}

describe('OidcSessionService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    globalThis.sessionStorage?.clear();
  });
  afterEach(() => globalThis.sessionStorage?.clear());

  it('démarre sans jeton', () => {
    const { service } = setup();
    expect(service.currentAccessToken()).toBeNull();
    expect(service.authenticated()).toBe(false);
  });

  it('construit une URL d’autorisation PKCE S256 complète', () => {
    const { service } = setup();
    const url = new URL(service.buildAuthorizeUrl('defi', 'etat-123'));
    expect(url.origin + url.pathname).toBe(
      'https://iam.cnpm.ml/realms/cnpm/protocol/openid-connect/auth',
    );
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('cnpm-web');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.cnpm.ml/auth/callback');
    expect(url.searchParams.get('code_challenge')).toBe('defi');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe('etat-123');
  });

  it('met de côté PKCE et state avant de rediriger', async () => {
    const { service } = setup();
    const redirect = vi.fn();
    await service.login('/admin/dashboard', redirect);

    expect(redirect).toHaveBeenCalledOnce();
    const pending = JSON.parse(globalThis.sessionStorage.getItem('cnpm.oidc.pending') ?? '{}');
    expect(pending.verifier).toBeTruthy();
    expect(pending.state).toBeTruthy();
    expect(pending.targetUrl).toBe('/admin/dashboard');
    // Le state redirigé est bien celui mis de côté, socle du contrôle anti-rejeu.
    const url = new URL((redirect.mock.calls[0] as string[])[0]);
    expect(url.searchParams.get('state')).toBe(pending.state);
  });

  it('échange le code contre un jeton et l’expose ensuite', async () => {
    const { service, controller } = setup();
    const redirect = vi.fn();
    await service.login('/member/home', redirect);
    const state = JSON.parse(
      globalThis.sessionStorage.getItem('cnpm.oidc.pending') ?? '{}',
    ).state as string;

    const promise = service.handleCallback({ code: 'code-abc', state });
    const request = controller.expectOne(TOKEN_URL);
    expect(request.request.body.toString()).toContain('grant_type=authorization_code');
    expect(request.request.body.toString()).toContain('code_verifier=');
    request.flush({ access_token: 'jeton-1', refresh_token: 'refresh-1', expires_in: 300 });

    await expect(promise).resolves.toBe('/member/home');
    expect(service.currentAccessToken()).toBe('jeton-1');
    expect(service.authenticated()).toBe(true);
  });

  it('rejette un retour dont le state ne correspond pas (anti-rejeu)', async () => {
    const { service } = setup();
    const redirect = vi.fn();
    await service.login('/', redirect);

    await expect(
      service.handleCallback({ code: 'code-abc', state: 'state-fabrique' }),
    ).rejects.toThrow();
  });

  it('considère un jeton expiré comme absent', async () => {
    const { service, controller } = setup();
    const redirect = vi.fn();
    await service.login('/', redirect);
    const state = JSON.parse(
      globalThis.sessionStorage.getItem('cnpm.oidc.pending') ?? '{}',
    ).state as string;

    const promise = service.handleCallback({ code: 'code-abc', state });
    // Déjà expiré (marge de sécurité comprise) : le port ne doit pas le livrer.
    controller.expectOne(TOKEN_URL).flush({ access_token: 'jeton', expires_in: 0 });
    await promise;

    expect(service.currentAccessToken()).toBeNull();
  });

  it('vide la session et redirige à la déconnexion', () => {
    const { service } = setup();
    const redirect = vi.fn();
    service.logout(redirect);
    expect(redirect).toHaveBeenCalledOnce();
    expect((redirect.mock.calls[0] as string[])[0]).toContain(
      'protocol/openid-connect/logout',
    );
    expect(service.currentAccessToken()).toBeNull();
  });
});
