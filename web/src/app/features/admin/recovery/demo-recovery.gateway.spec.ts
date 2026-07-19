import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoRecoveryGateway } from './demo-recovery.gateway';
import type {
  RecoveryActionsQuery,
  RecoveryPortfolioQuery,
  RecoveryQuery,
} from './recovery-gateway';

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

const ALL_ACTIONS: RecoveryActionsQuery = {
  search: '',
  kind: null,
  status: null,
  suspension: null,
  sort: { key: 'scheduledAt', direction: 'asc' },
  page: 1,
  pageSize: 25,
};

const ALL_PORTFOLIO: RecoveryPortfolioQuery = {
  search: '',
  status: null,
  suspension: null,
  segment: null,
  sort: { key: 'nextActionAt', direction: 'asc' },
  page: 1,
  pageSize: 25,
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

  it('conserve des destinations masquées dans le journal', async () => {
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

  it('livre une file BO-019 masquée et non exécutable', async () => {
    const page = await firstValueFrom(new DemoRecoveryGateway().searchActions(ALL_ACTIONS));

    expect(page.items).toHaveLength(8);
    expect(page.overview.total).toBe(8);
    for (const action of page.items) {
      expect(action.organization).toContain('Organisation');
      expect(action.contactDisclosure).toBe('Contact masqué');
      expect(action.executionAvailable).toBe(false);
      expect(JSON.stringify(action)).not.toMatch(/@|mailto:|tel:|https?:\/\/|\+223/i);
      if (action.suspension) expect(action.suspension.suspendedAt).toBeTruthy();
      if (action.suspension?.kind === 'PROMISE') {
        expect(action.promise?.amount).toBeGreaterThan(0);
        expect(action.promise?.dueDate).toBeTruthy();
        expect(action.promise?.comment).toBeTruthy();
        expect(action.promise?.status).toBe('PENDING');
      }
    }
  });

  it('filtre les suspensions et pagine la file sans perdre les compteurs globaux', async () => {
    const page = await firstValueFrom(
      new DemoRecoveryGateway().searchActions({
        ...ALL_ACTIONS,
        suspension: 'PROMISE',
        pageSize: 1,
      }),
    );

    expect(page.items).toHaveLength(1);
    expect(page.totalItems).toBe(2);
    expect(page.items[0]?.suspension?.kind).toBe('PROMISE');
    expect(page.overview.total).toBe(8);
  });

  it('livre le portefeuille BO-020 sans contact divulgué ni score individuel', async () => {
    const page = await firstValueFrom(new DemoRecoveryGateway().searchPortfolio(ALL_PORTFOLIO));

    expect(page.items).toHaveLength(8);
    expect(page.overview.assignedCases).toBe(8);
    expect(page.overview.contactRate).toBe(42.5);
    for (const item of page.items) {
      expect(item.organization).toContain('Organisation');
      expect(item.contactDisclosure).toBe('Contact masqué');
      expect(JSON.stringify(item)).not.toMatch(/score|@|mailto:|tel:|https?:\/\/|\+223/i);
      if (item.status === 'SUSPENDED') expect(item.suspension?.suspendedAt).toBeTruthy();
    }
  });
});
