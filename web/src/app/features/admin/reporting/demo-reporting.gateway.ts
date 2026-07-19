import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import {
  REPORT_CATALOGUE,
  type ExerciseId,
  type PeriodId,
  type RegionRate,
  type ReportDescriptor,
  type ReportInsight,
  type ReportQuery,
  type ReportResult,
  type ReportRow,
  type ReportTotals,
  type ReportingGateway,
} from './reporting-gateway';

/**
 * Point mensuel de la série de démonstration.
 *
 * `activeMembers` est un stock à la fin du mois, `newMembers` un flux du mois. Les
 * confondre ferait d'une somme d'effectifs un total sans signification.
 */
interface MonthPoint {
  readonly month: number;
  readonly expected: number;
  readonly collected: number;
  readonly newMembers: number;
  readonly activeMembers: number;
}

/**
 * Poids d'une ventilation, exprimés en pour mille.
 *
 * Des entiers plutôt que des fractions : trois arrondis de pourcentages ne retombent
 * pas sur le total, et le tableau contredirait alors le bandeau d'indicateurs. Le
 * reliquat d'arrondi est absorbé par la dernière ligne, si bien que la somme des
 * lignes égale toujours le total, au franc près.
 */
interface DimensionWeight {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly expected: number;
  readonly collected: number;
  readonly members: number;
}

const MONTH_LABELS: readonly string[] = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const MONTH_SHORT_LABELS: readonly string[] = [
  'Janv.',
  'Févr.',
  'Mars',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sept.',
  'Oct.',
  'Nov.',
  'Déc.',
];

/**
 * Exercice en cours, arrêté au 30 juin : les mois de juillet à décembre n'existent pas
 * encore. Sélectionner le second semestre mène donc à un état « aucune donnée »
 * légitime, et non à une erreur — c'est précisément le cas que la matrice
 * `loading-empty-error.md` demande de couvrir.
 */
const MONTHS_2024: readonly MonthPoint[] = [
  { month: 1, expected: 186_400_000, collected: 142_300_000, newMembers: 24, activeMembers: 3768 },
  { month: 2, expected: 214_800_000, collected: 168_900_000, newMembers: 31, activeMembers: 3789 },
  { month: 3, expected: 238_500_000, collected: 195_200_000, newMembers: 27, activeMembers: 3803 },
  { month: 4, expected: 201_700_000, collected: 152_400_000, newMembers: 33, activeMembers: 3818 },
  { month: 5, expected: 226_300_000, collected: 186_100_000, newMembers: 29, activeMembers: 3829 },
  { month: 6, expected: 245_900_000, collected: 208_700_000, newMembers: 34, activeMembers: 3842 },
];

const MONTHS_2023: readonly MonthPoint[] = [
  { month: 1, expected: 164_200_000, collected: 118_500_000, newMembers: 28, activeMembers: 3402 },
  { month: 2, expected: 179_600_000, collected: 131_400_000, newMembers: 25, activeMembers: 3421 },
  { month: 3, expected: 208_300_000, collected: 158_900_000, newMembers: 31, activeMembers: 3448 },
  { month: 4, expected: 187_500_000, collected: 139_200_000, newMembers: 27, activeMembers: 3468 },
  { month: 5, expected: 196_800_000, collected: 152_600_000, newMembers: 30, activeMembers: 3489 },
  { month: 6, expected: 221_400_000, collected: 173_800_000, newMembers: 35, activeMembers: 3512 },
  { month: 7, expected: 203_900_000, collected: 154_100_000, newMembers: 29, activeMembers: 3531 },
  { month: 8, expected: 168_700_000, collected: 121_300_000, newMembers: 22, activeMembers: 3548 },
  { month: 9, expected: 214_600_000, collected: 166_500_000, newMembers: 34, activeMembers: 3566 },
  { month: 10, expected: 229_100_000, collected: 181_700_000, newMembers: 38, activeMembers: 3582 },
  { month: 11, expected: 241_800_000, collected: 197_400_000, newMembers: 41, activeMembers: 3597 },
  { month: 12, expected: 263_500_000, collected: 219_800_000, newMembers: 42, activeMembers: 3610 },
];

