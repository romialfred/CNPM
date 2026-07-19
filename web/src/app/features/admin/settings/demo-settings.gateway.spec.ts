import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoSettingsGateway } from './demo-settings.gateway';
import { ReferenceValueConflictError } from './settings-gateway';

describe('DemoSettingsGateway', () => {
  it('ne sert que des domaines explicitement fictifs et pagine le jeu fermé', async () => {
    const gateway = new DemoSettingsGateway();
    const page = await firstValueFrom(gateway.list({ domain: null, page: 1, pageSize: 2 }));

    expect(page.rows).toHaveLength(2);
    expect(page.totalItems).toBe(3);
    expect(page.totalPages).toBe(2);
    expect(page.rows.every((value) => value.domain.startsWith('DEMO_'))).toBe(true);
  });

  it('rejoue une création identique et refuse un contenu divergent sur la clé naturelle', async () => {
    const gateway = new DemoSettingsGateway();
    const input = {
      domain: 'DEMO_CLASSE_INTERNE',
      code: 'DEMO_STANDARD',
      label: 'Classe standard fictive',
      sortOrder: 10,
      active: true,
    };

    const replay = await firstValueFrom(gateway.create(input));
    expect(replay.id).toBe('33000000-0000-4000-8000-000000000001');

    await expect(
      firstValueFrom(gateway.create({ ...input, label: 'Contenu divergent fictif' })),
    ).rejects.toBeInstanceOf(ReferenceValueConflictError);
  });

  it('applique le verrou optimiste et incrémente la version', async () => {
    const gateway = new DemoSettingsGateway();
    const current = (
      await firstValueFrom(gateway.list({ domain: 'DEMO_USAGE_INTERNE', page: 1, pageSize: 20 }))
    ).rows[0];

    await expect(
      firstValueFrom(gateway.update(current.id, current.version - 1, { active: false })),
    ).rejects.toBeInstanceOf(ReferenceValueConflictError);

    const updated = await firstValueFrom(
      gateway.update(current.id, current.version, { label: 'Usage fictif révisé' }),
    );
    expect(updated).toMatchObject({
      label: 'Usage fictif révisé',
      version: current.version + 1,
      domain: current.domain,
      code: current.code,
    });

    const replay = await firstValueFrom(
      gateway.update(updated.id, updated.version, { label: updated.label }),
    );
    expect(replay.version).toBe(updated.version);
  });
});
