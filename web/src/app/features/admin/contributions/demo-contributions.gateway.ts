import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import type {
  ContributionCallQuery,
  ContributionCallRow,
  ContributionCallStatus,
  ContributionCallsPage,
  ContributionsGateway,
  ContributionsOverview,
  Quarter,
} from './contributions-gateway';

/**
 * Date d'arrêté du jeu de démonstration.
 *
 * Fixée, jamais `Date.now()` : `visual-regression.md` impose « fixed fixtures, locale,
 * timezone and date ». Une horloge réelle ferait basculer des lignes de « à échoir » à
 * « échue » avec le temps, et la même capture cesserait de correspondre à sa baseline
 * sans qu'aucun code n'ait changé.
 */
const AS_OF = '2024-06-30';

/**
 * Appel de cotisation tel qu'il est saisi dans ce jeu de démonstration.
 *
 * Ni la référence, ni le solde, ni le statut n'y figurent : ils sont **dérivés**. Les
 * saisir à la main autoriserait un jeu contradictoire — un appel « Encaissé » avec un
 * solde non nul, ou une référence dont le trimestre dément la période — et c'est
 * exactement le genre d'incohérence que la fiche BO-011 interdit d'afficher.
 */
interface CallFixture {
  readonly memberCode: string;
  readonly memberName: string;
  readonly fiscalYear: string;
  readonly quarter: Quarter;
  readonly calledAmount: number;
  readonly paidAmount: number;
  /** Avoir déduit du solde ; positif ou nul. */
  readonly adjustmentAmount: number;
  readonly dueDate: string;
  /** Un appel non émis reste un brouillon : il n'a rien appelé. */
  readonly emitted: boolean;
}

/**
 * Données de démonstration — raisons sociales fictives, aucun membre réel du CNPM.
 *
 * `CLAUDE.md` interdit toute donnée officielle inventée comme toute donnée réelle de
 * membre : ces enregistrements sont manifestement synthétiques et ne doivent jamais
 * être présentés comme un état des cotisations du Patronat.
 */
