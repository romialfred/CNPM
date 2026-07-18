import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CnpmAlertTone } from '../../../design-system/alert/alert.component';
import type { CnpmVerificationStatus } from '../../../design-system/verification-badge/verification-badge.component';

/**
 * Port de la fiche membre 360° (BO-003).
 *
 * La fiche agrège identité, adhésion, cotisations, paiements, documents et historique.
 * Tout est assemblé par la source : l'écran ne recalcule aucun agrégat, faute de quoi
 * un second calcul pourrait contredire celui de BO-002 sur le même membre.
 *
 * Aucune écriture financière n'est exposée : la fiche impose que « les actions
 * financières renvoient vers les écrans spécialisés, sans édition directe de
 * transaction ». Le port est donc en lecture seule.
 */

/**
 * Cycle de vie d'un membre — même vocabulaire que BO-002 (`members-gateway.ts`).
 * Redéclaré ici pour que la fiche ne dépende pas du modèle interne d'un autre écran.
 */
export type MemberStatus = 'ACTIVE' | 'DORMANT' | 'PROSPECT';

/** Une période appelée est réglée, partiellement réglée, échue, ou pas encore due. */
export type ContributionStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'UPCOMING';

export type PaymentChannel = 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH' | 'CHEQUE';

/** État de rapprochement d'un paiement, aligné sur le vocabulaire de BO-014. */
export type PaymentStatus = 'MATCHED' | 'PENDING' | 'UNMATCHED';

export type DocumentStatus = 'VALID' | 'EXPIRING' | 'MISSING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface MemberIdentity {
  readonly id: string;
  readonly code: string;
  readonly organization: string;
  readonly legalForm: string;
  readonly category: string;
  readonly sector: string;
  readonly group: string;
  readonly region: string;
  readonly address: string;
  readonly status: MemberStatus;
  readonly verification: CnpmVerificationStatus;
  /** Date ISO `AAAA-MM-JJ` du constat CNPM ; `null` si la source ne la porte pas. */
  readonly verifiedAt: string | null;
  /** Marqueur orthogonal au statut, jamais une valeur de statut. */
  readonly isLargeContributor: boolean;
}

/**
 * Informations d'entreprise et d'adhésion.
 *
 * Les champs facultatifs sont `null` et non `''` : la fiche exige qu'« une donnée
 * manquante soit clairement distinguée d'une valeur vide ». La chaîne vide se
 * confondrait à l'affichage avec un champ renseigné mais blanc.
 */
export interface MemberProfile {
  readonly rccm: string | null;
  readonly nif: string | null;
  readonly employeeRange: string | null;
  readonly foundedYear: number | null;
  /** Date ISO `AAAA-MM-JJ`. */
  readonly joinedOn: string;
  /** Ancienneté en années, calculée par la source à sa date de référence. */
  readonly seniorityYears: number;
  readonly membershipReference: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly website: string | null;
}

export interface MemberContact {
  readonly name: string;
  readonly role: string;
  readonly phone: string | null;
  readonly email: string | null;
}

/** Agrégats de l'exercice courant. Montants entiers en XOF, jamais des flottants. */
export interface ContributionSummary {
  readonly year: number;
  readonly expected: number;
  readonly paid: number;
  readonly outstanding: number;
  readonly overduePeriods: number;
  /** Pourcentage 0–100 ; `null` si rien n'est appelé, pour ne pas diviser par zéro. */
  readonly settledShare: number | null;
  readonly nextDueLabel: string | null;
  readonly nextDueOn: string | null;
  readonly receiptsIssued: number;
}

export interface ContributionLine {
  readonly period: string;
  readonly label: string;
  readonly dueOn: string;
  readonly expected: number;
  readonly paid: number;
  readonly status: ContributionStatus;
}

export interface PaymentLine {
  readonly reference: string;
  /** Horodatage ISO complet : un paiement se situe à l'instant, pas au jour. */
  readonly paidAt: string;
  readonly period: string;
  readonly amount: number;
  readonly channel: PaymentChannel;
  /** Numéro de reçu ; `null` tant que le paiement n'est pas rapproché. */
  readonly receipt: string | null;
  readonly status: PaymentStatus;
}

export interface MemberDocument {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly issuedOn: string | null;
  readonly expiresOn: string | null;
  readonly sizeLabel: string | null;
  readonly status: DocumentStatus;
}

/** Entrée d'historique. Append-only : la fiche impose un historique non modifiable. */
export interface HistoryEntry {
  readonly id: string;
  readonly at: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
}

/**
 * Alerte de la fiche. Elle porte la règle ET le geste attendu : « les alertes
 * expliquent la règle et la prochaine action ».
 */
export interface MemberAlertItem {
  readonly id: string;
  readonly tone: CnpmAlertTone;
  readonly title: string;
  readonly message: string;
  readonly nextAction: string;
}

export interface NextAction {
  readonly id: string;
  readonly label: string;
  readonly priority: ActionPriority;
  readonly dueOn: string | null;
}

/**
 * Score de risque. La fiche interdit d'afficher un nombre seul : les facteurs et la
 * date d'évaluation font partie de la donnée, pas de la décoration.
 */
export interface RiskAssessment {
  readonly score: number;
  readonly level: RiskLevel;
  readonly assessedOn: string;
  readonly factors: readonly string[];
}

export interface AssignedAgent {
  readonly name: string;
  readonly role: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly portfolio: number;
  readonly recoveryRate: number;
  readonly lastContactOn: string | null;
}

/**
 * Droits transmis par le backend, qui reste seul juge (ADR-008).
 *
 * Ils masquent ou neutralisent des commandes côté navigateur ; ils ne protègent rien
 * par eux-mêmes — `frontend-angular.md` : « les permissions UI améliorent
 * l'expérience mais ne remplacent jamais le contrôle backend ».
 */
export interface MemberPermissions {
  readonly canEdit: boolean;
  readonly canViewContacts: boolean;
  readonly canViewFinancials: boolean;
}

export interface MemberDetail {
  readonly identity: MemberIdentity;
  readonly profile: MemberProfile;
  readonly mainContact: MemberContact | null;
  readonly summary: ContributionSummary;
  readonly contributions: readonly ContributionLine[];
  readonly payments: readonly PaymentLine[];
  readonly documents: readonly MemberDocument[];
  readonly history: readonly HistoryEntry[];
  readonly alerts: readonly MemberAlertItem[];
  readonly nextActions: readonly NextAction[];
  readonly risk: RiskAssessment | null;
  readonly agent: AssignedAgent | null;
  readonly permissions: MemberPermissions;
}

export interface MemberDetailGateway {
  load(id: string): Observable<MemberDetail>;
}

export const MEMBER_DETAIL_GATEWAY = new InjectionToken<MemberDetailGateway>(
  'MEMBER_DETAIL_GATEWAY',
);

/**
 * Refus d'accès (403). Distinct d'une panne : un droit refusé ne se « réessaie » pas,
 * et proposer de recommencer inviterait à répéter une action condamnée.
 */
export class MemberDetailAccessError extends Error {
  constructor(message = 'Accès refusé à la fiche membre') {
    super(message);
    this.name = 'MemberDetailAccessError';
  }
}

/**
 * Membre introuvable (404). Distinct d'une erreur technique : l'identifiant est en
 * cause, pas le service, et le geste utile est de revenir à la liste — pas de réessayer.
 */
export class MemberDetailNotFoundError extends Error {
  constructor(message = 'Aucun membre ne correspond à cet identifiant') {
    super(message);
    this.name = 'MemberDetailNotFoundError';
  }
}
