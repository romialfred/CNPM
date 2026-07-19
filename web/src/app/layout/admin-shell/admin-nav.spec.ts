import { describe, expect, it } from 'vitest';
import { ADMIN_NAV, visibleAdminNav } from './admin-nav';

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
      Relances: '/admin/recovery/campaigns',
      Groupements: '/admin/groups',
      Reporting: '/admin/reporting',
      Administration: '/admin/security/users',
    });
  });

  it('conserve les rubriques non livrées comme indisponibles explicites', () => {
    const pending = ADMIN_NAV.filter((entry) => entry.pending);

    expect(pending.map((entry) => entry.label)).toEqual(['Reçus', 'Requêtes']);
    expect(pending.map((entry) => entry.route)).toEqual(['/admin/receipts', '/admin/requests']);
  });

  it('n’expose Groupements qu’avec GROUP.READ', () => {
    expect(visibleAdminNav([]).some((entry) => entry.route === '/admin/groups')).toBe(false);
    expect(visibleAdminNav(['GROUP.READ']).some((entry) => entry.route === '/admin/groups')).toBe(
      true,
    );
  });
});
