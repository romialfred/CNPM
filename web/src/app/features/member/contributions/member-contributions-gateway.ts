import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberContributionStatus = 'A_ECHOIR' | 'EN_RETARD' | 'PARTIELLE' | 'REGLEE';
export type MemberContributionSort = 'dueDate' | 'reference' | 'status';
export type SortDirection = 'asc' | 'desc';

/**
 * Projection de lecture propre à MP-002/MP-003.
 *
 * Elle ne prétend pas être le schéma de `GET /portal/contributions` : l'OpenAPI livre
 * encore un `Resource` générique et aucun endpoint de détail. En particulier, ces
 * champs ne portent ni taux, ni tranche, ni catégorie de barème (DEC-008).
 */
export interface MemberContributionSummary {
  readonly id: string;
  readonly reference: string;
  readonly exercise: number;
  readonly dueDate: string;
  readonly calledAmount: number;
  readonly paidAmount: number;
  readonly outstandingAmount: number;
  readonly currency: 'XOF';
  readonly status: MemberContributionStatus;
}

export interface MemberContributionAdjustment {
  readonly reference: string;
  readonly direction: 'CREDIT' | 'DEBIT';
  readonly amount: number;
  readonly currency: 'XOF';
  readonly reason: string;
  readonly recordedOn: string;
}

export interface MemberContributionInstallment {
  readonly id: string;
  readonly label: string;
  readonly dueDate: string;
  readonly expectedAmount: number;
  readonly paidAmount: number;
  readonly outstandingAmount: number;
  readonly currency: 'XOF';
  readonly status: MemberContributionStatus;
}

export interface MemberContributionDetail extends MemberContributionSummary {
  readonly issuedOn: string;
  readonly amountOriginNote: string;
  readonly adjustments: readonly MemberContributionAdjustment[];
  readonly schedule: readonly MemberContributionInstallment[];
}

export interface MemberContributionQuery {
  readonly status?: MemberContributionStatus;
  readonly exercise?: number;
  readonly sort: MemberContributionSort;
  readonly direction: SortDirection;
  readonly page: number;
  readonly size: number;
}

export interface MemberContributionPage {
  readonly items: readonly MemberContributionSummary[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly availableExercises: readonly number[];
}

export class MemberContributionNotFoundError extends Error {
  constructor(readonly contributionId: string) {
    super(`La cotisation ${contributionId} n'existe pas dans la projection membre.`);
    this.name = 'MemberContributionNotFoundError';
  }
}

export interface MemberContributionsGateway {
  list(query: MemberContributionQuery): Observable<MemberContributionPage>;
  loadDetail(id: string): Observable<MemberContributionDetail>;
}

export const MEMBER_CONTRIBUTIONS_GATEWAY = new InjectionToken<MemberContributionsGateway>(
  'MEMBER_CONTRIBUTIONS_GATEWAY',
);