const FIXTURES: readonly CallFixture[] = [
  // Exercice 2024 — T1, échéance dépassée à la date d'arrêté.
  { memberCode: 'MBR-0101', memberName: 'Sahel Agro SA', fiscalYear: '2024', quarter: 'T1', calledAmount: 12_500_000, paidAmount: 12_500_000, adjustmentAmount: 0, dueDate: '2024-03-31', emitted: true },
  { memberCode: 'MBR-0102', memberName: 'Djoliba Logistique SARL', fiscalYear: '2024', quarter: 'T1', calledAmount: 8_750_000, paidAmount: 4_000_000, adjustmentAmount: 0, dueDate: '2024-03-31', emitted: true },
  { memberCode: 'MBR-0103', memberName: 'Faso Textile SA', fiscalYear: '2024', quarter: 'T1', calledAmount: 7_250_000, paidAmount: 0, adjustmentAmount: 0, dueDate: '2024-03-31', emitted: true },
  { memberCode: 'MBR-0104', memberName: 'Niger Cargo SARL', fiscalYear: '2024', quarter: 'T1', calledAmount: 3_200_000, paidAmount: 3_200_000, adjustmentAmount: 0, dueDate: '2024-03-31', emitted: true },
  // Solde soldé par un avoir : l'identité « appelé = payé + reste » ne tient qu'en
  // affichant l'ajustement, ce que la vue fait explicitement.
  { memberCode: 'MBR-0105', memberName: 'Bamako Digital Services SAS', fiscalYear: '2024', quarter: 'T1', calledAmount: 5_400_000, paidAmount: 5_150_000, adjustmentAmount: 250_000, dueDate: '2024-03-31', emitted: true },
  { memberCode: 'MBR-0106', memberName: 'Kayes Minerais SA', fiscalYear: '2024', quarter: 'T1', calledAmount: 18_500_000, paidAmount: 18_500_000, adjustmentAmount: 0, dueDate: '2024-03-31', emitted: true },
  { memberCode: 'MBR-0107', memberName: 'Ségou Agro-Industrie SARL', fiscalYear: '2024', quarter: 'T1', calledAmount: 4_750_000, paidAmount: 1_500_000, adjustmentAmount: 0, dueDate: '2024-03-31', emitted: true },
  { memberCode: 'MBR-0108', memberName: 'Mopti Pêcheries SA', fiscalYear: '2024', quarter: 'T1', calledAmount: 2_100_000, paidAmount: 2_100_000, adjustmentAmount: 0, dueDate: '2024-03-31', emitted: true },

  // Exercice 2024 — T2, échéances à venir pour l'essentiel.
  { memberCode: 'MBR-0101', memberName: 'Sahel Agro SA', fiscalYear: '2024', quarter: 'T2', calledAmount: 12_500_000, paidAmount: 6_000_000, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: true },
  { memberCode: 'MBR-0102', memberName: 'Djoliba Logistique SARL', fiscalYear: '2024', quarter: 'T2', calledAmount: 8_750_000, paidAmount: 0, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: true },
  { memberCode: 'MBR-0103', memberName: 'Faso Textile SA', fiscalYear: '2024', quarter: 'T2', calledAmount: 7_250_000, paidAmount: 0, adjustmentAmount: 0, dueDate: '2024-06-15', emitted: true },
  { memberCode: 'MBR-0104', memberName: 'Niger Cargo SARL', fiscalYear: '2024', quarter: 'T2', calledAmount: 3_200_000, paidAmount: 1_200_000, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: true },
  { memberCode: 'MBR-0105', memberName: 'Bamako Digital Services SAS', fiscalYear: '2024', quarter: 'T2', calledAmount: 5_400_000, paidAmount: 5_400_000, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: true },
  { memberCode: 'MBR-0106', memberName: 'Kayes Minerais SA', fiscalYear: '2024', quarter: 'T2', calledAmount: 18_500_000, paidAmount: 0, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: false },
  { memberCode: 'MBR-0107', memberName: 'Ségou Agro-Industrie SARL', fiscalYear: '2024', quarter: 'T2', calledAmount: 4_750_000, paidAmount: 0, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: false },
  { memberCode: 'MBR-0108', memberName: 'Mopti Pêcheries SA', fiscalYear: '2024', quarter: 'T2', calledAmount: 2_100_000, paidAmount: 0, adjustmentAmount: 0, dueDate: '2024-06-10', emitted: true },
  { memberCode: 'MBR-0109', memberName: 'Sikasso Coton Union SARL', fiscalYear: '2024', quarter: 'T2', calledAmount: 9_600_000, paidAmount: 9_600_000, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: true },
  { memberCode: 'MBR-0110', memberName: 'Tombouctou Transit SA', fiscalYear: '2024', quarter: 'T2', calledAmount: 1_250_000, paidAmount: 1_000_000, adjustmentAmount: 0, dueDate: '2024-06-20', emitted: true },
  { memberCode: 'MBR-0111', memberName: 'Koulikoro Ciments SA', fiscalYear: '2024', quarter: 'T2', calledAmount: 14_200_000, paidAmount: 7_100_000, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: true },
  { memberCode: 'MBR-0112', memberName: 'Gao Énergie Solaire SARL', fiscalYear: '2024', quarter: 'T2', calledAmount: 6_300_000, paidAmount: 0, adjustmentAmount: 0, dueDate: '2024-07-31', emitted: true },

  // Exercice 2023 — T4, clôturé pour l'essentiel.
  { memberCode: 'MBR-0101', memberName: 'Sahel Agro SA', fiscalYear: '2023', quarter: 'T4', calledAmount: 11_800_000, paidAmount: 11_800_000, adjustmentAmount: 0, dueDate: '2023-12-31', emitted: true },
  { memberCode: 'MBR-0103', memberName: 'Faso Textile SA', fiscalYear: '2023', quarter: 'T4', calledAmount: 6_900_000, paidAmount: 6_900_000, adjustmentAmount: 0, dueDate: '2023-12-31', emitted: true },
  { memberCode: 'MBR-0113', memberName: 'Bandiagara Tourisme SARL', fiscalYear: '2023', quarter: 'T4', calledAmount: 1_450_000, paidAmount: 950_000, adjustmentAmount: 0, dueDate: '2023-12-31', emitted: true },
  { memberCode: 'MBR-0114', memberName: 'Kidal Télécom Services SA', fiscalYear: '2023', quarter: 'T4', calledAmount: 3_750_000, paidAmount: 3_750_000, adjustmentAmount: 0, dueDate: '2023-12-31', emitted: true },
  { memberCode: 'MBR-0109', memberName: 'Sikasso Coton Union SARL', fiscalYear: '2023', quarter: 'T4', calledAmount: 9_100_000, paidAmount: 9_100_000, adjustmentAmount: 0, dueDate: '2023-12-31', emitted: true },
  { memberCode: 'MBR-0112', memberName: 'Gao Énergie Solaire SARL', fiscalYear: '2023', quarter: 'T4', calledAmount: 5_800_000, paidAmount: 2_900_000, adjustmentAmount: 500_000, dueDate: '2023-12-31', emitted: true },
];

