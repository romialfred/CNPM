import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de « Mes paiements » (MP-004) : l'historique RÉEL des encaissements du cotisant.
 *
 * <p>Un seul adaptateur HTTP réel, aucune démo. Le périmètre est déduit du compte connecté ;
 * un membre ne voit jamais le versement d'un autre. La confirmation de la COGEF se lit à la
 * présence d'un reçu.
 */

export type MemberPaymentChannel =
  | 'ORANGE_MONEY'
  | 'WAVE'
  | 'MTN_MONEY'
  | 'BANK_TRANSFER'
  | 'CASH';

export interface MemberPayment {
  readonly id: string;
  readonly transactionNumber: string;
  readonly referenceValue: string | null;
  readonly exercise: number | null;
  readonly channel: MemberPaymentChannel;
  /** Montant en XOF, converti au bord de l'application. */
  readonly amount: number;
  readonly currency: string;
  readonly paidAt: string | null;
  /** Vrai si la COGEF a confirmé l'encaissement (reçu émis). */
  readonly confirmed: boolean;
  readonly receiptNumber: string | null;
}

export interface MemberPaymentsGateway {
  list(): Observable<readonly MemberPayment[]>;
}

export const MEMBER_PAYMENTS_GATEWAY = new InjectionToken<MemberPaymentsGateway>(
  'MEMBER_PAYMENTS_GATEWAY',
);

export class MemberPaymentsAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'MemberPaymentsAuthenticationError';
  }
}

/** Le compte n'est rattaché à aucune adhésion (compte professionnel). */
export class MemberPaymentsNoMembershipError extends Error {
  constructor(message = 'Aucune adhésion n’est rattachée à ce compte.') {
    super(message);
    this.name = 'MemberPaymentsNoMembershipError';
  }
}
