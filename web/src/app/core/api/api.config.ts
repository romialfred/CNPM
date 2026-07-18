import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export interface CnpmApiConfig {
  /**
   * Racine versionnée du contrat CNPM. Elle peut être relative en local ou absolue
   * lorsqu'un environnement expose l'API sur un hôte distinct.
   */
  readonly baseUrl?: string;
  /**
   * Source applicative choisie au bootstrap. Le mode ne peut pas être modifié par
   * l'URL ou le stockage navigateur, afin qu'une erreur HTTP ne bascule jamais en
   * silence vers des fixtures.
   */
  readonly dataMode?: CnpmDataMode;
}

export type CnpmDataMode = 'http' | 'demo';

export const DEFAULT_CNPM_API_BASE_URL = '/v1';

export const CNPM_API_BASE_URL = new InjectionToken<string>('CNPM_API_BASE_URL', {
  providedIn: 'root',
  factory: () => DEFAULT_CNPM_API_BASE_URL,
});

export const CNPM_DATA_MODE = new InjectionToken<CnpmDataMode>('CNPM_DATA_MODE', {
  providedIn: 'root',
  // Fail-closed hors d'un bootstrap explicite : une application intégrée ne doit
  // jamais afficher des fixtures en réponse à une configuration manquante.
  factory: () => 'http',
});

export function provideCnpmApi(config: CnpmApiConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CNPM_API_BASE_URL,
      useValue: normalizeApiBaseUrl(config.baseUrl ?? DEFAULT_CNPM_API_BASE_URL),
    },
    { provide: CNPM_DATA_MODE, useValue: config.dataMode ?? 'http' },
  ]);
}

/** Lit une configuration injectée au déploiement, avant le bootstrap Angular. */
export function readCnpmRuntimeConfig(source: unknown = globalThis): CnpmApiConfig {
  if (!isRecord(source)) {
    return {};
  }
  const candidate = source['__CNPM_RUNTIME_CONFIG__'];
  if (candidate === undefined) {
    return {};
  }
  if (!isRecord(candidate)) {
    throw new Error('La configuration runtime CNPM doit être un objet.');
  }

  const dataMode = candidate['dataMode'];
  if (dataMode !== undefined && dataMode !== 'http' && dataMode !== 'demo') {
    throw new Error('Le mode de données CNPM doit valoir « http » ou « demo ».');
  }
  const baseUrl = candidate['baseUrl'];
  if (baseUrl !== undefined && typeof baseUrl !== 'string') {
    throw new Error("La racine de l'API CNPM doit être une chaîne.");
  }

  return {
    ...(typeof baseUrl === 'string' ? { baseUrl } : {}),
    ...(dataMode === 'http' || dataMode === 'demo' ? { dataMode } : {}),
  };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
