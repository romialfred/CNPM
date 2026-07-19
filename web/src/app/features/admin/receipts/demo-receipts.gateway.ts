import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import {
  type ReceiptChannel,
  type ReceiptPeriod,
  type ReceiptQuery,
  type ReceiptRegistryPage,
  type ReceiptRegistryRow,
  type ReceiptSortKey,
  type ReceiptStatus,
  type ReceiptsGateway,
} from './receipts-gateway';

const DEMO_LATENCY_MS = 100;

/**
 * Registre fermé et entièrement fictif pour REC-001..006 / BO-016. Les références
 * `DEMO-*`, membres, paiements, montants et dates ne correspondent à aucun reçu CNPM.
 */
const DEMO_RECEIPTS: readonly ReceiptRegistryRow[] = [
  receipt(
    12,
    'Atelier Kanu — démonstration',
    3_500_000,
    '2024-T2',
    'BANK_TRANSFER',
    '2024-06-28T10:20:00Z',
  ),
  receipt(
    11,
    'Entreprise Sira fictive',
    850_000,
    '2024-T2',
    'MOBILE_MONEY',
    '2024-06-25T08:45:00Z',
  ),
  receipt(
    10,
    'Coopérative Néma — scénario',
    1_250_000,
    '2024-T2',
    'CHECK',
    '2024-06-21T14:10:00Z',
    {
      supersedesReference: reference(9),
    },
  ),
  receipt(9, 'Coopérative Néma — scénario', 1_250_000, '2024-T2', 'CHECK', '2024-06-18T09:05:00Z', {
    status: 'CANCELLED',
    replacedByReference: reference(10),
  }),
  receipt(8, 'Maison Dô — prototype', 475_000, '2024-T2', 'CASH', '2024-06-12T11:30:00Z'),
  receipt(
    7,
    'Réseau Teriya — démonstration',
    2_100_000,
    '2024-T2',
    'BANK_TRANSFER',
    '2024-05-30T16:00:00Z',
    {
      supersedesReference: reference(6),
    },
  ),
  receipt(
    6,
    'Réseau Teriya — démonstration',
    2_100_000,
    '2024-T2',
    'BANK_TRANSFER',
    '2024-05-28T13:25:00Z',
    {
      status: 'CANCELLED',
      replacedByReference: reference(7),
    },
  ),
  receipt(5, 'Studio Bolo fictif', 620_000, '2024-T1', 'MOBILE_MONEY', '2024-04-19T07:40:00Z', {
    supersedesReference: reference(4),
  }),
  receipt(4, 'Studio Bolo fictif', 620_000, '2024-T1', 'MOBILE_MONEY', '2024-04-17T15:15:00Z', {
    status: 'CANCELLED',
    replacedByReference: reference(5),
  }),
  receipt(
    3,
    'Collectif Wassa — scénario',
    1_800_000,
    '2024-T1',
    'BANK_TRANSFER',
    '2024-03-29T12:00:00Z',
  ),
  receipt(2, 'Entreprise Lumo fictive', 940_000, '2024-T1', 'CHECK', '2024-03-15T10:35:00Z'),
  receipt(1, 'Atelier Fôro — prototype', 300_000, '2024-T1', 'CASH', '2024-02-27T09:10:00Z'),
];

@Injectable()
export class DemoReceiptsGateway implements ReceiptsGateway {
  search(query: ReceiptQuery): Observable<ReceiptRegistryPage> {
    const term = query.search.trim().toLocaleLowerCase('fr');
    const rows = DEMO_RECEIPTS.filter((row) => {
      const matchesSearch =
        !term ||
        [row.demonstrationReference, row.memberCode, row.memberLabel, row.paymentReference].some(
          (value) => value.toLocaleLowerCase('fr').includes(term),
        );
      return (
        matchesSearch &&
        (!query.status || row.status === query.status) &&
        (!query.channel || row.channel === query.channel) &&
        (!query.period || row.period === query.period)
      );
    }).sort((left, right) => compareRows(left, right, query.sort.key, query.sort.direction));

    const start = (query.page - 1) * query.pageSize;
    return of({
      rows: rows.slice(start, start + query.pageSize).map((row) => ({ ...row })),
      totalItems: rows.length,
      overview: {
        totalRecords: rows.length,
        issuedCount: rows.filter((row) => row.status === 'ISSUED').length,
        cancelledCount: rows.filter((row) => row.status === 'CANCELLED').length,
        totalAmount: rows.reduce((total, row) => total + row.amount, 0),
      },
    }).pipe(delay(DEMO_LATENCY_MS));
  }
}

interface ReceiptOptions {
  readonly status?: ReceiptStatus;
  readonly supersedesReference?: string | null;
  readonly replacedByReference?: string | null;
}

function receipt(
  index: number,
  memberLabel: string,
  amount: number,
  period: ReceiptPeriod,
  channel: ReceiptChannel,
  issuedAt: string,
  options: ReceiptOptions = {},
): ReceiptRegistryRow {
  return {
    id: `60000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    demonstrationReference: reference(index),
    memberCode: `MEM-DEMO-${String(index).padStart(4, '0')}`,
    memberLabel,
    amount,
    period,
    channel,
    issuedAt,
    status: options.status ?? 'ISSUED',
    paymentReference: `PAY-DEMO-2024-${String(index).padStart(4, '0')}`,
    paymentConfirmedAt: precedingConfirmation(issuedAt),
    sourcePaymentStatus: 'CONFIRMED',
    supersedesReference: options.supersedesReference ?? null,
    replacedByReference: options.replacedByReference ?? null,
    deliveryState: 'NOT_SIMULATED',
  };
}

function reference(index: number): string {
  return `DEMO-REC-2024-${String(index).padStart(4, '0')}`;
}

function precedingConfirmation(issuedAt: string): string {
  const date = new Date(issuedAt);
  date.setUTCHours(date.getUTCHours() - 2);
  return date.toISOString();
}

function compareRows(
  left: ReceiptRegistryRow,
  right: ReceiptRegistryRow,
  key: ReceiptSortKey,
  direction: 'asc' | 'desc',
): number {
  const factor = direction === 'asc' ? 1 : -1;
  const leftValue = left[key];
  const rightValue = right[key];
  return (
    (typeof leftValue === 'number'
      ? leftValue - (rightValue as number)
      : leftValue.localeCompare(rightValue as string)) * factor
  );
}
