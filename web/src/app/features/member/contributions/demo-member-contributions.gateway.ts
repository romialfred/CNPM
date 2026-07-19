import { Injectable } from '@angular/core';
import { delay, of, throwError, type Observable } from 'rxjs';
import {
  MemberContributionNotFoundError,
  type MemberContributionDetail,
  type MemberContributionPage,
  type MemberContributionQuery,
  type MemberContributionsGateway,
} from './member-contributions-gateway';

/**
 * Données entièrement fictives. Les valeurs financières et chaque solde sont saisis
 * explicitement dans la fixture ; cet adaptateur ne recalcule aucun montant officiel.
 */
const DEMO_CONTRIBUTIONS: readonly MemberContributionDetail[] = [
  {
    id: 'demo-contribution-2026-01',
    reference: 'DEMO-COT-2026-001',
    exercise: 2026,
    issuedOn: '2026-01-15',
    dueDate: '2026-09-30',
    calledAmount: 180000,
    paidAmount: 60000,
    outstandingAmount: 120000,
    currency: 'XOF',
    status: 'PARTIELLE',
    amountOriginNote:
      'Valeur fictive saisie dans la fixture de démonstration. Aucun barème, taux ou palier institutionnel n’est appliqué.',
    adjustments: [
      {
        reference: 'DEMO-AJ-2026-001',
        direction: 'CREDIT',
        amount: 15000,
        currency: 'XOF',
        reason: 'Ajustement fictif fourni par la projection de démonstration',
        recordedOn: '2026-02-03',
      },
    ],
    schedule: [
      {
        id: 'demo-installment-2026-01-a',
        label: 'Échéance fictive 1 sur 3',
        dueDate: '2026-03-31',
        expectedAmount: 60000,
        paidAmount: 60000,
        outstandingAmount: 0,
        currency: 'XOF',
        status: 'REGLEE',
      },
      {
        id: 'demo-installment-2026-01-b',
        label: 'Échéance fictive 2 sur 3',
        dueDate: '2026-06-30',
        expectedAmount: 60000,
        paidAmount: 0,
        outstandingAmount: 60000,
        currency: 'XOF',
        status: 'EN_RETARD',
      },
      {
        id: 'demo-installment-2026-01-c',
        label: 'Échéance fictive 3 sur 3',
        dueDate: '2026-09-30',
        expectedAmount: 60000,
        paidAmount: 0,
        outstandingAmount: 60000,
        currency: 'XOF',
        status: 'A_ECHOIR',
      },
    ],
  },
  {
    id: 'demo-contribution-2026-02',
    reference: 'DEMO-COT-2026-002',
    exercise: 2026,
    issuedOn: '2026-02-10',
    dueDate: '2026-10-31',
    calledAmount: 95000,
    paidAmount: 0,
    outstandingAmount: 95000,
    currency: 'XOF',
    status: 'A_ECHOIR',
    amountOriginNote:
      'Valeur fictive saisie dans la fixture de démonstration. Aucun calcul réglementaire n’est effectué.',
    adjustments: [],
    schedule: [
      {
        id: 'demo-installment-2026-02-a',
        label: 'Échéance fictive unique',
        dueDate: '2026-10-31',
        expectedAmount: 95000,
        paidAmount: 0,
        outstandingAmount: 95000,
        currency: 'XOF',
        status: 'A_ECHOIR',
      },
    ],
  },
  {
    id: 'demo-contribution-2025-01',
    reference: 'DEMO-COT-2025-001',
    exercise: 2025,
    issuedOn: '2025-01-20',
    dueDate: '2025-06-30',
    calledAmount: 150000,
    paidAmount: 100000,
    outstandingAmount: 50000,
    currency: 'XOF',
    status: 'EN_RETARD',
    amountOriginNote:
      'Valeur fictive saisie dans la fixture de démonstration. Le retard est un état fourni, non déduit par l’interface.',
    adjustments: [],
    schedule: [
      {
        id: 'demo-installment-2025-01-a',
        label: 'Échéance fictive 1 sur 2',
        dueDate: '2025-03-31',
        expectedAmount: 75000,
        paidAmount: 75000,
        outstandingAmount: 0,
        currency: 'XOF',
        status: 'REGLEE',
      },
      {
        id: 'demo-installment-2025-01-b',
        label: 'Échéance fictive 2 sur 2',
        dueDate: '2025-06-30',
        expectedAmount: 75000,
        paidAmount: 25000,
        outstandingAmount: 50000,
        currency: 'XOF',
        status: 'PARTIELLE',
      },
    ],
  },
  {
    id: 'demo-contribution-2025-02',
    reference: 'DEMO-COT-2025-002',
    exercise: 2025,
    issuedOn: '2025-03-14',
    dueDate: '2025-11-30',
    calledAmount: 80000,
    paidAmount: 80000,
    outstandingAmount: 0,
    currency: 'XOF',
    status: 'REGLEE',
    amountOriginNote:
      'Valeur fictive saisie dans la fixture de démonstration. Aucun barème institutionnel n’est représenté.',
    adjustments: [],
    schedule: [
      {
        id: 'demo-installment-2025-02-a',
        label: 'Échéance fictive unique',
        dueDate: '2025-11-30',
        expectedAmount: 80000,
        paidAmount: 80000,
        outstandingAmount: 0,
        currency: 'XOF',
        status: 'REGLEE',
      },
    ],
  },
  {
    id: 'demo-contribution-2024-01',
    reference: 'DEMO-COT-2024-001',
    exercise: 2024,
    issuedOn: '2024-02-01',
    dueDate: '2024-08-31',
    calledAmount: 125000,
    paidAmount: 125000,
    outstandingAmount: 0,
    currency: 'XOF',
    status: 'REGLEE',
    amountOriginNote:
      'Valeur fictive saisie dans la fixture de démonstration. Aucun taux ni palier n’est disponible.',
    adjustments: [
      {
        reference: 'DEMO-AJ-2024-001',
        direction: 'DEBIT',
        amount: 5000,
        currency: 'XOF',
        reason: 'Ajustement fictif fourni par la projection de démonstration',
        recordedOn: '2024-04-08',
      },
    ],
    schedule: [
      {
        id: 'demo-installment-2024-01-a',
        label: 'Échéance fictive unique',
        dueDate: '2024-08-31',
        expectedAmount: 125000,
        paidAmount: 125000,
        outstandingAmount: 0,
        currency: 'XOF',
        status: 'REGLEE',
      },
    ],
  },
  {
    id: 'demo-contribution-2024-02',
    reference: 'DEMO-COT-2024-002',
    exercise: 2024,
    issuedOn: '2024-04-18',
    dueDate: '2024-12-15',
    calledAmount: 70000,
    paidAmount: 30000,
    outstandingAmount: 40000,
    currency: 'XOF',
    status: 'PARTIELLE',
    amountOriginNote:
      'Valeur fictive saisie dans la fixture de démonstration. Les montants affichés ne valent pas appel officiel.',
    adjustments: [],
    schedule: [
      {
        id: 'demo-installment-2024-02-a',
        label: 'Échéance fictive unique',
        dueDate: '2024-12-15',
        expectedAmount: 70000,
        paidAmount: 30000,
        outstandingAmount: 40000,
        currency: 'XOF',
        status: 'PARTIELLE',
      },
    ],
  },
];

