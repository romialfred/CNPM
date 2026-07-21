import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { CNPM_ACCESS_TOKEN, type AccessTokenProvider } from './access-token';
import { provideCnpmApi } from './api.config';
import { bearerAuthInterceptor } from './bearer.interceptor';

const JETON = 'jeton-acces-keycloak';

function setup(tokenProvider: AccessTokenProvider) {
  TestBed.configureTestingModule({
    providers: [
      provideCnpmApi(),
      provideHttpClient(withInterceptors([bearerAuthInterceptor])),
      provideHttpClientTesting(),
      { provide: CNPM_ACCESS_TOKEN, useValue: tokenProvider },
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    controller: TestBed.inject(HttpTestingController),
  };
}

describe('bearerAuthInterceptor', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('ajoute le jeton Bearer aux appels de l’API CNPM', async () => {
    const { http, controller } = setup(() => JETON);
    const promise = firstValueFrom(http.get('/v1/auth/me'));
    const request = controller.expectOne('/v1/auth/me');

    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${JETON}`);
    request.flush({});
    await promise;
    controller.verify();
  });

  it('n’ajoute aucun en-tête quand aucune session n’est ouverte (mode démo)', async () => {
    const { http, controller } = setup(() => null);
    const promise = firstValueFrom(http.get('/v1/auth/me'));
    const request = controller.expectOne('/v1/auth/me');

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    await promise;
    controller.verify();
  });

  it('n’expédie jamais le jeton hors de l’API CNPM', async () => {
    // Un jeton d'API envoyé à Keycloak ou à un CDN d'actifs serait une fuite.
    const { http, controller } = setup(() => JETON);
    const promise = firstValueFrom(http.get('https://keycloak.example/realms/cnpm/protocol/openid-connect/token'));
    const request = controller.expectOne(
      'https://keycloak.example/realms/cnpm/protocol/openid-connect/token',
    );

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    await promise;
    controller.verify();
  });

  it('n’écrase pas un en-tête Authorization déjà posé par l’appelant', async () => {
    const { http, controller } = setup(() => JETON);
    const promise = firstValueFrom(
      http.get('/v1/auth/me', { headers: { Authorization: 'Bearer autre' } }),
    );
    const request = controller.expectOne('/v1/auth/me');

    expect(request.request.headers.get('Authorization')).toBe('Bearer autre');
    request.flush({});
    await promise;
    controller.verify();
  });

  it('lit le jeton à chaque requête, pour honorer un rafraîchissement', async () => {
    let jeton = 'premier';
    const { http, controller } = setup(() => jeton);

    const p1 = firstValueFrom(http.get('/v1/auth/me'));
    const r1 = controller.expectOne('/v1/auth/me');
    expect(r1.request.headers.get('Authorization')).toBe('Bearer premier');
    r1.flush({});
    await p1;

    jeton = 'rafraichi';
    const p2 = firstValueFrom(http.get('/v1/auth/me'));
    const r2 = controller.expectOne('/v1/auth/me');
    expect(r2.request.headers.get('Authorization')).toBe('Bearer rafraichi');
    r2.flush({});
    await p2;
    controller.verify();
  });
});
