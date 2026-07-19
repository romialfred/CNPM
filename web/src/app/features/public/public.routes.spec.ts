import { describe, expect, it } from 'vitest';
import { showcaseRoutes } from './public.routes';

describe('showcaseRoutes', () => {
  it('place les routes statiques PUB-004/PUB-005 avant le slug PUB-006', () => {
    const children = showcaseRoutes[0]?.children ?? [];

    expect(showcaseRoutes[0]?.path).toBe('');
    expect(children.map((route) => route.path)).toEqual(['', 'recherche', ':slug']);
    expect(children[0]?.data?.['mode']).toBe('directory');
    expect(children[1]?.data?.['mode']).toBe('search');
    expect(showcaseRoutes[0]?.providers).toBeDefined();
  });
});
