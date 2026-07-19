import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SortState } from '../../../design-system/data-table/data-table.model';

/**
 * Vue cœur d'une entreprise, strictement alignée sur `OrganizationView`.
 *
 * Le contrat R0 ne contient ni identifiant métier, ni contacts, ni adhésion, ni
 * agrégat financier. Les écrans BO-005/006 ne les reconstituent donc pas depuis
 * d'autres modules.
 */
export interface Organization {
  readonly id: string;
  readonly legalName: string;
  readonly tradeName: string | null;
  readonly organizationType: string;
  readonly sectorCode: string | null;
  readonly status: string;
  readonly riskLevel: string;
  /** Version à renvoyer dans `If-Match` lors d'une modification. */
  readonly version: number;
}

export interface OrganizationQuery {
  readonly search: string;
  readonly status: string | null;
  readonly organizationType: string | null;
  readonly sectorCode: string | null;
  readonly sort: SortState | null;
  /** Page lisible, indexée à partir de 1. L'adaptateur HTTP la convertit en base 0. */
  readonly page: number;
  readonly pageSize: number;
}

export interface OrganizationPage {
  readonly rows: readonly Organization[];
  readonly totalItems: number;
}

/**
 * Champs descriptifs autorisés par `OrganizationUpdate`.
 *
 * Le statut, le risque et l'identifiant métier sont volontairement absents : les
 * rendre désactivés dans un formulaire ne serait pas une frontière de sécurité.
 */
export interface OrganizationUpdate {
  readonly legalName: string;
  readonly tradeName: string;
  readonly organizationType: string;
  readonly sectorCode: string;
}

export interface OrganizationsGateway {
  search(query: OrganizationQuery): Observable<OrganizationPage>;
  get(id: string): Observable<Organization>;
  update(
    id: string,
    expectedVersion: number,
    changes: OrganizationUpdate,
  ): Observable<Organization>;
}

export const ORGANIZATIONS_GATEWAY = new InjectionToken<OrganizationsGateway>(
  'ORGANIZATIONS_GATEWAY',
);

export class OrganizationAccessError extends Error {
  constructor(message = 'Accès refusé aux entreprises') {
    super(message);
    this.name = 'OrganizationAccessError';
  }
}

export class OrganizationNotFoundError extends Error {
  constructor(message = 'Entreprise introuvable') {
    super(message);
    this.name = 'OrganizationNotFoundError';
  }
}

export class OrganizationConflictError extends Error {
  constructor(
    message = 'Cette entreprise a été modifiée depuis son ouverture. Rechargez la fiche avant de reprendre.',
  ) {
    super(message);
    this.name = 'OrganizationConflictError';
  }
}

export class OrganizationValidationError extends Error {
  constructor(message = 'Les informations transmises ne peuvent pas être enregistrées.') {
    super(message);
    this.name = 'OrganizationValidationError';
  }
}
