import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoGroupsGateway } from './demo-groups.gateway';
import { GroupNotFoundError } from './groups-gateway';

describe('DemoGroupsGateway', () => {
  it('sert une pagination stable sur un registre fermé', async () => {
    const gateway = new DemoGroupsGateway();
    const first = await firstValueFrom(gateway.list({ page: 1, pageSize: 10 }));
    const second = await firstValueFrom(gateway.list({ page: 2, pageSize: 10 }));

    expect(first.totalItems).toBe(12);
    expect(first.rows).toHaveLength(10);
    expect(second.rows).toHaveLength(2);
    expect([...first.rows, ...second.rows].every((group) => group.code.startsWith('GRP-'))).toBe(
      true,
    );
    expect(
      [...first.rows, ...second.rows].every((group) =>
        /^(Groupement|Collectif|Réseau) /.test(group.name),
      ),
    ).toBe(true);
  });

  it('retourne la même fiche que la liste et refuse un identifiant absent', async () => {
    const gateway = new DemoGroupsGateway();
    const page = await firstValueFrom(gateway.list({ page: 1, pageSize: 10 }));
    await expect(firstValueFrom(gateway.get(page.rows[0].id))).resolves.toEqual(page.rows[0]);
    await expect(
      firstValueFrom(gateway.get('20000000-0000-4000-8000-999999999999')),
    ).rejects.toBeInstanceOf(GroupNotFoundError);
  });
});
