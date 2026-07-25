import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de « Mes requêtes » (MP-009…011) : les requêtes et réclamations RÉELLES du cotisant.
 *
 * <p>Un seul adaptateur HTTP réel, aucune démo. Le périmètre est déduit du compte connecté
 * (organisation de l'adhésion) ; un membre ne voit jamais la requête d'une autre organisation,
 * ni les notes internes de la CNPM.
 */

export type MemberRequestType = 'INFORMATION' | 'DOCUMENT' | 'CLAIM' | 'OTHER';
export type MemberRequestStatus =
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'WAITING_MEMBER'
  | 'RESOLVED'
  | 'CLOSED';
export type MemberRequestMessageSender = 'MEMBER' | 'AGENT';

export interface MemberRequestSummary {
  readonly id: string;
  readonly reference: string;
  readonly type: MemberRequestType;
  readonly subject: string;
  readonly status: MemberRequestStatus;
  readonly priority: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MemberRequestMessage {
  readonly id: string;
  readonly sender: MemberRequestMessageSender;
  readonly body: string;
  readonly createdAt: string;
}

export interface MemberRequestDetail extends MemberRequestSummary {
  readonly description: string;
  readonly conversation: readonly MemberRequestMessage[];
}

export interface MemberRequestPage {
  readonly items: readonly MemberRequestSummary[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface CreateMemberRequestInput {
  readonly type: MemberRequestType;
  readonly subject: string;
  readonly description: string;
}

export interface MemberRequestsGateway {
  list(page: number, size: number): Observable<MemberRequestPage>;
  create(input: CreateMemberRequestInput): Observable<MemberRequestDetail>;
  loadDetail(id: string): Observable<MemberRequestDetail>;
  addMessage(id: string, body: string): Observable<MemberRequestDetail>;
}

export const MEMBER_REQUESTS_GATEWAY = new InjectionToken<MemberRequestsGateway>(
  'MEMBER_REQUESTS_GATEWAY',
);

export class MemberRequestsAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'MemberRequestsAuthenticationError';
  }
}

/** Le compte n'est rattaché à aucune adhésion, ou la requête n'existe pas dans son périmètre. */
export class MemberRequestNotFoundError extends Error {
  constructor(message = 'Requête introuvable dans votre périmètre.') {
    super(message);
    this.name = 'MemberRequestNotFoundError';
  }
}
