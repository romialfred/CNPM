import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import type {
  CampaignChannel,
  CampaignRow,
  DeliveryRow,
  PledgeRow,
  RecoveryActionRow,
  RecoveryActionsPage,
  RecoveryActionsQuery,
  RecoveryGateway,
  RecoveryOverview,
  RecoveryPage,
  RecoveryPortfolioCase,
  RecoveryPortfolioPage,
  RecoveryPortfolioQuery,
  RecoveryQuery,
  RecoveryRows,
} from './recovery-gateway';

/**
 * Forme brute d'une campagne, avant dérivation des promesses.
 *
 * `pledgeCount` et `pledgedAmount` n'y figurent pas volontairement : ils sont déduits
 * du jeu de promesses, sans quoi deux compteurs indépendants finiraient par se
 * contredire — exactement le total incohérent que les fiches proscrivent.
 */
type CampaignSeed = Omit<CampaignRow, 'pledgeCount' | 'pledgedAmount'>;

/**
 * Jeu de démonstration — aucune donnée réelle de membre, aucun montant officiel.
 *
 * Toutes les raisons sociales sont fictives et tous les domaines sont en `.example`,
 * conformément à `CLAUDE.md`. Les horodatages portent un décalage explicite `+00:00`,
 * qui est celui de Bamako (Africa/Bamako) : la fiche exige que le fuseau et la date
 * soient explicites, et une date sans décalage se décalerait d'un poste à l'autre.
 */
const CAMPAIGNS: readonly CampaignSeed[] = [
  {
    id: 'CMP-001',
    reference: 'REL-2026-001',
    label: 'Relance J+15 — cotisation 2026',
    segment: 'Grandes entreprises',
    scenario: 'Rappel courtois',
    channels: ['EMAIL', 'SMS'],
    status: 'COMPLETED',
    scheduledAt: '2026-06-02T09:00:00+00:00',
    audience: 148,
    sent: 148,
    delivered: 142,
    openable: 96,
    opened: 71,
    exclusions: 12,
    duplicates: 4,
    missingConsents: 3,
    estimatedCost: 22200,
    dedicatedToLargeContributors: true,
  },
  {
    id: 'CMP-002',
    reference: 'REL-2026-002',
    label: 'Relance J+30 — PME cotisation 2026',
    segment: 'PME',
    scenario: 'Rappel ferme',
    channels: ['SMS'],
    status: 'RUNNING',
    scheduledAt: '2026-07-06T08:30:00+00:00',
    audience: 312,
    sent: 240,
    delivered: 226,
    openable: 0,
    opened: 0,
    exclusions: 27,
    duplicates: 9,
    missingConsents: 6,
    estimatedCost: 24960,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-003',
    reference: 'REL-2026-003',
    label: 'Mise en demeure — arriérés 2025',
    segment: 'Comptes en retard',
    scenario: 'Mise en demeure',
    channels: ['EMAIL'],
    status: 'SCHEDULED',
    scheduledAt: '2026-07-24T09:00:00+00:00',
    audience: 64,
    sent: 0,
    delivered: 0,
    openable: 0,
    opened: 0,
    exclusions: 5,
    duplicates: 1,
    missingConsents: 2,
    estimatedCost: 6400,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-004',
    reference: 'REL-2026-004',
    label: 'Relance douce — nouveaux adhérents',
    segment: 'Nouveaux adhérents',
    scenario: 'Rappel courtois',
    channels: ['EMAIL', 'SMS'],
    status: 'COMPLETED',
    scheduledAt: '2026-05-18T10:00:00+00:00',
    audience: 87,
    sent: 87,
    delivered: 84,
    openable: 61,
    opened: 39,
    exclusions: 3,
    duplicates: 2,
    missingConsents: 1,
    estimatedCost: 13050,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-005',
    reference: 'REL-2026-005',
    label: 'Campagne trimestrielle T2 — tous secteurs',
    segment: 'Tous les membres',
    scenario: 'Rappel courtois',
    channels: ['EMAIL'],
    status: 'COMPLETED',
    scheduledAt: '2026-04-07T08:00:00+00:00',
    audience: 421,
    sent: 421,
    delivered: 402,
    openable: 402,
    opened: 233,
    exclusions: 34,
    duplicates: 12,
    missingConsents: 8,
    estimatedCost: 42100,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-006',
    reference: 'REL-2026-006',
    label: 'Relance ciblée — grands cotisants',
    segment: 'Grands cotisants',
    scenario: 'Appel personnalisé',
    channels: ['EMAIL'],
    status: 'RUNNING',
    scheduledAt: '2026-07-13T09:30:00+00:00',
    audience: 38,
    sent: 22,
    delivered: 22,
    openable: 22,
    opened: 17,
    exclusions: 2,
    duplicates: 0,
    missingConsents: 1,
    estimatedCost: 3800,
    dedicatedToLargeContributors: true,
  },
  {
    id: 'CMP-007',
    reference: 'REL-2026-007',
    label: 'Relance SMS — secteur commerce',
    segment: 'Commerce et distribution',
    scenario: 'Rappel ferme',
    channels: ['SMS'],
    status: 'PAUSED',
    scheduledAt: '2026-07-09T07:45:00+00:00',
    audience: 156,
    sent: 98,
    delivered: 90,
    openable: 0,
    opened: 0,
    exclusions: 11,
    duplicates: 5,
    missingConsents: 4,
    estimatedCost: 12480,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-008',
    reference: 'REL-2026-008',
    label: 'Préavis de suspension — impayés 2024',
    segment: 'Comptes en retard',
    scenario: 'Mise en demeure',
    channels: ['EMAIL', 'SMS'],
    status: 'DRAFT',
    scheduledAt: null,
    audience: 29,
    sent: 0,
    delivered: 0,
    openable: 0,
    opened: 0,
    exclusions: 4,
    duplicates: 1,
    missingConsents: 3,
    estimatedCost: 4350,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-009',
    reference: 'REL-2026-009',
    label: 'Relance BTP — échéance juin',
    segment: 'BTP et infrastructures',
    scenario: 'Rappel ferme',
    channels: ['SMS'],
    status: 'COMPLETED',
    scheduledAt: '2026-06-15T08:15:00+00:00',
    audience: 74,
    sent: 74,
    delivered: 68,
    openable: 0,
    opened: 0,
    exclusions: 6,
    duplicates: 2,
    missingConsents: 2,
    estimatedCost: 5920,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-010',
    reference: 'REL-2026-010',
    label: 'Rappel avant assemblée générale',
    segment: 'Tous les membres',
    scenario: 'Rappel courtois',
    channels: ['EMAIL'],
    status: 'SCHEDULED',
    scheduledAt: '2026-08-03T09:00:00+00:00',
    audience: 434,
    sent: 0,
    delivered: 0,
    openable: 0,
    opened: 0,
    exclusions: 31,
    duplicates: 14,
    missingConsents: 9,
    estimatedCost: 43400,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-011',
    reference: 'REL-2026-011',
    label: 'Relance agro-industrie — T2',
    segment: 'Agro-industrie',
    scenario: 'Rappel courtois',
    channels: ['EMAIL', 'SMS'],
    status: 'COMPLETED',
    scheduledAt: '2026-05-26T09:45:00+00:00',
    audience: 63,
    sent: 63,
    delivered: 59,
    openable: 41,
    opened: 24,
    exclusions: 4,
    duplicates: 1,
    missingConsents: 2,
    estimatedCost: 9450,
    dedicatedToLargeContributors: false,
  },
  {
    id: 'CMP-012',
    reference: 'REL-2026-012',
    label: 'Relance finale — exercice 2025',
    segment: 'Comptes en retard',
    scenario: 'Mise en demeure',
    channels: ['EMAIL', 'SMS'],
    status: 'DRAFT',
    scheduledAt: null,
    audience: 41,
    sent: 0,
    delivered: 0,
    openable: 0,
    opened: 0,
    exclusions: 7,
    duplicates: 3,
    missingConsents: 5,
    estimatedCost: 6150,
    dedicatedToLargeContributors: false,
  },
];