/**
 * Comparaison insensible à la casse et aux diacritiques.
 *
 * Sans dépliage des accents, chercher « Segou » ne trouverait pas « Ségou
 * Agro-Industrie » : l'utilisateur qui tape vite, ou sur un clavier sans accents,
 * n'obtiendrait rien.
 */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Adaptateur de démonstration du port `CONTRIBUTIONS_GATEWAY`.
 *
 * Il tient le rôle de l'API : c'est lui qui dérive, filtre, trie et pagine, exactement
 * comme le fera le backend. L'écran ne reçoit qu'une page déjà découpée, si bien que le
 * remplacer par l'adaptateur HTTP réel ne touchera aucune page.
 */
@Injectable()
export class DemoContributionsGateway implements ContributionsGateway {
  private readonly all: readonly ContributionCallRow[] = FIXTURES.map((fixture, index) =>
    this.toRow(fixture, index),
  );

  searchCalls(query: ContributionCallQuery): Observable<ContributionCallsPage> {
    const filtered = this.all.filter((call) => this.matches(call, query));
    const sorted = this.sortRows(filtered, query);

    const start = (query.page - 1) * query.pageSize;
    const rows = sorted.slice(start, start + query.pageSize);

    const page: ContributionCallsPage = {
      rows,
      totalItems: filtered.length,
      // La synthèse porte sur le jeu filtré, pas sur la base entière : la fiche exige
      // que les agrégats couvrent la même période que le tableau.
      overview: this.overview(filtered),
      fiscalYears: [...new Set(this.all.map((call) => call.fiscalYear))].sort((a, b) =>
        b.localeCompare(a),
      ),
      asOf: AS_OF,
    };

    // Latence simulée : sans elle, l'état de chargement ne serait jamais peint, donc
    // jamais éprouvé.
    return of(page).pipe(delay(120));
  }

  /**
   * Dérive un appel complet à partir de sa saisie.
   *
   * Solde et statut sont calculés ici, en un seul endroit : c'est ce qui garantit que
   * « appelé = payé + reste + ajustement » ne peut pas être violé par le jeu de
   * données, et qu'aucun appel ne peut afficher « Encaissé » avec un reste dû.
   */
  private toRow(fixture: CallFixture, index: number): ContributionCallRow {
    const outstandingAmount = Math.max(
      0,
      fixture.calledAmount - fixture.paidAmount - fixture.adjustmentAmount,
    );
    // Comparaison de chaînes ISO `AAAA-MM-JJ` : l'ordre lexicographique y est l'ordre
    // chronologique, ce qui évite d'instancier une `Date` et d'exposer le calcul au
    // fuseau du navigateur.
    const pastDue = fixture.dueDate < AS_OF;

    return {
      id: `call-${String(index + 1).padStart(4, '0')}`,
      reference: `APP-${fixture.fiscalYear}-${fixture.quarter}-${String(index + 1).padStart(4, '0')}`,
      memberCode: fixture.memberCode,
      memberName: fixture.memberName,
      fiscalYear: fixture.fiscalYear,
      quarter: fixture.quarter,
      calledAmount: fixture.calledAmount,
      paidAmount: fixture.paidAmount,
      adjustmentAmount: fixture.adjustmentAmount,
      outstandingAmount,
      dueDate: fixture.dueDate,
      pastDue,
      status: this.deriveStatus(fixture, outstandingAmount, pastDue),
    };
  }