const SERIES: Readonly<Record<ExerciseId, readonly MonthPoint[]>> = {
  '2024': MONTHS_2024,
  '2023': MONTHS_2023,
};

const UPDATED_AT: Readonly<Record<ExerciseId, string>> = {
  '2024': 'Données arrêtées au 30 juin 2024',
  '2023': 'Données arrêtées au 31 décembre 2023',
};

const PERIOD_MONTHS: Readonly<Record<PeriodId, readonly number[]>> = {
  annee: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  s1: [1, 2, 3, 4, 5, 6],
  s2: [7, 8, 9, 10, 11, 12],
  t1: [1, 2, 3],
  t2: [4, 5, 6],
  t3: [7, 8, 9],
  t4: [10, 11, 12],
};

export const PERIOD_LABELS: Readonly<Record<PeriodId, string>> = {
  annee: 'Année complète',
  s1: '1er semestre',
  s2: '2e semestre',
  t1: '1er trimestre',
  t2: '2e trimestre',
  t3: '3e trimestre',
  t4: '4e trimestre',
};

export const EXERCISE_LABELS: Readonly<Record<ExerciseId, string>> = {
  '2024': 'Exercice 2024',
  '2023': 'Exercice 2023',
};

/** Groupements et catégories repris de la taxonomie de démonstration des membres. */
const GROUP_WEIGHTS: readonly DimensionWeight[] = [
  {
    id: 'btp',
    label: 'BTP et Infrastructures',
    shortLabel: 'BTP',
    expected: 312,
    collected: 296,
    members: 268,
  },
  {
    id: 'commerce',
    label: 'Commerce et Distribution',
    shortLabel: 'Commerce',
    expected: 268,
    collected: 279,
    members: 305,
  },
  {
    id: 'services',
    label: 'Services',
    shortLabel: 'Services',
    expected: 244,
    collected: 251,
    members: 262,
  },
  {
    id: 'industrie',
    label: 'Industrie',
    shortLabel: 'Industrie',
    expected: 176,
    collected: 174,
    members: 165,
  },
];

const REGION_WEIGHTS: readonly DimensionWeight[] = [
  {
    id: 'bamako',
    label: 'Bamako',
    shortLabel: 'Bamako',
    expected: 548,
    collected: 583,
    members: 512,
  },
  {
    id: 'koulikoro',
    label: 'Koulikoro',
    shortLabel: 'Koulikoro',
    expected: 128,
    collected: 121,
    members: 138,
  },
  {
    id: 'sikasso',
    label: 'Sikasso',
    shortLabel: 'Sikasso',
    expected: 114,
    collected: 106,
    members: 122,
  },
  { id: 'segou', label: 'Ségou', shortLabel: 'Ségou', expected: 86, collected: 78, members: 94 },
  { id: 'mopti', label: 'Mopti', shortLabel: 'Mopti', expected: 62, collected: 51, members: 68 },
  {
    id: 'autres',
    label: 'Autres régions',
    shortLabel: 'Autres',
    expected: 62,
    collected: 61,
    members: 66,
  },
];

const CATEGORY_WEIGHTS: readonly DimensionWeight[] = [
  {
    id: 'grande',
    label: 'Grande entreprise',
    shortLabel: 'Grandes',
    expected: 462,
    collected: 498,
    members: 118,
  },
  {
    id: 'moyenne',
    label: 'Moyenne entreprise',
    shortLabel: 'Moyennes',
    expected: 274,
    collected: 268,
    members: 236,
  },
  { id: 'pme', label: 'PME', shortLabel: 'PME', expected: 186, collected: 164, members: 341 },
  { id: 'tpe', label: 'TPE', shortLabel: 'TPE', expected: 78, collected: 70, members: 305 },
];

