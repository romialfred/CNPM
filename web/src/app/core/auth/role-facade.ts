/**
 * Façade des rôles — les cinq rôles de la mission, projetés sur les vingt rôles
 * canoniques du dépôt (`docs/05-security/rbac-grants.csv`).
 *
 * IMPORTANT : c'est une lecture SIMPLIFIÉE, pas un modèle d'autorisation. Les vrais
 * droits restent portés par les rôles canoniques et vérifiés côté serveur (ADR-008) ;
 * réduire à cinq rôles ne retire aucune permission et ne contourne aucune séparation des
 * tâches. La façade sert seulement à présenter à l'écran un modèle lisible par un
 * non-technicien.
 *
 * Le regroupement ci-dessous est un choix de conception, non une règle officielle : il
 * est à valider (voir open-decisions, RBAC-DEC-001). Le modifier ne touche que l'affichage.
 */
export type RoleFacade =
  | 'SUPER_ADMIN'
  | 'ADMIN_CNPM'
  | 'RESPONSABLE_ORGANISATION'
  | 'MEMBRE_CNPM'
  | 'AUDITEUR';

export interface RoleFacadeInfo {
  readonly id: RoleFacade;
  readonly label: string;
  readonly description: string;
}

/** Ordonnés du plus large au plus restreint : un compte cumulant plusieurs rôles est
 *  présenté par sa façade la plus élevée. */
export const ROLE_FACADES: readonly RoleFacadeInfo[] = [
  {
    id: 'SUPER_ADMIN',
    label: 'Super administrateur',
    description: 'Accès complet au système, sécurité et exploitation.',
  },
  {
    id: 'ADMIN_CNPM',
    label: 'Administrateur CNPM',
    description: 'Gestion administrative et fonctionnelle globale de la plateforme.',
  },
  {
    id: 'RESPONSABLE_ORGANISATION',
    label: 'Responsable d’organisation',
    description: 'Gestion des informations et des membres de son périmètre.',
  },
  {
    id: 'MEMBRE_CNPM',
    label: 'Membre CNPM',
    description: 'Espace personnel : cotisations, requêtes et informations CNPM.',
  },
  {
    id: 'AUDITEUR',
    label: 'Auditeur',
    description: 'Lecture seule et accès aux journaux, sans droit d’écriture.',
  },
];

/**
 * Rattachement des vingt rôles canoniques aux cinq façades. Tout rôle non listé n'est
 * pas rattaché : le serveur reste la seule source de droits, la façade ne fabrique rien.
 */
const CANONICAL_TO_FACADE: Readonly<Record<string, RoleFacade>> = {
  SUPER_ADMIN_TECH: 'SUPER_ADMIN',
  ADMIN_SECURITE: 'SUPER_ADMIN',
  PRESTATAIRE_TECH: 'SUPER_ADMIN',

  ADMIN_FONCTIONNEL: 'ADMIN_CNPM',
  DIRECTION_GENERALE: 'ADMIN_CNPM',
  DIRECTION_FINANCIERE: 'ADMIN_CNPM',
  SECRETAIRE_GENERAL: 'ADMIN_CNPM',
  COMPTABLE: 'ADMIN_CNPM',
  CAISSIER: 'ADMIN_CNPM',
  AGENT_RECOUVREMENT: 'ADMIN_CNPM',
  COMMUNICATION: 'ADMIN_CNPM',
  JURIDIQUE: 'ADMIN_CNPM',
  VALIDATEUR_ENROLEMENT: 'ADMIN_CNPM',
  SUPPORT: 'ADMIN_CNPM',

  RESPONSABLE_GROUPEMENT: 'RESPONSABLE_ORGANISATION',
  REFERENT_GROUPEMENT: 'RESPONSABLE_ORGANISATION',
  MEMBRE_ADMIN: 'RESPONSABLE_ORGANISATION',

  MEMBRE_UTILISATEUR: 'MEMBRE_CNPM',

  AUDITEUR_INTERNE: 'AUDITEUR',
  AUDITEUR_EXTERNE: 'AUDITEUR',
};

/** Priorité d'affichage, du plus large au plus restreint. */
const FACADE_PRIORITY: readonly RoleFacade[] = [
  'SUPER_ADMIN',
  'ADMIN_CNPM',
  'RESPONSABLE_ORGANISATION',
  'MEMBRE_CNPM',
  'AUDITEUR',
];

/** Façade d'un rôle canonique, ou `null` s'il n'est rattaché à aucune. */
export function facadeOfRole(canonicalRole: string): RoleFacade | null {
  return CANONICAL_TO_FACADE[canonicalRole] ?? null;
}

/**
 * Façades distinctes d'un ensemble de rôles, ordonnées par priorité. Sert à présenter
 * simplement l'identité issue de `/auth/me`, dont les rôles sont les rôles canoniques.
 */
export function facadesOfRoles(roles: readonly string[]): readonly RoleFacade[] {
  const present = new Set<RoleFacade>();
  for (const role of roles) {
    const facade = facadeOfRole(role);
    if (facade) {
      present.add(facade);
    }
  }
  return FACADE_PRIORITY.filter((facade) => present.has(facade));
}

/** Façade la plus élevée d'un compte, celle qui le résume ; `null` si aucune ne s'applique. */
export function primaryFacade(roles: readonly string[]): RoleFacade | null {
  return facadesOfRoles(roles)[0] ?? null;
}

export function roleFacadeInfo(facade: RoleFacade): RoleFacadeInfo {
  // Non-null : `ROLE_FACADES` couvre l'union `RoleFacade` par construction.
  return ROLE_FACADES.find((info) => info.id === facade) as RoleFacadeInfo;
}
