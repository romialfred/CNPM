import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SortState } from '../../../design-system/data-table/data-table.model';

/**
 * Port du reporting décisionnel (BO-028).
 *
 * Le découpage par période, la recherche et le tri appartiennent à la source, jamais à
 * l'écran : agréger côté navigateur ne pourrait porter que sur ce qui a déjà été
 * transmis, et afficherait donc un total plus faible que le total réel — exactement le
 * chiffre incohérent que la fiche proscrit.
 */

/** Rapports du catalogue. Aucun autre identifiant n'est admis. */
export type ReportId =
  'recouvrement-mensuel' | 'repartition-groupement' | 'performance-region' | 'categorie-cotisant';

export type ExerciseId = '2024' | '2023';

export type PeriodId = 'annee' | 's1' | 's2' | 't1' | 't2' | 't3' | 't4';

/**
 * Fiche d'un rapport du catalogue.
 *
 * `definition` et `source` ne sont pas décoratifs : la fiche BO-028 impose que chaque
 * indicateur expose sa définition, sa source, sa période et sa date de mise à jour.
 * Un taux affiché sans énoncer ce qu'il rapporte à quoi se prête à toutes les lectures,
 * y compris fausses.
 */
export interface ReportDescriptor {
  readonly id: ReportId;
  /** Libellé court de l'onglet du catalogue. */
  readonly label: string;
  readonly title: string;
  readonly description: string;
  /** En-tête de la colonne de ventilation (région, groupement, mois…). */
  readonly dimensionLabel: string;
  readonly definition: string;
  readonly source: string;
  /**
   * Le rapport ventile-t-il un effectif de membres ?
   *
   * Faux pour la série mensuelle : un effectif est un stock à une date, pas un flux.
   * Empiler douze stocks mensuels dans une colonne inviterait à les additionner, ce qui
   * compterait douze fois les mêmes membres. La colonne n'est alors pas rendue.
   */
  readonly hasMembers: boolean;
}

/**
 * Catalogue des rapports disponibles.
 *
 * Constante de contrat, et non donnée d'exploitation : la liste des rapports que
 * l'écran sait rendre est connue à la compilation. La faire transiter par le réseau
 * imposerait un état de chargement au sélecteur lui-même, donc un écran sans repère
 * tant que la réponse n'est pas là.
 */
export const REPORT_CATALOGUE: readonly ReportDescriptor[] = [
  {
    id: 'recouvrement-mensuel',
    label: 'Évolution mensuelle',
    title: 'Évolution mensuelle du recouvrement',
    description:
      'Cotisations attendues et encaissements constatés, mois par mois, sur la période sélectionnée.',
    dimensionLabel: 'Mois',
    definition:
      'Un mois est rattaché à la date de constatation de l’encaissement, non à la date d’échéance de la cotisation.',
    source: 'Journal des encaissements et échéancier des cotisations.',
    hasMembers: false,
  },
  {
    id: 'repartition-groupement',
    label: 'Par groupement',
    title: 'Répartition par groupement professionnel',
    description:
      'Ventilation des cotisations attendues et encaissées entre les groupements professionnels.',
    dimensionLabel: 'Groupement',
    definition:
      'Un membre est rattaché à un seul groupement ; les montants ne sont donc jamais comptés deux fois.',
    source: 'Registre des membres et journal des encaissements.',
    hasMembers: true,
  },
  {
    id: 'performance-region',
    label: 'Par région',
    title: 'Performance par région',
    description:
      'Recouvrement constaté par région d’implantation du siège social déclaré par le membre.',
    dimensionLabel: 'Région',
    definition:
      'La région retenue est celle du siège social déclaré, et non celle du lieu de paiement.',
    source: 'Registre des membres et journal des encaissements.',
    hasMembers: true,
  },
  {
    id: 'categorie-cotisant',
    label: 'Par catégorie',
    title: 'Répartition par catégorie de cotisant',
    description:
      'Concentration des cotisations par catégorie d’entreprise, de la grande entreprise à la TPE.',
    dimensionLabel: 'Catégorie',
    definition:
      'La catégorie est celle enregistrée sur la fiche du membre au dernier jour de la période.',
    source: 'Registre des membres et journal des encaissements.',
    hasMembers: true,
  },
];

