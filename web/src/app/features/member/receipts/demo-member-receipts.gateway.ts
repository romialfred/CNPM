import { Injectable } from '@angular/core';
import { delay, of, throwError, type Observable } from 'rxjs';
import {
  MemberReceiptNotFoundError,
  type MemberReceiptDetail,
  type MemberReceiptPage,
  type MemberReceiptQuery,
  type MemberReceiptsGateway,
} from './member-receipts-gateway';

const SOURCE_DISCLOSURE =
  'Récapitulatif établi à partir des éléments enregistrés sur votre espace membre.';
const PAYMENT_DISCLOSURE =
  'Le règlement associé n’est pas encore rapproché : la confirmation du CNPM reste à venir.';
const PROOF_DISCLOSURE =
  'Le reçu officiel signé n’est pas encore émis. Le téléchargement, le partage et la vérification restent indisponibles tant que DEC-005 et le contrat documentaire ne sont pas finalisés.';

const RECEIPTS: readonly MemberReceiptDetail[] = [
  receipt('demo-receipt-preview-2026-001', 'RCP-2026-001', 2026, 150000, '2026-06-18'),
  receipt('demo-receipt-preview-2026-002', 'RCP-2026-002', 2026, 220000, '2026-04-08'),
  receipt(
    'demo-receipt-preview-2025-002',
    'RCP-2025-002',
    2025,
    180000,
    '2025-12-20',
    'DEMONSTRATION_CANCELLED',
  ),
  receipt('demo-receipt-preview-2025-001', 'RCP-2025-001', 2025, 95000, '2025-07-11'),
  receipt('demo-receipt-preview-2024-002', 'RCP-2024-002', 2024, 125000, '2024-11-30'),
  receipt(
    'demo-receipt-preview-2024-001',
    'RCP-2024-001',
    2024,
    70000,
    '2024-08-22',
    'DEMONSTRATION_CANCELLED',
  ),
];

const AVAILABLE_EXERCISES = [2026, 2025, 2024] as const;

@Injectable()
export class DemoMemberReceiptsGateway implements MemberReceiptsGateway {
  list(query: MemberReceiptQuery): Observable<MemberReceiptPage> {
    const term = query.search.trim().toLocaleLowerCase('fr');
    const filtered = RECEIPTS.filter((item) => {
      const exercise = Number(item.scenarioDate.slice(0, 4));
      return (
        (!term ||
          [item.reference, item.periodLabel].some((value) =>
            value.toLocaleLowerCase('fr').includes(term),
          )) &&
        (!query.status || item.status === query.status) &&
        (!query.exercise || exercise === query.exercise)
      );
    });
    const ordered = [...filtered].sort((left, right) => {
      const leftValue = sortValue(left, query);
      const rightValue = sortValue(right, query);
      const comparison = leftValue.localeCompare(rightValue, 'fr');
      return query.direction === 'asc' ? comparison : -comparison;
    });
    const start = (query.page - 1) * query.size;

    return of({
      items: ordered.slice(start, start + query.size).map(toSummary),
      page: query.page,
      size: query.size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / query.size),
      availableExercises: AVAILABLE_EXERCISES,
    }).pipe(delay(0));
  }

  loadDetail(id: string): Observable<MemberReceiptDetail> {
    const detail = RECEIPTS.find((item) => item.id === id || item.reference === id);
    return detail
      ? of({ ...detail }).pipe(delay(0))
      : throwError(() => new MemberReceiptNotFoundError(id));
  }
}

function receipt(
  id: string,
  reference: `RCP-${string}`,
  exercise: number,
  amountXof: number,
  scenarioDate: string,
  status: MemberReceiptDetail['status'] = 'DEMONSTRATION_AVAILABLE',
): MemberReceiptDetail {
  return {
    id,
    reference,
    periodLabel: `Exercice ${exercise}`,
    amountXof,
    scenarioDate,
    status,
    sourceDisclosure: SOURCE_DISCLOSURE,
    paymentDisclosure: PAYMENT_DISCLOSURE,
    proofDisclosure: PROOF_DISCLOSURE,
  };
}

function toSummary(detail: MemberReceiptDetail) {
  return {
    id: detail.id,
    reference: detail.reference,
    periodLabel: detail.periodLabel,
    amountXof: detail.amountXof,
    scenarioDate: detail.scenarioDate,
    status: detail.status,
  };
}

function sortValue(detail: MemberReceiptDetail, query: MemberReceiptQuery): string {
  switch (query.sort) {
    case 'amountXof':
      return detail.amountXof.toString().padStart(20, '0');
    case 'reference':
      return detail.reference;
    default:
      return detail.scenarioDate;
  }
}
