import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Port de supervision des intégrations (BO-038).
 *
 * Le contrat exclut volontairement les URL, secrets, jetons, charges utiles, contacts
 * et identifiants externes. L'écran ne peut donc pas divulguer une donnée sensible par
 * simple oubli de gabarit. Les opérations d'administration ne font pas partie du port :
 * faute de flux de réauthentification et d'approbation, BO-038 reste consultatif.
 *
 * Traçabilité : INT-001 (correspondances agrégées), INT-002 (version de contrat),
 * INT-003 (autorisation), INT-004 (provenance/date/qualité), INT-005 (blocage des
 * conflits) et INT-006 (bac à sable et journal fictifs).
 */

export type IntegrationsView = 'partners' | 'journal';
export type IntegrationHealth = 'HEALTHY' | 'DEGRADED' | 'PAUSED' | 'UNAVAILABLE';
export type IntegrationHealthFilter = 'all' | IntegrationHealth;
export type IntegrationDirection = 'INBOUND' | 'OUTBOUND';
export type IntegrationDirectionFilter = 'all' | IntegrationDirection;
export type ExchangeAuthorization = 'DOCUMENTED' | 'PENDING' | 'BLOCKED';
export type IntegrationLogOutcome = 'SUCCESS' | 'REJECTED' | 'RETRYING' | 'BLOCKED';

export interface IntegrationPartner {
  readonly id: string;
  /** Dénomination manifestement fictive, jamais le nom d'un partenaire réel. */
  readonly name: string;
  readonly purpose: string;
  /** Canal logique uniquement : aucune URL ni information de raccordement. */
  readonly channelLabel: string;
  readonly environmentLabel: string;
  readonly health: IntegrationHealth;
  readonly contractVersion: string;
  readonly authorization: ExchangeAuthorization;
  readonly authorizationLabel: string;
  /** Nombre agrégé ; les identifiants de correspondance eux-mêmes restent absents. */
  readonly externalMappings: number;
  readonly sourceLabel: string;
  readonly qualityLabel: string;
  readonly lastCheckAt: string;
  readonly lastCheckLabel: string;
  readonly lastExchangeAt: string | null;
  readonly lastExchangeLabel: string;
  readonly successRate24h: number | null;
  readonly events24h: number;
  readonly statusDetail: string;
}

export interface IntegrationLogEntry {
  readonly id: string;
  readonly occurredAt: string;
  readonly occurredAtLabel: string;
  readonly partnerId: string;
  readonly partnerName: string;
  readonly direction: IntegrationDirection;
  readonly exchangeLabel: string;
  readonly outcome: IntegrationLogOutcome;
  /** Corrélation synthétique de démonstration ; ne sert jamais d'identifiant externe. */
  readonly correlationLabel: string;
  readonly contractVersion: string;
  readonly provenanceLabel: string;
  readonly qualityLabel: string;
  readonly detail: string;
}

/** Agrégats calculés par la source sur le jeu complet, avant filtrage. */
export interface IntegrationSummary {
  readonly totalPartners: number;
  readonly healthyPartners: number;
  readonly attentionPartners: number;
  readonly blockedPartners: number;
  readonly events24h: number;
  readonly failedEvents24h: number;
}

export interface IntegrationsQuery {
  readonly view: IntegrationsView;
  readonly health: IntegrationHealthFilter;
  readonly direction: IntegrationDirectionFilter;
  readonly search: string;
}

export interface IntegrationsSnapshot {
  readonly partners: readonly IntegrationPartner[];
  readonly logs: readonly IntegrationLogEntry[];
  readonly summary: IntegrationSummary;
  readonly totalPartners: number;
  readonly totalLogs: number;
  readonly updatedAt: string;
  readonly updatedAtLabel: string;
}

export interface IntegrationsGateway {
  load(query: IntegrationsQuery): Observable<IntegrationsSnapshot>;
}

export const INTEGRATIONS_GATEWAY = new InjectionToken<IntegrationsGateway>('INTEGRATIONS_GATEWAY');

/** Refus d'accès porté par un futur adaptateur HTTP (permission OPS.MONITOR.READ). */
export class IntegrationsAccessError extends Error {
  constructor(message = 'Accès refusé à la supervision des intégrations') {
    super(message);
    this.name = 'IntegrationsAccessError';
  }
}
