import { describe, expect, it } from 'vitest';
import { memberRoutes } from './member.routes';

describe('memberRoutes', () => {
  it('expose MP-001 sur sa route canonique', () => {
    expect(memberRoutes[0]).toMatchObject({ path: 'home' });
    expect(memberRoutes[0]?.loadComponent).toBeTypeOf('function');
    expect(memberRoutes[0]?.providers).toHaveLength(2);
  });

  it('expose MP-002 et MP-003 sous une composition de données commune', () => {
    const route = memberRoutes.find((candidate) => candidate.path === 'contributions');
    expect(route?.providers).toHaveLength(2);
    expect(route?.children).toHaveLength(2);
    expect(route?.children?.[0]).toMatchObject({ path: '', pathMatch: 'full' });
    expect(route?.children?.[0]?.loadComponent).toBeTypeOf('function');
    expect(route?.children?.[1]).toMatchObject({ path: ':id' });
    expect(route?.children?.[1]?.loadComponent).toBeTypeOf('function');
  });
});
