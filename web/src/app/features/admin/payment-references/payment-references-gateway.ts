import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de l'écran « Références de paiement » (Lot 2 de la refonte).
 *
 * <p>Un seul adaptateur : {@link HttpPaymentReferencesGateway}. Aucune passerelle de
 * démonstration — l'écran ne fonctionne que contre le vrai backend (« zéro démo »).
 */

export type PaymentReferenceStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REVOKED';

/** Projection d'une référence de paiement, telle que le backend la renvoie. */
export interface PaymentReference {
  readonly id: string;
  readonly membershipId: string;
  readonly membershipNumber: string | null;
  readonly organizationName: string | null;
  readonly referenceValue: string;
  readonly exercise: number | null;
  readonly status: PaymentReferenceStatus;
  readonly approvedAt: string | null;
  readonly createdAt: string | null;
}

/** Corps de génération : la référence se produit POUR un cotisant et un exercice. */
export interface PaymentReferenceInput {
  readonly membershipId: string;
  readonly exercise: number;
}

export interface PaymentReferencesGateway {
  list(): Observable<readonly PaymentReference[]>;
  generate(input: PaymentReferenceInput): Observable<PaymentReference>;
  validate(id: string): Observable<PaymentReference>;
  revoke(id: string, reason: string): Observable<PaymentReference>;
}

export const PAYMENT_REFERENCES_GATEWAY = new InjectionToken<PaymentReferencesGateway>(
  'PAYMENT_REFERENCES_GATEWAY',
);

export interface PaymentReferenceFieldError {
  readonly field?: string;
  readonly message?: string;
}

export class PaymentReferencesAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'PaymentReferencesAuthenticationError';
  }
}

export class PaymentReferencesAccessError extends Error {
  constructor(message = 'Accès refusé aux références de paiement.') {
    super(message);
    this.name = 'PaymentReferencesAccessError';
  }
}

export class PaymentReferenceNotFoundError extends Error {
  constructor(message = 'La référence de paiement est introuvable.') {
    super(message);
    this.name = 'PaymentReferenceNotFoundError';
  }
}

export class PaymentReferenceConflictError extends Error {
  constructor(message = 'L’opération contredit l’état de la référence.') {
    super(message);
    this.name = 'PaymentReferenceConflictError';
  }
}

export class PaymentReferenceValidationError extends Error {
  constructor(
    message = 'Les informations transmises ne peuvent pas être enregistrées.',
    readonly fieldErrors: readonly PaymentReferenceFieldError[] = [],
  ) {
    super(message);
    this.name = 'PaymentReferenceValidationError';
  }
}
