import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Port de l'accueil de l'espace membre (MP-001).
 *
 * L'écran ne calcule aucun agrégat : la source livre déjà les totaux par exercice.
 * Un second calcul côté vue pourrait diverger des lignes affichées — c'est exactement
 * le « montant incohérent » que la fiche MP-001 proscrit (« Montant, échéance et
 * statut sont cohérents »).
 */

export type MembershipStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED';

/**
 * Cycle de vie d'un appel de cotisation.
 *
 * `OVERDUE` n'est pas un `PENDING` en retard déguisé : il appelle un geste immédiat,
 * alors que `PENDING` n'appelle rien avant son échéance. Les confondre reviendrait à
 * alarmer un membre à jour.
 */
export type ContributionCallStatus = 'SETTLED' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export type MemberRequestStatus = 'RECEIVED' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED';

export interface MemberIdentity {
  readonly organization: string;
  /** Référence métier de l'adhérent, distincte de la clé technique. */
  readonly memberCode: string;
  readonly category: string;
  readonly group: string;
  readonly status: MembershipStatus;
  /** Date ISO `AAAA-MM-JJ` ; le formatage appartient à la vue. */
  readonly memberSince: string;
}

/** Totaux d'un exercice, établis par la source et jamais recalculés par l'écran. */
export interface ExerciseSummary {
  readonly year: number;
  /** Montants entiers en XOF. Jamais un flottant : `CLAUDE.md` l'interdit. */
  readonly called: number;
  readonly settled: number;
  readonly outstanding: number;
}

export interface ContributionSituation {
  /** Reste dû tous exercices confondus : ce que le membre doit réellement aujourd'hui. */
  readonly outstandingTotal: number;
  /** Part du reste dû dont l'échéance est dépassée ; `0` si le membre est dans les temps. */
  readonly overdueAmount: number;
  /** Prochaine échéance à honorer ; `null` quand plus rien n'est attendu. */
  readonly nextDueDate: string | null;
  /** Du plus récent au plus ancien : l'exercice courant est la vue par défaut. */
  readonly exercises: readonly ExerciseSummary[];
}

export interface ContributionCall {
  readonly id: string;
  readonly reference: string;
  readonly period: string;
  readonly year: number;
  readonly dueOn: string;
  readonly amount: number;
  readonly settled: number;
  readonly outstanding: number;
  readonly status: ContributionCallStatus;
}

export interface MemberReceipt {
  readonly id: string;
  readonly reference: string;
  readonly year: number;
  readonly period: string;
  readonly paidOn: string;
  readonly amount: number;
  readonly fileFormat: string;
  /** Taille en kilo-octets : la fiche exige que les reçus annoncent statut et taille. */
  readonly fileSizeKb: number;
}

export interface MemberDocument {
  readonly id: string;
  /** Intitulé explicite : la fiche impose des documents « nommés clairement ». */
  readonly name: string;
  readonly kind: string;
  readonly issuedOn: string;
  readonly fileFormat: string;
  readonly fileSizeKb: number;
  /** Fin de validité ; `null` pour un document sans échéance. */
  readonly expiresOn: string | null;
}

export interface MemberRequest {
  readonly id: string;
  readonly reference: string;
  readonly subject: string;
  readonly submittedOn: string;
  readonly status: MemberRequestStatus;
}

export interface MemberContact {
  readonly contactName: string;
  readonly role: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly updatedOn: string;
}

/**
 * Complétude du dossier.
 *
 * Les champs manquants sont nommés, jamais seulement comptés : « profil à 80 % » sans
 * dire ce qui manque ne permet aucun geste, ce que la fiche refuse (« Le profil
 * incomplet pointe vers les champs manquants »).
 */
export interface MemberProfileCompletion {
  readonly percent: number;
  readonly missingFields: readonly string[];
}

export interface MemberSupportDesk {
  readonly channel: string;
  readonly phone: string;
  readonly email: string;
  readonly hours: string;
}

export interface MemberHomeSnapshot {
  readonly identity: MemberIdentity;
  readonly situation: ContributionSituation;
  readonly calls: readonly ContributionCall[];
  readonly receipts: readonly MemberReceipt[];
  readonly documents: readonly MemberDocument[];
  readonly requests: readonly MemberRequest[];
  readonly contact: MemberContact;
  readonly profile: MemberProfileCompletion;
  readonly support: MemberSupportDesk;
}

export interface MemberHomeGateway {
  /** Charge le périmètre du membre authentifié ; aucun identifiant n'est passé depuis la vue. */
  load(): Observable<MemberHomeSnapshot>;
}

export const MEMBER_HOME_GATEWAY = new InjectionToken<MemberHomeGateway>('MEMBER_HOME_GATEWAY');

/**
 * Refus d'accès (403) prononcé par le backend.
 *
 * L'écran le distingue d'une panne : un droit refusé ne se « réessaie » pas, et
 * proposer de recommencer inviterait à répéter une action condamnée. Le contrôle reste
 * intégralement côté serveur — la vue ne fait que traduire sa réponse.
 */
export class MemberHomeAccessError extends Error {
  constructor(message = 'Accès refusé à l’espace membre') {
    super(message);
    this.name = 'MemberHomeAccessError';
  }
}
