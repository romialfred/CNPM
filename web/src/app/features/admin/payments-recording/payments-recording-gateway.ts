import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de l'écran COGEF « Encaissements » (Lot 4 de la refonte, méthode A : saisie agent).
 *
 * <p>Un seul adaptateur HTTP réel, aucune passerelle de démonstration. L'agent enregistre un
 * encaissement reçu contre une référence validée ; le serveur en tient l'idempotence et
 * l'ajout seul.
 */

export type PaymentChannel = 'ORANGE_MONEY' | 'WAVE' | 'MTN_MONEY' | 'BANK_TRANSFER' | 'CASH';

export interface RecordedPayment {
  readonly id: string;
  readonly transactionNumber: string;
  readonly referenceValue: string | null;
  readonly membershipNumber: string | null;
  readonly organizationName: string | null;
  readonly channel: PaymentChannel;
  /** Montant en XOF, converti au bord de l'application (jamais un flottant côté contrat). */
  readonly amount: number;
  readonly currency: string;
  readonly paidAt: string | null;
  readonly status: string;
}

export interface RecordPaymentInput {
  readonly referenceId: string;
  readonly channel: PaymentChannel;
  /** Montant décimal transmis en chaîne, jamais en flottant. */
  readonly amount: string;
  readonly paidAt?: string;
  readonly providerTransactionId?: string;
}

/** Résultat d'une confirmation : le reçu émis, et son jeton révélé une seule fois. */
export interface PaymentConfirmation {
  readonly receiptNumber: string;
  readonly receiptId: string;
  /** Jeton de vérification en clair, présent seulement à la première émission ; sinon `null`. */
  readonly verificationToken: string | null;
}

export interface PaymentsRecordingGateway {
  list(): Observable<readonly RecordedPayment[]>;
  record(input: RecordPaymentInput): Observable<RecordedPayment>;
  confirm(paymentId: string): Observable<PaymentConfirmation>;
}

export const PAYMENTS_RECORDING_GATEWAY = new InjectionToken<PaymentsRecordingGateway>(
  'PAYMENTS_RECORDING_GATEWAY',
);

export class PaymentsRecordingAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'PaymentsRecordingAuthenticationError';
  }
}

export class PaymentsRecordingAccessError extends Error {
  constructor(message = 'Accès refusé aux encaissements.') {
    super(message);
    this.name = 'PaymentsRecordingAccessError';
  }
}

export class PaymentsRecordingConflictError extends Error {
  constructor(message = 'L’encaissement contredit l’état de la référence.') {
    super(message);
    this.name = 'PaymentsRecordingConflictError';
  }
}

export class PaymentsRecordingValidationError extends Error {
  constructor(message = 'Les informations transmises ne peuvent pas être enregistrées.') {
    super(message);
    this.name = 'PaymentsRecordingValidationError';
  }
}
