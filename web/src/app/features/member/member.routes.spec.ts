import { describe, expect, it } from 'vitest';
import { memberRoutes } from './member.routes';

describe('memberRoutes', () => {
  it('expose MP-001 sur sa route canonique', () => {
    expect(memberRoutes[0]).toMatchObject({ path: 'member/home' });
    expect(memberRoutes[0]?.loadComponent).toBeTypeOf('function');
  });

  it('redirige l ancien chemin de démonstration vers MP-001', () => {
    expect(memberRoutes[1]).toMatchObject({
      path: 'espace-membre',
      pathMatch: 'full',
      redirectTo: 'member/home',
    });
  });
});