const AVAILABLE_EXERCISES = [2026, 2025, 2024] as const;

@Injectable()
export class DemoMemberContributionsGateway implements MemberContributionsGateway {
  list(query: MemberContributionQuery): Observable<MemberContributionPage> {
    const filtered = DEMO_CONTRIBUTIONS.filter(
      (item) =>
        (!query.status || item.status === query.status) &&
        (!query.exercise || item.exercise === query.exercise),
    );
    const ordered = [...filtered].sort((left, right) => {
      const leftValue = this.sortValue(left, query);
      const rightValue = this.sortValue(right, query);
      const comparison = leftValue.localeCompare(rightValue, 'fr');
      return query.direction === 'asc' ? comparison : -comparison;
    });
    const start = (query.page - 1) * query.size;
    const items = ordered.slice(start, start + query.size).map((item) => ({
      id: item.id,
      reference: item.reference,
      exercise: item.exercise,
      dueDate: item.dueDate,
      calledAmount: item.calledAmount,
      paidAmount: item.paidAmount,
      outstandingAmount: item.outstandingAmount,
      currency: item.currency,
      status: item.status,
    }));

    return of({
      items,
      page: query.page,
      size: query.size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / query.size),
      availableExercises: AVAILABLE_EXERCISES,
    }).pipe(delay(0));
  }

  loadDetail(id: string): Observable<MemberContributionDetail> {
    const contribution = DEMO_CONTRIBUTIONS.find((item) => item.id === id);
    return contribution
      ? of(contribution).pipe(delay(0))
      : throwError(() => new MemberContributionNotFoundError(id));
  }

  private sortValue(
    contribution: MemberContributionDetail,
    query: MemberContributionQuery,
  ): string {
    switch (query.sort) {
      case 'reference':
        return contribution.reference;
      case 'status':
        return contribution.status;
      default:
        return contribution.dueDate;
    }
  }
}
