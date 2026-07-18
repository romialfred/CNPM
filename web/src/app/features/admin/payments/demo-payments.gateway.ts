import { Injectable } from '@angular/core';
import { delay, type Observable, of, switchMap, throwError, timer } from 'rxjs';
import type {
  AnomalyCommand,
  AuditEntry,
  MatchSuggestion,
  PaymentChannel,
  PaymentsGateway,
  PaymentsQuery,
  PaymentsQueuePage,
  ReconciliationCommand,
  ReconciliationOutcome,
  ReconciliationOverview,
  ReconciliationQueue,
  StatementLine,
} from './payments-gateway';
import { PaymentsValidationError } from './payments-gateway';

/**
 * Latence simulée. Sans elle, l'état de chargement ne serait jamais peint, donc jamais
 * éprouvé — et un écran dont on n'a jamais vu le chargement se découvre en production.
 */
const LATENCY_MS = 140;

/**
 * Jeu de démonstration — données entièrement fictives.
 *
 * Aucune raison sociale, aucun matricule et aucun montant réel : ni membre du CNPM, ni
 * établissement bancaire, ni opérateur existant. `CLAUDE.md` interdit d'inventer une
 * donnée institutionnelle, et les codes membres portent le préfixe `DEMO` pour qu'une
 * capture d'écran ne puisse jamais être prise pour un extrait de production.
 */
