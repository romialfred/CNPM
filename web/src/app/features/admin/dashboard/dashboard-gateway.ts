import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Port du tableau de bord d'administration (BO-001).
 *
 * L'écran n'agrège rien : il reçoit des mesures déjà établies. Recalculer ici ce que
 * la source a déjà calculé produirait un second résultat, capable de contredire
 * silencieusement le premier — c'est exactement le « total incohérent » que les fiches
 * BO-001 et BO-002 interdisent.
 */

/**
 * Indicateur clé.
 *
 * `value` vaut `null` quand la mesure n'est pas disponible pour l'exercice demandé.
 * Le critère d'acceptation de la fiche l'exige : « Les valeurs absentes affichent
 * “Donnée indisponible”, pas zéro implicite ». Un zéro affiché à la place d'une
 * absence se lit comme une contre-performance, ce qui est un mensonge.
 */
export interface DashboardKpi {
  readonly key: string;
  readonly label: string;
  readonly value: number | null;
  /** Décimales affichées ; entier par défaut. */
  readonly decimals?: number;
  /** Suffixe collé à la valeur, par exemple « % ». */
  readonly suffix?: string;
  /** Unité rappelée à côté du libellé, par exemple « FCFA ». */
  readonly unit?: string;
  /** Définition de la mesure : la fiche impose que les KPI soient définis, pas devinés. */
  readonly definition: string;
  /**
   * Destination du clic sur le KPI (« Un clic sur KPI applique un filtre et ouvre la
   * page cible »). Absente quand aucune page livrée ne porte ce périmètre : un KPI
   * cliquable vers une rubrique non livrée conduirait à une page morte.
   */
  readonly route?: string;
  readonly queryParams?: Readonly<Record<string, string>>;
  /** Intention du lien, énoncée pour ne pas laisser « Membres actifs » seul comme nom. */
  readonly linkLabel?: string;
}

/** Point mensuel de la série d'encaissements. */
export interface DashboardMonthPoint {
  readonly key: string;
  /** Libellé complet, utilisé par la table accessible du graphique. */
  readonly label: string;
  /** Libellé court, sous la barre. */
  readonly shortLabel: string;
  readonly expected: number;
  readonly collected: number;
  /** Pourcentage 0–100. */
  readonly rate: number;
}

/**
 * Variation entre les deux derniers points de la série.
 *
 * `direction` porte le sens et le texte l'énonce : une tendance ne doit jamais se lire
 * à la seule couleur d'une flèche.
 */
export interface DashboardTrend {
  readonly direction: 'up' | 'down' | 'flat';
  /** Amplitude en pourcentage, toujours positive ; le sens vit dans `direction`. */
  readonly value: number;
  /** Point de comparaison, par exemple « mai 2024 ». */
  readonly reference: string;
  /** Point mesuré, par exemple « juin 2024 ». */
  readonly current: string;
}

/**
 * Cohorte de la segmentation.
 *
 * `scope` évite l'erreur de lecture la plus coûteuse du panneau : additionner des
 * cohortes qui ne s'additionnent pas. `base` compose la base de membres, `outside`
 * n'en fait pas partie, `subset` en est un sous-ensemble déjà compté.
 */
export interface DashboardSegment {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  /** Part de la base de membres ; `null` hors base, où la part n'a pas de sens. */
  readonly share: number | null;
  readonly scope: 'base' | 'outside' | 'subset';
}

export type DashboardPaymentChannel = 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH';
export type DashboardPaymentStatus = 'MATCHED' | 'UNMATCHED' | 'PENDING';

export interface DashboardPayment {
  readonly id: string;
  readonly reference: string;
  readonly payer: string;
  /** Montant en XOF, entier. Jamais un flottant : `CLAUDE.md` l'interdit. */
  readonly amount: number;
  readonly channel: DashboardPaymentChannel;
  readonly status: DashboardPaymentStatus;
  /** Horodatage ISO 8601, formaté à l'affichage seulement. */
  readonly paidAt: string;
}

export type DashboardAlertSeverity = 'critical' | 'warning' | 'info';

export interface DashboardAlert {
  readonly id: string;
  readonly severity: DashboardAlertSeverity;
  readonly title: string;
  readonly detail: string;
  readonly raisedAt: string;
}

export interface DashboardActivity {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  /** Date ISO `AAAA-MM-JJ`. */
  readonly occurredAt: string;
}

/** Agrégats de cotisation de l'exercice. `null` quand la mesure est indisponible. */
export interface DashboardContributions {
  readonly expected: number | null;
  readonly collected: number | null;
  readonly outstanding: number | null;
  /** Pourcentage 0–100. */
  readonly recoveryRate: number | null;
}

export interface DashboardSnapshot {
  readonly exercise: string;
  /** Horodatage ISO de la mesure : « le rafraîchissement conserve la dernière donnée
   *  lisible », encore faut-il pouvoir dire de quand elle date. */
  readonly generatedAt: string;
  readonly kpis: readonly DashboardKpi[];
  readonly months: readonly DashboardMonthPoint[];
  readonly trend: DashboardTrend | null;
  readonly segments: readonly DashboardSegment[];
  /** Effectif de la base de membres ; `null` si indisponible. */
  readonly memberBase: number | null;
  readonly contributions: DashboardContributions;
  readonly payments: readonly DashboardPayment[];
  /**
   * Alertes déjà triées par gravité puis par date décroissante — critère
   * d'acceptation de la fiche. Le tri appartient à la source : le refaire à l'écran
   * ouvrirait la possibilité que les deux ordres divergent.
   */
  readonly alerts: readonly DashboardAlert[];
  readonly activities: readonly DashboardActivity[];
}

export interface DashboardGateway {
  /** Exercices consultables, du plus récent au plus ancien. */
  readonly exercises: readonly string[];
  load(exercise: string): Observable<DashboardSnapshot>;
}

export const DASHBOARD_GATEWAY = new InjectionToken<DashboardGateway>('DASHBOARD_GATEWAY');

/**
 * Refus d'autorisation (403) renvoyé par le port.
 *
 * L'écran le distingue d'une panne : un droit refusé ne se « réessaie » pas, et
 * proposer de recommencer inviterait à répéter une action condamnée.
 */
export class DashboardAccessError extends Error {
  constructor(message = 'Accès refusé au tableau de bord') {
    super(message);
    this.name = 'DashboardAccessError';
  }
}
