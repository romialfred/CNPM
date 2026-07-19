import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Événement immuable exposé par `GET /audit-events`.
 *
 * Le port reprend strictement le read-model OpenAPI : il ne transporte ni adresse IP,
 * ni appareil, ni résultat métier, ni contenu avant/après. Seules les empreintes
 * cryptographiques prévues par le contrat peuvent être affichées.
 */
export interface AuditEvent {
  readonly id: string;
  readonly createdAt: string;
  readonly actorUserId?: string | null;
  readonly actorType: string;
  readonly actionCode: string;
  readonly entityType: string;
  readonly entityId?: string | null;
  readonly beforeHash?: string | null;
  readonly afterHash?: string | null;
  readonly correlationId: string;
}

/** Page OpenAPI, indexée à partir de zéro comme l'endpoint backend. */
export interface AuditEventPage {
  readonly items: readonly AuditEvent[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/** La page de l'interface est indexée à partir de 1, comme elle est lue dans l'URL. */
export interface AuditEventQuery {
  readonly page: number;
  readonly size: number;
}

export interface AuditGateway {
  search(query: AuditEventQuery): Observable<AuditEventPage>;
}

export const AUDIT_GATEWAY = new InjectionToken<AuditGateway>('AUDIT_GATEWAY');

/** Session absente ou expirée lors de la consultation. */
export class AuditAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise pour consulter les journaux') {
    super(message);
    this.name = 'AuditAuthenticationError';
  }
}

/** Refus backend de la permission `PERM_AUDIT.READ`. */
export class AuditAccessError extends Error {
  constructor(message = 'Accès refusé aux journaux d’audit') {
    super(message);
    this.name = 'AuditAccessError';
  }
}
