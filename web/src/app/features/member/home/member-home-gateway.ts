import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Port de l'accueil de l'espace membre (MP-001) — le tableau de bord RÉEL du cotisant.
 *
 * <p>Un seul adaptateur HTTP réel, aucune démo. Le périmètre est déduit du compte connecté ;
 * les totaux sont établis par la source (`GET /portal/dashboard`) et jamais recalculés par la vue.
 */

export type MembershipStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED';

export interface MemberIdentity {
  readonly organization: string;
  /** Référence métier de l'adhésion, distincte de la clé technique. */
  readonly memberCode: string;
  readonly category: string;
  readonly status: MembershipStatus;
  /** Date ISO `AAAA-MM-JJ` d'entrée dans l'adhésion ; `null` si inconnue. */
  readonly memberSince: string | null;
}

/** Totaux d'un exercice, établis par la source et jamais recalculés par l'écran. */
export interface ExerciseSummary {
  readonly year: number;
  /** Montants en XOF, convertis au bord de l'application. */
  readonly called: number;
  readonly settled: number;
  readonly outstanding: number;
}

/** Dernier règlement confirmé, ou `null` si aucun. */
export interface LastPayment {
  readonly amount: number;
  readonly currency: string;
  readonly paidAt: string | null;
}

export interface MemberDashboard {
  readonly identity: MemberIdentity;
  readonly calledTotal: number;
  readonly settledTotal: number;
  readonly outstandingTotal: number;
  readonly overdueAmount: number;
  readonly nextDueDate: string | null;
  readonly lastPayment: LastPayment | null;
  readonly paymentCount: number;
  readonly receiptCount: number;
  /** Du plus récent au plus ancien : l'exercice courant est la vue par défaut. */
  readonly exercises: readonly ExerciseSummary[];
}

export interface MemberHomeGateway {
  /** Charge le tableau de bord du membre authentifié ; aucun identifiant n'est passé depuis la vue. */
  load(): Observable<MemberDashboard>;
}

export const MEMBER_HOME_GATEWAY = new InjectionToken<MemberHomeGateway>('MEMBER_HOME_GATEWAY');

/**
 * Refus d'accès (401/403) prononcé par le backend.
 *
 * L'écran le distingue d'une panne : un droit refusé ne se « réessaie » pas. Le contrôle reste
 * intégralement côté serveur — la vue ne fait que traduire sa réponse.
 */
export class MemberHomeAccessError extends Error {
  constructor(message = 'Accès refusé à l’espace membre') {
    super(message);
    this.name = 'MemberHomeAccessError';
  }
}

/** Le compte n'est rattaché à aucune adhésion (compte professionnel). */
export class MemberHomeNoMembershipError extends Error {
  constructor(message = 'Aucune adhésion n’est rattachée à ce compte.') {
    super(message);
    this.name = 'MemberHomeNoMembershipError';
  }
}
