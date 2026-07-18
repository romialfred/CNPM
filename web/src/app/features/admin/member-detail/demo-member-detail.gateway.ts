import { Injectable } from '@angular/core';
import { concatMap, delay, type Observable, of, throwError } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import type { CnpmVerificationStatus } from '../../../design-system/verification-badge/verification-badge.component';
import {
  MemberDetailAccessError,
  MemberDetailNotFoundError,
  type AssignedAgent,
  type ContributionLine,
  type ContributionStatus,
  type ContributionSummary,
  type HistoryEntry,
  type MemberAlertItem,
  type MemberDetail,
  type MemberDetailGateway,
  type MemberDocument,
  type MemberStatus,
  type NextAction,
  type PaymentChannel,
  type PaymentLine,
  type RiskAssessment,
  type RiskLevel,
} from './member-detail-gateway';

/** Forme brute d'un membre dans `demo-fixtures.json`. */
interface MemberFixture {
  readonly id: string;
  readonly code: string;
  readonly organization: string;
  readonly category: string;
  readonly segment: string;
  readonly group: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly contactEmail: string;
  readonly due: number;
  readonly paid: number;
  readonly status: string;
  readonly lastActivity: string;
}

/**
 * Date de référence du jeu de démonstration.
 *
 * Les fixtures décrivent l'exercice 2024 ; échéances, retards et scores sont donc
 * évalués à cette date et non à `Date.now()`. Sans point fixe, la fiche changerait de
 * contenu chaque jour et aucune capture de régression visuelle ne tiendrait.
 */
const REFERENCE_DATE = '2024-05-27';
const EXERCISE_YEAR = 2024;

const STATUSES: readonly MemberStatus[] = ['ACTIVE', 'DORMANT', 'PROSPECT'];

interface QuarterTemplate {
  readonly period: string;
  readonly label: string;
  /** Échéance de la période appelée. */
  readonly dueOn: string;
  /** Date d'appel de cotisation, pour l'historique. */
  readonly calledOn: string;
  /** Règlement effectif quand la période est passée. */
  readonly settledAt: string;
  /** Règlement anticipé, pour une période non encore échue. */
  readonly advancedAt: string;
}

const QUARTERS: readonly QuarterTemplate[] = [
  {
    period: 'T1 2024',
    label: 'Cotisation T1 2024',
    dueOn: '2024-01-31',
    calledOn: '2024-01-02T08:00:00Z',
    settledAt: '2024-01-22T10:24:00Z',
    advancedAt: '2024-05-20T08:45:00Z',
  },
  {
    period: 'T2 2024',
    label: 'Cotisation T2 2024',
    dueOn: '2024-04-30',
    calledOn: '2024-04-02T08:00:00Z',
    settledAt: '2024-04-18T09:12:00Z',
    advancedAt: '2024-05-21T09:15:00Z',
  },
  {
    period: 'T3 2024',
    label: 'Cotisation T3 2024',
    dueOn: '2024-07-31',
    calledOn: '2024-07-01T08:00:00Z',
    settledAt: '2024-07-24T14:05:00Z',
    advancedAt: '2024-05-22T10:05:00Z',
  },
  {
    period: 'T4 2024',
    label: 'Cotisation T4 2024',
    dueOn: '2024-10-31',
    calledOn: '2024-10-01T08:00:00Z',
    settledAt: '2024-10-21T11:38:00Z',
    advancedAt: '2024-05-23T11:30:00Z',
  },
];

const CHANNELS: readonly PaymentChannel[] = ['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH', 'CHEQUE'];

const SECTORS: Readonly<Record<string, string>> = {
  'BTP et Infrastructures': 'Bâtiment et travaux publics',
  'Commerce et Distribution': 'Commerce de gros et de détail',
  Services: 'Services aux entreprises',
  Industrie: 'Industrie manufacturière',
};

const EMPLOYEE_RANGES: Readonly<Record<string, string>> = {
  'Grande entreprise': '250 salariés et plus',
  'Moyenne entreprise': '50 à 249 salariés',
  PME: '10 à 49 salariés',
  TPE: 'Moins de 10 salariés',
};

const LEGAL_FORMS: readonly string[] = [
  'Société anonyme',
  'Société à responsabilité limitée',
  'Entreprise individuelle',
  'Société par actions simplifiée',
];

