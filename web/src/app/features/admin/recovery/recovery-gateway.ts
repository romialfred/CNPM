import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SortState } from '../../../design-system/data-table/data-table.model';

/**
 * Port des campagnes de relance (BO-017).
 *
 * Trois vues d'un même programme de recouvrement : les campagnes, le journal des
 * envois et les promesses de paiement obtenues. Le filtrage, le tri et la pagination
 * appartiennent à la source — trier la page courante ne trierait que la page, ce qui
 * mentirait sur un jeu paginé.
 */
export type RecoveryTab = 'campaigns' | 'deliveries' | 'pledges';

/** Canaux réellement câblés par la fiche : SMS et e-mail, rien d'autre. */
export type CampaignChannel = 'SMS' | 'EMAIL';

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

/**
 * Étapes de diffusion d'un message. `OPENED` n'existe que sur le canal e-mail :
 * l'ouverture d'un SMS n'est pas mesurable, et prétendre le contraire fausserait le
 * taux d'ouverture du programme.
 */
export type DeliveryStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'FAILED';

export type PledgeStatus = 'PENDING' | 'HONOURED' | 'PARTIAL' | 'BROKEN';

export interface CampaignRow {
  readonly id: string;
  readonly reference: string;
  readonly label: string;
  readonly segment: string;
  readonly scenario: string;
  readonly channels: readonly CampaignChannel[];
  readonly status: CampaignStatus;
  /**
   * Instant de déclenchement, en ISO 8601 avec décalage explicite. `null` tant que la
   * campagne est un brouillon : une date par défaut laisserait croire à une
   * planification qui n'existe pas.
   */
  readonly scheduledAt: string | null;
  /** Membres retenus par le segment, exclusions déduites. */
  readonly audience: number;
  readonly sent: number;
  readonly delivered: number;
  /**
   * Messages délivrés dont l'ouverture est mesurable (canal e-mail uniquement).
   * Sert de dénominateur au taux d'ouverture ; `0` sur une campagne SMS seule.
   */
  readonly openable: number;
  readonly opened: number;
  /** Contrôles avant lancement exigés par la fiche. */
  readonly exclusions: number;
  readonly duplicates: number;
  readonly missingConsents: number;
  /** Coût estimé de diffusion, en FCFA entiers. Jamais un flottant. */
  readonly estimatedCost: number;
  /** Traitement dédié aux grands cotisants — critère d'acceptation de la fiche. */
  readonly dedicatedToLargeContributors: boolean;
  /**
   * Conversion de la campagne, dérivée des promesses réellement enregistrées.
   *
   * Jamais saisie à part : deux compteurs indépendants de la même réalité finissent
   * par se contredire, et c'est le total incohérent que les fiches proscrivent.
   */
  readonly pledgeCount: number;
  /** Montant total promis à la suite de cette campagne, en FCFA entiers. */
  readonly pledgedAmount: number;
}

export interface DeliveryRow {
  readonly id: string;
  readonly campaignReference: string;
  readonly campaignLabel: string;
  readonly memberCode: string;
  readonly organization: string;
  /** Destination partiellement masquée : un journal n'a pas à exposer un contact complet. */
  readonly destination: string;
  readonly channel: CampaignChannel;
  readonly status: DeliveryStatus;
  readonly sentAt: string;
  /** Motif d'échec ; `null` dès que la diffusion a abouti. */
  readonly failureReason: string | null;
}

export interface PledgeRow {
  readonly id: string;
  readonly memberCode: string;
  readonly organization: string;
  readonly campaignReference: string;
  readonly campaignLabel: string;
  readonly segment: string;
  /** Montant promis en FCFA, entier. */
  readonly amount: number;
  /** Échéance annoncée, date ISO `AAAA-MM-JJ`. */
  readonly dueDate: string;
  readonly status: PledgeStatus;
}

/**
 * Lignes de la page, discriminées par la vue.
 *
 * Une union discriminée plutôt qu'un tableau générique : l'écran rend trois jeux de
 * colonnes distincts, et un transtypage à l'affichage finirait par lire un champ
 * absent le jour où une vue évolue.
 */
