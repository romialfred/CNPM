import { TestBed } from '@angular/core/testing';

import {
  buildCnpmApiUrl,
  CNPM_API_BASE_URL,
  DEFAULT_CNPM_API_BASE_URL,
  isCnpmApiRequest,
  normalizeApiBaseUrl,
  provideCnpmApi,
} from './api.config';

describe('configuration API CNPM', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('fournit la racine canonique /v1 par défaut', () => {
    TestBed.configureTestingModule({ providers: [provideCnpmApi()] });
    expect(TestBed.inject(CNPM_API_BASE_URL)).toBe(DEFAULT_CNPM_API_BASE_URL);
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
});