/**
 * Ligne de ventilation d'un rapport.
 *
 * Les montants sont des entiers de FCFA. Jamais un flottant : `CLAUDE.md` l'interdit
 * pour un montant, et une somme de flottants ne retomberait pas sur le total affiché.
 */
export interface ReportRow {
  readonly id: string;
  readonly label: string;
  /** Libellé abrégé, réservé aux axes du graphique où la place manque. */
  readonly shortLabel: string;
  readonly expected: number;
  readonly collected: number;
  /** `collected - expected` : négatif tant qu'il reste à recouvrer. */
  readonly gap: number;
  /** Pourcentage 0–100 ; `null` si rien n'est attendu, pour éviter une division par zéro. */
  readonly recoveryRate: number | null;
  /** Part de la ligne dans les encaissements de la période, en pourcentage. */
  readonly share: number | null;
  /** Effectif de membres actifs, `null` quand la ventilation n'en porte pas. */
  readonly members: number | null;
}

/**
 * Agrégats de la période — le « KpiStrip » de la fiche, borné à six mesures.
 *
 * Établis par la source, jamais recalculés par l'écran : deux calculs finissent par
 * diverger, et c'est le panneau qui contredit le tableau.
 */
export interface ReportTotals {
  readonly expected: number;
  readonly collected: number;
  /** `expected - collected` : reste à recouvrer, positif. */
  readonly outstanding: number;
  readonly recoveryRate: number | null;
  /** Stock de membres actifs à la fin de la période. */
  readonly activeMembers: number;
  /** Flux d'adhésions sur la période. */
  readonly newMembers: number;
}

export type ReportInsightKind = 'fact' | 'anomaly' | 'recommendation';

/**
 * Énoncé produit automatiquement à partir des chiffres du rapport.
 *
 * `rationale` est obligatoire : la fiche exige que les recommandations automatiques
 * soient « identifiées comme telles et explicables ». Une recommandation sans règle
 * énoncée est un oracle, que personne ne peut ni vérifier ni contester.
 */
export interface ReportInsight {
  readonly id: string;
  readonly kind: ReportInsightKind;
  readonly message: string;
  readonly rationale: string;
}

/** Taux de recouvrement d'une région, pour le panneau territorial. */
export interface RegionRate {
  readonly id: string;
  readonly label: string;
  readonly recoveryRate: number | null;
}

export interface ReportResult {
  readonly descriptor: ReportDescriptor;
  readonly rows: readonly ReportRow[];
  /**
   * Nombre de lignes du rapport avant application de la recherche.
   *
   * Sans lui, l'écran ne saurait pas distinguer une période réellement sans donnée
   * d'une recherche trop étroite. Les deux appellent des gestes opposés : changer de
   * période, ou élargir la recherche.
   */
  readonly totalRows: number;
  /** `null` lorsque la période sélectionnée ne porte aucune donnée. */
  readonly totals: ReportTotals | null;
  readonly insights: readonly ReportInsight[];
  readonly regions: readonly RegionRate[];
  readonly periodLabel: string;
  /** Date d'arrêté des données, déjà mise en forme par la source. */
  readonly updatedAt: string;
}

export interface ReportQuery {
  readonly reportId: ReportId;
  readonly exercise: ExerciseId;
  readonly period: PeriodId;
  readonly search: string;
  readonly sort: SortState | null;
}

export interface ReportingGateway {
  load(query: ReportQuery): Observable<ReportResult>;
}

export const REPORTING_GATEWAY = new InjectionToken<ReportingGateway>('REPORTING_GATEWAY');

/**
 * Refus d'accès (403) levé par le port.
 *
 * L'écran le distingue d'une panne : un droit refusé ne se « réessaie » pas — proposer
 * de recommencer inviterait à répéter une action que la permission condamne.
 */
export class ReportingAccessError extends Error {
  constructor(message = 'Accès refusé au reporting') {
    super(message);
    this.name = 'ReportingAccessError';
  }
}
