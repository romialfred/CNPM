import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_MEMBER_CONTRIBUTIONS_GATEWAY } from '../unavailable-member-gateways';
import { DemoMemberContributionsGateway } from './demo-member-contributions.gateway';
import {
  MemberContributionNotFoundError,
  type MemberContributionQuery,
} from './member-contributions-gateway';

const DEFAULT_QUERY: MemberContributionQuery = {
  sort: 'dueDate',
  direction: 'desc',
  page: 1,
  size: 3,
};

describe('DemoMemberContributionsGateway — MP-002/MP-003', () => {
  const gateway = new DemoMemberContributionsGateway();

  it('filtre, trie et pagine la projection déterministe côté source', async () => {
    const firstPage = await firstValueFrom(gateway.list(DEFAULT_QUERY));
    expect(firstPage.items).toHaveLength(3);
    expect(firstPage.totalElements).toBe(6);
    expect(firstPage.totalPages).toBe(2);
    expect(firstPage.items.map((item) => item.dueDate)).toEqual([
      '2026-10-31',
      '2026-09-30',
      '2025-11-30',
    ]);

    const filtered = await firstValueFrom(
      gateway.list({
        ...DEFAULT_QUERY,
        status: 'REGLEE',
        exercise: 2025,
        sort: 'reference',
        direction: 'asc',
      }),
    );
    expect(filtered.items.map((item) => item.reference)).toEqual(['CNPM-COT-2025-002']);
    expect(filtered.availableExercises).toEqual([2026, 2025, 2024]);
  });

  it('sert les montants, ajustements et échéances saisis sans champ de barème', async () => {
    const detail = await firstValueFrom(gateway.loadDetail('demo-contribution-2026-01'));
    expect(detail).toMatchObject({
      calledAmount: 180000,
      paidAmount: 60000,
      outstandingAmount: 120000,
    });
    expect(detail.adjustments[0]).toMatchObject({ amount: 15000, direction: 'CREDIT' });
    expect(detail.schedule.map((item) => item.outstandingAmount)).toEqual([0, 60000, 60000]);
    expect(Object.keys(detail).join(' ')).not.toMatch(/rate|tier|tranche|barème/i);
    expect(detail.amountOriginNote).toContain('DEC-008');
  });

  it('signale explicitement une contribution absente', async () => {
    await expect(firstValueFrom(gateway.loadDetail('inconnue'))).rejects.toBeInstanceOf(
      MemberContributionNotFoundError,
    );
  });

  it('reste explicitement indisponible en HTTP faute de projection OpenAPI exploitable', async () => {
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_CONTRIBUTIONS_GATEWAY.list(DEFAULT_QUERY)),
    ).rejects.toMatchObject({ feature: 'MP-002' });
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_CONTRIBUTIONS_GATEWAY.loadDetail('demo')),
    ).rejects.toMatchObject({ feature: 'MP-003' });
  });
});
