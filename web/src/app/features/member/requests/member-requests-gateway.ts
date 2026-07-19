import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberRequestStatus =
  'SUBMITTED' | 'IN_PROGRESS' | 'WAITING_MEMBER' | 'RESOLVED' | 'CLOSED';
export type MemberRequestKind = 'REQUEST' | 'CLAIM';
export type MemberRequestSlaState = 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'NOT_APPLICABLE';
export type MemberRequestSort = 'updatedAt' | 'createdAt' | 'targetAt';
export type MemberRequestCategory =
  'DEMO_INFORMATION' | 'DEMO_DOCUMENT' | 'DEMO_PORTAL' | 'DEMO_CLAIM';

/**
 * Métadonnée locale uniquement : aucun octet, URL ou identifiant GED n'est conservé.
 */
export interface SimulatedMemberAttachment {
  readonly id: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly simulated: true;
}

export interface MemberRequestMessage {
  readonly id: string;
  readonly sender: 'MEMBER' | 'CNPM';
  readonly authorLabel: string;
  readonly body: string;
  readonly createdAt: string;
  readonly attachments: readonly SimulatedMemberAttachment[];
}

export interface RequestedMemberDocument {
  readonly id: string;
  readonly label: string;
  readonly state: 'REQUESTED' | 'PROVIDED';
}

export interface MemberRequestSummary {
  readonly id: string;
  readonly reference: string;
  readonly kind: MemberRequestKind;
  readonly category: MemberRequestCategory;
  readonly subject: string;
  readonly status: MemberRequestStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Date cible fournie par le scénario, jamais recalculée dans l'interface. */
  readonly targetAt: string | null;
  readonly slaState: MemberRequestSlaState;
}

/**
 * Projection membre : elle ne possède volontairement aucun champ de note interne.
 * REQ-004 est ainsi respectée par construction, et non par un simple masquage CSS.
 */
export interface MemberRequestDetail extends MemberRequestSummary {
  readonly description: string;
  readonly conversation: readonly MemberRequestMessage[];
  readonly requestedDocuments: readonly RequestedMemberDocument[];
}

export interface MemberRequestQuery {
  readonly search: string;
  readonly status?: MemberRequestStatus;
  readonly kind?: MemberRequestKind;
  readonly sort: MemberRequestSort;
  readonly direction: 'asc' | 'desc';
  readonly page: number;
  readonly size: number;
}

export interface MemberRequestPage {
  readonly items: readonly MemberRequestSummary[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface CreateMemberRequestInput {
  readonly kind: MemberRequestKind;
  readonly category: MemberRequestCategory;
  readonly subject: string;
  readonly description: string;
  readonly attachments: readonly SimulatedMemberAttachment[];
}

export interface AddMemberRequestMessageInput {
  readonly body: string;
  readonly attachments: readonly SimulatedMemberAttachment[];
}

export interface MemberRequestsGateway {
  list(query: MemberRequestQuery): Observable<MemberRequestPage>;
  create(input: CreateMemberRequestInput): Observable<MemberRequestDetail>;
  loadDetail(id: string): Observable<MemberRequestDetail>;
  addMessage(id: string, input: AddMemberRequestMessageInput): Observable<MemberRequestDetail>;
}

export class MemberRequestNotFoundError extends Error {
  constructor(readonly requestId: string) {
    super(`La requête ${requestId} n'existe pas dans la projection membre.`);
    this.name = 'MemberRequestNotFoundError';
  }
}

export const MEMBER_REQUESTS_GATEWAY = new InjectionToken<MemberRequestsGateway>(
  'MEMBER_REQUESTS_GATEWAY',
);
