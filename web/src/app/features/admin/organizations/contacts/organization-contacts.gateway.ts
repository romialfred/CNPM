import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import { unavailableFeature$ } from '../../../../core/api/unavailable-feature';

export type OrganizationContactRole = 'DIRECTION' | 'FINANCE' | 'ADMINISTRATION' | 'TECHNIQUE';

export interface OrganizationContact {
  readonly id: string;
  readonly displayName: string;
  readonly role: OrganizationContactRole;
  readonly functionLabel: string;
  readonly email: string;
  readonly phone: string;
  readonly primary: boolean;
  readonly financial: boolean;
  readonly active: boolean;
  readonly validFrom: string;
}

export interface OrganizationContactsView {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly updatedAt: string;
  readonly contacts: readonly OrganizationContact[];
}

export interface OrganizationContactsGateway {
  load(organizationId: string): Observable<OrganizationContactsView>;
}

export const ORGANIZATION_CONTACTS_GATEWAY = new InjectionToken<OrganizationContactsGateway>(
  'ORGANIZATION_CONTACTS_GATEWAY',
);

/**
 * Le contrat HTTP R0 n'expose pas encore les contacts d'une entreprise. Le profil HTTP
 * échoue donc fermé au lieu de réutiliser silencieusement les personnes fictives.
 */
export const UNAVAILABLE_ORGANIZATION_CONTACTS_GATEWAY: OrganizationContactsGateway = {
  load: () => unavailableFeature$('BO-007'),
};

export class OrganizationContactsAccessError extends Error {
  constructor(message = 'Accès refusé aux contacts de cette entreprise') {
    super(message);
    this.name = 'OrganizationContactsAccessError';
  }
}