/**
 * Journal des envois : les derniers événements de diffusion, échecs compris.
 *
 * Ce n'est pas l'exhaustivité des envois — les compteurs de campagne portent, eux, sur
 * la totalité. Le libellé de l'onglet le dit, faute de quoi on lirait « 18 envois »
 * là où la campagne en annonce 240.
 */
const DELIVERIES: readonly DeliveryRow[] = [
  {
    id: 'DLV-0001',
    campaignReference: 'REL-2026-002',
    campaignLabel: 'Relance J+30 — PME cotisation 2026',
    memberCode: 'DEMO-2026-0101',
    organization: 'Sahel Agro SA',
    destination: '+223 66 •• •• 07',
    channel: 'SMS',
    status: 'DELIVERED',
    sentAt: '2026-07-06T08:31:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0002',
    campaignReference: 'REL-2026-002',
    campaignLabel: 'Relance J+30 — PME cotisation 2026',
    memberCode: 'DEMO-2026-0102',
    organization: 'Niger Textile SARL',
    destination: '+223 76 •• •• 44',
    channel: 'SMS',
    status: 'FAILED',
    sentAt: '2026-07-06T08:31:00+00:00',
    failureReason: 'Numéro invalide',
  },
  {
    id: 'DLV-0003',
    campaignReference: 'REL-2026-002',
    campaignLabel: 'Relance J+30 — PME cotisation 2026',
    memberCode: 'DEMO-2026-0103',
    organization: 'Kayes Logistique SA',
    destination: '+223 66 •• •• 19',
    channel: 'SMS',
    status: 'DELIVERED',
    sentAt: '2026-07-06T08:32:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0004',
    campaignReference: 'REL-2026-006',
    campaignLabel: 'Relance ciblée — grands cotisants',
    memberCode: 'DEMO-2026-0104',
    organization: 'Koulikoro Ciment SA',
    destination: 'relance@koulikoro-ciment.example',
    channel: 'EMAIL',
    status: 'OPENED',
    sentAt: '2026-07-13T09:31:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0005',
    campaignReference: 'REL-2026-006',
    campaignLabel: 'Relance ciblée — grands cotisants',
    memberCode: 'DEMO-2026-0105',
    organization: 'Manden Télécom SA',
    destination: 'compta@manden-telecom.example',
    channel: 'EMAIL',
    status: 'DELIVERED',
    sentAt: '2026-07-13T09:31:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0006',
    campaignReference: 'REL-2026-006',
    campaignLabel: 'Relance ciblée — grands cotisants',
    memberCode: 'DEMO-2026-0106',
    organization: 'Djoliba Assurances SA',
    destination: 'finance@djoliba-assur.example',
    channel: 'EMAIL',
    status: 'FAILED',
    sentAt: '2026-07-13T09:32:00+00:00',
    failureReason: 'Boîte de réception saturée',
  },
  {
    id: 'DLV-0007',
    campaignReference: 'REL-2026-006',
    campaignLabel: 'Relance ciblée — grands cotisants',
    memberCode: 'DEMO-2026-0107',
    organization: 'Bamako Digital SARL',
    destination: 'direction@bamako-digital.example',
    channel: 'EMAIL',
    status: 'OPENED',
    sentAt: '2026-07-13T09:32:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0008',
    campaignReference: 'REL-2026-007',
    campaignLabel: 'Relance SMS — secteur commerce',
    memberCode: 'DEMO-2026-0108',
    organization: 'Faso Négoce SA',
    destination: '+223 65 •• •• 88',
    channel: 'SMS',
    status: 'DELIVERED',
    sentAt: '2026-07-09T07:46:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0009',
    campaignReference: 'REL-2026-007',
    campaignLabel: 'Relance SMS — secteur commerce',
    memberCode: 'DEMO-2026-0109',
    organization: 'Gao Transit SARL',
    destination: '+223 79 •• •• 03',
    channel: 'SMS',
    status: 'FAILED',
    sentAt: '2026-07-09T07:46:00+00:00',
    failureReason: 'Opposition au démarchage',
  },
  {
    id: 'DLV-0010',
    campaignReference: 'REL-2026-007',
    campaignLabel: 'Relance SMS — secteur commerce',
    memberCode: 'DEMO-2026-0110',
    organization: 'Sikasso Coton SA',
    destination: '+223 66 •• •• 51',
    channel: 'SMS',
    status: 'QUEUED',
    sentAt: '2026-07-09T07:47:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0011',
    campaignReference: 'REL-2026-001',
    campaignLabel: 'Relance J+15 — cotisation 2026',
    memberCode: 'DEMO-2026-0111',
    organization: 'Ségou Industries SA',
    destination: 'tresorerie@segou-industries.example',
    channel: 'EMAIL',
    status: 'OPENED',
    sentAt: '2026-06-02T09:01:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0012',
    campaignReference: 'REL-2026-001',
    campaignLabel: 'Relance J+15 — cotisation 2026',
    memberCode: 'DEMO-2026-0112',
    organization: 'Mopti Pêche SA',
    destination: 'contact@mopti-peche.example',
    channel: 'EMAIL',
    status: 'DELIVERED',
    sentAt: '2026-06-02T09:01:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0013',
    campaignReference: 'REL-2026-001',
    campaignLabel: 'Relance J+15 — cotisation 2026',
    memberCode: 'DEMO-2026-0113',
    organization: 'Tombouctou Énergie SARL',
    destination: 'admin@tombouctou-energie.example',
    channel: 'EMAIL',
    status: 'FAILED',
    sentAt: '2026-06-02T09:02:00+00:00',
    failureReason: 'Adresse inconnue',
  },
  {
    id: 'DLV-0014',
    campaignReference: 'REL-2026-001',
    campaignLabel: 'Relance J+15 — cotisation 2026',
    memberCode: 'DEMO-2026-0114',
    organization: 'Baoulé Minoterie SARL',
    destination: '+223 76 •• •• 26',
    channel: 'SMS',
    status: 'DELIVERED',
    sentAt: '2026-06-02T09:02:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0015',
    campaignReference: 'REL-2026-009',
    campaignLabel: 'Relance BTP — échéance juin',
    memberCode: 'DEMO-2026-0115',
    organization: 'Kita Travaux SA',
    destination: '+223 66 •• •• 72',
    channel: 'SMS',
    status: 'SENT',
    sentAt: '2026-06-15T08:16:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0016',
    campaignReference: 'REL-2026-009',
    campaignLabel: 'Relance BTP — échéance juin',
    memberCode: 'DEMO-2026-0116',
    organization: 'Bandiagara Constructions SARL',
    destination: '+223 74 •• •• 35',
    channel: 'SMS',
    status: 'FAILED',
    sentAt: '2026-06-15T08:16:00+00:00',
    failureReason: 'Numéro invalide',
  },
  {
    id: 'DLV-0017',
    campaignReference: 'REL-2026-011',
    campaignLabel: 'Relance agro-industrie — T2',
    memberCode: 'DEMO-2026-0117',
    organization: 'Sahel Agro SA',
    destination: 'relance@sahel-agro.example',
    channel: 'EMAIL',
    status: 'OPENED',
    sentAt: '2026-05-26T09:46:00+00:00',
    failureReason: null,
  },
  {
    id: 'DLV-0018',
    campaignReference: 'REL-2026-011',
    campaignLabel: 'Relance agro-industrie — T2',
    memberCode: 'DEMO-2026-0118',
    organization: 'Diré Huileries SA',
    destination: 'compta@dire-huileries.example',
    channel: 'EMAIL',
    status: 'DELIVERED',
    sentAt: '2026-05-26T09:46:00+00:00',
    failureReason: null,
  },
];

