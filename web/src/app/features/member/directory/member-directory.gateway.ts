import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de « Annuaire des membres » (MP-018) : les organisations membres ACTIVES, réelles.
 *
 * <p>Un seul adaptateur HTTP réel, aucune démo. Projection non nominative : ni contact, ni
 * adresse, ni identifiant fiscal, ni donnée financière — ces coordonnées relèvent de la vitrine
 * membre (R4) et de son consentement.
 */

export interface DirectoryOrganization {
  readonly id: string;
  readonly name: string;
  readonly sector: string;
  readonly category: string;
  readonly memberSince: string | null;
}

export interface MemberDirectoryGateway {
  list(search: string): Observable<readonly DirectoryOrganization[]>;
}

export const MEMBER_DIRECTORY_GATEWAY = new InjectionToken<MemberDirectoryGateway>(
  'MEMBER_DIRECTORY_GATEWAY',
);

export class MemberDirectoryAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'MemberDirectoryAuthenticationError';
  }
}