const DEMO_LINES: readonly StatementLine[] = [
  {
    id: 'line-0001',
    reference: 'MM-2026-0714-01001',
    payer: 'Sahel Agro SA',
    amount: 12500000,
    channel: 'MOBILE_MONEY',
    valueDate: '2026-07-14T11:23:00Z',
    transactionReference: 'DEMO-MM-260714-1001',
    status: 'UNMATCHED',
    allocation: null,
    suggestions: [
      {
        id: 'sugg-0001-a',
        memberCode: 'CNPM-DEMO-0101',
        memberName: 'Sahel Agro SA',
        contributionLabel: 'Cotisation annuelle 2026',
        period: 'T1 2026 – T4 2026',
        expectedAmount: 12500000,
        score: 98,
        reasons: [
          'Montant identique au montant attendu',
          'Raison sociale identique au membre',
          'Référence de transaction déclarée par le membre',
        ],
      },
      {
        id: 'sugg-0001-b',
        memberCode: 'CNPM-DEMO-0111',
        memberName: 'Wassoulou Agro SA',
        contributionLabel: 'Cotisation annuelle 2026',
        period: 'T1 2026 – T4 2026',
        expectedAmount: 12500000,
        score: 61,
        reasons: ['Montant identique au montant attendu', 'Raison sociale partiellement proche'],
      },
    ],
  },
  {
    id: 'line-0002',
    reference: 'VIR-2026-0714-01002',
    payer: 'Niger Textile SARL',
    amount: 8750000,
    channel: 'BANK_TRANSFER',
    valueDate: '2026-07-14T10:18:00Z',
    transactionReference: 'DEMO-VIR-260714-1002',
    status: 'UNMATCHED',
    allocation: null,
    suggestions: [
      {
        id: 'sugg-0002-a',
        memberCode: 'CNPM-DEMO-0102',
        memberName: 'Niger Textile SARL',
        contributionLabel: 'Cotisation annuelle 2026',
        period: 'T1 2026 – T4 2026',
        expectedAmount: 8750000,
        score: 95,
        reasons: [
          'Montant identique au montant attendu',
          'Raison sociale identique au membre',
          'Libellé de virement contenant le matricule',
        ],
      },
    ],
  },
  {
    id: 'line-0003',
    reference: 'CAI-2026-0714-01003',
    payer: 'Ets Diallo Négoce',
    amount: 3250000,
    channel: 'CASH',
    valueDate: '2026-07-14T09:52:00Z',
    transactionReference: 'DEMO-CAI-260714-1003',
    status: 'UNMATCHED',
    allocation: null,
    // Aucune correspondance : le payeur n'est rattaché à aucun membre connu. L'écran
    // doit savoir dire « rien à proposer » plutôt que d'imposer un choix par défaut.
    suggestions: [],
  },
  {
    id: 'line-0004',
    reference: 'MM-2026-0713-01004',
    payer: 'Manding BTP SARL',
    amount: 7250000,
    channel: 'MOBILE_MONEY',
    valueDate: '2026-07-13T17:41:00Z',
    transactionReference: 'DEMO-MM-260713-1004',
    status: 'UNMATCHED',
    allocation: null,
    suggestions: [
      {
        id: 'sugg-0004-a',
        memberCode: 'CNPM-DEMO-0106',
        memberName: 'Manding BTP SARL',
        contributionLabel: 'Cotisation annuelle 2026',
        period: 'T1 2026 – T4 2026',
        expectedAmount: 9000000,
        score: 74,
        reasons: [
          'Raison sociale identique au membre',
          'Montant inférieur au montant attendu : affectation partielle probable',
        ],
      },
    ],
  },
  {
    id: 'line-0005',
    reference: 'VIR-2026-0713-01005',
    payer: 'Delta Ciment SA',
    amount: 5000000,
    channel: 'BANK_TRANSFER',
    valueDate: '2026-07-13T16:05:00Z',
    transactionReference: 'DEMO-VIR-260713-1005',
    status: 'UNMATCHED',
    allocation: null,
    suggestions: [
      {
        id: 'sugg-0005-a',
        memberCode: 'CNPM-DEMO-0105',
        memberName: 'Delta Ciment SA',
        contributionLabel: 'Cotisation annuelle 2026',
        period: 'T1 2026 – T4 2026',
        expectedAmount: 5000000,
        score: 93,
        reasons: ['Montant identique au montant attendu', 'Raison sociale identique au membre'],
      },
    ],
  },
  {
    id: 'line-0006',
    reference: 'CHQ-2026-0713-01006',
    payer: 'Faso Bureautique SARL',
    amount: 2650000,
    channel: 'CHECK',
    valueDate: '2026-07-13T15:22:00Z',
    transactionReference: 'DEMO-CHQ-260713-1006',
    status: 'UNMATCHED',
    allocation: null,
    suggestions: [
      {
        id: 'sugg-0006-a',
        memberCode: 'CNPM-DEMO-0104',
        memberName: 'Faso Bureautique SARL',
        contributionLabel: 'Cotisation annuelle 2026',
        period: 'T1 2026 – T4 2026',
        expectedAmount: 2650000,
        score: 91,
        reasons: ['Montant identique au montant attendu', 'Raison sociale identique au membre'],
      },
      {
        id: 'sugg-0006-b',
        memberCode: 'CNPM-DEMO-0104',
        memberName: 'Faso Bureautique SARL',
        contributionLabel: 'Régularisation 2025',
        period: 'T3 2025 – T4 2025',
        expectedAmount: 2650000,
        score: 68,
        reasons: ['Montant identique au montant attendu', 'Solde ouvert sur l’exercice précédent'],
      },
    ],
  },
  {
    id: 'line-0007',
    reference: 'MM-2026-0712-01007',
    payer: 'Bamako Froid SA',
    amount: 1750000,
    channel: 'MOBILE_MONEY',
    valueDate: '2026-07-12T14:03:00Z',
    transactionReference: 'DEMO-MM-260712-1007',
    status: 'UNMATCHED',
    allocation: null,
    suggestions: [
      {
        id: 'sugg-0007-a',
        memberCode: 'CNPM-DEMO-0107',
        memberName: 'Bamako Froid SA',
        contributionLabel: 'Cotisation annuelle 2026',
        period: 'T1 2026 – T4 2026',
        expectedAmount: 3500000,
        score: 66,
        reasons: [
          'Raison sociale identique au membre',
          'Montant correspondant à la moitié du montant attendu',
        ],
      },
    ],
  },
  {
    id: 'line-0008',
    reference: 'VIR-2026-0712-01008',
    payer: 'Kayes Logistique SA',
    amount: 10000000,
    channel: 'BANK_TRANSFER',
    valueDate: '2026-07-12T11:56:00Z',
    transactionReference: 'DEMO-VIR-260712-1008',
    status: 'UNMATCHED',
    allocation: null,
    suggestions: [
      {
        id: 'sugg-0008-a',
        memberCode: 'CNPM-DEMO-0103',
        memberName: 'Kayes Logistique SA',
        contributionLabel: 'Cotisation annuelle 2026',
        period: 'T1 2026 – T4 2026',
        expectedAmount: 10000000,
        score: 96,
        reasons: [
          'Montant identique au montant attendu',
          'Raison sociale identique au membre',
          'Libellé de virement contenant le matricule',
        ],
      },
    ],
  },
  {
    id: 'line-0009',
    reference: 'MM-2026-0711-01009',
    payer: 'Sikasso Coton SARL',
    amount: 6300000,
    channel: 'MOBILE_MONEY',
    valueDate: '2026-07-11T10:31:00Z',
    transactionReference: 'DEMO-MM-260711-1009',
    status: 'TO_CONFIRM',
    allocation: {
      memberCode: 'CNPM-DEMO-0108',
      memberName: 'Sikasso Coton SARL',
      contributionLabel: 'Cotisation annuelle 2026',
      allocatedAmount: 6300000,
      remainder: 0,
    },
    suggestions: [],
  },
  {
    id: 'line-0010',
    reference: 'VIR-2026-0711-01010',
    payer: 'Mopti Pêche SA',
    amount: 9500000,
    channel: 'BANK_TRANSFER',
    valueDate: '2026-07-11T09:12:00Z',
    transactionReference: 'DEMO-VIR-260711-1010',
    status: 'TO_CONFIRM',
    allocation: {
      memberCode: 'CNPM-DEMO-0109',
      memberName: 'Mopti Pêche SA',
      contributionLabel: 'Cotisation annuelle 2026',
      allocatedAmount: 8000000,
      remainder: 1500000,
    },
    suggestions: [],
  },
  {
    id: 'line-0011',
    reference: 'VIR-2026-0710-01011',
    payer: 'Gao Énergie SARL',
    amount: 4200000,
    channel: 'BANK_TRANSFER',
    valueDate: '2026-07-10T16:48:00Z',
    transactionReference: 'DEMO-VIR-260710-1011',
    status: 'MATCHED',
    allocation: {
      memberCode: 'CNPM-DEMO-0110',
      memberName: 'Gao Énergie SARL',
      contributionLabel: 'Cotisation annuelle 2026',
      allocatedAmount: 4200000,
      remainder: 0,
    },
    suggestions: [],
  },
  {
    id: 'line-0012',
    reference: 'MM-2026-0710-01012',
    payer: 'Koulikoro Transit SARL',
    amount: 3100000,
    channel: 'MOBILE_MONEY',
    valueDate: '2026-07-10T13:27:00Z',
    transactionReference: 'DEMO-MM-260710-1012',
    status: 'MATCHED',
    allocation: {
      memberCode: 'CNPM-DEMO-0112',
      memberName: 'Koulikoro Transit SARL',
      contributionLabel: 'Cotisation annuelle 2026',
      allocatedAmount: 3100000,
      remainder: 0,
    },
    suggestions: [],
  },
  {
    id: 'line-0013',
    reference: 'CAI-2026-0709-01013',
    payer: 'Wassoulou Agro SA',
    amount: 1250000,
    channel: 'CASH',
    valueDate: '2026-07-09T15:04:00Z',
    transactionReference: 'DEMO-CAI-260709-1013',
    status: 'MATCHED',
    allocation: {
      memberCode: 'CNPM-DEMO-0111',
      memberName: 'Wassoulou Agro SA',
      contributionLabel: 'Régularisation 2025',
      allocatedAmount: 1250000,
      remainder: 0,
    },
    suggestions: [],
  },
  {
    id: 'line-0014',
    reference: 'MM-2026-0709-01014',
    payer: 'Payeur non identifié',
    amount: 875000,
    channel: 'MOBILE_MONEY',
    valueDate: '2026-07-09T08:36:00Z',
    transactionReference: 'DEMO-MM-260709-1014',
    status: 'ANOMALY',
    allocation: null,
    suggestions: [],
  },
];

