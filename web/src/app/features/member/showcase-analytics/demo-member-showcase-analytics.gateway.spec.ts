import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoMemberShowcaseAnalyticsGateway } from './demo-member-showcase-analytics.gateway';

describe('DemoMemberShowcaseAnalyticsGateway — MP-017', () => {
  it('produit des séries déterministes pour les trois périodes', async () => {
    const gateway = new DemoMemberShowcaseAnalyticsGateway();
    const week = await firstValueFrom(gateway.load({ period: '7d' }));
    const month = await firstValueFrom(gateway.load({ period: '30d' }));
    const quarter = await firstValueFrom(gateway.load({ period: '90d' }));

    expect(week.days).toHaveLength(7);
    expect(month.days).toHaveLength(30);
    expect(quarter.days).toHaveLength(90);
    expect(week.days.at(-1)?.date).toBe('2026-07-18');
    expect(week.privacyMode).toBe('ANONYMOUS_AGGREGATES_ONLY');
  });

  it('n’expose aucun identifiant visiteur et neutralise le suivi des contacts', async () => {
    const snapshot = await firstValueFrom(
      new DemoMemberShowcaseAnalyticsGateway().load({ period: '30d' }),
    );
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.days.every((day) => day.contactActions === 0)).toBe(true);
    expect(serialized).not.toMatch(/ip|cookie|email|phone|visitor|device|contactId|userId/i);
  });
});
