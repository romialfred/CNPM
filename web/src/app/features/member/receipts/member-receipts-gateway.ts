import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberReceiptStatus = 'DEMONSTRATION_AVAILABLE' | 'DEMONSTRATION_CANCELLED';
export type MemberReceiptSort = 'scenarioDate' | 'reference' | 'amountXof';

/**
 * Projection membre pour MP-007/MP-008.
 *
 * Elle ne porte volontairement aucun contenu PDF, URL de téléchargement,
 * jeton de vérification, QR, signature ou cachet. Un aperçu HTML ne doit pas
 * pouvoir être confondu avec la preuve officielle décrite par REC-001..003.
 */
export interface MemberReceiptSummary {
  readonly id: string;
  readonly reference: `RCP-${string}`;
  readonly periodLabel: string;
  readonly amountXof: number;
  readonly scenarioDate: string;
  readonly status: MemberReceiptStatus;
}

export interface MemberReceiptDetail extends MemberReceiptSummary {
  readonly sourceDisclosure: string;
  readonly paymentDisclosure: string;
  readonly proofDisclosure: string;
}

export interface MemberReceiptQuery {
  readonly search: string;
  readonly status?: MemberReceiptStatus;
  readonly exercise?: number;
  readonly sort: MemberReceiptSort;
  readonly direction: 'asc' | 'desc';
  readonly page: number;
  readonly size: number;
}

export interface MemberReceiptPage {
  readonly items: readonly MemberReceiptSummary[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly availableExercises: readonly number[];
}

export interface MemberReceiptsGateway {
  list(query: MemberReceiptQuery): Observable<MemberReceiptPage>;
  loadDetail(id: string): Observable<MemberReceiptDetail>;
}

export class MemberReceiptNotFoundError extends Error {
  constructor(readonly receiptId: string) {
    super(`L’aperçu ${receiptId} n’existe pas dans la projection membre.`);
    this.name = 'MemberReceiptNotFoundError';
  }
}

export const MEMBER_RECEIPTS_GATEWAY = new InjectionToken<MemberReceiptsGateway>(
  'MEMBER_RECEIPTS_GATEWAY',
);