/** Journal initial. Acteurs volontairement génériques : aucune identité réelle. */
const SEED_AUDIT: readonly AuditEntry[] = [
  {
    id: 'audit-003',
    actor: 'Agent démo 2',
    action: 'Rapprochement enregistré sur MM-2026-0711-01009, en attente de confirmation',
    outcome: 'pending',
    occurredAt: '2026-07-15T09:41:00Z',
  },
  {
    id: 'audit-002',
    actor: 'Système',
    action: 'Anomalie automatique sur MM-2026-0709-01014 : payeur non identifié',
    outcome: 'rejected',
    occurredAt: '2026-07-14T18:12:00Z',
  },
  {
    id: 'audit-001',
    actor: 'Agent démo 1',
    action: 'Confirmation du rapprochement de VIR-2026-0710-01011',
    outcome: 'success',
    occurredAt: '2026-07-14T17:05:00Z',
  },
];

const QUEUE_STATUSES: Readonly<Record<ReconciliationQueue, readonly StatementLine['status'][]>> = {
  'a-rapprocher': ['UNMATCHED'],
  'a-confirmer': ['TO_CONFIRM'],
  traites: ['MATCHED', 'ANOMALY'],
};

/**
 * Comparaison insensible à la casse et aux diacritiques : chercher « Peche » doit
 * trouver « Mopti Pêche SA », sinon une frappe rapide ou un clavier sans accents ne
 * renvoie rien.
 */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function bestScore(line: StatementLine): number {
  return line.suggestions.length === 0 ? -1 : line.suggestions[0].score;
}