const REGIONS: readonly string[] = ['Bamako', 'Koulikoro', 'Ségou', 'Sikasso', 'Mopti'];

/** Agents de démonstration. Personnes fictives, adresses en `.example`. */
const AGENTS: readonly Omit<AssignedAgent, 'portfolio' | 'recoveryRate' | 'lastContactOn'>[] = [
  {
    name: 'Moussa Diarra',
    role: 'Agent de recouvrement',
    phone: '+223 76 12 34 56',
    email: 'moussa.diarra@cnpm.example',
  },
  {
    name: 'Aïssata Coulibaly',
    role: 'Agente de recouvrement',
    phone: '+223 76 22 45 67',
    email: 'aissata.coulibaly@cnpm.example',
  },
  {
    name: 'Ibrahim Traoré',
    role: 'Chargé de portefeuille',
    phone: '+223 76 33 56 78',
    email: 'ibrahim.traore@cnpm.example',
  },
  {
    name: 'Kadiatou Sangaré',
    role: 'Chargée de portefeuille',
    phone: '+223 76 44 67 89',
    email: 'kadiatou.sangare@cnpm.example',
  },
];

interface DocumentTemplate {
  readonly key: string;
  readonly title: string;
  readonly kind: string;
  readonly sizeLabel: string;
}

const DOCUMENT_TEMPLATES: readonly DocumentTemplate[] = [
  { key: 'fiscale', title: 'Attestation fiscale 2024', kind: 'Fiscalité', sizeLabel: '245 Ko' },
  { key: 'rccm', title: 'Extrait RCCM', kind: 'Registre du commerce', sizeLabel: '512 Ko' },
  { key: 'financiers', title: 'États financiers 2023', kind: 'Comptabilité', sizeLabel: '1,2 Mo' },
  { key: 'inps', title: 'Attestation INPS', kind: 'Protection sociale', sizeLabel: '320 Ko' },
];

/**
 * Identifiants de démonstration réservés aux états d'échec.
 *
 * Sans eux, « accès refusé » et « erreur technique » ne seraient jamais peints, donc
 * jamais éprouvés — or `loading-empty-error.md` impose de les couvrir.
 */
const FORBIDDEN_ID = 'MEM-INTERDIT';
const FAILING_ID = 'MEM-ERREUR';

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/**
 * Séparateur de milliers `U+202F`, celui qu'emploie la locale `fr-ML` d'Angular.
 * Un espace ordinaire ferait diverger le texte des alertes des montants du tableau.
 */
