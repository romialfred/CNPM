import { describe, expect, it } from 'vitest';
import { publicRoutes, showcaseRoutes } from './public.routes';

describe('publicRoutes', () => {
  it('déclare PUB-009/PUB-010/PUB-011 avant la route d’accueil vide', () => {
    expect(publicRoutes.map((route) => route.path)).toEqual([
      'le-cnpm',
      'services',
      'actualites',
      'agenda',
      '',
    ]);
    expect(publicRoutes[2]?.children?.map((route) => route.path)).toEqual(['', ':slug']);
    expect(publicRoutes[2]?.providers).toBeDefined();
    expect(publicRoutes[3]?.providers).toBeDefined();
  });
});

describe('showcaseRoutes', () => {
  it('place les routes PUB-004/PUB-005/PUB-007/PUB-008 avant le slug PUB-006', () => {
    const children = showcaseRoutes[0]?.children ?? [];

    expect(showcaseRoutes[0]?.path).toBe('');
    expect(children.map((route) => route.path)).toEqual([
      '',
      'recherche',
      ':slug/activites',
      ':slug/realisations/:id',
      ':slug',
    ]);
    expect(children[0]?.data?.['mode']).toBe('directory');
    expect(children[1]?.data?.['mode']).toBe('search');
    expect(children[2]?.data?.['mode']).toBe('activities');
    expect(children[3]?.data?.['mode']).toBe('project');
    expect(showcaseRoutes[0]?.providers).toBeDefined();
  });
});