/** Promesses obtenues à la suite d'une relance. Montants fictifs, en FCFA entiers. */
const PLEDGES: readonly PledgeRow[] = [
  {
    id: 'PLD-0001',
    memberCode: 'DEMO-2026-0104',
    organization: 'Koulikoro Ciment SA',
    campaignReference: 'REL-2026-006',
    campaignLabel: 'Relance ciblée — grands cotisants',
    segment: 'Grands cotisants',
    amount: 18500000,
    dueDate: '2026-07-31',
    status: 'PENDING',
  },
  {
    id: 'PLD-0002',
    memberCode: 'DEMO-2026-0107',
    organization: 'Bamako Digital SARL',
    campaignReference: 'REL-2026-006',
    campaignLabel: 'Relance ciblée — grands cotisants',
    segment: 'Grands cotisants',
    amount: 12250000,
    dueDate: '2026-07-25',
    status: 'HONOURED',
  },
  {
    id: 'PLD-0003',
    memberCode: 'DEMO-2026-0105',
    organization: 'Manden Télécom SA',
    campaignReference: 'REL-2026-006',
    campaignLabel: 'Relance ciblée — grands cotisants',
    segment: 'Grands cotisants',
    amount: 9800000,
    dueDate: '2026-08-14',
    status: 'PARTIAL',
  },
  {
    id: 'PLD-0004',
    memberCode: 'DEMO-2026-0111',
    organization: 'Ségou Industries SA',
    campaignReference: 'REL-2026-001',
    campaignLabel: 'Relance J+15 — cotisation 2026',
    segment: 'Grandes entreprises',
    amount: 7400000,
    dueDate: '2026-06-30',
    status: 'HONOURED',
  },
  {
    id: 'PLD-0005',
    memberCode: 'DEMO-2026-0112',
    organization: 'Mopti Pêche SA',
    campaignReference: 'REL-2026-001',
    campaignLabel: 'Relance J+15 — cotisation 2026',
    segment: 'Grandes entreprises',
    amount: 3150000,
    dueDate: '2026-06-28',
    status: 'BROKEN',
  },
  {
    id: 'PLD-0006',
    memberCode: 'DEMO-2026-0114',
    organization: 'Baoulé Minoterie SARL',
    campaignReference: 'REL-2026-001',
    campaignLabel: 'Relance J+15 — cotisation 2026',
    segment: 'Grandes entreprises',
    amount: 2650000,
    dueDate: '2026-07-20',
    status: 'PENDING',
  },
  {
    id: 'PLD-0007',
    memberCode: 'DEMO-2026-0101',
    organization: 'Sahel Agro SA',
    campaignReference: 'REL-2026-002',
    campaignLabel: 'Relance J+30 — PME cotisation 2026',
    segment: 'PME',
    amount: 1850000,
    dueDate: '2026-07-28',
    status: 'PENDING',
  },
  {
    id: 'PLD-0008',
    memberCode: 'DEMO-2026-0103',
    organization: 'Kayes Logistique SA',
    campaignReference: 'REL-2026-002',
    campaignLabel: 'Relance J+30 — PME cotisation 2026',
    segment: 'PME',
    amount: 1240000,
    dueDate: '2026-08-05',
    status: 'PENDING',
  },
  {
    id: 'PLD-0009',
    memberCode: 'DEMO-2026-0119',
    organization: 'Nara Élevage SARL',
    campaignReference: 'REL-2026-002',
    campaignLabel: 'Relance J+30 — PME cotisation 2026',
    segment: 'PME',
    amount: 960000,
    dueDate: '2026-07-15',
    status: 'BROKEN',
  },
  {
    id: 'PLD-0010',
    memberCode: 'DEMO-2026-0108',
    organization: 'Faso Négoce SA',
    campaignReference: 'REL-2026-007',
    campaignLabel: 'Relance SMS — secteur commerce',
    segment: 'Commerce et distribution',
    amount: 4300000,
    dueDate: '2026-08-10',
    status: 'PENDING',
  },
  {
    id: 'PLD-0011',
    memberCode: 'DEMO-2026-0110',
    organization: 'Sikasso Coton SA',
    campaignReference: 'REL-2026-007',
    campaignLabel: 'Relance SMS — secteur commerce',
    segment: 'Commerce et distribution',
    amount: 5750000,
    dueDate: '2026-07-22',
    status: 'PARTIAL',
  },
  {
    id: 'PLD-0012',
    memberCode: 'DEMO-2026-0115',
    organization: 'Kita Travaux SA',
    campaignReference: 'REL-2026-009',
    campaignLabel: 'Relance BTP — échéance juin',
    segment: 'BTP et infrastructures',
    amount: 6100000,
    dueDate: '2026-07-18',
    status: 'HONOURED',
  },
  {
    id: 'PLD-0013',
    memberCode: 'DEMO-2026-0120',
    organization: 'Yélimané Carrières SA',
    campaignReference: 'REL-2026-009',
    campaignLabel: 'Relance BTP — échéance juin',
    segment: 'BTP et infrastructures',
    amount: 2480000,
    dueDate: '2026-08-01',
    status: 'PENDING',
  },
  {
    id: 'PLD-0014',
    memberCode: 'DEMO-2026-0117',
    organization: 'Sahel Agro SA',
    campaignReference: 'REL-2026-011',
    campaignLabel: 'Relance agro-industrie — T2',
    segment: 'Agro-industrie',
    amount: 3900000,
    dueDate: '2026-06-25',
    status: 'HONOURED',
  },
  {
    id: 'PLD-0015',
    memberCode: 'DEMO-2026-0118',
    organization: 'Diré Huileries SA',
    campaignReference: 'REL-2026-011',
    campaignLabel: 'Relance agro-industrie — T2',
    segment: 'Agro-industrie',
    amount: 1720000,
    dueDate: '2026-07-30',
    status: 'PENDING',
  },
  {
    id: 'PLD-0016',
    memberCode: 'DEMO-2026-0121',
    organization: 'Bougouni Bois SARL',
    campaignReference: 'REL-2026-004',
    campaignLabel: 'Relance douce — nouveaux adhérents',
    segment: 'Nouveaux adhérents',
    amount: 840000,
    dueDate: '2026-06-12',
    status: 'HONOURED',
  },
];

