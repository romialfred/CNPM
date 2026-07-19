import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoShowcaseModerationGateway } from './demo-showcase-moderation.gateway';

describe('DemoShowcaseModerationGateway', () => {
  it('ne livre que des projections fictives sans contact ni média', async () => {
    const result = await firstValueFrom(new DemoShowcaseModerationGateway().loadQueue());
    const serialized = JSON.stringify(result);

    expect(result.items).toHaveLength(2);
    expect(result.items.every((item) => item.demonstrationReference.startsWith('DEMO-'))).toBe(
      true,
    );
    expect(result.items.every((item) => item.organizationLabel.includes('Démo'))).toBe(true);
    expect(
      result.items.every(
        (item) =>
          item.proposedVersion.mediaPresentation === 'PLACEHOLDER_ONLY' &&
          item.proposedVersion.publicContactPresentation === 'MASKED_NO_CONSENT',
      ),
    ).toBe(true);
    expect(serialized).not.toMatch(/@|https?:|\+223|telephone|téléphone|mediaUrl|imageUrl/i);
  });

  it('retourne une copie indépendante de la file', async () => {
    const gateway = new DemoShowcaseModerationGateway();
    const first = await firstValueFrom(gateway.loadQueue());
    const second = await firstValueFrom(gateway.loadQueue());

    expect(first).toEqual(second);
    expect(first.items).not.toBe(second.items);
    expect(first.items[0]).not.toBe(second.items[0]);
    expect(first.items[0]?.checks).not.toBe(second.items[0]?.checks);
  });
});
