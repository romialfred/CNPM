import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoRecoveryGateway } from './demo-recovery.gateway';
import type { RecoveryQuery } from './recovery-gateway';

const ALL_CAMPAIGNS: RecoveryQuery = {
  tab: 'campaigns',
  search: '',
  channel: null,
  segment: null,
  status: null,
  sort: null,
  page: 1,
  pageSize: 50,
};

describe('DemoRecoveryGateway — composition BO-017', () => {
  it('livre des compteurs de diffusion cohérents sur chaque campagne', async () => {
    const page = await firstValueFrom(new DemoRecoveryGateway().search(ALL_CAMPAIGNS));
    expect(page.rows.kind).toBe('campaigns');
    if (page.rows.kind !== 'campaigns') return;

    for (const campaign of page.rows.items) {
      expect(campaign.delivered).toBeLessThanOrEqual(campaign.sent);
      expect(campaign.sent).toBeLessThanOrEqual(campaign.audience);
      expect(campaign.opened).toBeLessThanOrEqual(campaign.openable);
      expect(campaign.exclusions).toBeGreaterThanOrEqual(0);
      expect(campaign.estimatedCost).toBeGreaterThanOrEqual(0);
    }
  });

  it('conserve des destinations fictives ou masquées dans le journal', async () => {
    const page = await firstValueFrom(
      new DemoRecoveryGateway().search({ ...ALL_CAMPAIGNS, tab: 'deliveries' }),
    );
    expect(page.rows.kind).toBe('deliveries');
    if (page.rows.kind !== 'deliveries') return;

    expect(page.rows.items.length).toBeGreaterThan(0);
    for (const delivery of page.rows.items) {
      expect(delivery.destination.endsWith('.example') || delivery.destination.includes('•')).toBe(
        true,
      );
    }
  });
});
