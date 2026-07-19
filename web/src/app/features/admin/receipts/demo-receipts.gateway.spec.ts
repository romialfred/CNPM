import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoReceiptsGateway } from './demo-receipts.gateway';
import type { ReceiptQuery } from './receipts-gateway';

const BASE_QUERY: ReceiptQuery = {
  search: '',
  status: null,
  channel: null,
  period: null,
  sort: { key: 'issuedAt', direction: 'desc' },
  page: 1,
  pageSize: 10,
};

describe('DemoReceiptsGateway', () => {
  const gateway = new DemoReceiptsGateway();

  it('pagine un registre fermé avec des références normalisées', async () => {
    const page = await firstValueFrom(gateway.search(BASE_QUERY));

    expect(page.totalItems).toBe(12);
    expect(page.rows).toHaveLength(10);
    expect(page.rows.every((row) => row.demonstrationReference.startsWith('CNPM-REC-'))).toBe(true);
    expect(page.rows.every((row) => row.paymentReference.startsWith('PAY-CNPM-'))).toBe(true);
    expect(page.overview).toMatchObject({ totalRecords: 12, issuedCount: 9, cancelledCount: 3 });
  });

  it('filtre et trie côté source sans recalcul de page', async () => {
    const page = await firstValueFrom(
      gateway.search({
        ...BASE_QUERY,
        status: 'CANCELLED',
        channel: 'BANK_TRANSFER',
        sort: { key: 'amount', direction: 'desc' },
      }),
    );

    expect(page.totalItems).toBe(1);
    expect(page.rows[0]).toMatchObject({ status: 'CANCELLED', channel: 'BANK_TRANSFER' });
    expect(page.overview.cancelledCount).toBe(1);
  });

  it('conserve les chaînes de correction et exige une provenance confirmée', async () => {
    const first = await firstValueFrom(gateway.search({ ...BASE_QUERY, pageSize: 50 }));
    const cancelled = first.rows.filter((row) => row.status === 'CANCELLED');

    expect(cancelled.every((row) => row.replacedByReference?.startsWith('CNPM-REC-'))).toBe(true);
    expect(first.rows.every((row) => row.sourcePaymentStatus === 'CONFIRMED')).toBe(true);
    expect(first.rows.every((row) => row.paymentConfirmedAt < row.issuedAt)).toBe(true);
  });
});