/** File BO-019 : scénarios locaux, sans destination ni exécution de communication. */
const RECOVERY_ACTIONS: readonly RecoveryActionRow[] = [
  {
    id: 'demo-recovery-action-0001',
    reference: 'DEMO-ACT-2026-0001',
    memberCode: 'DEMO-MEMBRE-0001',
    organization: 'Organisation Démo Alpha',
    agentLabel: 'Agent Démo Recouvrement',
    kind: 'EMAIL',
    status: 'DUE_TODAY',
    scheduledAt: '2026-07-19T09:00:00+00:00',
    campaignReference: 'DEMO-CAMP-0001',
    campaignLabel: 'Campagne Démo — échéances de juillet',
    segment: 'Segment Démo A',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'AUTHORIZED_DEMO',
    suspension: null,
    promise: null,
    executionAvailable: false,
  },
  {
    id: 'demo-recovery-action-0002',
    reference: 'DEMO-ACT-2026-0002',
    memberCode: 'DEMO-MEMBRE-0002',
    organization: 'Organisation Démo Bêta',
    agentLabel: 'Agent Démo Recouvrement',
    kind: 'SMS',
    status: 'BLOCKED_CONSENT',
    scheduledAt: '2026-07-19T10:30:00+00:00',
    campaignReference: 'DEMO-CAMP-0001',
    campaignLabel: 'Campagne Démo — échéances de juillet',
    segment: 'Segment Démo A',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'BLOCKED_NO_CONSENT',
    suspension: null,
    promise: null,
    executionAvailable: false,
  },
  {
    id: 'demo-recovery-action-0003',
    reference: 'DEMO-ACT-2026-0003',
    memberCode: 'DEMO-MEMBRE-0003',
    organization: 'Organisation Démo Gamma',
    agentLabel: 'Agent Démo Recouvrement',
    kind: 'CALL',
    status: 'OVERDUE',
    scheduledAt: '2026-07-18T15:00:00+00:00',
    campaignReference: 'DEMO-CAMP-0002',
    campaignLabel: 'Campagne Démo — suivi manuel',
    segment: 'Segment Démo B',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'NOT_APPLICABLE',
    suspension: null,
    promise: null,
    executionAvailable: false,
  },
  {
    id: 'demo-recovery-action-0004',
    reference: 'DEMO-ACT-2026-0004',
    memberCode: 'DEMO-MEMBRE-0004',
    organization: 'Organisation Démo Delta',
    agentLabel: 'Agent Démo Recouvrement',
    kind: 'VISIT',
    status: 'SUSPENDED',
    scheduledAt: '2026-07-19T11:00:00+00:00',
    campaignReference: 'DEMO-CAMP-0002',
    campaignLabel: 'Campagne Démo — suivi manuel',
    segment: 'Segment Démo B',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'NOT_APPLICABLE',
    suspension: {
      kind: 'DISPUTE',
      suspendedAt: '2026-07-17T08:20:00+00:00',
      reasonLabel: 'Litige bloquant fictif',
    },
    promise: null,
    executionAvailable: false,
  },
  {
    id: 'demo-recovery-action-0005',
    reference: 'DEMO-ACT-2026-0005',
    memberCode: 'DEMO-MEMBRE-0005',
    organization: 'Organisation Démo Epsilon',
    agentLabel: 'Agent Démo Recouvrement',
    kind: 'MEETING',
    status: 'SUSPENDED',
    scheduledAt: '2026-07-20T10:00:00+00:00',
    campaignReference: 'DEMO-CAMP-0003',
    campaignLabel: 'Campagne Démo — engagements',
    segment: 'Segment Démo C',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'NOT_APPLICABLE',
    suspension: {
      kind: 'PROMISE',
      suspendedAt: '2026-07-16T16:10:00+00:00',
      reasonLabel: 'Promesse active fictive',
    },
    promise: {
      amount: 750_000,
      dueDate: '2026-07-25',
      comment: 'Engagement fictif consigné pour la démonstration.',
      status: 'PENDING',
    },
    executionAvailable: false,
  },
  {
    id: 'demo-recovery-action-0006',
    reference: 'DEMO-ACT-2026-0006',
    memberCode: 'DEMO-MEMBRE-0006',
    organization: 'Organisation Démo Zêta',
    agentLabel: 'Agent Démo Recouvrement',
    kind: 'EMAIL',
    status: 'PLANNED',
    scheduledAt: '2026-07-21T08:30:00+00:00',
    campaignReference: 'DEMO-CAMP-0001',
    campaignLabel: 'Campagne Démo — échéances de juillet',
    segment: 'Segment Démo A',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'AUTHORIZED_DEMO',
    suspension: null,
    promise: null,
    executionAvailable: false,
  },
  {
    id: 'demo-recovery-action-0007',
    reference: 'DEMO-ACT-2026-0007',
    memberCode: 'DEMO-MEMBRE-0007',
    organization: 'Organisation Démo Êta',
    agentLabel: 'Agent Démo Recouvrement',
    kind: 'CALL',
    status: 'DUE_TODAY',
    scheduledAt: '2026-07-19T14:00:00+00:00',
    campaignReference: 'DEMO-CAMP-0002',
    campaignLabel: 'Campagne Démo — suivi manuel',
    segment: 'Segment Démo B',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'NOT_APPLICABLE',
    suspension: null,
    promise: null,
    executionAvailable: false,
  },
  {
    id: 'demo-recovery-action-0008',
    reference: 'DEMO-ACT-2026-0008',
    memberCode: 'DEMO-MEMBRE-0008',
    organization: 'Organisation Démo Thêta',
    agentLabel: 'Agent Démo Recouvrement',
    kind: 'SMS',
    status: 'SUSPENDED',
    scheduledAt: '2026-07-20T13:30:00+00:00',
    campaignReference: 'DEMO-CAMP-0003',
    campaignLabel: 'Campagne Démo — engagements',
    segment: 'Segment Démo C',
    contactDisclosure: 'Contact masqué — démonstration',
    communicationAuthorization: 'AUTHORIZED_DEMO',
    suspension: {
      kind: 'PROMISE',
      suspendedAt: '2026-07-18T12:15:00+00:00',
      reasonLabel: 'Promesse active fictive',
    },
    promise: {
      amount: 320_000,
      dueDate: '2026-07-22',
      comment: 'Promesse fictive à suivre sans relance automatique.',
      status: 'PENDING',
    },
    executionAvailable: false,
  },
];

