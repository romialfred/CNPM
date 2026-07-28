import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** Projection exacte de `ProfessionalGroupView`. */
export interface ProfessionalGroup {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly sectorCode: string | null;
  readonly status: string;
  readonly version: number;
}

export interface ProfessionalGroupQuery {
  /** Page lisible, indexée à partir de 1. L'adaptateur HTTP la convertit en base 0. */
  readonly page: number;
  readonly pageSize: number;
}

export interface ProfessionalGroupPage {
  readonly rows: readonly ProfessionalGroup[];
  readonly totalItems: number;
}

/** Données saisies pour créer un groupement (le statut naît ACTIVE côté serveur). */
export interface CreateProfessionalGroupInput {
  readonly code: string;
  readonly name: string;
  readonly sectorCode: string | null;
}

export interface GroupsGateway {
  list(query: ProfessionalGroupQuery): Observable<ProfessionalGroupPage>;
  get(id: string): Observable<ProfessionalGroup>;
  create(input: CreateProfessionalGroupInput): Observable<ProfessionalGroup>;
}

export const GROUPS_GATEWAY = new InjectionToken<GroupsGateway>('GROUPS_GATEWAY');

/** Le code proposé est déjà porté par un groupement existant (409). */
export class GroupConflictError extends Error {
  constructor(message = 'Un groupement porte déjà ce code') {
    super(message);
    this.name = 'GroupConflictError';
  }
}

export class GroupAccessError extends Error {
  constructor(message = 'Accès refusé aux groupements professionnels') {
    super(message);
    this.name = 'GroupAccessError';
  }
}

export class GroupNotFoundError extends Error {
  constructor(message = 'Groupement professionnel introuvable') {
    super(message);
    this.name = 'GroupNotFoundError';
  }
}
