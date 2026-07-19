export type AdminNavIconName =
  | 'dashboard'
  | 'members'
  | 'companies'
  | 'enrolments'
  | 'contributions'
  | 'payments'
  | 'receipts'
  | 'reminders'
  | 'requests'
  | 'groups'
  | 'reporting'
  | 'audit'
  | 'settings'
  | 'administration';

export interface AdminNavEntry {
  readonly label: string;
  readonly route: string;
  readonly icon: AdminNavIconName;
  /** Permission fonctionnelle requise pour exposer la destination dans le shell. */
  readonly requiredPermission?: string;
  /**
   * Rubrique déclarée mais non encore livrée. L'entrée reste visible — la navigation
   * est la carte du produit — et annonce son indisponibilité au lieu de conduire vers
   * une page morte.
   */
  readonly pending?: boolean;
}

/**
 * Rubriques de la navigation d'administration.
 *
 * L'ordre et les libellés proviennent de la maquette `ref-bo-002-members-list.png`.
 * Le pictogramme est désigné par un nom du domaine, pas par le composant Lucide :
 * la correspondance vit dans `AdminNavIconComponent`, seul endroit à changer si
 * UX-DEC-009 écarte Lucide.
 */
export const ADMIN_NAV: readonly AdminNavEntry[] = [
  { label: 'Tableau de bord', route: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Membres', route: '/admin/members', icon: 'members' },
  { label: 'Entreprises', route: '/admin/organizations', icon: 'companies' },
  { label: 'Enrôlements', route: '/admin/enrollments', icon: 'enrolments' },
  { label: 'Cotisations', route: '/admin/contributions', icon: 'contributions' },
  { label: 'Paiements', route: '/admin/payments/reconciliation', icon: 'payments' },
  { label: 'Reçus', route: '/admin/receipts', icon: 'receipts', pending: true },
  { label: 'Relances', route: '/admin/recovery/campaigns', icon: 'reminders' },
  { label: 'Requêtes', route: '/admin/requests', icon: 'requests' },
  {
    label: 'Groupements',
    route: '/admin/groups',
    icon: 'groups',
    requiredPermission: 'GROUP.READ',
  },
  { label: 'Reporting', route: '/admin/reporting', icon: 'reporting' },
  {
    label: 'Audit',
    route: '/admin/security/audit',
    icon: 'audit',
    requiredPermission: 'AUDIT.READ',
  },
  {
    label: 'Paramétrage',
    route: '/admin/settings',
    icon: 'settings',
    requiredPermission: 'ADMIN.REFERENTIAL.READ',
  },
  { label: 'Administration', route: '/admin/security/users', icon: 'administration' },
];

/** Filtrage d'affordance uniquement ; le backend garde chaque opération. */
export function visibleAdminNav(permissions: readonly string[]): readonly AdminNavEntry[] {
  return ADMIN_NAV.filter(
    (entry) => !entry.requiredPermission || permissions.includes(entry.requiredPermission),
  );
}