const OUTSTANDING_BY_ACTION: Readonly<Record<string, { amount: number; days: number }>> = {
  'demo-recovery-action-0001': { amount: 1_250_000, days: 45 },
  'demo-recovery-action-0002': { amount: 980_000, days: 32 },
  'demo-recovery-action-0003': { amount: 760_000, days: 61 },
  'demo-recovery-action-0004': { amount: 1_100_000, days: 50 },
  'demo-recovery-action-0005': { amount: 750_000, days: 20 },
  'demo-recovery-action-0006': { amount: 620_000, days: 12 },
  'demo-recovery-action-0007': { amount: 440_000, days: 27 },
  'demo-recovery-action-0008': { amount: 320_000, days: 15 },
};

const RECOVERY_PORTFOLIO: readonly RecoveryPortfolioCase[] = RECOVERY_ACTIONS.map((action) => {
  const financial = OUTSTANDING_BY_ACTION[action.id];
  if (!financial) throw new Error(`Montant fictif manquant pour ${action.id}`);
  return {
    id: action.id.replace('action', 'case'),
    reference: action.reference.replace('ACT', 'DOS'),
    memberCode: action.memberCode,
    organization: action.organization,
    agentLabel: action.agentLabel,
    segment: action.segment,
    campaignReference: action.campaignReference,
    campaignLabel: action.campaignLabel,
    status: action.suspension ? 'SUSPENDED' : 'ACTIVE',
    outstandingAmount: financial.amount,
    daysOverdue: financial.days,
    nextActionKind: action.kind,
    nextActionAt: action.scheduledAt,
    contactDisclosure: action.contactDisclosure,
    communicationAuthorization: action.communicationAuthorization,
    suspension: action.suspension ? { ...action.suspension } : null,
    promise: action.promise ? { ...action.promise } : null,
    calendarBucket: action.suspension
      ? 'Suivi suspendu'
      : action.status === 'DUE_TODAY' || action.status === 'BLOCKED_CONSENT'
        ? 'Aujourd’hui'
        : 'Cette semaine',
  } satisfies RecoveryPortfolioCase;
});

