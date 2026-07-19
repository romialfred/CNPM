import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_MEMBER_RECEIPTS_GATEWAY } from '../unavailable-member-gateways';
import { DemoMemberReceiptsGateway } from './demo-member-receipts.gateway';
import { MemberReceiptNotFoundError, type MemberReceiptQuery } from './member-receipts-gateway';

const DEFAULT_QUERY: MemberReceiptQuery = {
  search: '',
  sort: 'scenarioDate',
  direction: 'desc',
  page: 1,
  size: 5,
};

describe('DemoMemberReceiptsGateway — MP-007/MP-008', () => {
  it('filtre, trie et pagine les récapitulatifs déterministes', async () => {
    const gateway = new DemoMemberReceiptsGateway();
    const page = await firstValueFrom(gateway.list(DEFAULT_QUERY));
    expect(page.items).toHaveLength(5);
    expect(page.totalElements).toBe(6);
    expect(page.totalPages).toBe(2);
    expect(page.items[0]?.reference).toBe('RCP-2026-001');

    const filtered = await firstValueFrom(
      gateway.list({
        ...DEFAULT_QUERY,
        search: '2025',
        status: 'DEMONSTRATION_CANCELLED',
        exercise: 2025,
      }),
    );
    expect(filtered.items.map((item) => item.reference)).toEqual(['RCP-2025-002']);
  });

  it('sert un récapitulatif consultatif sans contenu ni identifiant de preuve', async () => {
    const gateway = new DemoMemberReceiptsGateway();
    const detail = await firstValueFrom(gateway.loadDetail('demo-receipt-preview-2026-001'));
    expect(detail).toMatchObject({
      reference: 'RCP-2026-001',
      periodLabel: 'Exercice 2026',
      amountXof: 150000,
    });
    expect(Object.keys(detail)).not.toEqual(
      expect.arrayContaining([
        'pdf',
        'downloadUrl',
        'verificationToken',
        'qrCode',
        'signature',
        'stamp',
      ]),
    );
    expect(detail.proofDisclosure).toContain('Le reçu officiel signé n’est pas encore émis');
  });

  it('signale une référence absente', async () => {
    const gateway = new DemoMemberReceiptsGateway();
    await expect(firstValueFrom(gateway.loadDetail('absente'))).rejects.toBeInstanceOf(
      MemberReceiptNotFoundError,
    );
  });

  it('ferme liste et détail en profil HTTP générique', async () => {
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_RECEIPTS_GATEWAY.list(DEFAULT_QUERY)),
    ).rejects.toMatchObject({ feature: 'MP-007' });
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_RECEIPTS_GATEWAY.loadDetail('demo')),
    ).rejects.toMatchObject({ feature: 'MP-008' });
  });
});