/** Seuil d'alerte du taux de recouvrement, en pourcentage. */
const LOW_RECOVERY_THRESHOLD = 75;

const AMOUNT_FORMAT = new Intl.NumberFormat('fr-ML', { maximumFractionDigits: 0 });
const RATE_FORMAT = new Intl.NumberFormat('fr-ML', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Comparaison insensible à la casse et aux diacritiques : chercher « Segou » doit
 * trouver « Ségou », faute de quoi la recherche ne rend rien à qui tape sans accents.
 */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function rate(collected: number, expected: number): number | null {
  return expected === 0 ? null : (collected / expected) * 100;
}

/**
 * Adaptateur de démonstration du port `REPORTING_GATEWAY`.
 *
 * Il tient le rôle de l'API : c'est lui qui agrège, ventile, recherche et trie. L'écran
 * ne reçoit qu'un rapport déjà constitué, si bien que le remplacer par l'adaptateur
 * HTTP réel ne touchera aucune page.
 *
 * Toutes les valeurs affichées dérivent d'une seule série mensuelle, et les
 * ventilations sont des répartitions de ses totaux : la somme d'un tableau égale
 * toujours l'indicateur correspondant. C'est la seule construction qui garantisse le
 * critère « données cohérentes avec le catalogue KPI » — deux jeux de chiffres saisis
 * séparément divergent à la première correction.
 *
 * Données entièrement fictives, conformément à `CLAUDE.md` : aucune donnée réelle de
 * membre, aucun montant officiel du CNPM.
 */
@Injectable()
export class DemoReportingGateway implements ReportingGateway {
  load(query: ReportQuery): Observable<ReportResult> {
    const descriptor = this.descriptor(query.reportId);
    const months = this.months(query);
    const totals = this.totals(months);

    const all = this.buildRows(descriptor, months, totals);
    const filtered = this.applySearch(all, query.search);
    const rows = this.sortRows(filtered, query);

    const result: ReportResult = {
      descriptor,
      rows,
      totalRows: all.length,
      totals,
      insights: this.insights(descriptor, all, totals),
      regions: this.regions(totals),
      periodLabel: `${PERIOD_LABELS[query.period]} ${query.exercise}`,
      updatedAt: UPDATED_AT[query.exercise],
    };

    // Latence simulée : sans elle, l'état de chargement ne serait jamais peint, donc
    // jamais éprouvé.
    return of(result).pipe(delay(140));
  }

  private descriptor(id: ReportQuery['reportId']): ReportDescriptor {
    const found = REPORT_CATALOGUE.find((entry) => entry.id === id);
    // Le catalogue est exhaustif par construction ; la garde protège d'un identifiant
    // hors contrat plutôt que de laisser passer un `undefined` jusqu'au gabarit.
    return found ?? REPORT_CATALOGUE[0];
  }

  private months(query: ReportQuery): readonly MonthPoint[] {
    const wanted = PERIOD_MONTHS[query.period];
    return SERIES[query.exercise].filter((point) => wanted.includes(point.month));
  }

  private totals(months: readonly MonthPoint[]): ReportTotals | null {
    if (months.length === 0) {
      return null;
    }
    const expected = months.reduce((sum, point) => sum + point.expected, 0);
    const collected = months.reduce((sum, point) => sum + point.collected, 0);
    return {
      expected,
      collected,
      outstanding: expected - collected,
      recoveryRate: rate(collected, expected),
      // Un stock se lit à la fin de la période ; l'additionner compterait les mêmes
      // membres autant de fois qu'il y a de mois.
      activeMembers: months[months.length - 1].activeMembers,
      newMembers: months.reduce((sum, point) => sum + point.newMembers, 0),
    };
  }

  private buildRows(
    descriptor: ReportDescriptor,
    months: readonly MonthPoint[],
    totals: ReportTotals | null,
  ): readonly ReportRow[] {
    if (!totals) {
      return [];
    }
    if (descriptor.id === 'recouvrement-mensuel') {
      return this.monthlyRows(months, totals);
    }
    return this.dimensionRows(this.weights(descriptor), totals);
  }

  private weights(descriptor: ReportDescriptor): readonly DimensionWeight[] {
    switch (descriptor.id) {
      case 'repartition-groupement':
        return GROUP_WEIGHTS;
      case 'performance-region':
        return REGION_WEIGHTS;
      default:
        return CATEGORY_WEIGHTS;
    }
  }

  private monthlyRows(months: readonly MonthPoint[], totals: ReportTotals): readonly ReportRow[] {
    return months.map((point) => {
      const gap = point.collected - point.expected;
      return {
        id: `mois-${point.month}`,
        label: MONTH_LABELS[point.month - 1],
        shortLabel: MONTH_SHORT_LABELS[point.month - 1],
        expected: point.expected,
        collected: point.collected,
        gap,
        recoveryRate: rate(point.collected, point.expected),
        share: totals.collected === 0 ? null : (point.collected / totals.collected) * 100,
        members: null,
      };
    });
  }

  /**
   * Ventile les totaux de la période selon des poids en pour mille.
   *
   * La dernière ligne reçoit le reliquat plutôt qu'un arrondi indépendant : c'est ce
   * qui garantit que la somme de la colonne égale exactement l'indicateur affiché.
   */
  private dimensionRows(
    weights: readonly DimensionWeight[],
    totals: ReportTotals,
  ): readonly ReportRow[] {
    let expectedLeft = totals.expected;
    let collectedLeft = totals.collected;
    let membersLeft = totals.activeMembers;

    return weights.map((weight, index) => {
      const last = index === weights.length - 1;
      const expected = last ? expectedLeft : Math.round((totals.expected * weight.expected) / 1000);
      const collected = last
        ? collectedLeft
        : Math.round((totals.collected * weight.collected) / 1000);
      const members = last
        ? membersLeft
        : Math.round((totals.activeMembers * weight.members) / 1000);

      expectedLeft -= expected;
      collectedLeft -= collected;
      membersLeft -= members;

      return {
        id: weight.id,
        label: weight.label,
        shortLabel: weight.shortLabel,
        expected,
        collected,
        gap: collected - expected,
        recoveryRate: rate(collected, expected),
        share: totals.collected === 0 ? null : (collected / totals.collected) * 100,
        members,
      };
    });
  }

  private applySearch(rows: readonly ReportRow[], search: string): readonly ReportRow[] {
    const term = fold(search.trim());
    if (!term) {
      return rows;
    }
    return rows.filter((row) => fold(row.label).includes(term));
  }

  private sortRows(rows: readonly ReportRow[], query: ReportQuery): readonly ReportRow[] {
    const sort = query.sort;
    if (!sort) {
      return rows;
    }
    const factor = sort.direction === 'asc' ? 1 : -1;
    // La copie est délibérée : `sort` trie en place et réordonnerait le tableau source.
    return [...rows].sort((left, right) => factor * this.compare(left, right, sort.key));
  }

  private compare(left: ReportRow, right: ReportRow, key: string): number {
    switch (key) {
      case 'expected':
        return left.expected - right.expected;
      case 'collected':
        return left.collected - right.collected;
      case 'gap':
        return left.gap - right.gap;
      case 'recoveryRate':
        return (left.recoveryRate ?? 0) - (right.recoveryRate ?? 0);
      case 'members':
        return (left.members ?? 0) - (right.members ?? 0);
      case 'label':
      default:
        // L'ordre naturel de la série mensuelle est chronologique, pas alphabétique :
        // trier « Août » avant « Janvier » rendrait la courbe illisible.
        return left.id.localeCompare(right.id, 'fr', { numeric: true });
    }
  }

  private regions(totals: ReportTotals | null): readonly RegionRate[] {
    if (!totals) {
      return [];
    }
    return this.dimensionRows(REGION_WEIGHTS, totals).map((row) => ({
      id: row.id,
      label: row.label,
      recoveryRate: row.recoveryRate,
    }));
  }

  /**
   * Énoncés dérivés des seules valeurs affichées.
   *
   * Chacun porte la règle qui l'a produit : la fiche exige des recommandations
   * « explicables ». Aucune n'est une décision, et aucune n'introduit un chiffre absent
   * du tableau.
   */
  private insights(
    descriptor: ReportDescriptor,
    rows: readonly ReportRow[],
    totals: ReportTotals | null,
  ): readonly ReportInsight[] {
    if (!totals || rows.length === 0) {
      return [];
    }

    const insights: ReportInsight[] = [];

    if (totals.recoveryRate !== null) {
      insights.push({
        id: 'taux-periode',
        kind: 'fact',
        message: `Taux de recouvrement de la période : ${RATE_FORMAT.format(totals.recoveryRate)} %.`,
        rationale: `Encaissements (${AMOUNT_FORMAT.format(totals.collected)} FCFA) rapportés aux cotisations attendues (${AMOUNT_FORMAT.format(totals.expected)} FCFA).`,
      });
    }

    const rated = rows.filter((row) => row.recoveryRate !== null);
    const best = rated.reduce<ReportRow | null>(
      (top, row) => (top === null || (row.recoveryRate ?? 0) > (top.recoveryRate ?? 0) ? row : top),
      null,
    );
    if (best && best.recoveryRate !== null) {
      insights.push({
        id: 'meilleure-ligne',
        kind: 'fact',
        message: `${best.label} affiche le meilleur taux de recouvrement (${RATE_FORMAT.format(best.recoveryRate)} %).`,
        rationale: `Maximum des ${rated.length} lignes du rapport « ${descriptor.title} », sur la même période.`,
      });
    }

    const worst = rated.reduce<ReportRow | null>(
      (low, row) => (low === null || (row.recoveryRate ?? 0) < (low.recoveryRate ?? 0) ? row : low),
      null,
    );
    if (worst && worst.recoveryRate !== null && worst.recoveryRate < LOW_RECOVERY_THRESHOLD) {
      insights.push({
        id: 'ligne-basse',
        kind: 'anomaly',
        message: `${worst.label} reste sous le seuil d’alerte, à ${RATE_FORMAT.format(worst.recoveryRate)} %.`,
        rationale: `Seuil d’alerte fixé à ${LOW_RECOVERY_THRESHOLD} % ; écart constaté de ${AMOUNT_FORMAT.format(Math.abs(worst.gap))} FCFA.`,
      });
    }

    // Le plus grand écart est cherché parmi les seules lignes qui recouvrent moins bien
    // que la période dans son ensemble. Le chercher sur toutes les lignes désignerait la
    // plus volumineuse, souvent la mieux tenue : l'écran recommanderait de relancer
    // celui qu'il vient de citer en exemple, et se contredirait d'un encadré à l'autre.
    const periodRate = totals.recoveryRate;
    const underperforming = rows.filter(
      (row) =>
        row.gap < 0 &&
        periodRate !== null &&
        row.recoveryRate !== null &&
        row.recoveryRate < periodRate,
    );
    const widest = underperforming.reduce<ReportRow | null>(
      (top, row) => (top === null || row.gap < top.gap ? row : top),
      null,
    );
    if (widest && periodRate !== null) {
      const shareOfOutstanding =
        totals.outstanding === 0 ? null : (Math.abs(widest.gap) / totals.outstanding) * 100;
      const basis = `Écart le plus élevé parmi les lignes recouvrant moins bien que la période (${RATE_FORMAT.format(periodRate)} %) : ${AMOUNT_FORMAT.format(Math.abs(widest.gap))} FCFA`;
      insights.push({
        id: 'relance-prioritaire',
        kind: 'recommendation',
        message: `Concentrer l’effort de relance sur ${widest.label}.`,
        rationale:
          shareOfOutstanding === null
            ? `${basis}.`
            : `${basis}, soit ${RATE_FORMAT.format(shareOfOutstanding)} % du reste à recouvrer.`,
      });
    }

    return insights;
  }
}