export type RecoveryRows =
  | { readonly kind: 'campaigns'; readonly items: readonly CampaignRow[] }
  | { readonly kind: 'deliveries'; readonly items: readonly DeliveryRow[] }
  | { readonly kind: 'pledges'; readonly items: readonly PledgeRow[] };

/**
 * Agrégats du programme de relance.
 *
 * Ils décrivent l'ensemble du programme, pas le filtre courant : la question « où en
 * est le recouvrement ? » ne change pas de réponse parce qu'on a restreint
 * l'affichage. Tous sont établis par la source ; l'écran n'en recalcule aucun.
 */
export interface RecoveryOverview {
  readonly campaignsTotal: number;
  readonly running: number;
  readonly scheduled: number;
  readonly drafts: number;

  readonly audience: number;
  readonly sent: number;
  readonly delivered: number;
  readonly opened: number;
  /** Pourcentage 0–100 ; `null` si rien n'a été envoyé, pour éviter une division par zéro. */
  readonly deliveryRate: number | null;
  /** `null` si aucune diffusion mesurable (programme entièrement SMS). */
  readonly openRate: number | null;

  readonly pledgeCount: number;
  readonly pledgedAmount: number;
  readonly conversionRate: number | null;

  readonly exclusions: number;
  readonly duplicates: number;
  readonly missingConsents: number;
  readonly estimatedCost: number;

  /** Échecs présents dans le journal des envois, seul périmètre où ils sont détaillés. */
  readonly failedDeliveries: number;
}