/**
 * Comparaison insensible à la casse et aux diacritiques.
 *
 * Sans dépliage des accents, chercher « Segou » ne trouverait pas « Ségou Industries » :
 * l'utilisateur qui tape vite, ou sur un clavier sans accents, n'obtiendrait rien.
 */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function matchesTerm(term: string, fields: readonly string[]): boolean {
  if (!term) {
    return true;
  }
  return fields.some((field) => fold(field).includes(term));
}

function ratio(part: number, whole: number): number | null {
  return whole === 0 ? null : (part / whole) * 100;
}

function cloneAction(action: RecoveryActionRow): RecoveryActionRow {
  return {
    ...action,
    suspension: action.suspension ? { ...action.suspension } : null,
    promise: action.promise ? { ...action.promise } : null,
  };
}

function clonePortfolioCase(item: RecoveryPortfolioCase): RecoveryPortfolioCase {
  return {
    ...item,
    suspension: item.suspension ? { ...item.suspension } : null,
    promise: item.promise ? { ...item.promise } : null,
  };
}

/**
 * Adaptateur de démonstration du port `RECOVERY_GATEWAY`.
 *
 * Il tient le rôle de l'API : c'est lui qui filtre, trie et pagine, exactement comme
 * le fera le backend. L'écran ne reçoit qu'une page déjà découpée, si bien que le
 * remplacer par l'adaptateur HTTP ne touchera aucune page.
 *
 * Aucun envoi n'est effectué : le lancement et la relance des échecs restent
 * indisponibles ici, conformément au critère « aucun envoi réel en environnement de
 * test » de la fiche BO-017.
 */
@Injectable()
export class DemoRecoveryGateway implements RecoveryGateway {
  /** Promesses agrégées par campagne — source unique des chiffres de conversion. */
  private readonly pledgesByCampaign = PLEDGES.reduce<Map<string, readonly PledgeRow[]>>(
    (index, pledge) => {
      const current = index.get(pledge.campaignReference) ?? [];
      index.set(pledge.campaignReference, [...current, pledge]);
      return index;
    },
    new Map<string, readonly PledgeRow[]>(),
  );

  /**
   * Campagnes complétées de leur conversion. La dérivation a lieu une fois, à la
   * construction : la recalculer à chaque requête coûterait sans rien changer, les
   * promesses de démonstration étant immuables.
   */
  private readonly campaigns: readonly CampaignRow[] = CAMPAIGNS.map((campaign) => {
    const pledges = this.pledgesByCampaign.get(campaign.reference) ?? [];
    return {
      ...campaign,
      pledgeCount: pledges.length,
      pledgedAmount: pledges.reduce((total, pledge) => total + pledge.amount, 0),
    };
  });

  search(query: RecoveryQuery): Observable<RecoveryPage> {
    const { rows, totalItems } = this.selectRows(query);

    const page: RecoveryPage = {
      rows,
      totalItems,
      // La synthèse décrit le programme entier, pas le filtre courant : restreindre
      // l'affichage ne change pas l'état du recouvrement.
      overview: this.overview(),
      segments: [...new Set(this.campaigns.map((campaign) => campaign.segment))].sort((a, b) =>
        a.localeCompare(b, 'fr'),
      ),
    };

    // Latence simulée : sans elle, l'état de chargement ne serait jamais peint et ne
    // serait donc jamais éprouvé.
    return of(page).pipe(delay(140));
  }