/**
 * Adaptateur de démonstration du port `PAYMENTS_GATEWAY`.
 *
 * Il tient le rôle de l'API : c'est lui qui filtre, trie, pagine, **valide les montants**
 * et garantit l'idempotence. Les contrôles faits ici sont ceux que le backend devra
 * refaire ; l'écran ne s'y substitue jamais. Le remplacer par l'adaptateur HTTP ne
 * touchera aucune page.
 */
@Injectable()
export class DemoPaymentsGateway implements PaymentsGateway {
  /** Copie mutable : rapprocher une ligne doit la faire changer de file. */
  private lines: StatementLine[] = DEMO_LINES.map((line) => ({ ...line }));
  private audit: AuditEntry[] = [...SEED_AUDIT];
  private auditSequence = SEED_AUDIT.length;

  /**
   * Mémoire des clés d'idempotence déjà traitées.
   *
   * C'est ce registre, et non le bouton neutralisé de l'écran, qui empêche le doublon :
   * un second envoi de la même clé rend le résultat déjà enregistré sans rien réécrire.
   */
  private readonly processed = new Map<string, ReconciliationOutcome>();

  search(query: PaymentsQuery): Observable<PaymentsQueuePage> {
    const statuses = QUEUE_STATUSES[query.queue];
    const filtered = this.lines.filter(
      (line) => statuses.includes(line.status) && this.matches(line, query),
    );
    const sorted = this.sortLines(filtered, query);

    const start = (query.page - 1) * query.pageSize;

    return this.succeed({
      lines: sorted.slice(start, start + query.pageSize),
      totalItems: filtered.length,
      // La synthèse décrit toute la file, pas le filtre courant : « combien reste-t-il
      // à rapprocher ? » ne change pas parce qu'on a restreint l'affichage.
      overview: this.overview(),
      auditTrail: this.audit.slice(0, 6),
      channels: this.channels(),
    });
  }

  reconcile(command: ReconciliationCommand): Observable<ReconciliationOutcome> {
    const replay = this.processed.get(command.idempotencyKey);
    if (replay) {
      return this.succeed({ ...replay, replayed: true });
    }

    if (command.assignments.length === 0) {
      return this.fail('Aucune ligne à rapprocher n’a été transmise.');
    }

    // Toutes les affectations sont vérifiées AVANT d'en appliquer une seule : un lot
    // à moitié écrit laisserait la file dans un état que personne n'a demandé.
    for (const assignment of command.assignments) {
      const line = this.lines.find((candidate) => candidate.id === assignment.lineId);
      if (!line) {
        return this.fail('Une des lignes sélectionnées n’existe plus.');
      }
      if (line.status !== 'UNMATCHED') {
        return this.fail(`La ligne ${line.reference} a déjà été traitée.`);
      }
      const suggestion = line.suggestions.find((item) => item.id === assignment.suggestionId);
      if (!suggestion) {
        return this.fail(`Aucune correspondance valide pour la ligne ${line.reference}.`);
      }
      if (!Number.isInteger(assignment.allocatedAmount) || assignment.allocatedAmount <= 0) {
        return this.fail('Le montant à affecter doit être un entier strictement positif.');
      }
      if (assignment.allocatedAmount > line.amount) {
        return this.fail(
          `Le montant affecté dépasse le montant encaissé sur la ligne ${line.reference}.`,
        );
      }
    }

    for (const assignment of command.assignments) {
      const line = this.lines.find((candidate) => candidate.id === assignment.lineId);
      if (!line) {
        continue;
      }
      const suggestion = line.suggestions.find(
        (item) => item.id === assignment.suggestionId,
      ) as MatchSuggestion;

      this.replace(line.id, {
        ...line,
        // Séparation des tâches : rapprocher ne solde pas le paiement, cela le place en
        // attente de confirmation par un second agent.
        status: 'TO_CONFIRM',
        suggestions: [],
        allocation: {
          memberCode: suggestion.memberCode,
          memberName: suggestion.memberName,
          contributionLabel: suggestion.contributionLabel,
          allocatedAmount: assignment.allocatedAmount,
          remainder: line.amount - assignment.allocatedAmount,
        },
      });

      this.record(
        `Rapprochement de ${line.reference} avec ${suggestion.memberCode}, en attente de confirmation`,
        'pending',
      );
    }

    if (command.comment) {
      this.record(`Commentaire de rapprochement : ${command.comment}`, 'success');
    }

    const outcome: ReconciliationOutcome = {
      affectedCount: command.assignments.length,
      replayed: false,
      auditTrail: this.audit.slice(0, 6),
    };
    this.processed.set(command.idempotencyKey, outcome);
    return this.succeed(outcome);
  }

