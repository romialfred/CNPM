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
  | 'documents'
  | 'groups'
  | 'showcases'
  | 'integrations'
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

export interface AdminNavGroup {
  /** Identifiant stable : il sert de base aux liaisons ARIA du dépliant. */
  readonly id: string;
  readonly label: string;
  readonly icon: AdminNavIconName;
  readonly entries: readonly AdminNavEntry[];
}

export type AdminNavNode =
  | { readonly kind: 'link'; readonly entry: AdminNavEntry }
  | { readonly kind: 'group'; readonly group: AdminNavGroup };

/**
 * Rubriques de la navigation d'administration, regroupées par domaine.
 *
 * Dix-sept destinations alignées à plat demandaient de parcourir toute la colonne pour
 * trouver un écran. Elles sont désormais réunies en cinq domaines, « Tableau de bord »
 * restant hors groupe puisqu'il s'atteint en un clic.
 *
 * Deux rattachements méritent leur justification. « Enrôlements » rejoint le répertoire
 * parce qu'il en constitue l'entrée, non un flux financier. « Intégrations » rejoint la
 * supervision parce que sa permission réelle est `OPS.MONITOR.READ` — c'est une lecture
 * de la permission déjà déclarée, pas une règle métier inventée.
 *
 * Le pictogramme est désigné par un nom du domaine, pas par le composant Lucide : la
 * correspondance vit dans `AdminNavIconComponent`, seul endroit à changer si UX-DEC-009
 * écarte Lucide. Les groupes réemploient des noms déjà mappés, aucun n'est ajouté.
 */
export const ADMIN_NAV_TREE: readonly AdminNavNode[] = [
  {
    kind: 'link',
    entry: { label: 'Tableau de bord', route: '/admin/dashboard', icon: 'dashboard' },
  },
  {
    kind: 'group',
    group: {
      id: 'repertoire',
      label: 'Répertoire',
      icon: 'members',
      entries: [
        { label: 'Membres', route: '/admin/members', icon: 'members' },
        { label: 'Entreprises', route: '/admin/organizations', icon: 'companies' },
        {
          label: 'Groupements',
          route: '/admin/groups',
          icon: 'groups',
          requiredPermission: 'GROUP.READ',
        },
        { label: 'Enrôlements', route: '/admin/enrollments', icon: 'enrolments' },
      ],
    },
  },
  {
    kind: 'group',
    group: {
      id: 'recouvrement',
      label: 'Cotisations et recouvrement',
      icon: 'contributions',
      entries: [
        { label: 'Cotisations', route: '/admin/contributions', icon: 'contributions' },
        { label: 'Paiements', route: '/admin/payments/reconciliation', icon: 'payments' },
        { label: 'Reçus', route: '/admin/receipts', icon: 'receipts' },
        { label: 'Relances', route: '/admin/recovery/campaigns', icon: 'reminders' },
      ],
    },
  },
  {
    kind: 'group',
    group: {
      id: 'relation',
      label: 'Relation membre',
      icon: 'requests',
      entries: [
        { label: 'Requêtes', route: '/admin/requests', icon: 'requests' },
        {
          label: 'Documents',
          route: '/admin/documents',
          icon: 'documents',
          requiredPermission: 'DOCUMENT.READ',
        },
        {
          label: 'Vitrines',
          route: '/admin/showcases/moderation',
          icon: 'showcases',
          requiredPermission: 'SHOWCASE.MODERATION.READ',
        },
      ],
    },
  },
  {
    kind: 'group',
    group: {
      id: 'supervision',
      label: 'Supervision',
      icon: 'reporting',
      entries: [
        { label: 'Reporting', route: '/admin/reporting', icon: 'reporting' },
        {
          label: 'Audit',
          route: '/admin/security/audit',
          icon: 'audit',
          requiredPermission: 'AUDIT.READ',
        },
        {
          label: 'Intégrations',
          route: '/admin/integrations',
          icon: 'integrations',
          requiredPermission: 'OPS.MONITOR.READ',
        },
      ],
    },
  },
  {
    kind: 'group',
    group: {
      id: 'administration',
      label: 'Administration',
      icon: 'administration',
      entries: [
        {
          label: 'Paramétrage',
          route: '/admin/settings',
          icon: 'settings',
          requiredPermission: 'ADMIN.REFERENTIAL.READ',
        },
        { label: 'Administration', route: '/admin/security/users', icon: 'administration' },
      ],
    },
  },
];

/**
 * Liste plate, DÉRIVÉE de l'arbre et jamais réécrite à la main.
 *
 * C'est ce qui garantit qu'aucune destination n'est perdue ni dupliquée au regroupement :
 * les deux représentations ne peuvent pas diverger.
 */
export const ADMIN_NAV: readonly AdminNavEntry[] = ADMIN_NAV_TREE.flatMap((node) =>
  node.kind === 'link' ? [node.entry] : node.group.entries,
);

/** Filtrage d'affordance uniquement ; le backend garde chaque opération. */
export function visibleAdminNav(permissions: readonly string[]): readonly AdminNavEntry[] {
  return ADMIN_NAV.filter(
    (entry) => !entry.requiredPermission || permissions.includes(entry.requiredPermission),
  );
}

/**
 * Même filtrage, en conservant les groupes.
 *
 * Un groupe n'a pas de permission propre : il hérite de ce que ses entrées laissent
 * passer. Un groupe vidé de toutes ses entrées n'est pas rendu — une section vide est
 * un titre qui ne mène nulle part.
 */
export function visibleAdminNavTree(permissions: readonly string[]): readonly AdminNavNode[] {
  const autorise = (entry: AdminNavEntry) =>
    !entry.requiredPermission || permissions.includes(entry.requiredPermission);

  return ADMIN_NAV_TREE.flatMap((node): readonly AdminNavNode[] => {
    if (node.kind === 'link') {
      return autorise(node.entry) ? [node] : [];
    }
    const entries = node.group.entries.filter(autorise);
    return entries.length ? [{ kind: 'group', group: { ...node.group, entries } }] : [];
  });
}

/** Groupe contenant une route donnée — sert à déplier celui de l'écran ouvert. */
export function adminNavGroupOfRoute(route: string): string | undefined {
  for (const node of ADMIN_NAV_TREE) {
    if (node.kind === 'group' && node.group.entries.some((entry) => entry.route === route)) {
      return node.group.id;
    }
  }
  return undefined;
}