  searchActions(query: RecoveryActionsQuery): Observable<RecoveryActionsPage> {
    const term = fold(query.search.trim());
    const filtered = RECOVERY_ACTIONS.filter((action) => {
      if (query.kind && action.kind !== query.kind) return false;
      if (query.status && action.status !== query.status) return false;
      if (query.suspension && action.suspension?.kind !== query.suspension) return false;
      return matchesTerm(term, [
        action.reference,
        action.memberCode,
        action.organization,
        action.campaignReference,
        action.campaignLabel,
      ]);
    });
    const factor = query.sort.direction === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((left, right) => {
      switch (query.sort.key) {
        case 'organization':
          return factor * left.organization.localeCompare(right.organization, 'fr');
        case 'kind':
          return factor * left.kind.localeCompare(right.kind);
        case 'status':
          return factor * left.status.localeCompare(right.status);
        case 'scheduledAt':
        default:
          return factor * left.scheduledAt.localeCompare(right.scheduledAt);
      }
    });
    const start = (query.page - 1) * query.pageSize;

    return of({
      items: sorted.slice(start, start + query.pageSize).map(cloneAction),
      totalItems: filtered.length,
      overview: {
        total: RECOVERY_ACTIONS.length,
        dueToday: RECOVERY_ACTIONS.filter((item) => item.status === 'DUE_TODAY').length,
        overdue: RECOVERY_ACTIONS.filter((item) => item.status === 'OVERDUE').length,
        suspended: RECOVERY_ACTIONS.filter((item) => item.status === 'SUSPENDED').length,
        blockedNoConsent: RECOVERY_ACTIONS.filter(
          (item) => item.communicationAuthorization === 'BLOCKED_NO_CONSENT',
        ).length,
      },
    }).pipe(delay(100));
  }

  searchPortfolio(query: RecoveryPortfolioQuery): Observable<RecoveryPortfolioPage> {
    const term = fold(query.search.trim());
    const filtered = RECOVERY_PORTFOLIO.filter((item) => {
      if (query.status && item.status !== query.status) return false;
      if (query.suspension && item.suspension?.kind !== query.suspension) return false;
      if (query.segment && item.segment !== query.segment) return false;
      return matchesTerm(term, [
        item.reference,
        item.memberCode,
        item.organization,
        item.campaignReference,
        item.campaignLabel,
      ]);
    });
    const factor = query.sort.direction === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((left, right) => {
      switch (query.sort.key) {
        case 'organization':
          return factor * left.organization.localeCompare(right.organization, 'fr');
        case 'outstandingAmount':
          return factor * (left.outstandingAmount - right.outstandingAmount);
        case 'daysOverdue':
          return factor * (left.daysOverdue - right.daysOverdue);
        case 'nextActionAt':
        default:
          return factor * left.nextActionAt.localeCompare(right.nextActionAt);
      }
    });
    const start = (query.page - 1) * query.pageSize;
    const outstandingAmount = RECOVERY_PORTFOLIO.reduce(
      (total, item) => total + item.outstandingAmount,
      0,
    );

    return of({
      items: sorted.slice(start, start + query.pageSize).map(clonePortfolioCase),
      totalItems: filtered.length,
      segments: [...new Set(RECOVERY_PORTFOLIO.map((item) => item.segment))].sort((a, b) =>
        a.localeCompare(b, 'fr'),
      ),
      overview: {
        assignedCases: RECOVERY_PORTFOLIO.length,
        activeCases: RECOVERY_PORTFOLIO.filter((item) => item.status === 'ACTIVE').length,
        suspendedCases: RECOVERY_PORTFOLIO.filter((item) => item.status === 'SUSPENDED').length,
        activePromises: RECOVERY_PORTFOLIO.filter((item) => item.promise?.status === 'PENDING')
          .length,
        outstandingAmount,
        contactRate: 42.5,
        conversionRate: 18.75,
        recoveredAmount: 1_250_000,
        estimatedCost: 18_500,
        averageDelayDays: 4.2,
      },
    }).pipe(delay(100));
  }

  private selectRows(query: RecoveryQuery): { rows: RecoveryRows; totalItems: number } {
    const term = fold(query.search.trim());
    const start = (query.page - 1) * query.pageSize;

    if (query.tab === 'deliveries') {
      const filtered = DELIVERIES.filter((row) => this.matchesDelivery(row, query, term));
      const sorted = this.sortDeliveries(filtered, query);
      return {
        rows: { kind: 'deliveries', items: sorted.slice(start, start + query.pageSize) },
        totalItems: filtered.length,
      };
    }

    if (query.tab === 'pledges') {
      const filtered = PLEDGES.filter((row) => this.matchesPledge(row, query, term));
      const sorted = this.sortPledges(filtered, query);
      return {
        rows: { kind: 'pledges', items: sorted.slice(start, start + query.pageSize) },
        totalItems: filtered.length,
      };
    }

    const filtered = this.campaigns.filter((row) => this.matchesCampaign(row, query, term));
    const sorted = this.sortCampaigns(filtered, query);
    return {
      rows: { kind: 'campaigns', items: sorted.slice(start, start + query.pageSize) },
      totalItems: filtered.length,
    };
  }

