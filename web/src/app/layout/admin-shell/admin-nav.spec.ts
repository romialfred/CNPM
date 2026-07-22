import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_NAV,
  ADMIN_NAV_TREE,
  adminNavGroupOfRoute,
  visibleAdminNav,
  visibleAdminNavTree,
} from './admin-nav';
import { DemoSessionGateway } from './demo-session.gateway';

describe('ADMIN_NAV', () => {
  it('pointe chaque écran livré vers sa route canonique', () => {
    const delivered = new Map(
      ADMIN_NAV.filter((entry) => !entry.pending).map((entry) => [entry.label, entry.route]),
    );

    expect(Object.fromEntries(delivered)).toEqual({
      'Tableau de bord': '/admin/dashboard',
      Membres: '/admin/members',
      Entreprises: '/admin/organizations',
      Enrôlements: '/admin/enrollments',
      Cotisations: '/admin/contributions',
      Paiements: '/admin/payments/reconciliation',
      Reçus: '/admin/receipts',
      Relances: '/admin/recovery/campaigns',
      Requêtes: '/admin/requests',
      Documents: '/admin/documents',
      Groupements: '/admin/groups',
      Vitrines: '/admin/showcases/moderation',
      Intégrations: '/admin/integrations',
      Reporting: '/admin/reporting',
      Audit: '/admin/security/audit',
      Paramétrage: '/admin/settings',
      'Gestion des utilisateurs': '/admin/security/users',
    });
  });

  it('conserve les rubriques non livrées comme indisponibles explicites', () => {
    const pending = ADMIN_NAV.filter((entry) => entry.pending);

    expect(pending).toEqual([]);
  });

  it('n’expose Groupements qu’avec GROUP.READ', () => {
    expect(visibleAdminNav([]).some((entry) => entry.route === '/admin/groups')).toBe(false);
    expect(visibleAdminNav(['GROUP.READ']).some((entry) => entry.route === '/admin/groups')).toBe(
      true,
    );
  });

  it('n’expose Documents qu’avec DOCUMENT.READ', () => {
    expect(visibleAdminNav([]).some((entry) => entry.label === 'Documents')).toBe(false);
    expect(visibleAdminNav(['DOCUMENT.READ']).some((entry) => entry.label === 'Documents')).toBe(
      true,
    );
  });

  it('n’expose la modération des vitrines qu’avec la permission du brouillon R4', () => {
    expect(visibleAdminNav([]).some((entry) => entry.label === 'Vitrines')).toBe(false);
    expect(
      visibleAdminNav(['SHOWCASE.MODERATION.READ']).some((entry) => entry.label === 'Vitrines'),
    ).toBe(true);
  });

  it('n’expose la supervision des intégrations qu’avec OPS.MONITOR.READ', () => {
    expect(visibleAdminNav([]).some((entry) => entry.label === 'Intégrations')).toBe(false);
    expect(
      visibleAdminNav(['OPS.MONITOR.READ']).some((entry) => entry.label === 'Intégrations'),
    ).toBe(true);
  });

  it('donne à la persona démo (propriétaire) un accès complet couvrant toutes les rubriques', async () => {
    const identity = await firstValueFrom(new DemoSessionGateway().identity);
    // Profil propriétaire de la démonstration : accès complet (tout le catalogue).
    expect(identity?.permissions).toContain('OPS.MONITOR.READ');
    expect(identity?.permissions.length).toBeGreaterThan(60);
    // Toutes les rubriques gouvernées par une permission sont visibles.
    const routes = visibleAdminNav(identity?.permissions ?? []).map((entry) => entry.route);
    expect(routes).toContain('/admin/integrations');
    expect(routes).toContain('/admin/security/audit');
  });

  it('filtre les rubriques sensibles selon la projection de permissions', () => {
    expect(visibleAdminNav([]).map((entry) => entry.route)).not.toContain('/admin/security/audit');
    expect(visibleAdminNav([]).map((entry) => entry.route)).not.toContain('/admin/settings');

    const routes = visibleAdminNav(['AUDIT.READ', 'ADMIN.REFERENTIAL.READ']).map(
      (entry) => entry.route,
    );
    expect(routes).toContain('/admin/security/audit');
    expect(routes).toContain('/admin/settings');
  });
});

describe('ADMIN_NAV_TREE', () => {
  it('ne perd ni ne duplique aucune destination au regroupement', () => {
    const dansArbre = ADMIN_NAV_TREE.flatMap((node) =>
      node.kind === 'link' ? [node.entry.route] : node.group.entries.map((entry) => entry.route),
    );

    // La liste plate est DERIVEE de l'arbre : les deux representations ne peuvent pas
    // diverger, et ce test le constate plutot que de le supposer.
    expect(dansArbre).toEqual(ADMIN_NAV.map((entry) => entry.route));
    expect(new Set(dansArbre).size).toBe(dansArbre.length);
    expect(dansArbre).toHaveLength(17);
  });

  it('garde le tableau de bord hors groupe, donc a un seul clic', () => {
    const premier = ADMIN_NAV_TREE[0];

    expect(premier.kind).toBe('link');
    expect(premier.kind === 'link' && premier.entry.route).toBe('/admin/dashboard');
  });

  it('retire un groupe vide plutot que d afficher un titre sans destination', () => {
    // Sans aucune permission, « Relation membre » ne conserve que Requetes ; les deux
    // autres entrees tombent. Le groupe subsiste donc, mais allege.
    const sansPermission = visibleAdminNavTree([]);
    const relation = sansPermission.find(
      (node) => node.kind === 'group' && node.group.id === 'relation',
    );

    expect(relation?.kind).toBe('group');
    expect(relation?.kind === 'group' && relation.group.entries.map((e) => e.label)).toEqual([
      'Requêtes',
    ]);

    // Chaque groupe rendu porte au moins une destination.
    for (const node of sansPermission) {
      if (node.kind === 'group') {
        expect(node.group.entries.length).toBeGreaterThan(0);
      }
    }
  });

  it('applique les permissions a l entree, jamais au groupe', () => {
    const avec = visibleAdminNavTree(['SHOWCASE.MODERATION.READ', 'DOCUMENT.READ']);
    const relation = avec.find((node) => node.kind === 'group' && node.group.id === 'relation');

    expect(relation?.kind === 'group' && relation.group.entries.map((e) => e.label)).toEqual([
      'Requêtes',
      'Documents',
      'Vitrines',
    ]);
  });

  it('retrouve le groupe d une route, pour deplier celui de l ecran ouvert', () => {
    expect(adminNavGroupOfRoute('/admin/reporting')).toBe('supervision');
    expect(adminNavGroupOfRoute('/admin/members')).toBe('repertoire');
    // Le tableau de bord n'appartient a aucun groupe.
    expect(adminNavGroupOfRoute('/admin/dashboard')).toBeUndefined();
  });
});
