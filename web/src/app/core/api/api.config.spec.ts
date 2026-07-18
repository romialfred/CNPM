import { TestBed } from '@angular/core/testing';

import {
  buildCnpmApiUrl,
  CNPM_API_BASE_URL,
  CNPM_DATA_MODE,
  DEFAULT_CNPM_API_BASE_URL,
  isCnpmApiRequest,
  normalizeApiBaseUrl,
  provideCnpmApi,
  readCnpmRuntimeConfig,
} from './api.config';

describe('configuration API CNPM', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('fournit la racine canonique /v1 par défaut', () => {
    TestBed.configureTestingModule({ providers: [provideCnpmApi()] });
    expect(TestBed.inject(CNPM_API_BASE_URL)).toBe(DEFAULT_CNPM_API_BASE_URL);
    expect(TestBed.inject(CNPM_DATA_MODE)).toBe('http');
  });

  it('active les fixtures uniquement lorsque le bootstrap le demande explicitement', () => {
    TestBed.configureTestingModule({ providers: [provideCnpmApi({ dataMode: 'demo' })] });
    expect(TestBed.inject(CNPM_DATA_MODE)).toBe('demo');
  });

  it('accepte une racine d’environnement absolue et retire le slash terminal', () => {
    TestBed.configureTestingModule({
      providers: [provideCnpmApi({ baseUrl: 'https://sandbox.cnpm.test/v1/' })],
    });
    expect(TestBed.inject(CNPM_API_BASE_URL)).toBe('https://sandbox.cnpm.test/v1');
  });

  it('construit une URL sans créer de double slash', () => {
    expect(buildCnpmApiUrl('/v1/', '/members?page=0')).toBe('/v1/members?page=0');
  });

  it('ne confond pas /v1 avec une route ou un hôte tiers', () => {
    expect(isCnpmApiRequest('/v1/members', '/v1')).toBe(true);
    expect(isCnpmApiRequest('/v10/members', '/v1')).toBe(false);
    expect(isCnpmApiRequest('https://identity.test/v1/members', '/v1')).toBe(false);
  });

  it('refuse une racine vide', () => {
    expect(() => normalizeApiBaseUrl(' / ')).toThrow(/ne peut pas être vide/);
  });

  it('lit un profil de déploiement sans dépendre du stockage navigateur', () => {
    expect(
      readCnpmRuntimeConfig({
        __CNPM_RUNTIME_CONFIG__: { dataMode: 'http', baseUrl: 'https://api.test/v1' },
      }),
    ).toEqual({ dataMode: 'http', baseUrl: 'https://api.test/v1' });
  });

  it('refuse un mode runtime inconnu au lieu de basculer vers les fixtures', () => {
    expect(() =>
      readCnpmRuntimeConfig({ __CNPM_RUNTIME_CONFIG__: { dataMode: 'fallback-demo' } }),
    ).toThrow(/http.*demo/);
  });
});
