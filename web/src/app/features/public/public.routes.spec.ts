import { describe, expect, it } from 'vitest';
import { publicRoutes, showcaseRoutes } from './public.routes';

describe('publicRoutes', () => {
  it('déclare les parcours publics avant la route d’accueil vide', () => {
    expect(publicRoutes.map((route) => route.path)).toEqual([
      'adhesion',
      'verification/:code',
      'le-cnpm',
      'services',
      'actualites',
      'agenda',
      'contact',
      'legal/:document',
      '',
    ]);
    const enrollment = publicRoutes.find((route) => route.path === 'adhesion');
    const verification = publicRoutes.find((route) => route.path === 'verification/:code');
    const news = publicRoutes.find((route) => route.path === 'actualites');
    const agenda = publicRoutes.find((route) => route.path === 'agenda');

    expect(enrollment?.providers).toBeDefined();
    expect(enrollment?.children?.map((route) => route.path)).toEqual(['confirmation', '']);
    expect(enrollment?.children?.[1]?.canDeactivate).toBeDefined();
    expect(verification?.providers).toBeDefined();
    expect(news?.children?.map((route) => route.path)).toEqual(['', ':slug']);
    expect(news?.providers).toBeDefined();
    expect(agenda?.providers).toBeDefined();
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
