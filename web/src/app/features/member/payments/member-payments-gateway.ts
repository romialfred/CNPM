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
 * Projection membre de MP-004 à MP-006.
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

/** Opérateurs de règlement proposés au membre. */
export type PaymentOperator = 'ORANGE_MONEY' | 'WAVE' | 'MTN_MONEY' | 'VISA';
export type PaymentOperatorKind = 'mobile-money' | 'card';

/**
 * Ordre d'initiation d'un paiement par opérateur.
 *
 * Aucun secret ne transite : pour une carte, seuls les 4 derniers chiffres (affichage) et
 * le nom du porteur circulent — jamais le PAN complet, la date d'expiration ni le CVC, qui
 * ne quittent pas le navigateur tant qu'aucune passerelle certifiée n'est branchée.
 */
export interface InitiateMemberPaymentInput {
  readonly contributionId: string;
  readonly operator: PaymentOperator;
  /** Numéro Mobile Money (opérateurs mobile), au format local. */
  readonly phone?: string;
  /** Quatre derniers chiffres de la carte (VISA), pour l'affichage uniquement. */
  readonly cardLast4?: string;
  readonly cardHolder?: string;
}

/**
 * Issue de l'initiation.
 *
 * `GATEWAY_NOT_CONFIGURED` : le parcours est complet côté membre, mais aucune passerelle
 * opérateur (clés/API) n'est encore branchée — aucun montant n'est débité. C'est le seul
 * reliquat pour rendre le module fonctionnel.
 */
export type PaymentInitiationOutcome = 'GATEWAY_NOT_CONFIGURED';

export interface PaymentInitiationResult {
  readonly outcome: PaymentInitiationOutcome;
  readonly operator: PaymentOperator;
  readonly reference: string;
  readonly amountXof: number;
  readonly contributionReference: string;
  /** Ce qui se produirait une fois la passerelle branchée (instruction propre à l'opérateur). */
  readonly nextStep: string;
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
    super(`Le suivi ${paymentId} n'existe pas dans la projection membre.`);
    this.name = 'MemberPaymentNotFoundError';
  }
}

export interface MemberPaymentsGateway {
  list(query: MemberPaymentQuery): Observable<MemberPaymentPage>;
  listContributionOptions(): Observable<readonly MemberPaymentContributionOption[]>;
  prepareDemo(input: PrepareMemberPaymentDemoInput): Observable<MemberPaymentDetail>;
  loadStatus(id: string): Observable<MemberPaymentDetail>;
  /**
   * Initie un règlement via un opérateur. Tant que les passerelles ne sont pas branchées,
   * l'issue est `GATEWAY_NOT_CONFIGURED` : le parcours est complet mais rien n'est débité.
   */
  initiatePayment(input: InitiateMemberPaymentInput): Observable<PaymentInitiationResult>;
}

export const MEMBER_PAYMENTS_GATEWAY = new InjectionToken<MemberPaymentsGateway>(
  'MEMBER_PAYMENTS_GATEWAY',
);
