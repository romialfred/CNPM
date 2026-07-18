import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardAlertSeverity,
  DashboardGateway,
  DashboardKpi,
  DashboardMonthPoint,
  DashboardPayment,
  DashboardPaymentChannel,
  DashboardPaymentStatus,
  DashboardSegment,
  DashboardSnapshot,
  DashboardTrend,
} from './dashboard-gateway';

/** Forme brute d'un paiement dans `demo-fixtures.json`. */
interface PaymentFixture {
  readonly reference: string;
  readonly payer: string;
  readonly amount: number;
  readonly channel: string;
  readonly status: string;
  readonly paidAt: string;
  readonly transactionReference: string;
}

/** Forme brute d'un point mensuel dans `demo-fixtures.json`. */
interface MonthFixture {
  readonly month: string;
  readonly expected: number;
  readonly collected: number;
  readonly rate: number;
}

/** Sous-ensemble des champs membres utilisés par le fil d'activité. */
interface MemberFixture {
  readonly id: string;
  readonly code: string;
  readonly organization: string;
  readonly lastActivity: string;
}

const CHANNELS: readonly DashboardPaymentChannel[] = ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'];
const STATUSES: readonly DashboardPaymentStatus[] = ['MATCHED', 'UNMATCHED', 'PENDING'];

/**
 * Noms de mois en table fixe plutôt que via `Intl`.
 *
 * Les captures de régression visuelle exigent un rendu identique d'une machine à
 * l'autre ; la sortie d'`Intl` dépend de la version d'ICU embarquée par le moteur.
 */