function formatAmount(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function isMemberStatus(value: string): value is MemberStatus {
  return (STATUSES as readonly string[]).includes(value);
}

/**
 * Adaptateur de démonstration du port `MEMBER_DETAIL_GATEWAY`.
 *
 * Il tient le rôle de l'API : identité, cotisations, paiements, documents, historique,
 * alertes et score sont assemblés ici, exactement comme le fera le backend. Le
 * remplacer par l'adaptateur HTTP ne touchera pas la page.
 *
 * Les 33 membres proviennent de `demo-fixtures.json`, jeu fictif du handoff (voir
 * DATA-DEC-003) : raisons sociales inventées, domaines `.example`. Les données propres
 * à la fiche 360° en sont dérivées de façon déterministe — même identifiant, même
 * contenu, à chaque chargement. Aucune donnée réelle de membre, conformément à
 * `CLAUDE.md`.
 *
 * Les montants de l'exercice sont ceux de BO-002 (`due` et `paid`) : la fiche ne
 * recalcule rien, sans quoi elle pourrait annoncer un total que la liste contredit.
 */
@Injectable()
export class DemoMemberDetailGateway implements MemberDetailGateway {
  private readonly members: readonly MemberFixture[] = (
    fixtures.members as readonly MemberFixture[]
  ).filter((member) => isMemberStatus(member.status));

  load(id: string): Observable<MemberDetail> {
    // Latence simulée : sans elle, l'état de chargement ne serait jamais peint.
    const latency = 180;

    if (id === FORBIDDEN_ID) {
      return this.fail(new MemberDetailAccessError(), latency);
    }
    if (id === FAILING_ID) {
      return this.fail(new Error('Service de la fiche membre indisponible'), latency);
    }

    const index = this.members.findIndex((member) => member.id === id || member.code === id);
    if (index < 0) {
      return this.fail(new MemberDetailNotFoundError(), latency);
    }

    return of(this.build(this.members[index], index)).pipe(delay(latency));
  }

  /**
   * `delay` ne retarde pas une notification d'erreur : sans ce `concatMap`, l'échec
   * surviendrait avant même que l'état de chargement ne soit rendu.
   */
  private fail(error: Error, latency: number): Observable<never> {
    return of(null).pipe(
      delay(latency),
      concatMap(() => throwError(() => error)),
    );
  }

  private build(member: MemberFixture, index: number): MemberDetail {
    const status = member.status as MemberStatus;
    const contributions = this.contributions(member);
    const payments = this.payments(index, contributions);
    const documents = this.documents(index);
    const summary = this.summary(member, contributions, payments);
    const risk = this.risk(member, summary, documents);
    const seniorityYears = this.seniority(index);
    const alerts = this.alerts(summary, documents);

    return {
      identity: {
        id: member.id,
        code: member.code,
        organization: member.organization,
        legalForm: LEGAL_FORMS[index % LEGAL_FORMS.length],
        category: member.category,
        sector: SECTORS[member.group] ?? member.group,
        group: member.group,
        region: REGIONS[index % REGIONS.length],
        address: `ACI 2000, Rue ${100 + index * 3}, Porte ${20 + index}, ${
          REGIONS[index % REGIONS.length]
        }`,
        status,
        verification: this.verification(status),
        // Une vitrine sur six n'a pas de date de constat : le badge doit savoir dire
        // qu'il l'ignore plutôt que d'afficher une date inventée.
        verifiedAt: index % 6 === 0 ? null : `2024-0${(index % 4) + 1}-1${index % 9}`,
        isLargeContributor: member.segment === 'Grand cotisant',
      },
      profile: {
        rccm: index % 9 === 4 ? null : `MA.BKO.${2015 + (index % 8)}.B.${pad(4500 + index * 7, 4)}`,
        nif: index % 11 === 6 ? null : `0${83456700 + index * 13}A`,
        employeeRange: EMPLOYEE_RANGES[member.category] ?? null,
        foundedYear: 1998 + (index % 20),
        joinedOn: this.joinedOn(index),
        seniorityYears,
        membershipReference: `ADH-${2015 + (index % 8)}-${pad(index + 1, 4)}`,
        phone: `+223 20 ${pad(20 + (index % 60), 2)} ${pad(30 + (index % 50), 2)} ${pad(40 + (index % 40), 2)}`,
        email: `contact@${this.domain(member.organization)}.example`,
        // Toutes les entreprises n'ont pas de site : la fiche exige de distinguer une
        // donnée absente d'une valeur vide, ce que `null` permet et `''` interdirait.
        website: index % 5 === 0 ? null : `www.${this.domain(member.organization)}.example`,
      },
      mainContact: {
        name: member.contactName,
        role: 'Directeur administratif et financier',
        phone: member.contactPhone,
        email: member.contactEmail,
      },
      summary,
      contributions,
      payments,
      documents,
      history: this.history(member, index, contributions, payments, summary),
      alerts,
      nextActions: this.nextActions(summary, documents),
      risk,
      // Une fiche sur huit n'a pas d'agent affecté : le cas existe et l'écran doit
      // savoir le dire. Variété de démonstration, non une règle d'affectation.
      agent: index % 8 === 5 ? null : this.agent(index),
      // Le backend reste seul juge (ADR-008) ; l'adaptateur de démonstration accorde
      // tout, et l'écran sait masquer ce qui lui est refusé.
      permissions: { canEdit: true, canViewContacts: true, canViewFinancials: true },
    };
  }

  private verification(status: MemberStatus): CnpmVerificationStatus {
    // Correspondance de démonstration uniquement : les critères et la durée de
    // validité du badge relèvent d'UX-DEC-004, non tranchée. La valeur réelle viendra
    // du backend, jamais d'une déduction faite dans l'interface.
    switch (status) {
      case 'ACTIVE':
        return 'VERIFIED';
      case 'DORMANT':
        return 'EXPIRED';
      default:
        return 'PENDING';
    }
  }

  private domain(organization: string): string {
    return (
      organization
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 12) || 'membre'
    );
  }

  private joinedOn(index: number): string {
    return `${2015 + (index % 8)}-${pad((index % 12) + 1, 2)}-${pad(5 + (index % 20), 2)}`;
  }

  private seniority(index: number): number {
    return EXERCISE_YEAR - (2015 + (index % 8));
  }

  /**
   * Répartit l'appel annuel sur quatre trimestres, puis impute le réglé par ordre
   * chronologique. Le reste de la division va au dernier trimestre : la somme des
   * lignes égale exactement le montant annuel, sans centime perdu en arrondi.
   */
  private contributions(member: MemberFixture): readonly ContributionLine[] {
    const base = Math.floor(member.due / 4);
    let remaining = member.paid;

    return QUARTERS.map((quarter, position) => {
      const expected = position === QUARTERS.length - 1 ? member.due - base * 3 : base;
      const paid = Math.min(remaining, expected);
      remaining -= paid;
      return {
        period: quarter.period,
        label: quarter.label,
        dueOn: quarter.dueOn,
        expected,
        paid,
        status: this.contributionStatus(expected, paid, quarter.dueOn),
      };
    });
  }

  private contributionStatus(expected: number, paid: number, dueOn: string): ContributionStatus {
    if (expected > 0 && paid >= expected) {
      return 'PAID';
    }
    // Comparaison lexicographique sur des dates ISO `AAAA-MM-JJ` : l'ordre des chaînes
    // est l'ordre chronologique, sans construction d'objet `Date` ni fuseau.
    if (dueOn > REFERENCE_DATE) {
      return 'UPCOMING';
    }
    return paid > 0 ? 'PARTIAL' : 'OVERDUE';
  }

  private payments(
    index: number,
    contributions: readonly ContributionLine[],
  ): readonly PaymentLine[] {
    const lines: PaymentLine[] = [];

    contributions.forEach((line, position) => {
      if (line.paid <= 0) {
        return;
      }
      const quarter = QUARTERS[position];
      const paidAt =
        quarter.settledAt.slice(0, 10) > REFERENCE_DATE ? quarter.advancedAt : quarter.settledAt;
      // Un règlement sur cinq reste en attente de rapprochement : le reçu n'est émis
      // qu'au rapprochement, d'où `receipt: null` tant qu'il n'a pas eu lieu.
      const pending = index % 5 === 0 && position === contributions.length - 1;
      const sequence = pad(index * 4 + position + 100, 4);

      lines.push({
        reference: `PAY-${EXERCISE_YEAR}-${sequence}`,
        paidAt,
        period: line.period,
        amount: line.paid,
        channel: CHANNELS[(index + position) % CHANNELS.length],
        receipt: pending ? null : `REC-${EXERCISE_YEAR}-${sequence}`,
        status: pending ? 'PENDING' : 'MATCHED',
      });
    });

    return [...lines].sort((left, right) => right.paidAt.localeCompare(left.paidAt));
  }

  private documents(index: number): readonly MemberDocument[] {
    // Un membre sur sept n'a déposé aucune pièce : l'état vide de l'onglet Documents
    // existe donc réellement dans le jeu, au lieu de rester théorique.
    if (index % 7 === 3) {
      return [];
    }

    return DOCUMENT_TEMPLATES.map((template, position) => {
      const rank = index + position;
      const status = rank % 9 === 0 ? 'MISSING' : rank % 5 === 0 ? 'EXPIRING' : 'VALID';
      if (status === 'MISSING') {
        return {
          id: `${template.key}-${index}`,
          title: template.title,
          kind: template.kind,
          issuedOn: null,
          expiresOn: null,
          sizeLabel: null,
          status,
        };
      }
      return {
        id: `${template.key}-${index}`,
        title: template.title,
        kind: template.kind,
        issuedOn: `2024-0${(position % 5) + 1}-${pad(8 + position * 3, 2)}`,
        expiresOn: status === 'EXPIRING' ? '2024-06-30' : '2025-03-31',
        sizeLabel: template.sizeLabel,
        status,
      };
    });
  }

  private summary(
    member: MemberFixture,
    contributions: readonly ContributionLine[],
    payments: readonly PaymentLine[],
  ): ContributionSummary {
    const outstanding = member.due - member.paid;
    const overdue = contributions.filter(
      (line) => line.status === 'OVERDUE' || line.status === 'PARTIAL',
    );
    const next = contributions.find((line) => line.status !== 'PAID');

    return {
      year: EXERCISE_YEAR,
      expected: member.due,
      paid: member.paid,
      outstanding,
      overduePeriods: overdue.length,
      // `null` plutôt que 0 quand rien n'est appelé : afficher « 0 % réglé » à un
      // membre qui ne doit rien le présenterait comme mauvais payeur.
      settledShare: member.due === 0 ? null : (member.paid / member.due) * 100,
      nextDueLabel: next?.label ?? null,
      nextDueOn: next?.dueOn ?? null,
      receiptsIssued: payments.filter((payment) => payment.receipt !== null).length,
    };
  }

  private risk(
    member: MemberFixture,
    summary: ContributionSummary,
    documents: readonly MemberDocument[],
  ): RiskAssessment {
    const missing = documents.filter((document) => document.status !== 'VALID').length;
    const outstandingShare = summary.expected === 0 ? 0 : summary.outstanding / summary.expected;
    const score = Math.max(0, Math.min(100, Math.round(18 + outstandingShare * 62 + missing * 5)));
    const level: RiskLevel = score < 40 ? 'LOW' : score < 70 ? 'MEDIUM' : 'HIGH';

    const factors: string[] = [
      summary.settledShare === null
        ? `Aucune cotisation appelée sur l’exercice ${summary.year}`
        : `${Math.round(summary.settledShare)} % de la cotisation ${summary.year} réglée`,
    ];
    if (summary.overduePeriods > 0) {
      factors.push(
        `${summary.overduePeriods} période${summary.overduePeriods > 1 ? 's' : ''} échue${
          summary.overduePeriods > 1 ? 's' : ''
        } non soldée${summary.overduePeriods > 1 ? 's' : ''}`,
      );
    }
    if (missing > 0) {
      factors.push(
        `${missing} pièce${missing > 1 ? 's' : ''} justificative${missing > 1 ? 's' : ''} manquante${missing > 1 ? 's' : ''} ou à renouveler`,
      );
    }
    if (member.status === 'DORMANT') {
      factors.push('Aucune activité enregistrée depuis plus de six mois');
    }

    return { score, level, assessedOn: REFERENCE_DATE, factors };
  }

  /**
   * Chaque alerte énonce la règle constatée ET le geste attendu : la fiche impose que
   * « les alertes expliquent la règle et la prochaine action ». Une alerte sans suite
   * possible ne fait qu'inquiéter.
   */
  private alerts(
    summary: ContributionSummary,
    documents: readonly MemberDocument[],
  ): readonly MemberAlertItem[] {
    const alerts: MemberAlertItem[] = [];

    if (summary.outstanding > 0) {
      alerts.push({
        id: 'impayes',
        tone: summary.overduePeriods > 1 ? 'error' : 'warning',
        title: 'Impayés à régulariser',
        message: `${formatAmount(summary.outstanding)} FCFA restent dus sur l’exercice ${summary.year}, dont ${summary.overduePeriods} période${summary.overduePeriods > 1 ? 's' : ''} déjà échue${summary.overduePeriods > 1 ? 's' : ''}.`,
        nextAction: 'Ouvrir l’onglet Cotisations pour identifier les périodes concernées.',
      });
    }

    const toRenew = documents.filter((document) => document.status !== 'VALID');
    if (toRenew.length > 0) {
      alerts.push({
        id: 'documents',
        tone: 'warning',
        title: 'Pièces justificatives incomplètes',
        message: `${toRenew.length} pièce${toRenew.length > 1 ? 's' : ''} du dossier ${toRenew.length > 1 ? 'sont manquantes ou arrivent' : 'est manquante ou arrive'} à expiration.`,
        nextAction: 'Demander le dépôt des pièces depuis l’onglet Documents.',
      });
    } else if (documents.length === 0) {
      alerts.push({
        id: 'dossier-vide',
        tone: 'info',
        title: 'Dossier documentaire vide',
        message: 'Aucune pièce justificative n’a encore été déposée pour ce membre.',
        nextAction: 'Solliciter les pièces d’adhésion auprès du contact principal.',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'conforme',
        tone: 'success',
        title: 'Aucun point de vigilance',
        message: `Cotisations à jour et dossier documentaire complet pour l’exercice ${summary.year}.`,
        nextAction: 'Aucune action requise à ce jour.',
      });
    }

    return alerts;
  }

  private nextActions(
    summary: ContributionSummary,
    documents: readonly MemberDocument[],
  ): readonly NextAction[] {
    const actions: NextAction[] = [];

    if (summary.overduePeriods > 0) {
      actions.push({
        id: 'relance',
        label: 'Programmer une relance de recouvrement',
        priority: 'HIGH',
        dueOn: '2024-06-05',
      });
    }
    if (documents.some((document) => document.status !== 'VALID') || documents.length === 0) {
      actions.push({
        id: 'pieces',
        label: 'Demander les pièces justificatives manquantes',
        priority: 'MEDIUM',
        dueOn: '2024-06-14',
      });
    }
    if (summary.nextDueOn) {
      actions.push({
        id: 'echeance',
        label: `Préparer l’appel de ${summary.nextDueLabel}`,
        priority: 'LOW',
        dueOn: summary.nextDueOn,
      });
    }

    return actions;
  }

  private agent(index: number): AssignedAgent {
    const agent = AGENTS[index % AGENTS.length];
    return {
      ...agent,
      portfolio: 38 + ((index * 3) % 45),
      recoveryRate: 62 + ((index * 7) % 31),
      lastContactOn: `2024-05-${pad(6 + (index % 20), 2)}`,
    };
  }

  /**
   * Historique append-only : la fiche impose qu'il ne soit pas modifiable. Il est
   * reconstitué à partir des faits déjà établis — appels, règlements, relances — et
   * n'introduit aucun événement que les autres onglets ne montreraient pas.
   */
  private history(
    member: MemberFixture,
    index: number,
    contributions: readonly ContributionLine[],
    payments: readonly PaymentLine[],
    summary: ContributionSummary,
  ): readonly HistoryEntry[] {
    const entries: HistoryEntry[] = [
      {
        id: 'adhesion',
        at: `${this.joinedOn(index)}T09:00:00Z`,
        actor: 'Admin CNPM',
        action: 'Adhésion validée',
        detail: `Dossier accepté pour ${member.organization}.`,
      },
      {
        id: 'coordonnees',
        at: `${member.lastActivity}T15:10:00Z`,
        actor: member.contactName,
        action: 'Coordonnées mises à jour',
        detail: 'Contact principal et adresse confirmés par le membre.',
      },
    ];

    contributions.forEach((line, position) => {
      const quarter = QUARTERS[position];
      if (quarter.calledOn.slice(0, 10) > REFERENCE_DATE) {
        return;
      }
      entries.push({
        id: `appel-${line.period}`,
        at: quarter.calledOn,
        actor: 'Système de cotisations',
        action: 'Cotisation appelée',
        detail: `${line.label} — ${formatAmount(line.expected)} FCFA.`,
      });
    });

    payments.forEach((payment) => {
      entries.push({
        id: `paiement-${payment.reference}`,
        at: payment.paidAt,
        actor: 'Service comptable',
        action: 'Paiement enregistré',
        detail: `${formatAmount(payment.amount)} FCFA sur ${payment.period} — référence ${payment.reference}.`,
      });
    });

    if (summary.overduePeriods > 0) {
      entries.push({
        id: 'relance-1',
        at: '2024-05-08T09:41:00Z',
        actor: 'Moussa Diarra',
        action: 'Relance niveau 1 envoyée',
        detail: 'Courriel de rappel adressé au contact principal.',
      });
    }
    if (summary.overduePeriods > 1) {
      entries.push({
        id: 'relance-2',
        at: '2024-05-20T10:23:00Z',
        actor: 'Moussa Diarra',
        action: 'Relance niveau 2 envoyée',
        detail: 'Mise en demeure préparée et transmise pour visa.',
      });
    }

    return entries.sort((left, right) => right.at.localeCompare(left.at));
  }
}
