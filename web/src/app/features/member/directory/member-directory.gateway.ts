import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberDirectorySector = 'AGRI_DEMO' | 'SERVICES_DEMO' | 'CRAFT_DEMO';
export type MemberDirectoryZone = 'ZONE_A_DEMO' | 'ZONE_B_DEMO' | 'ZONE_C_DEMO';
export type MemberDirectoryTheme = 'SKILLS_DEMO' | 'LOGISTICS_DEMO' | 'TRAINING_DEMO';
export type MemberDirectorySort = 'name' | 'sector';

/**
 * Organisation de démonstration volontairement dépourvue de contact, adresse,
 * identifiant métier, URL, média et donnée financière.
 */
export interface PrivateDirectoryOrganization {
  readonly id: `demo-directory-${string}`;
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
  readonly visibility: 'PRIVATE_MEMBER_DEMO';
  readonly items: readonly PrivateDirectoryOrganization[];
  readonly total: number;
}

export interface MemberDirectoryGateway {
  list(query: MemberDirectoryQuery): Observable<MemberDirectorySnapshot>;
}

export const MEMBER_DIRECTORY_GATEWAY = new InjectionToken<MemberDirectoryGateway>(
  'MEMBER_DIRECTORY_GATEWAY',
);
