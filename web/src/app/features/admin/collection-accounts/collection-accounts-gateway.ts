import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de l'écran « Comptes d'encaissement de la CNPM » (Lot 1 de la refonte).
 *
 * <p>Il n'existe qu'un seul adaptateur : {@link HttpCollectionAccountsGateway}. Aucune
 * passerelle de démonstration — l'écran ne fonctionne que contre le vrai backend, conformément
 * à la décision « zéro démo ».
 */

export type CollectionAccountChannel = 'ORANGE_MONEY' | 'WAVE' | 'MTN_MONEY' | 'BANK_TRANSFER';
export type CollectionAccountStatus = 'DRAFT' | 'ACTIVE' | 'DISABLED';

/** Projection du compte d'encaissement telle que le backend la renvoie. */
export interface CollectionAccount {
  readonly id: string;
  readonly channel: CollectionAccountChannel;
  readonly label: string;
  readonly accountHolder: string;
  readonly accountIdentifier: string;
  readonly bankName: string | null;
  readonly instructions: string | null;
  readonly status: CollectionAccountStatus;
  readonly approvedAt: string | null;
  readonly createdAt: string | null;
}

/** Corps de création — un compte naît toujours en brouillon, aucun statut n'est transmis. */
export interface CollectionAccountInput {
  readonly channel: CollectionAccountChannel;
  readonly label: string;
  readonly accountHolder: string;
  readonly accountIdentifier: string;
  readonly bankName?: string;
  readonly instructions?: string;
}

export interface CollectionAccountsGateway {
  list(): Observable<readonly CollectionAccount[]>;
  create(input: CollectionAccountInput): Observable<CollectionAccount>;
  approve(id: string): Observable<CollectionAccount>;
  disable(id: string, reason: string): Observable<CollectionAccount>;
}

export const COLLECTION_ACCOUNTS_GATEWAY = new InjectionToken<CollectionAccountsGateway>(
  'COLLECTION_ACCOUNTS_GATEWAY',
);

export interface CollectionAccountFieldError {
  readonly field?: string;
  readonly message?: string;
}

export class CollectionAccountsAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'CollectionAccountsAuthenticationError';
  }
}

export class CollectionAccountsAccessError extends Error {
  constructor(message = 'Accès refusé aux comptes d’encaissement.') {
    super(message);
    this.name = 'CollectionAccountsAccessError';
  }
}

export class CollectionAccountNotFoundError extends Error {
  constructor(message = 'Le compte d’encaissement est introuvable.') {
    super(message);
    this.name = 'CollectionAccountNotFoundError';
  }
}

export class CollectionAccountConflictError extends Error {
  constructor(message = 'L’opération contredit l’état du compte.') {
    super(message);
    this.name = 'CollectionAccountConflictError';
  }
}

export class CollectionAccountValidationError extends Error {
  constructor(
    message = 'Les informations transmises ne peuvent pas être enregistrées.',
    readonly fieldErrors: readonly CollectionAccountFieldError[] = [],
  ) {
    super(message);
    this.name = 'CollectionAccountValidationError';
  }
}
