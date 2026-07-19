import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type ServiceRequestStatus =
  | 'SUBMITTED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_MEMBER'
  | 'WAITING_INTERNAL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type ServiceRequestPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type ServiceRequestSlaState = 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'NOT_APPLICABLE';
export type ServiceRequestSortKey = 'submittedAt' | 'targetAt' | 'priority';

export interface ServiceRequestQuery {
  readonly search: string;
  readonly status: ServiceRequestStatus | null;
  readonly priority: ServiceRequestPriority | null;
  readonly sort: {
    readonly key: ServiceRequestSortKey;
    readonly direction: 'asc' | 'desc';
  };
  /** Page lisible, indexée à partir de 1. */
  readonly page: number;
  readonly pageSize: number;
}

export interface ServiceRequestSummary {
  readonly id: string;
  readonly reference: string;
  readonly subject: string;
  readonly requesterLabel: string;
  readonly categoryLabel: string;
  readonly priority: ServiceRequestPriority;
  readonly status: ServiceRequestStatus;
  readonly submittedAt: string;
  /** Échéance de scénario uniquement : aucune valeur officielle de SLA. */
  readonly targetAt: string | null;
  readonly slaState: ServiceRequestSlaState;
  readonly assigneeLabel: string | null;
}

export interface ServiceRequestPage {
  readonly rows: readonly ServiceRequestSummary[];
  readonly totalItems: number;
}

/** Échange visible par le membre dans le scénario de démonstration. */
export interface MemberVisibleMessage {
  readonly id: string;
  readonly direction: 'MEMBER' | 'AGENT';
  readonly authorLabel: string;
  readonly body: string;
  readonly createdAt: string;
}

/** Note réservée au back-office. Ce type n'entre jamais dans `memberConversation`. */
export interface InternalRequestNote {
  readonly id: string;
  readonly authorLabel: string;
  readonly body: string;
  readonly createdAt: string;
}

export interface ServiceRequestDetail extends ServiceRequestSummary {
  readonly serviceLabel: string;
  readonly confidentialityLabel: string;
  readonly description: string;
  readonly memberConversation: readonly MemberVisibleMessage[];
  readonly internalNotes: readonly InternalRequestNote[];
  readonly attachments: {
    readonly available: false;
    readonly reason: string;
  };
  readonly resolutionProofLabel: string | null;
  readonly notificationNotice: string;
}

export interface RequestsGateway {
  search(query: ServiceRequestQuery): Observable<ServiceRequestPage>;
  get(id: string): Observable<ServiceRequestDetail>;
}

export const REQUESTS_GATEWAY = new InjectionToken<RequestsGateway>('REQUESTS_GATEWAY');

export class RequestAccessError extends Error {
  constructor(message = 'Accès refusé aux requêtes et réclamations') {
    super(message);
    this.name = 'RequestAccessError';
  }
}

export class RequestNotFoundError extends Error {
  constructor(message = 'Requête ou réclamation introuvable') {
    super(message);
    this.name = 'RequestNotFoundError';
  }
}
