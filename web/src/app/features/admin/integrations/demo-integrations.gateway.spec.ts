import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_INTEGRATIONS_GATEWAY } from '../unavailable-admin-gateways';
import { DemoIntegrationsGateway } from './demo-integrations.gateway';

describe('DemoIntegrationsGateway — BO-038', () => {
  it('livre des agrégats cohérents et des statuts explicites', async () => {
    const snapshot = await firstValueFrom(
      new DemoIntegrationsGateway().load({
        view: 'partners',
        health: 'all',
        direction: 'all',
        search: '',
      }),
    );

    expect(snapshot.partners).toHaveLength(4);
    expect(snapshot.summary.totalPartners).toBe(snapshot.totalPartners);
    expect(
      snapshot.summary.healthyPartners +
        snapshot.summary.attentionPartners +
        snapshot.summary.blockedPartners,
    ).toBe(snapshot.totalPartners);
    expect(snapshot.summary.events24h).toBe(
      snapshot.partners.reduce((sum, partner) => sum + partner.events24h, 0),
    );
    expect(snapshot.partners.every((partner) => partner.contractVersion.endsWith('-demo'))).toBe(
      true,
    );
  });

  it('ne transporte aucune URL, clé, identité, charge utile ou coordonnée externe', async () => {
    const snapshot = await firstValueFrom(
      new DemoIntegrationsGateway().load({
        view: 'journal',
        health: 'all',
        direction: 'all',
        search: '',
      }),
    );
    const serialized = JSON.stringify(snapshot).toLowerCase();

    expect(serialized).not.toContain('http://');
    expect(serialized).not.toContain('https://');
    expect(serialized).not.toContain('@');
    expect(serialized).not.toContain('token');
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('payload');
    expect(snapshot.logs.every((entry) => entry.correlationLabel.startsWith('DEMO-INT-'))).toBe(
      true,
    );
  });

  it('filtre à la source par état, sens et recherche sans diacritiques', async () => {
    const gateway = new DemoIntegrationsGateway();
    const degraded = await firstValueFrom(
      gateway.load({ view: 'partners', health: 'DEGRADED', direction: 'all', search: 'beta' }),
    );
    expect(degraded.partners.map((partner) => partner.name)).toEqual(['Paiement Sandbox Bêta']);

    const outbound = await firstValueFrom(
      gateway.load({ view: 'journal', health: 'all', direction: 'OUTBOUND', search: 'gamma' }),
    );
    expect(outbound.logs).toHaveLength(1);
    expect(outbound.logs[0].direction).toBe('OUTBOUND');
    expect(outbound.logs[0].outcome).toBe('BLOCKED');
  });

  it('échoue fermé en HTTP sans retomber sur les fixtures', async () => {
    await expect(
      firstValueFrom(
        UNAVAILABLE_INTEGRATIONS_GATEWAY.load({
          view: 'partners',
          health: 'all',
          direction: 'all',
          search: '',
        }),
      ),
    ).rejects.toMatchObject({
      name: 'UnavailableHttpFeatureError',
      feature: 'BO-038',
    });
  });
});
