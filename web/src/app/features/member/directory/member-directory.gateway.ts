import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberDirectorySector = 'AGRI' | 'SERVICES' | 'CRAFT';
export type MemberDirectoryZone = 'ZONE_A' | 'ZONE_B' | 'ZONE_C';
export type MemberDirectoryTheme = 'SKILLS' | 'LOGISTICS' | 'TRAINING';
export type MemberDirectorySort = 'name' | 'sector';

/**
 * Organisation de l’annuaire privé, volontairement dépourvue de contact, adresse,
 * identifiant métier, URL, média et donnée financière.
 */
export interface PrivateDirectoryOrganization {
  readonly id: `directory-${string}`;
  readonly name: string;
  readonly sector: MemberDirectorySector;
  readonly zone: MemberDirectoryZone;
  readonly sizeLabel: string;
  readonly summary: string;
  readonly themes: readonly MemberDirectoryTheme[];
}

export interface MemberDirectoryQuery {
  /** Recherche libre locale, limitée à 80 caractères. */
  readonly search: string;
  readonly sector?: MemberDirectorySector;
  readonly zone?: MemberDirectoryZone;
  readonly theme?: MemberDirectoryTheme;
  readonly sort: MemberDirectorySort;
}

export interface MemberDirectorySnapshot {
  readonly visibility: 'PRIVATE_MEMBER';
  readonly items: readonly PrivateDirectoryOrganization[];
  readonly total: number;
}

export interface MemberDirectoryGateway {
  list(query: MemberDirectoryQuery): Observable<MemberDirectorySnapshot>;
}

export const MEMBER_DIRECTORY_GATEWAY = new InjectionToken<MemberDirectoryGateway>(
  'MEMBER_DIRECTORY_GATEWAY',
);
