import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat des instructions de paiement de l'espace membre (Lot 3 de la refonte).
 *
 * <p>Un seul adaptateur : {@link HttpPaymentInstructionsGateway}. L'écran ne montre que le
 * diffusable — références validées et comptes d'encaissement actifs — tel que le serveur le
 * borne au compte connecté. Aucune passerelle de démonstration.
 */

export type CollectionChannel = 'ORANGE_MONEY' | 'WAVE' | 'MTN_MONEY' | 'BANK_TRANSFER';

export interface PaymentReferenceLine {
  readonly id: string;
  readonly referenceValue: string;
  readonly exercise: number | null;
}

export interface CollectionAccountLine {
  readonly id: string;
  readonly channel: CollectionChannel;
  readonly label: string;
  readonly accountHolder: string;
  readonly accountIdentifier: string;
  readonly bankName: string | null;
  readonly instructions: string | null;
}

export interface PaymentInstructions {
  readonly references: readonly PaymentReferenceLine[];
  readonly collectionAccounts: readonly CollectionAccountLine[];
}

export interface PaymentInstructionsGateway {
  load(): Observable<PaymentInstructions>;
}

export const PAYMENT_INSTRUCTIONS_GATEWAY = new InjectionToken<PaymentInstructionsGateway>(
  'PAYMENT_INSTRUCTIONS_GATEWAY',
);

export class PaymentInstructionsAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'PaymentInstructionsAuthenticationError';
  }
}

export class PaymentInstructionsAccessError extends Error {
  constructor(message = 'Accès refusé aux instructions de paiement.') {
    super(message);
    this.name = 'PaymentInstructionsAccessError';
  }
}

/** Le compte connecté n'est rattaché à aucune adhésion (compte professionnel). */
export class PaymentInstructionsNoMembershipError extends Error {
  constructor(message = 'Aucune adhésion n’est rattachée à ce compte.') {
    super(message);
    this.name = 'PaymentInstructionsNoMembershipError';
  }
}
