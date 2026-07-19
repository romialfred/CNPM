import { describe, expect, it } from 'vitest';
import { ADMIN_NAV } from './admin-nav';

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
      Reporting: '/admin/reporting',
      Administration: '/admin/security/users',
    });
  });

  it('conserve les rubriques non livrées comme indisponibles explicites', () => {
    const pending = ADMIN_NAV.filter((entry) => entry.pending);

    expect(pending.map((entry) => entry.label)).toEqual(['Reçus', 'Requêtes', 'Groupements']);
    expect(pending.map((entry) => entry.route)).toEqual([
      '/admin/receipts',
      '/admin/requests',
      '/admin/groups',
    ]);
  });
});
