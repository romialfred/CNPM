import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberPaymentStatus = 'PREPARED' | 'PROCESSING' | 'NEEDS_REVIEW' | 'FAILED';
export type MemberPaymentChannel =
  | 'MOBILE_MONEY_PREVIEW'
  | 'BANK_TRANSFER_PREVIEW'
  | 'CASH_DECLARATION_PREVIEW';
export type MemberPaymentSort = 'updatedAt' | 'reference' | 'amountXof' | 'status';
export type MemberPaymentSortDirection = 'asc' | 'desc';

/**
 * Projection strictement fictive de MP-004 à MP-006.
 *
 * Elle ne représente ni une transaction, ni un callback opérateur, ni une confirmation
 * CNPM. Le contrat canonique ne porte encore aucune commande de paiement auto-scopée
 * membre et DEC-002/003 restent ouvertes.
 */
export interface MemberPaymentSummary {
  readonly id: string;
  readonly reference: string;
  readonly contributionId: string;
  readonly contributionReference: string;
  readonly amountXof: number;
  readonly currency: 'XOF';
  readonly channel: MemberPaymentChannel;
  readonly status: MemberPaymentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly failureExplanation?: string;
  readonly officialConfirmation: false;
  readonly receiptAvailable: false;
}

export interface MemberPaymentStatusStep {
  readonly id: 'PREPARED' | 'PROVIDER' | 'RECONCILIATION' | 'CONFIRMATION';
  readonly label: string;
  readonly detail: string;
  readonly state: 'complete' | 'current' | 'blocked';
}

export interface MemberPaymentDetail extends MemberPaymentSummary {
  readonly organizationLabel: string;
  readonly statusExplanation: string;
  readonly lastCheckedAt: string;
  readonly steps: readonly MemberPaymentStatusStep[];
}

export interface MemberPaymentContributionOption {
  readonly id: string;
  readonly reference: string;
  readonly exercise: number;
  readonly dueDate: string;
  readonly outstandingAmountXof: number;
  readonly currency: 'XOF';
}

export interface PrepareMemberPaymentDemoInput {
  readonly contributionId: string;
  readonly channel: MemberPaymentChannel;
  readonly simulationAcknowledged: true;
}

export interface MemberPaymentQuery {
  readonly search?: string;
  readonly status?: MemberPaymentStatus;
  readonly channel?: MemberPaymentChannel;
  readonly sort: MemberPaymentSort;
  readonly direction: MemberPaymentSortDirection;
  readonly page: number;
  readonly size: number;
}

export interface MemberPaymentPageSummary {
  readonly displayedAmountXof: number;
  readonly processingCount: number;
  readonly attentionCount: number;
}

export interface MemberPaymentPage {
  readonly items: readonly MemberPaymentSummary[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly summary: MemberPaymentPageSummary;
}

export class MemberPaymentNotFoundError extends Error {
  constructor(readonly paymentId: string) {
    super(`Le suivi fictif ${paymentId} n'existe pas dans la projection membre.`);
    this.name = 'MemberPaymentNotFoundError';
  }
}

export interface MemberPaymentsGateway {
  list(query: MemberPaymentQuery): Observable<MemberPaymentPage>;
  listContributionOptions(): Observable<readonly MemberPaymentContributionOption[]>;
  prepareDemo(input: PrepareMemberPaymentDemoInput): Observable<MemberPaymentDetail>;
  loadStatus(id: string): Observable<MemberPaymentDetail>;
}

export const MEMBER_PAYMENTS_GATEWAY = new InjectionToken<MemberPaymentsGateway>(
  'MEMBER_PAYMENTS_GATEWAY',
);
