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

  it('expose MP-006, MP-004 puis MP-005 sous une composition de paiement fermée en HTTP', () => {
    const route = memberRoutes.find((candidate) => candidate.path === 'payments');
    expect(route?.providers).toHaveLength(2);
    expect(route?.children?.map((child) => child.path)).toEqual(['', 'new', ':id/status']);
    expect(route?.children?.[0]).toMatchObject({ path: '', pathMatch: 'full' });
    expect(route?.children?.every((child) => child.loadComponent)).toBe(true);
    expect(route?.canActivate).toBeUndefined();
  });

  it('expose MP-007 et MP-008 sous une composition de données commune', () => {
    const route = memberRoutes.find((candidate) => candidate.path === 'receipts');
    expect(route?.providers).toHaveLength(2);
    expect(route?.children).toHaveLength(2);
    expect(route?.children?.map((child) => child.path)).toEqual(['', ':id']);
    expect(route?.children?.[0]?.loadComponent).toBeTypeOf('function');
    expect(route?.children?.[1]?.loadComponent).toBeTypeOf('function');
  });

  it('expose MP-009, MP-010 et MP-011 sans confondre new avec un identifiant', () => {
    const route = memberRoutes.find((candidate) => candidate.path === 'requests');
    expect(route?.providers).toHaveLength(2);
    expect(route?.children).toHaveLength(3);
    expect(route?.children?.map((child) => child.path)).toEqual(['', 'new', ':id']);
    expect(route?.children?.[0]?.loadComponent).toBeTypeOf('function');
    expect(route?.children?.[1]?.canDeactivate).toHaveLength(1);
    expect(route?.children?.[1]?.loadComponent).toBeTypeOf('function');
    expect(route?.children?.[2]?.loadComponent).toBeTypeOf('function');
  });

  it('expose MP-012 en lecture seule sans garde membre fictive', () => {
    const route = memberRoutes.find((candidate) => candidate.path === 'documents');
    expect(route?.providers).toHaveLength(2);
    expect(route?.loadComponent).toBeTypeOf('function');
    expect(route?.canActivate).toBeUndefined();
    expect(route?.children).toBeUndefined();
  });

  it.each([
    ['profile', 'MP-013'],
    ['users', 'MP-014'],
  ])('expose %s (%s) en lecture seule sans garde membre fictive', (path) => {
    const route = memberRoutes.find((candidate) => candidate.path === path);
    expect(route?.providers).toHaveLength(2);
    expect(route?.loadComponent).toBeTypeOf('function');
    expect(route?.canActivate).toBeUndefined();
    expect(route?.children).toBeUndefined();
  });

  it('expose MP-015 à MP-017 sous une composition locale commune et sans garde factice', () => {
    const route = memberRoutes.find((candidate) => candidate.path === 'showcase');
    expect(route?.providers).toHaveLength(4);
    expect(route?.children?.map((child) => child.path)).toEqual([
      '',
      'edit',
      'preview',
      'analytics',
    ]);
    // Sans ce repli, /member/showcase rendait une page blanche.
    expect(route?.children?.[0]).toMatchObject({ pathMatch: 'full', redirectTo: 'edit' });
    expect(route?.children?.slice(1).every((child) => child.loadComponent)).toBe(true);
    expect(route?.canActivate).toBeUndefined();
  });

  it('expose MP-018 sous une composition locale dédiée et sans garde factice', () => {
    const route = memberRoutes.find((candidate) => candidate.path === 'directory');
    expect(route?.providers).toHaveLength(2);
    expect(route?.loadComponent).toBeTypeOf('function');
    expect(route?.canActivate).toBeUndefined();
    expect(route?.children).toBeUndefined();
  });

  it('expose « Le CNPM » comme écran présentationnel, sans passerelle ni fixture', () => {
    const route = memberRoutes.find((candidate) => candidate.path === 'cnpm');
    expect(route?.loadComponent).toBeTypeOf('function');
    // Page institutionnelle sans données membre : aucune passerelle composée, aucun enfant.
    expect(route?.providers).toBeUndefined();
    expect(route?.children).toBeUndefined();
    expect(route?.canActivate).toBeUndefined();
  });

  it('rend /member sur un écran plutôt que sur un corps vide', () => {
    // Défaut constaté en exécution : sans route de repli, /member ne correspondait à
    // aucune route et rendait un document entièrement vide — ni coquille, ni message.
    // Le '**' racine ne rattrape pas ce cas, le préfixe 'member' étant déjà consommé.
    const fallback = memberRoutes.find((candidate) => candidate.path === '');
    expect(fallback).toMatchObject({ pathMatch: 'full', redirectTo: 'home' });
    // Le repli doit rester en dernier : place plus haut, il capterait le catalogue.
    expect(memberRoutes.indexOf(fallback!)).toBe(memberRoutes.length - 1);
  });

  it('donne une destination par défaut à chaque groupe de routes enfants', () => {
    // Tout groupe exposant des enfants doit rendre quelque chose sur son propre chemin,
    // sinon l'URL du groupe est une impasse blanche.
    for (const route of memberRoutes.filter((candidate) => candidate.children?.length)) {
      const children = route.children ?? [];
      const byDefault = children.find((child) => child.path === '');
      expect(
        byDefault,
        `le groupe « ${route.path} » n'a aucune destination par défaut`,
      ).toBeDefined();
      expect(byDefault?.pathMatch).toBe('full');
      expect(Boolean(byDefault?.redirectTo || byDefault?.loadComponent)).toBe(true);
    }
  });
});
