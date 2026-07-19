import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** Projection exacte du contrat OpenAPI `ReferenceValueView`. */
export interface ReferenceValue {
  readonly id: string;
  readonly domain: string;
  readonly code: string;
  readonly label: string;
  readonly sortOrder: number;
  readonly active: boolean;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  /** Version à transmettre dans `If-Match` lors d'un PATCH. */
  readonly version: number;
}

export interface ReferenceValueQuery {
  readonly domain: string | null;
  /** Page lisible, indexée à partir de 1. L'adaptateur HTTP la convertit en base 0. */
  readonly page: number;
  readonly pageSize: number;
}

export interface ReferenceValuePage {
  readonly rows: readonly ReferenceValue[];
  readonly totalItems: number;
  readonly totalPages: number;
}

/** Corps strictement limité à `ReferenceValueInput`. */
export interface ReferenceValueInput {
  readonly domain: string;
  readonly code: string;
  readonly label: string;
  readonly sortOrder?: number;
  readonly active?: boolean;
}

/** Corps strictement limité à `ReferenceValueUpdate`. */
export interface ReferenceValueUpdate {
  readonly label?: string;
  readonly sortOrder?: number;
  readonly active?: boolean;
}

export interface ReferenceValuesGateway {
  list(query: ReferenceValueQuery): Observable<ReferenceValuePage>;
  create(input: ReferenceValueInput): Observable<ReferenceValue>;
  update(
    id: string,
    expectedVersion: number,
    changes: ReferenceValueUpdate,
  ): Observable<ReferenceValue>;
}

export const SETTINGS_GATEWAY = new InjectionToken<ReferenceValuesGateway>('SETTINGS_GATEWAY');

export interface ReferenceValueFieldError {
  readonly field?: string;
  readonly message?: string;
}

export class ReferenceValuesAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'ReferenceValuesAuthenticationError';
  }
}

export class ReferenceValuesAccessError extends Error {
  constructor(message = 'Accès refusé au paramétrage fonctionnel.') {
    super(message);
    this.name = 'ReferenceValuesAccessError';
  }
}

export class ReferenceValueNotFoundError extends Error {
  constructor(message = 'La valeur de référentiel est introuvable.') {
    super(message);
    this.name = 'ReferenceValueNotFoundError';
  }
}

export class ReferenceValueConflictError extends Error {
  constructor(message = 'La valeur existe déjà ou a été modifiée depuis son chargement.') {
    super(message);
    this.name = 'ReferenceValueConflictError';
  }
}

export class ReferenceValueValidationError extends Error {
  constructor(
    message = 'Les informations transmises ne peuvent pas être enregistrées.',
    readonly fieldErrors: readonly ReferenceValueFieldError[] = [],
  ) {
    super(message);
    this.name = 'ReferenceValueValidationError';
  }
}
