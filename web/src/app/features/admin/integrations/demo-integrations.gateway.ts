import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import type {
  IntegrationLogEntry,
  IntegrationPartner,
  IntegrationsGateway,
  IntegrationsQuery,
  IntegrationsSnapshot,
  IntegrationSummary,
} from './integrations-gateway';

/**
 * Jeu déterministe et entièrement fictif de BO-038.
 *
 * Les libellés décrivent des canaux simulés, sans URL, secret, jeton, charge utile,
 * contact, compte financier ou identifiant partenaire. Les journaux ne contiennent que
 * des métadonnées techniques minimales. Aucune donnée n'est envoyée ni conservée.
 */
const PARTNERS: readonly IntegrationPartner[] = [
  {
    id: 'demo-integration-001',
    name: 'Registre Alpha',
    purpose: 'Synchronisation de fiches d’entreprise',
    channelLabel: 'API · lecture seule',
    environmentLabel: 'Bac à sable',
    health: 'HEALTHY',
    contractVersion: 'v1-2026',
    authorization: 'DOCUMENTED',
    authorizationLabel: 'Autorisation documentée',
    externalMappings: 12,
    sourceLabel: 'Jeu synthétique Alpha',
    qualityLabel: 'Contrôlée · 98 %',
    lastCheckAt: '2026-07-19T10:42:00Z',
    lastCheckLabel: '19 juillet 2026, 10:42',
    lastExchangeAt: '2026-07-19T10:35:00Z',
    lastExchangeLabel: '19 juillet 2026, 10:35',
    successRate24h: 99.4,
    events24h: 186,
    statusDetail: 'Échanges reçus et provenance disponible.',
  },
  {
    id: 'demo-integration-002',
    name: 'Paiement Sandbox Bêta',
    purpose: 'Accusés de paiement',
    channelLabel: 'Callback · aucune transaction',
    environmentLabel: 'Bac à sable',
    health: 'DEGRADED',
    contractVersion: 'v2-2026',
    authorization: 'DOCUMENTED',
    authorizationLabel: 'Autorisation documentée',
    externalMappings: 8,
    sourceLabel: 'Scénarios synthétiques Bêta',
    qualityLabel: 'À vérifier · 91 %',
    lastCheckAt: '2026-07-19T10:40:00Z',
    lastCheckLabel: '19 juillet 2026, 10:40',
    lastExchangeAt: '2026-07-19T10:31:00Z',
    lastExchangeLabel: '19 juillet 2026, 10:31',
    successRate24h: 94.7,
    events24h: 74,
    statusDetail: 'Deux réponses sont en reprise automatique.',
  },
  {
    id: 'demo-integration-003',
    name: 'Messagerie Gamma',
    purpose: 'Notifications de test sans destinataire réel',
    channelLabel: 'File locale',
    environmentLabel: 'Environnement local',
    health: 'PAUSED',
    contractVersion: 'v1-2026',
    authorization: 'PENDING',
    authorizationLabel: 'Finalité à confirmer',
    externalMappings: 0,
    sourceLabel: 'Messages synthétiques Gamma',
    qualityLabel: 'Non évaluée',
    lastCheckAt: '2026-07-19T10:38:00Z',
    lastCheckLabel: '19 juillet 2026, 10:38',
    lastExchangeAt: null,
    lastExchangeLabel: 'Aucun échange autorisé',
    successRate24h: null,
    events24h: 0,
    statusDetail: 'Flux suspendu tant que la finalité et l’autorisation ne sont pas validées.',
  },
  {
    id: 'demo-integration-004',
    name: 'Archivage Delta',
    purpose: 'Dépôt de preuves techniques non sensibles',
    channelLabel: 'Stockage · métadonnées seules',
    environmentLabel: 'Bac à sable',
    health: 'UNAVAILABLE',
    contractVersion: 'v1-2026',
    authorization: 'BLOCKED',
    authorizationLabel: 'Contrat incomplet',
    externalMappings: 3,
    sourceLabel: 'Lot synthétique Delta',
    qualityLabel: 'Bloquée avant import',
    lastCheckAt: '2026-07-19T10:36:00Z',
    lastCheckLabel: '19 juillet 2026, 10:36',
    lastExchangeAt: '2026-07-18T16:20:00Z',
    lastExchangeLabel: '18 juillet 2026, 16:20',
    successRate24h: 0,
    events24h: 1,
    statusDetail: 'Aucun import : le contrat reste incomplet.',
  },
];

