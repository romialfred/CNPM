import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export interface CnpmApiConfig {
  /**
   * Racine versionnée du contrat CNPM. Elle peut être relative en local ou absolue
   * lorsqu'un environnement expose l'API sur un hôte distinct.
   */
  readonly baseUrl?: string;
}

export const DEFAULT_CNPM_API_BASE_URL = '/v1';

export const CNPM_API_BASE_URL = new InjectionToken<string>('CNPM_API_BASE_URL', {
  providedIn: 'root',
  factory: () => DEFAULT_CNPM_API_BASE_URL,
});

export function provideCnpmApi(config: CnpmApiConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CNPM_API_BASE_URL,
      useValue: normalizeApiBaseUrl(config.baseUrl ?? DEFAULT_CNPM_API_BASE_URL),
    },
  ]);
}

export function buildCnpmApiUrl(baseUrl: string, resourcePath: string): string {
  const base = normalizeApiBaseUrl(baseUrl);
  const path = resourcePath.replace(/^\/+/, '');
  return path.length === 0 ? base : `${base}/${path}`;
}

export function isCnpmApiRequest(url: string, baseUrl: string): boolean {
  const base = normalizeApiBaseUrl(baseUrl);
  return url === base || url.startsWith(`${base}/`) || url.startsWith(`${base}?`);
}

export function normalizeApiBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '');
  if (normalized.length === 0) {
    throw new Error("La racine de l'API CNPM ne peut pas être vide.");
  }
  return normalized;
}
