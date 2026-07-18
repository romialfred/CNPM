import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SortState } from '../../../design-system/data-table/data-table.model';

/**
 * Canal d'encaissement. Le canal n'est pas un statut : il dit d'où vient l'argent,
 * jamais où en est son rapprochement. Les confondre reviendrait à traiter « espèces »
 * comme un état d'avancement.
 */
export type PaymentChannel = 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH' | 'CHECK';

/**
 * Cycle de vie d'une ligne de relevé.
 *
 * `TO_CONFIRM` existe parce que la fiche BO-014 impose « rapprocher puis confirmer
 * selon séparation des tâches » : l'agent qui rapproche n'est pas celui qui confirme.
 * Fusionner `TO_CONFIRM` et `MATCHED` supprimerait le contrôle à quatre yeux.
 */
export type ReconciliationStatus = 'UNMATCHED' | 'TO_CONFIRM' | 'MATCHED' | 'ANOMALY';

/** Files de travail. Les valeurs voyagent dans l'URL : elles restent lisibles. */
export type ReconciliationQueue = 'a-rapprocher' | 'a-confirmer' | 'traites';

/** Type d'anomalie ; la fiche exige un type ET un commentaire, jamais l'un sans l'autre. */
export type AnomalyType = 'DUPLICATE' | 'UNKNOWN_PAYER' | 'AMOUNT_MISMATCH' | 'OUT_OF_SCOPE';

/**
 * Correspondance proposée entre une ligne de relevé et une cotisation attendue.
 *
 * Le score est un indice de confiance, pas une décision : c'est un agent qui
 * rapproche. `reasons` dit sur quoi le score repose — un chiffre nu ne se conteste
 * pas, et un rapprochement qu'on ne peut pas contester ne peut pas être audité.
 */
export interface MatchSuggestion {
  readonly id: string;
  readonly memberCode: string;
  readonly memberName: string;
  readonly contributionLabel: string;
  readonly period: string;
  /** Montant attendu en XOF, entier. Jamais un flottant : `CLAUDE.md` l'interdit. */
  readonly expectedAmount: number;
  /** Indice de confiance, 0 à 100. */
  readonly score: number;
  readonly reasons: readonly string[];
}

export interface StatementLine {
  readonly id: string;
  /** Référence métier de l'encaissement, distincte de l'identifiant technique. */
  readonly reference: string;
  readonly payer: string;
  /** Montant encaissé en XOF, entier. */
  readonly amount: number;
  readonly channel: PaymentChannel;
  /** Horodatage ISO 8601 avec fuseau ; formaté à l'affichage seulement. */
  readonly valueDate: string;
  readonly transactionReference: string;
  readonly status: ReconciliationStatus;
  /** Triées par score décroissant par la source ; l'écran ne les reclasse pas. */
  readonly suggestions: readonly MatchSuggestion[];
  /** Affectation retenue, une fois la ligne rapprochée ; `null` sinon. */
  readonly allocation: LineAllocation | null;
}

export interface LineAllocation {
  readonly memberCode: string;
  readonly memberName: string;
  readonly contributionLabel: string;
  readonly allocatedAmount: number;
  /** Reste à affecter ; zéro pour une affectation complète. */
  readonly remainder: number;
}

export interface PaymentsQuery {
  readonly queue: ReconciliationQueue;
  readonly search: string;
  readonly channel: PaymentChannel | null;
  readonly sort: SortState | null;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Entrée de piste d'audit. La fiche l'exige explicitement : « acteur, horodatage et
 * résultat ». Un journal qui n'énonce pas son résultat ne prouve rien.
 */
export interface AuditEntry {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly outcome: 'success' | 'pending' | 'rejected';
  readonly occurredAt: string;
}

export interface ReconciliationOverview {
  readonly toReconcile: number;
  readonly toConfirm: number;
  readonly anomalies: number;
  /** Montant total encore à affecter, en XOF. */
  readonly amountToReconcile: number;
}

export interface PaymentsQueuePage {
  readonly lines: readonly StatementLine[];
  /** Nombre de lignes correspondant au filtre, toutes pages confondues. */
  readonly totalItems: number;
  readonly overview: ReconciliationOverview;
  readonly auditTrail: readonly AuditEntry[];
  /** Canaux réellement présents dans la source ; jamais une nomenclature inventée. */
  readonly channels: readonly PaymentChannel[];
}

export interface ReconciliationAssignment {
  readonly lineId: string;
  readonly suggestionId: string;
  /** Montant affecté en XOF, entier. Validé par la source, pas par l'écran. */
  readonly allocatedAmount: number;
}

/**
 * Ordre de rapprochement.
 *
 * `idempotencyKey` porte le critère d'acceptation « double clic ne crée pas de
 * doublon » : rejouer la même clé rend le résultat déjà enregistré au lieu d'écrire
 * une seconde fois. La garde d'interface (bouton neutralisé) ne suffit pas — elle ne
 * couvre ni le renvoi réseau ni la reprise après coupure.
 */
export interface ReconciliationCommand {
  readonly idempotencyKey: string;
  readonly assignments: readonly ReconciliationAssignment[];
  readonly comment: string | null;
}

export interface AnomalyCommand {
  readonly idempotencyKey: string;
  readonly lineId: string;
  readonly type: AnomalyType;
  /** Obligatoire : la fiche impose un commentaire pour toute anomalie. */
  readonly comment: string;
}

export interface ReconciliationOutcome {
  readonly affectedCount: number;
  /** Vrai lorsque la clé d'idempotence a déjà été traitée : rien n'a été réécrit. */
  readonly replayed: boolean;
  readonly auditTrail: readonly AuditEntry[];
}

/**
 * Port du rapprochement des paiements (BO-014).
 *
 * Filtrage, tri, pagination et surtout validation des montants appartiennent à la
 * source. Une vérification faite uniquement dans le navigateur ne protège rien : la
 * fiche impose que « le montant affecté [soit] validé côté serveur ».
 */
export interface PaymentsGateway {
  search(query: PaymentsQuery): Observable<PaymentsQueuePage>;
  reconcile(command: ReconciliationCommand): Observable<ReconciliationOutcome>;
  reportAnomaly(command: AnomalyCommand): Observable<ReconciliationOutcome>;
}

export const PAYMENTS_GATEWAY = new InjectionToken<PaymentsGateway>('PAYMENTS_GATEWAY');

/**
 * Refus d'autorisation (403). Distinct d'une panne : un droit refusé ne se
 * « réessaie » pas, et proposer de réessayer inviterait à répéter une action
 * condamnée.
 */
export class PaymentsAccessError extends Error {
  constructor(message = 'Accès refusé au rapprochement des paiements') {
    super(message);
    this.name = 'PaymentsAccessError';
  }
}

/**
 * Refus métier de la source : montant hors bornes, ligne déjà traitée, anomalie
 * incomplète. Le message est destiné à l'agent et ne divulgue aucun détail technique.
 */
export class PaymentsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentsValidationError';
  }
}
