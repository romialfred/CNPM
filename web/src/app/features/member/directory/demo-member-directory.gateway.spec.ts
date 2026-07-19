import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoMemberDirectoryGateway } from './demo-member-directory.gateway';

describe('DemoMemberDirectoryGateway — MP-018', () => {
  it('filtre les organisations par secteur, zone et thème', async () => {
    const snapshot = await firstValueFrom(
      new DemoMemberDirectoryGateway().list({
        search: '',
        sector: 'AGRI',
        zone: 'ZONE_C',
        theme: 'LOGISTICS',
        sort: 'name',
      }),
    );

    expect(snapshot.visibility).toBe('PRIVATE_MEMBER');
    expect(snapshot.items).toHaveLength(2);
    expect(snapshot.items.every((item) => item.id.startsWith('directory-'))).toBe(true);
  });

  it('n’expose aucune coordonnée, URL ou donnée métier sensible', async () => {
    const snapshot = await firstValueFrom(
      new DemoMemberDirectoryGateway().list({ search: '', sort: 'name' }),
    );
    const serialized = JSON.stringify(snapshot);

    expect(serialized).not.toMatch(/@|https?:|telephone|phone|email|address|rccm|nif|contact/i);
    expect(Object.keys(snapshot.items[0])).toEqual([
      'id',
      'name',
      'sector',
      'zone',
      'sizeLabel',
      'summary',
      'themes',
    ]);
  });
});