  /**
   * Ordre de priorité assumé : le retard prime sur le règlement partiel.
   *
   * Un appel à la fois partiellement réglé et échu relève d'abord de la relance ; la
   * vue rappelle le règlement partiel par un marqueur distinct, à côté du statut et
   * jamais à sa place.
   */
  private deriveStatus(
    fixture: CallFixture,
    outstandingAmount: number,
    pastDue: boolean,
  ): ContributionCallStatus {
    if (!fixture.emitted) {
      return 'DRAFT';
    }
    if (outstandingAmount === 0) {
      return 'SETTLED';
    }
    if (pastDue) {
      return 'OVERDUE';
    }
    return fixture.paidAmount > 0 ? 'PARTIAL' : 'PENDING';
  }

  private matches(call: ContributionCallRow, query: ContributionCallQuery): boolean {
    if (query.fiscalYear && call.fiscalYear !== query.fiscalYear) {
      return false;
    }
    if (query.quarter && call.quarter !== query.quarter) {
      return false;
    }
    if (query.status && call.status !== query.status) {
      return false;
    }
    const term = fold(query.search.trim());
    if (!term) {
      return true;
    }
    return [call.reference, call.memberCode, call.memberName].some((field) =>
      fold(field).includes(term),
    );
  }

  private sortRows(
    rows: readonly ContributionCallRow[],
    query: ContributionCallQuery,
  ): readonly ContributionCallRow[] {
    const sort = query.sort;
    if (!sort) {
      return rows;
    }
    const factor = sort.direction === 'asc' ? 1 : -1;
    // La copie est délibérée : `sort` trie en place, ce qui réordonnerait `this.all` et
    // ferait partir le tri suivant d'un ordre déjà altéré.
    return [...rows].sort((left, right) => factor * this.compare(left, right, sort.key));
  }

  private compare(left: ContributionCallRow, right: ContributionCallRow, key: string): number {
    switch (key) {
      case 'member':
        return left.memberName.localeCompare(right.memberName, 'fr');
      case 'period':
        // L'exercice d'abord, le trimestre ensuite : trier sur « T1, T2… » seul
        // mélangerait 2023 et 2024 dans la même grappe.
        return (
          left.fiscalYear.localeCompare(right.fiscalYear) ||
          left.quarter.localeCompare(right.quarter)
        );
      case 'called':
        return left.calledAmount - right.calledAmount;
      case 'paid':
        return left.paidAmount - right.paidAmount;
      case 'outstanding':
        return left.outstandingAmount - right.outstandingAmount;
      case 'dueDate':
        // Format ISO `AAAA-MM-JJ` : l'ordre lexicographique est l'ordre chronologique.
        return left.dueDate.localeCompare(right.dueDate);
      case 'status':
        return left.status.localeCompare(right.status);
      case 'reference':
      default:
        return left.reference.localeCompare(right.reference, 'fr', { numeric: true });
    }
  }

  /**
   * Agrégats du jeu filtré.
   *
   * Les brouillons sont écartés des montants : un appel non émis n'a rien appelé, et
   * l'inclure gonflerait le « montant appelé » d'une somme que personne n'a réclamée.
   */
  private overview(rows: readonly ContributionCallRow[]): ContributionsOverview {
    const issued = rows.filter((call) => call.status !== 'DRAFT');

    const calledTotal = issued.reduce((sum, call) => sum + call.calledAmount, 0);
    const collectedTotal = issued.reduce((sum, call) => sum + call.paidAmount, 0);
    const outstandingTotal = issued.reduce((sum, call) => sum + call.outstandingAmount, 0);

    return {
      callsIssued: issued.length,
      calledTotal,
      collectedTotal,
      outstandingTotal,
      recoveryRate: calledTotal === 0 ? null : (collectedTotal / calledTotal) * 100,
    };
  }
}
