import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Noyau modifiable du dossier membre BO-004.
 *
 * La route canonique porte l'identifiant de l'entreprise membre, comme BO-002 et
 * BO-003. Le seul contrat d'écriture disponible est cependant `PATCH
 * /organizations/{id}` : ni l'adhésion, ni les contacts, ni les identifiants métier
 * ne peuvent être modifiés par cet écran.
 */
export interface EditableMemberCore {
  readonly id: string;
  readonly legalName: string;
  readonly tradeName: string | null;
  readonly organizationType: string;
  readonly sectorCode: string | null;
  readonly status: string;
  readonly riskLevel: string;
  /** Version transmise dans `If-Match` pour le verrou optimiste. */
  readonly version: number;
}

/** Champs strictement autorisés par `OrganizationUpdate`. */
export interface MemberCoreUpdate {
  readonly legalName: string;
  readonly tradeName: string;
  readonly organizationType: string;
  readonly sectorCode: string;
}

export interface MemberEditGateway {
  load(id: string): Observable<EditableMemberCore>;
  update(
    id: string,
    expectedVersion: number,
    changes: MemberCoreUpdate,
  ): Observable<EditableMemberCore>;
}

export const MEMBER_EDIT_GATEWAY = new InjectionToken<MemberEditGateway>('MEMBER_EDIT_GATEWAY');

export class MemberEditAccessError extends Error {
  constructor(message = 'Accès refusé au dossier membre') {
    super(message);
    this.name = 'MemberEditAccessError';
  }
}

export class MemberEditNotFoundError extends Error {
  constructor(message = 'Dossier membre introuvable') {
    super(message);
    this.name = 'MemberEditNotFoundError';
  }
}

export class MemberEditConflictError extends Error {
  constructor(
    message = 'Ce dossier a été modifié depuis son ouverture. Rechargez la version courante avant de reprendre.',
  ) {
    super(message);
    this.name = 'MemberEditConflictError';
  }
}

export class MemberEditValidationError extends Error {
  constructor(message = 'Les informations transmises ne peuvent pas être enregistrées.') {
    super(message);
    this.name = 'MemberEditValidationError';
  }
}
