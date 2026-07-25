import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de l'écran CNPM « Rapprochement » (Lot 5). Un seul adaptateur HTTP réel, aucune démo.
 */

export type ReconciliationStatus = 'PROPOSED' | 'CONFIRMED' | 'REJECTED' | 'UNMATCHED';

export interface ReconciliationCase {
  readonly id: string;
  readonly bookingDate: string | null;
  readonly amount: number;
  readonly currency: string;
  readonly referenceText: string | null;
  readonly matchScore: number | null;
  readonly status: ReconciliationStatus;
  readonly matchedReferenceValue: string | null;
  readonly membershipNumber: string | null;
  readonly organizationName: string | null;
  readonly paymentTransactionNumber: string | null;
}

export interface StatementLineInput {
  readonly lineNumber: number;
  readonly bookingDate: string;
  readonly amount: string;
  readonly referenceText: string;
}

export interface StatementImportRequest {
  readonly bankCode: string;
  readonly statementRef: string;
  readonly accountRefMasked: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly lines: readonly StatementLineInput[];
}

export interface ImportSummary {
  readonly statementRef: string;
  readonly importedLines: number;
  readonly matched: number;
  readonly unmatched: number;
  readonly duplicates: number;
}

export interface ReconciliationGateway {
  list(): Observable<readonly ReconciliationCase[]>;
  importStatement(request: StatementImportRequest): Observable<ImportSummary>;
  decide(caseId: string, decision: 'CONFIRM' | 'REJECT', reason: string): Observable<void>;
}

export const RECONCILIATION_GATEWAY = new InjectionToken<ReconciliationGateway>(
  'RECONCILIATION_GATEWAY',
);

export class ReconciliationAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'ReconciliationAuthenticationError';
  }
}

export class ReconciliationAccessError extends Error {
  constructor(message = 'Accès refusé au rapprochement.') {
    super(message);
    this.name = 'ReconciliationAccessError';
  }
}

export class ReconciliationConflictError extends Error {
  constructor(message = 'L’opération contredit l’état du cas.') {
    super(message);
    this.name = 'ReconciliationConflictError';
  }
}

export class ReconciliationValidationError extends Error {
  constructor(message = 'Les informations transmises ne peuvent pas être traitées.') {
    super(message);
    this.name = 'ReconciliationValidationError';
  }
}