  reportAnomaly(command: AnomalyCommand): Observable<ReconciliationOutcome> {
    const replay = this.processed.get(command.idempotencyKey);
    if (replay) {
      return this.succeed({ ...replay, replayed: true });
    }

    const line = this.lines.find((candidate) => candidate.id === command.lineId);
    if (!line) {
      return this.fail('La ligne signalée n’existe plus.');
    }
    if (line.status === 'ANOMALY') {
      return this.fail(`La ligne ${line.reference} porte déjà une anomalie.`);
    }
    // Critère d'acceptation de la fiche : « Toute anomalie exige un type et un
    // commentaire. » La règle est tenue par la source, pas seulement par le formulaire.
    if (!command.comment.trim()) {
      return this.fail('Un commentaire est obligatoire pour signaler une anomalie.');
    }

    this.replace(line.id, { ...line, status: 'ANOMALY', suggestions: [], allocation: null });
    this.record(`Anomalie signalée sur ${line.reference} : ${command.comment.trim()}`, 'rejected');

    const outcome: ReconciliationOutcome = {
      affectedCount: 1,
      replayed: false,
      auditTrail: this.audit.slice(0, 6),
    };
    this.processed.set(command.idempotencyKey, outcome);
    return this.succeed(outcome);
  }

  private matches(line: StatementLine, query: PaymentsQuery): boolean {
    if (query.channel && line.channel !== query.channel) {
      return false;
    }
    const term = fold(query.search.trim());
    if (!term) {
      return true;
    }
    return [line.reference, line.payer, line.transactionReference].some((field) =>
      fold(field).includes(term),
    );
  }

  private sortLines(
    lines: readonly StatementLine[],
    query: PaymentsQuery,
  ): readonly StatementLine[] {
    const sort = query.sort;
    if (!sort) {
      // Défaut : le plus récent d'abord. Une file de traitement se prend par le haut.
      return [...lines].sort((left, right) => right.valueDate.localeCompare(left.valueDate));
    }
    const factor = sort.direction === 'asc' ? 1 : -1;
    // La copie est délibérée : `sort` trie en place et réordonnerait `this.lines`.
    return [...lines].sort((left, right) => factor * this.compare(left, right, sort.key));
  }

  private compare(left: StatementLine, right: StatementLine, key: string): number {
    switch (key) {
      case 'amount':
        return left.amount - right.amount;
      case 'payer':
        return left.payer.localeCompare(right.payer, 'fr');
      case 'suggestion':
        return bestScore(left) - bestScore(right);
      case 'valueDate':
        // ISO 8601 : l'ordre lexicographique est l'ordre chronologique.
        return left.valueDate.localeCompare(right.valueDate);
      case 'reference':
      default:
        return left.reference.localeCompare(right.reference, 'fr', { numeric: true });
    }
  }

  private channels(): readonly PaymentChannel[] {
    const order: readonly PaymentChannel[] = ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CHECK'];
    const present = new Set(this.lines.map((line) => line.channel));
    return order.filter((channel) => present.has(channel));
  }

  private overview(): ReconciliationOverview {
    const toReconcile = this.lines.filter((line) => line.status === 'UNMATCHED');
    return {
      toReconcile: toReconcile.length,
      toConfirm: this.lines.filter((line) => line.status === 'TO_CONFIRM').length,
      anomalies: this.lines.filter((line) => line.status === 'ANOMALY').length,
      amountToReconcile: toReconcile.reduce((sum, line) => sum + line.amount, 0),
    };
  }

  private replace(id: string, next: StatementLine): void {
    this.lines = this.lines.map((line) => (line.id === id ? next : line));
  }

  private record(action: string, outcome: AuditEntry['outcome']): void {
    this.auditSequence += 1;
    const entry: AuditEntry = {
      id: `audit-${String(this.auditSequence).padStart(3, '0')}`,
      actor: 'Agent démo 1',
      action,
      outcome,
      occurredAt: new Date().toISOString(),
    };
    this.audit = [entry, ...this.audit];
  }

  private succeed<T>(value: T): Observable<T> {
    return of(value).pipe(delay(LATENCY_MS));
  }

  /**
   * `timer` puis `throwError` : `delay` ne retarde pas une notification d'erreur, qui
   * partirait donc instantanément et ferait clignoter le bouton d'envoi sans que l'état
   * « envoi en cours » soit jamais visible.
   */
  private fail<T>(message: string): Observable<T> {
    return timer(LATENCY_MS).pipe(
      switchMap(() => throwError(() => new PaymentsValidationError(message))),
    );
  }
}