const MONTH_NAMES: readonly string[] = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const MONTH_SHORT: readonly string[] = [
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

/** Gravité décroissante : c'est l'ordre imposé aux alertes par la fiche BO-001. */
const SEVERITY_RANK: Readonly<Record<DashboardAlertSeverity, number>> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/**
 * Exercice le plus récent, seul couvert par les fixtures. `meta.period` fait foi.
 */
const CURRENT_EXERCISE = fixtures.meta.period;

/**
 * Exercice antérieur, volontairement sans données.
 *
 * Rien dans le dépôt ne décrit l'exercice 2023 ; fabriquer une seconde année de
 * chiffres reviendrait à inventer une histoire institutionnelle. L'exercice est donc
 * proposé mais annoncé vide, ce qui est la vérité et met en évidence les états
 * « donnée indisponible » que la fiche impose.
 */
const PREVIOUS_EXERCISE = '2023';

/**
 * Horodatage de la mesure : l'événement le plus récent des fixtures.
 *
 * Déterministe par construction — `Date.now()` rendrait chaque capture visuelle
 * différente de la précédente.
 */
const GENERATED_AT = '2024-05-27T11:23:00Z';

function isChannel(value: string): value is DashboardPaymentChannel {
  return (CHANNELS as readonly string[]).includes(value);
}

function isStatus(value: string): value is DashboardPaymentStatus {
  return (STATUSES as readonly string[]).includes(value);
}

/** Accord du pluriel français, sans dépendance de localisation. */
function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

/** Pourcentage à une décimale, séparateur français, sans passer par `Intl`. */
function percent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} %`;
}

/**
 * Adaptateur de démonstration du port `DASHBOARD_GATEWAY`.
 *
 * Il tient le rôle de l'API : c'est lui qui agrège, trie et libelle. L'écran ne reçoit
 * que des mesures prêtes à afficher, si bien que le remplacer par l'adaptateur HTTP ne
 * touchera aucune page.
 *
 * Toutes les données proviennent de `assets/demo-fixtures.json`, dont l'en-tête
 * précise : « Donnees fictives; ne pas importer en production ». Aucune donnée réelle
 * de membre, de montant officiel ou de partenaire, conformément à `CLAUDE.md`.
 *
 * DIVERGENCE DE FIXTURES — le bloc `kpis` et la série `monthlyCollections` ne se
 * réconcilient pas : les six mois cumulent 3 525 780 000 FCFA encaissés quand
 * `kpis.collectedContributions` en annonce 2 145 780 000 pour l'exercice entier. Le
 * critère « les totaux correspondent aux fixtures et aux définitions KPI » tranche en
 * faveur du bloc `kpis`, qui est la source déclarée des KPI ; la série n'alimente donc
 * que le graphique mensuel, et l'écran n'affiche jamais son cumul — un total qui
 * contredirait le KPI voisin serait pire que pas de total du tout. À arbitrer avec le
 * propriétaire des fixtures.
 */
@Injectable()
export class DemoDashboardGateway implements DashboardGateway {
  readonly exercises: readonly string[] = [CURRENT_EXERCISE, PREVIOUS_EXERCISE];

  load(exercise: string): Observable<DashboardSnapshot> {
    const snapshot =
      exercise === CURRENT_EXERCISE ? this.currentSnapshot() : this.emptySnapshot(exercise);

    // Latence simulée : sans elle, l'état de chargement ne serait jamais peint et ne
    // serait donc jamais éprouvé.
    return of(snapshot).pipe(delay(140));
  }

  private currentSnapshot(): DashboardSnapshot {
    const months = this.months();

    return {
      exercise: CURRENT_EXERCISE,
      generatedAt: GENERATED_AT,
      kpis: this.kpis(),
      months,
      trend: this.trend(months),
      segments: this.segments(),
      memberBase: fixtures.kpis.membersTotal,
      contributions: {
        expected: fixtures.kpis.expectedContributions,
        collected: fixtures.kpis.collectedContributions,
        outstanding: fixtures.kpis.outstandingContributions,
        recoveryRate: fixtures.kpis.recoveryRate,
      },
      payments: this.payments(),
      alerts: this.alerts(),
      activities: this.activities(),
    };
  }

  /**
   * Exercice sans donnée : les KPI conservent leur libellé et leur définition, mais
   * portent `null`. Masquer les cartes laisserait croire que l'indicateur n'existe
   * pas ; afficher zéro laisserait croire qu'il vaut zéro.
   */
  private emptySnapshot(exercise: string): DashboardSnapshot {
    return {
      exercise,
      generatedAt: GENERATED_AT,
      kpis: this.kpis().map((kpi) => ({ ...kpi, value: null })),
      months: [],
      trend: null,
      segments: [],
      memberBase: null,
      contributions: { expected: null, collected: null, outstanding: null, recoveryRate: null },
      payments: [],
      alerts: [],
      activities: [],
    };
  }

  /**
   * Cinq KPI au maximum en première ligne — composition normative de la fiche.
   *
   * Seuls les trois indicateurs d'effectif ouvrent une page : `/admin/members` est la
   * seule rubrique livrée. Rendre les deux indicateurs financiers cliquables les
   * enverrait vers une rubrique annoncée « à venir », c'est-à-dire nulle part.
   */
  private kpis(): readonly DashboardKpi[] {
    return [
      {
        key: 'collected',
        label: 'Cotisations encaissées',
        value: fixtures.kpis.collectedContributions,
        unit: 'FCFA',
        definition: 'Montant réglé sur l’exercice par la base de membres.',
      },
      {
        key: 'recovery',
        label: 'Taux de recouvrement',
        value: fixtures.kpis.recoveryRate,
        decimals: 1,
        suffix: ' %',
        definition: 'Part du montant attendu effectivement encaissée.',
      },
      {
        key: 'active',
        label: 'Membres actifs',
        value: fixtures.kpis.activeMembers,
        definition: 'Membres à jour de leur cycle d’adhésion.',
        route: '/admin/members',
        queryParams: { statut: 'ACTIVE' },
        linkLabel: 'Ouvrir la liste filtrée sur les membres actifs',
      },
      {
        key: 'dormant',
        label: 'Cotisants dormants',
        value: fixtures.kpis.dormantMembers,
        definition: 'Membres de la base sans activité récente.',
        route: '/admin/members',
        queryParams: { statut: 'DORMANT' },
        linkLabel: 'Ouvrir la liste filtrée sur les cotisants dormants',
      },
      {
        key: 'prospects',
        label: 'Prospects',
        value: fixtures.kpis.prospects,
        definition: 'Contacts hors base de membres ; ils ne génèrent pas de cotisation.',
        route: '/admin/members',
        queryParams: { statut: 'PROSPECT' },
        linkLabel: 'Ouvrir la liste filtrée sur les prospects',
      },
    ];
  }

  private months(): readonly DashboardMonthPoint[] {
    return (fixtures.monthlyCollections as readonly MonthFixture[]).map((point) => {
      // `AAAA-MM` : l'index du mois se lit sans construire de `Date`, donc sans
      // dépendre du fuseau du navigateur — un décalage y ferait basculer un point
      // d'un mois à l'autre.
      const year = point.month.slice(0, 4);
      const index = Number(point.month.slice(5, 7)) - 1;

      return {
        key: point.month,
        label: `${MONTH_NAMES[index]} ${year}`,
        shortLabel: MONTH_SHORT[index],
        expected: point.expected,
        collected: point.collected,
        rate: point.rate,
      };
    });
  }

  /**
   * Variation du dernier mois par rapport au précédent.
   *
   * Aucune tendance n'est calculée sur les effectifs : les fixtures ne portent aucune
   * série historique de membres, et une flèche sans mesure derrière elle serait une
   * invention pure.
   */
  private trend(months: readonly DashboardMonthPoint[]): DashboardTrend | null {
    if (months.length < 2) {
      return null;
    }
    const current = months[months.length - 1];
    const previous = months[months.length - 2];
    if (previous.collected === 0) {
      return null;
    }

    const variation = ((current.collected - previous.collected) / previous.collected) * 100;
    const direction = variation > 0.05 ? 'up' : variation < -0.05 ? 'down' : 'flat';

    return {
      direction,
      value: Math.abs(variation),
      reference: previous.label,
      current: current.label,
    };
  }

  /**
   * Segmentation des cotisants.
   *
   * `largeContributorsSubset` est un sous-ensemble de la base et `prospects` en est
   * exclu : les empiler dans une même part reviendrait à compter deux fois les uns et
   * à gonfler le total des autres. Chaque cohorte porte donc sa portée.
   */
  private segments(): readonly DashboardSegment[] {
    const base = fixtures.kpis.membersTotal;
    const share = (count: number): number | null => (base === 0 ? null : (count / base) * 100);

    return [
      {
        key: 'active',
        label: 'Actifs',
        count: fixtures.kpis.activeMembers,
        share: share(fixtures.kpis.activeMembers),
        scope: 'base',
      },
      {
        key: 'dormant',
        label: 'Dormants',
        count: fixtures.kpis.dormantMembers,
        share: share(fixtures.kpis.dormantMembers),
        scope: 'base',
      },
      {
        key: 'large',
        label: 'dont grands cotisants',
        count: fixtures.kpis.largeContributorsSubset,
        share: share(fixtures.kpis.largeContributorsSubset),
        scope: 'subset',
      },
      {
        key: 'prospects',
        label: 'Prospects',
        count: fixtures.kpis.prospects,
        share: null,
        scope: 'outside',
      },
    ];
  }

  /** Derniers paiements enregistrés, du plus récent au plus ancien. */
  private payments(): readonly DashboardPayment[] {
    return (fixtures.payments as readonly PaymentFixture[])
      .filter((payment) => isChannel(payment.channel) && isStatus(payment.status))
      .map((payment) => ({
        id: payment.reference,
        reference: payment.reference,
        payer: payment.payer,
        amount: payment.amount,
        channel: payment.channel as DashboardPaymentChannel,
        status: payment.status as DashboardPaymentStatus,
        paidAt: payment.paidAt,
      }))
      .sort((left, right) => right.paidAt.localeCompare(left.paidAt));
  }

  /**
   * Alertes déduites des faits présents dans les fixtures, jamais d'un seuil inventé :
   * aucun document du dépôt ne fixe de cible de recouvrement, aussi l'écran n'en
   * proclame aucune.
   *
   * Le tri est fait ici — gravité décroissante puis date décroissante — pour que
   * l'écran n'ait rien à réordonner et ne puisse pas diverger de cet ordre.
   */
  private alerts(): readonly DashboardAlert[] {
    const payments = this.payments();
    const unmatched = payments.filter((payment) => payment.status === 'UNMATCHED');
    const pending = payments.filter((payment) => payment.status === 'PENDING');
    const base = fixtures.kpis.membersTotal;
    const dormantShare = base === 0 ? 0 : (fixtures.kpis.dormantMembers / base) * 100;

    const alerts: DashboardAlert[] = [];

    if (unmatched.length > 0) {
      alerts.push({
        id: 'unmatched-payments',
        severity: 'critical',
        title: plural(unmatched.length, 'paiement non rapproché', 'paiements non rapprochés'),
        detail: 'Ces encaissements ne sont imputés à aucun membre.',
        raisedAt: unmatched[0].paidAt,
      });
    }

    if (pending.length > 0) {
      alerts.push({
        id: 'pending-payments',
        severity: 'warning',
        title: plural(
          pending.length,
          'paiement en attente de validation',
          'paiements en attente de validation',
        ),
        detail: 'Le règlement est enregistré mais n’est pas encore validé en caisse.',
        raisedAt: pending[0].paidAt,
      });
    }

    if (fixtures.kpis.dormantMembers > 0) {
      alerts.push({
        id: 'dormant-members',
        severity: 'warning',
        title: plural(fixtures.kpis.dormantMembers, 'cotisant dormant', 'cotisants dormants'),
        detail: `Soit ${percent(dormantShare)} de la base de membres.`,
        raisedAt: GENERATED_AT,
      });
    }

    if (fixtures.kpis.prospects > 0) {
      alerts.push({
        id: 'prospects',
        severity: 'info',
        title: plural(fixtures.kpis.prospects, 'prospect hors base', 'prospects hors base'),
        detail: 'Les prospects ne sont pas comptés dans la base et ne génèrent pas de cotisation.',
        raisedAt: GENERATED_AT,
      });
    }

    return alerts.sort(
      (left, right) =>
        SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity] ||
        right.raisedAt.localeCompare(left.raisedAt),
    );
  }

  /**
   * Fil d'activité : les cinq dossiers membres touchés le plus récemment.
   *
   * L'égalité de date est départagée par le code membre, faute de quoi l'ordre
   * dépendrait de l'ordre d'insertion et changerait d'une exécution à l'autre.
   */
  private activities(): readonly DashboardActivity[] {
    return [...(fixtures.members as readonly MemberFixture[])]
      .sort(
        (left, right) =>
          right.lastActivity.localeCompare(left.lastActivity) ||
          left.code.localeCompare(right.code, 'fr', { numeric: true }),
      )
      .slice(0, 5)
      .map((member) => ({
        id: member.id,
        label: member.organization,
        detail: `Dernière activité sur le dossier ${member.code}.`,
        occurredAt: member.lastActivity,
      }));
  }
}
