import { describe, expect, it } from 'vitest';
import { memberRoutes } from './member.routes';

describe('memberRoutes', () => {
  it('expose MP-001 sur sa route canonique', () => {
    expect(memberRoutes[0]).toMatchObject({ path: 'home' });
    expect(memberRoutes[0]?.loadComponent).toBeTypeOf('function');
    expect(memberRoutes[0]?.providers).toHaveLength(2);
  });
});
