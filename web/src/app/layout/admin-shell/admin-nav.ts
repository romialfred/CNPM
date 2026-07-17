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
  | 'administration';

export interface AdminNavEntry {
  readonly label: string;
  readonly route: string;
  readonly icon: AdminNavIconName;
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
  { label: 'Tableau de bord', route: '/admin/tableau-de-bord', icon: 'dashboard', pending: true },
  { label: 'Membres', route: '/admin/members', icon: 'members' },
  { label: 'Entreprises', route: '/admin/entreprises', icon: 'companies', pending: true },
  { label: 'Enrôlements', route: '/admin/enrolements', icon: 'enrolments', pending: true },
  { label: 'Cotisations', route: '/admin/cotisations', icon: 'contributions', pending: true },
  { label: 'Paiements', route: '/admin/paiements', icon: 'payments', pending: true },
  { label: 'Reçus', route: '/admin/recus', icon: 'receipts', pending: true },
  { label: 'Relances', route: '/admin/relances', icon: 'reminders', pending: true },
  { label: 'Requêtes', route: '/admin/requetes', icon: 'requests', pending: true },
  { label: 'Groupements', route: '/admin/groupements', icon: 'groups', pending: true },
  { label: 'Reporting', route: '/admin/reporting', icon: 'reporting', pending: true },
  { label: 'Administration', route: '/admin/administration', icon: 'administration', pending: true },
];