const LOGS: readonly IntegrationLogEntry[] = [
  {
    id: 'demo-log-001',
    occurredAt: '2026-07-19T10:35:00Z',
    occurredAtLabel: '19 juillet 2026, 10:35',
    partnerId: 'demo-integration-001',
    partnerName: 'Registre Alpha',
    direction: 'INBOUND',
    exchangeLabel: 'Import contrôlé',
    outcome: 'SUCCESS',
    correlationLabel: 'CNPM-INT-0248',
    contractVersion: 'v1-2026',
    provenanceLabel: 'Jeu synthétique Alpha',
    qualityLabel: 'Conforme au scénario',
    detail: 'Métadonnées validées ; aucune charge utile conservée.',
  },
  {
    id: 'demo-log-002',
    occurredAt: '2026-07-19T10:31:00Z',
    occurredAtLabel: '19 juillet 2026, 10:31',
    partnerId: 'demo-integration-002',
    partnerName: 'Paiement Sandbox Bêta',
    direction: 'INBOUND',
    exchangeLabel: 'Accusé',
    outcome: 'RETRYING',
    correlationLabel: 'CNPM-INT-0247',
    contractVersion: 'v2-2026',
    provenanceLabel: 'Scénarios synthétiques Bêta',
    qualityLabel: 'Réponse incomplète',
    detail: 'Reprise automatique ; rejeu manuel indisponible.',
  },
  {
    id: 'demo-log-003',
    occurredAt: '2026-07-19T10:18:00Z',
    occurredAtLabel: '19 juillet 2026, 10:18',
    partnerId: 'demo-integration-001',
    partnerName: 'Registre Alpha',
    direction: 'OUTBOUND',
    exchangeLabel: 'Confirmation',
    outcome: 'SUCCESS',
    correlationLabel: 'CNPM-INT-0246',
    contractVersion: 'v1-2026',
    provenanceLabel: 'Journal local',
    qualityLabel: 'Conforme au scénario',
    detail: 'Confirmation sans donnée d’entreprise.',
  },
  {
    id: 'demo-log-004',
    occurredAt: '2026-07-19T09:54:00Z',
    occurredAtLabel: '19 juillet 2026, 09:54',
    partnerId: 'demo-integration-003',
    partnerName: 'Messagerie Gamma',
    direction: 'OUTBOUND',
    exchangeLabel: 'Notification',
    outcome: 'BLOCKED',
    correlationLabel: 'CNPM-INT-0245',
    contractVersion: 'v1-2026',
    provenanceLabel: 'Messages synthétiques Gamma',
    qualityLabel: 'Non évaluée',
    detail: 'Échange bloqué avant émission : finalité non confirmée.',
  },
  {
    id: 'demo-log-005',
    occurredAt: '2026-07-18T16:20:00Z',
    occurredAtLabel: '18 juillet 2026, 16:20',
    partnerId: 'demo-integration-004',
    partnerName: 'Archivage Delta',
    direction: 'OUTBOUND',
    exchangeLabel: 'Dépôt',
    outcome: 'REJECTED',
    correlationLabel: 'CNPM-INT-0244',
    contractVersion: 'v1-2026',
    provenanceLabel: 'Lot synthétique Delta',
    qualityLabel: 'Bloquée avant import',
    detail: 'Rejet contrôlé : contrat incomplet.',
  },
];

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

@Injectable()
export class DemoIntegrationsGateway implements IntegrationsGateway {
  load(query: IntegrationsQuery): Observable<IntegrationsSnapshot> {
    const term = fold(query.search.trim());
    const partners = PARTNERS.filter(
      (partner) =>
        (query.health === 'all' || partner.health === query.health) &&
        (!term ||
          [
            partner.name,
            partner.purpose,
            partner.channelLabel,
            partner.contractVersion,
            partner.sourceLabel,
          ].some((value) => fold(value).includes(term))),
    );
    const logs = LOGS.filter(
      (entry) =>
        (query.direction === 'all' || entry.direction === query.direction) &&
        (!term ||
          [
            entry.partnerName,
            entry.exchangeLabel,
            entry.correlationLabel,
            entry.contractVersion,
            entry.provenanceLabel,
          ].some((value) => fold(value).includes(term))),
    );

    return of({
      partners,
      logs,
      summary: this.summary(),
      totalPartners: PARTNERS.length,
      totalLogs: LOGS.length,
      updatedAt: '2026-07-19T10:42:00Z',
      updatedAtLabel: '19 juillet 2026, 10:42',
    }).pipe(delay(120));
  }

  private summary(): IntegrationSummary {
    return {
      totalPartners: PARTNERS.length,
      healthyPartners: PARTNERS.filter((partner) => partner.health === 'HEALTHY').length,
      attentionPartners: PARTNERS.filter((partner) => partner.health === 'DEGRADED').length,
      blockedPartners: PARTNERS.filter((partner) =>
        ['PAUSED', 'UNAVAILABLE'].includes(partner.health),
      ).length,
      events24h: PARTNERS.reduce((sum, partner) => sum + partner.events24h, 0),
      failedEvents24h: LOGS.filter((entry) =>
        ['REJECTED', 'RETRYING', 'BLOCKED'].includes(entry.outcome),
      ).length,
    };
  }
}
