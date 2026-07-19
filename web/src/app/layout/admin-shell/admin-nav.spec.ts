import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ADMIN_NAV, visibleAdminNav } from './admin-nav';
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
      Administration: '/admin/security/users',
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

  it('expose BO-038 à la persona démo sans lui accorder de permission d’écriture', async () => {
    const identity = await firstValueFrom(new DemoSessionGateway().identity);
    expect(identity?.permissions).toContain('OPS.MONITOR.READ');
    expect(
      identity?.permissions.filter((permission) => permission.startsWith('INTEGRATION.')),
    ).toEqual([]);
    expect(
      visibleAdminNav(identity?.permissions ?? []).some(
        (entry) => entry.route === '/admin/integrations',
      ),
    ).toBe(true);
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