export interface RecoveryQuery {
  readonly tab: RecoveryTab;
  readonly search: string;
  readonly channel: CampaignChannel | null;
  readonly segment: string | null;
  /** Vocabulaire propre à la vue courante ; la source ignore une valeur hors vocabulaire. */
  readonly status: string | null;
  readonly sort: SortState | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface RecoveryPage {
  readonly rows: RecoveryRows;
  /** Nombre d'enregistrements correspondant au filtre, toutes pages confondues. */
  readonly totalItems: number;
  readonly overview: RecoveryOverview;
  /** Valeurs réellement présentes dans la source ; jamais une nomenclature inventée. */
  readonly segments: readonly string[];
}

export type RecoveryActionKind = 'EMAIL' | 'SMS' | 'CALL' | 'VISIT' | 'MEETING';
export type RecoveryActionStatus =
  'PLANNED' | 'DUE_TODAY' | 'OVERDUE' | 'SUSPENDED' | 'BLOCKED_CONSENT';
export type RecoverySuspensionKind = 'DISPUTE' | 'PROMISE';
export type CommunicationAuthorization =
  'AUTHORIZED_DEMO' | 'BLOCKED_NO_CONSENT' | 'NOT_APPLICABLE';

/** Projection d'une promesse existante ; aucune commande de création/modification. */
export interface RecoveryPromiseSnapshot {
  readonly amount: number;
  readonly dueDate: string;
  readonly comment: string;
  readonly status: PledgeStatus;
}

/** Suspension datée exigée par REL-004/RG-009. */
export interface RecoverySuspensionSnapshot {
  readonly kind: RecoverySuspensionKind;
  readonly suspendedAt: string;
  readonly reasonLabel: string;
}

export interface RecoveryActionRow {
  readonly id: string;
  readonly reference: string;
  readonly memberCode: string;
  readonly organization: string;
  readonly agentLabel: 'Agent de recouvrement';
  readonly kind: RecoveryActionKind;
  readonly status: RecoveryActionStatus;
  readonly scheduledAt: string;
  readonly campaignReference: string;
  readonly campaignLabel: string;
  readonly segment: string;
  readonly contactDisclosure: 'Contact masqué';
  readonly communicationAuthorization: CommunicationAuthorization;
  readonly suspension: RecoverySuspensionSnapshot | null;
  readonly promise: RecoveryPromiseSnapshot | null;
  readonly executionAvailable: false;
}

export type RecoveryActionSortKey = 'scheduledAt' | 'organization' | 'kind' | 'status';

export interface RecoveryActionsQuery {
  readonly search: string;
  readonly kind: RecoveryActionKind | null;
  readonly status: RecoveryActionStatus | null;
  readonly suspension: RecoverySuspensionKind | null;
  readonly sort: { readonly key: RecoveryActionSortKey; readonly direction: 'asc' | 'desc' };
  readonly page: number;
  readonly pageSize: number;
}

export interface RecoveryActionsPage {
  readonly items: readonly RecoveryActionRow[];
  readonly totalItems: number;
  readonly overview: {
    readonly total: number;
    readonly dueToday: number;
    readonly overdue: number;
    readonly suspended: number;
    readonly blockedNoConsent: number;
  };
}

export type RecoveryPortfolioStatus = 'ACTIVE' | 'SUSPENDED';
export type RecoveryPortfolioSortKey =
  'nextActionAt' | 'organization' | 'outstandingAmount' | 'daysOverdue';

export interface RecoveryPortfolioCase {
  readonly id: string;
  readonly reference: string;
  readonly memberCode: string;
  readonly organization: string;
  readonly agentLabel: 'Agent de recouvrement';
  readonly segment: string;
  readonly campaignReference: string;
  readonly campaignLabel: string;
  readonly status: RecoveryPortfolioStatus;
  readonly outstandingAmount: number;
  readonly daysOverdue: number;
  readonly nextActionKind: RecoveryActionKind;
  readonly nextActionAt: string;
  readonly contactDisclosure: 'Contact masqué';
  readonly communicationAuthorization: CommunicationAuthorization;
  readonly suspension: RecoverySuspensionSnapshot | null;
  readonly promise: RecoveryPromiseSnapshot | null;
  /** Libellé purement calendaire ; aucun score analytique ou sanction automatique. */
  readonly calendarBucket: 'Aujourd’hui' | 'Cette semaine' | 'Suivi suspendu';
}

export interface RecoveryPortfolioQuery {
  readonly search: string;
  readonly status: RecoveryPortfolioStatus | null;
  readonly suspension: RecoverySuspensionKind | null;
  readonly segment: string | null;
  readonly sort: { readonly key: RecoveryPortfolioSortKey; readonly direction: 'asc' | 'desc' };
  readonly page: number;
  readonly pageSize: number;
}

export interface RecoveryPortfolioPage {
  readonly items: readonly RecoveryPortfolioCase[];
  readonly totalItems: number;
  readonly segments: readonly string[];
  readonly overview: {
    readonly assignedCases: number;
    readonly activeCases: number;
    readonly suspendedCases: number;
    readonly activePromises: number;
    readonly outstandingAmount: number;
    /** Indicateurs historiques fictifs REL-007, jamais utilisés comme score individuel. */
    readonly contactRate: number;
    readonly conversionRate: number;
    readonly recoveredAmount: number;
    readonly estimatedCost: number;
    readonly averageDelayDays: number;
  };
}

export interface RecoveryGateway {
  search(query: RecoveryQuery): Observable<RecoveryPage>;
  /** Optionnel tant qu'OpenAPI ne porte pas la projection BO-019. */
  searchActions?(query: RecoveryActionsQuery): Observable<RecoveryActionsPage>;
  /** Optionnel tant qu'OpenAPI/ABAC ne portent pas la projection agent BO-020. */
  searchPortfolio?(query: RecoveryPortfolioQuery): Observable<RecoveryPortfolioPage>;
}

export const RECOVERY_GATEWAY = new InjectionToken<RecoveryGateway>('RECOVERY_GATEWAY');

/**
 * Refus d'autorisation renvoyé par le port (403).
 *
 * Distingué d'une panne : un refus de droit ne se « réessaie » pas — le proposer
 * inviterait à répéter une action que la permission condamne.
 */
export class RecoveryAccessError extends Error {
  constructor(message = 'Accès refusé aux campagnes de relance') {
    super(message);
    this.name = 'RecoveryAccessError';
  }
}
