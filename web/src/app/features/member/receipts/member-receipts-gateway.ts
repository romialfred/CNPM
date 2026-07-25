import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de « Mes reçus » (MP-007) : les reçus officiels RÉELS du cotisant.
 *
 * <p>Un seul adaptateur HTTP réel, aucune démo. Le périmètre est déduit du compte connecté ;
 * un membre ne voit jamais le reçu d'un autre. Le jeton de vérification n'est jamais exposé.
 */

export type MemberReceiptChannel =
  | 'ORANGE_MONEY'
  | 'WAVE'
  | 'MTN_MONEY'
  | 'BANK_TRANSFER'
  | 'CASH';

export interface MemberReceipt {
  readonly id: string;
  readonly receiptNumber: string;
  readonly transactionNumber: string;
  readonly referenceValue: string | null;
  readonly exercise: number | null;
  readonly channel: MemberReceiptChannel;
  /** Montant en XOF, converti au bord de l'application. */
  readonly amount: number;
  readonly currency: string;
  readonly paidAt: string | null;
  readonly issuedAt: string | null;
  readonly status: string;
}

export interface MemberReceiptsGateway {
  list(): Observable<readonly MemberReceipt[]>;
}

export const MEMBER_RECEIPTS_GATEWAY = new InjectionToken<MemberReceiptsGateway>(
  'MEMBER_RECEIPTS_GATEWAY',
);

export class MemberReceiptsAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'MemberReceiptsAuthenticationError';
  }
}

/** Le compte n'est rattaché à aucune adhésion (compte professionnel). */
export class MemberReceiptsNoMembershipError extends Error {
  constructor(message = 'Aucune adhésion n’est rattachée à ce compte.') {
    super(message);
    this.name = 'MemberReceiptsNoMembershipError';
  }
}
