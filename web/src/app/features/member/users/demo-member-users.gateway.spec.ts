import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_MEMBER_USERS_GATEWAY } from '../unavailable-member-gateways';
import { DemoMemberUsersGateway } from './demo-member-users.gateway';
import type { MemberUserQuery } from './member-users-gateway';

const DEFAULT_QUERY: MemberUserQuery = {
  search: '',
  sort: 'displayLabel',
  direction: 'asc',
  page: 1,
  size: 5,
};

describe('DemoMemberUsersGateway — MP-014', () => {
  it('filtre, trie et pagine six métadonnées utilisateur déterministes', async () => {
    const gateway = new DemoMemberUsersGateway();
    const page = await firstValueFrom(gateway.list(DEFAULT_QUERY));
    expect(page.items).toHaveLength(5);
    expect(page.totalElements).toBe(6);
    expect(page.totalPages).toBe(2);
    expect(page.items[0]?.reference).toBe('CNPM-USR-0001');

    const inactive = await firstValueFrom(
      gateway.list({ ...DEFAULT_QUERY, status: 'INACTIVE' }),
    );
    expect(inactive.items.map((item) => item.reference)).toEqual([
      'CNPM-USR-0004',
      'CNPM-USR-0006',
    ]);

    const secondPage = await firstValueFrom(
      gateway.list({ ...DEFAULT_QUERY, page: 2, sort: 'lastActivityOn', direction: 'desc' }),
    );
    expect(secondPage.items).toHaveLength(1);
  });

  it('n’expose que des identités .example sans secret, session ou permission', async () => {
    const page = await firstValueFrom(new DemoMemberUsersGateway().list(DEFAULT_QUERY));
    const user = page.items[0];
    if (!user) throw new Error('Fixture utilisateur absente');
    expect(user.email).toMatch(/@sahel-agro\.example$/);
    expect(user.displayLabel).toMatch(/^Utilisateur /);
    expect(Object.keys(user)).not.toEqual(
      expect.arrayContaining([
        'keycloakSubject',
        'password',
        'mfaCredential',
        'permissions',
        'token',
        'sessionId',
        'ipAddress',
        'organizationId',
      ]),
    );
  });

  it('ferme le profil HTTP faute de projection MP-014 auto-scopée', async () => {
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_USERS_GATEWAY.list(DEFAULT_QUERY)),
    ).rejects.toMatchObject({ feature: 'MP-014' });
  });
});
