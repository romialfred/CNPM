import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SortState } from '../../../design-system/data-table/data-table.model';

/**
 * Trimestre d'appel. L'exercice est porté séparément : « T2 » seul ne désigne rien,
 * mais dupliquer l'année dans le libellé de période rendrait le filtre « Exercice »
 * redondant et permettrait de choisir « 2024 » et « T2 2023 » simultanément.
 */
export type Quarter = 'T1' | 'T2' | 'T3' | 'T4';

export const QUARTER_LABELS: Readonly<Record<Quarter, string>> = {
  T1: 'T1 (janvier – mars)',
  T2: 'T2 (avril – juin)',
  T3: 'T3 (juillet – septembre)',
  T4: 'T4 (octobre – décembre)',
};

export const QUARTERS = ['T1', 'T2', 'T3', 'T4'] as const satisfies readonly Quarter[];

/**
 * Cycle de vie d'un appel de cotisation.
 *
 * `SETTLED` s'affiche « Encaissé » et non « Encaisser » : la fiche BO-011 en fait un
 * critère d'acceptation explicite — le libellé de la maquette est un impératif, donc
 * une action, là où la colonne annonce un état.
 *
 * `DRAFT` désigne un appel préparé mais non émis : c'est le seul état qui justifie
 * l'action « Émettre ». Un appel non émis n'est pas encore dû, et n'entre donc dans
 * aucun montant appelé.
 */
export type ContributionCallStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'SETTLED' | 'OVERDUE';

export interface ContributionCallRow {
  readonly id: string;
  /** Référence métier de l'appel, distincte de la clé technique. */
  readonly reference: string;
  readonly memberCode: string;
  readonly memberName: string;
  /** Exercice budgétaire, en années pleines (« 2024 »). */
  readonly fiscalYear: string;
  readonly quarter: Quarter;
  /**
   * Montants en XOF, entiers. Jamais un flottant : `CLAUDE.md` l'interdit pour un
   * montant, et un centième de franc CFA n'existe pas.
   */
  readonly calledAmount: number;
  readonly paidAmount: number;
  /**
   * Ajustement déduit du solde (avoir, remise validée). Positif ou nul.
   *
   * Sans ce champ, l'identité « appelé = payé + reste » serait fausse dès qu'un avoir
   * existe, et l'écart resterait inexpliqué à l'écran. La fiche BO-011 exige que
   * l'identité tienne « sauf ajustement explicitement affiché » : le montant est donc
   * transporté jusqu'à la vue, qui l'affiche, plutôt qu'absorbé silencieusement.
   */
  readonly adjustmentAmount: number;
  /** `calledAmount - paidAmount - adjustmentAmount`, calculé à la source. */
  readonly outstandingAmount: number;
  /** Date ISO `AAAA-MM-JJ` ; le formatage n'a lieu qu'à l'affichage. */
  readonly dueDate: string;
  /**
   * Échéance dépassée à la date d'arrêté du jeu (`asOf`).
   *
   * Calculé à la source et non dans la vue : une comparaison à `Date.now()` côté écran
   * rendrait la page non déterministe, donc intestable en régression visuelle.
   */
  readonly pastDue: boolean;
  readonly status: ContributionCallStatus;
}

export interface ContributionCallQuery {
  readonly search: string;
  readonly fiscalYear: string | null;
  readonly quarter: Quarter | null;
  readonly status: ContributionCallStatus | null;
  readonly sort: SortState | null;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Agrégats des appels correspondant au filtre courant.
 *
 * Portée volontairement identique à celle du tableau : la fiche BO-011 impose que le
 * graphique et le tableau couvrent la même période, et un total « tous exercices
 * confondus » posé au-dessus d'une liste filtrée sur 2024 additionnerait des montants
 * que personne ne regarde.
 *
 * Les brouillons sont exclus des montants : un appel non émis n'a rien appelé.
 */
export interface ContributionsOverview {
  /** Appels réellement émis parmi ceux que le filtre retient ; brouillons exclus. */
  readonly callsIssued: number;
  readonly calledTotal: number;
  readonly collectedTotal: number;
  /** Somme des soldes restants, ajustements déjà déduits. */
  readonly outstandingTotal: number;
  /** Pourcentage 0–100 ; `null` si rien n'est appelé, pour éviter une division par zéro. */
  readonly recoveryRate: number | null;
}

export interface ContributionCallsPage {
  readonly rows: readonly ContributionCallRow[];
  /** Nombre d'appels correspondant au filtre, toutes pages confondues. */
  readonly totalItems: number;
  readonly overview: ContributionsOverview;
  /** Exercices réellement présents dans la source ; jamais une plage inventée. */
  readonly fiscalYears: readonly string[];
  /**
   * Date d'arrêté qui sépare les échéances échues des échéances à venir.
   *
   * Exposée à la vue parce qu'elle est une hypothèse de lecture : « en retard » n'a de
   * sens qu'à une date donnée, et la taire laisserait croire à un temps réel.
   */
  readonly asOf: string;
}

/**
 * Port de la liste des appels de cotisation (BO-011).
 *
 * Le filtrage, le tri et la pagination appartiennent à la source : trier la page
 * courante ne trierait que la page, ce qui mentirait sur un jeu paginé.
 */
export interface ContributionsGateway {
  searchCalls(query: ContributionCallQuery): Observable<ContributionCallsPage>;
}

export const CONTRIBUTIONS_GATEWAY = new InjectionToken<ContributionsGateway>(
  'CONTRIBUTIONS_GATEWAY',
);

/**
 * Refus d'accès (403) émis par le port.
 *
 * L'écran le distingue d'une panne : un droit refusé ne se « réessaie » pas, et
 * proposer le bouton inviterait à répéter une action condamnée.
 */
export class ContributionsAccessError extends Error {
  constructor(message = 'Accès refusé aux cotisations') {
    super(message);
    this.name = 'ContributionsAccessError';
  }
}