  private matchesCampaign(row: CampaignRow, query: RecoveryQuery, term: string): boolean {
    if (query.channel && !row.channels.includes(query.channel)) {
      return false;
    }
    if (query.segment && row.segment !== query.segment) {
      return false;
    }
    if (query.status && row.status !== query.status) {
      return false;
    }
    return matchesTerm(term, [row.reference, row.label, row.segment, row.scenario]);
  }

  private matchesDelivery(row: DeliveryRow, query: RecoveryQuery, term: string): boolean {
    if (query.channel && row.channel !== query.channel) {
      return false;
    }
    // Le segment est porté par la campagne ; le journal le filtre par ricochet.
    if (query.segment && this.campaignSegment(row.campaignReference) !== query.segment) {
      return false;
    }
    if (query.status && row.status !== query.status) {
      return false;
    }
    return matchesTerm(term, [
      row.campaignReference,
      row.campaignLabel,
      row.memberCode,
      row.organization,
    ]);
  }

  private matchesPledge(row: PledgeRow, query: RecoveryQuery, term: string): boolean {
    // Une promesse n'a pas de canal propre : elle suit celui de sa campagne.
    if (query.channel && !this.campaignChannels(row.campaignReference).includes(query.channel)) {
      return false;
    }
    if (query.segment && row.segment !== query.segment) {
      return false;
    }
    if (query.status && row.status !== query.status) {
      return false;
    }
    return matchesTerm(term, [
      row.memberCode,
      row.organization,
      row.campaignReference,
      row.campaignLabel,
    ]);
  }

  private sortCampaigns(
    rows: readonly CampaignRow[],
    query: RecoveryQuery,
  ): readonly CampaignRow[] {
    const sort = query.sort;
    if (!sort) {
      return rows;
    }
    const factor = sort.direction === 'asc' ? 1 : -1;
    // La copie est délibérée : `sort` trie en place et réordonnerait la source.
    return [...rows].sort((left, right) => {
      switch (sort.key) {
        case 'label':
          return factor * left.label.localeCompare(right.label, 'fr');
        case 'schedule':
          // Les brouillons n'ont pas de date : ils se rangent en fin de tri croissant
          // plutôt que d'être traités comme le 1er janvier 1970.
          return factor * (left.scheduledAt ?? '9999').localeCompare(right.scheduledAt ?? '9999');
        case 'audience':
          return factor * (left.audience - right.audience);
        case 'delivery':
          return factor * (left.delivered - right.delivered);
        case 'conversion':
          return factor * (left.pledgeCount - right.pledgeCount);
        case 'status':
          return factor * left.status.localeCompare(right.status);
        case 'reference':
        default:
          return factor * left.reference.localeCompare(right.reference, 'fr', { numeric: true });
      }
    });
  }

  private sortDeliveries(
    rows: readonly DeliveryRow[],
    query: RecoveryQuery,
  ): readonly DeliveryRow[] {
    const sort = query.sort;
    if (!sort) {
      return rows;
    }
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
      switch (sort.key) {
        case 'organization':
          return factor * left.organization.localeCompare(right.organization, 'fr');
        case 'status':
          return factor * left.status.localeCompare(right.status);
        case 'sentAt':
        default:
          // Format ISO : l'ordre lexicographique est l'ordre chronologique.
          return factor * left.sentAt.localeCompare(right.sentAt);
      }
    });
  }

  private sortPledges(rows: readonly PledgeRow[], query: RecoveryQuery): readonly PledgeRow[] {
    const sort = query.sort;
    if (!sort) {
      return rows;
    }
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
      switch (sort.key) {
        case 'amount':
          return factor * (left.amount - right.amount);
        case 'organization':
          return factor * left.organization.localeCompare(right.organization, 'fr');
        case 'status':
          return factor * left.status.localeCompare(right.status);
        case 'dueDate':
        default:
          return factor * left.dueDate.localeCompare(right.dueDate);
      }
    });
  }

  private campaignSegment(reference: string): string | null {
    return this.campaigns.find((campaign) => campaign.reference === reference)?.segment ?? null;
  }

  private campaignChannels(reference: string): readonly CampaignChannel[] {
    return this.campaigns.find((campaign) => campaign.reference === reference)?.channels ?? [];
  }

  private overview(): RecoveryOverview {
    const sum = (pick: (campaign: CampaignRow) => number): number =>
      this.campaigns.reduce((total, campaign) => total + pick(campaign), 0);

    const sent = sum((campaign) => campaign.sent);
    const delivered = sum((campaign) => campaign.delivered);
    const opened = sum((campaign) => campaign.opened);
    const openable = sum((campaign) => campaign.openable);
    const pledgedAmount = PLEDGES.reduce((total, pledge) => total + pledge.amount, 0);

    return {
      campaignsTotal: this.campaigns.length,
      running: this.campaigns.filter((campaign) => campaign.status === 'RUNNING').length,
      scheduled: this.campaigns.filter((campaign) => campaign.status === 'SCHEDULED').length,
      drafts: this.campaigns.filter((campaign) => campaign.status === 'DRAFT').length,

      audience: sum((campaign) => campaign.audience),
      sent,
      delivered,
      opened,
      deliveryRate: ratio(delivered, sent),
      openRate: ratio(opened, openable),

      pledgeCount: PLEDGES.length,
      pledgedAmount,
      conversionRate: ratio(PLEDGES.length, delivered),

      exclusions: sum((campaign) => campaign.exclusions),
      duplicates: sum((campaign) => campaign.duplicates),
      missingConsents: sum((campaign) => campaign.missingConsents),
      estimatedCost: sum((campaign) => campaign.estimatedCost),

      failedDeliveries: DELIVERIES.filter((delivery) => delivery.status === 'FAILED').length,
    };
  }
}
