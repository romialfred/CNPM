import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Port de l'écran BO-030 — Administration et sécurité.
 *
 * L'écran ne connaît ni transport ni règle : il demande un instantané et l'affiche.
 * Remplacer l'adaptateur de démonstration par l'adaptateur HTTP réel ne touchera que
 * le point d'assemblage des routes, jamais la page.
 *
 * Aucun secret ne transite par ce port : ni mot de passe, ni jeton, ni code à usage
 * unique, ni empreinte de session. C'est un critère d'acceptation de la fiche
 * (« Aucun secret ou jeton n'est affiché ») et il se tient d'abord dans le contrat,
 * pas seulement dans le gabarit — un champ qui n'existe pas ne peut pas fuiter.
 */

/** Sections de l'écran. L'onglet actif vit dans l'URL : la vue reste partageable. */
export type SecurityTabId = 'comptes' | 'roles' | 'sessions' | 'audit';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED';

/**
 * État du second facteur. `PENDING` est distinct de `DISABLED` : un compte invité
 * dont l'inscription 2FA n'est pas terminée n'est pas un compte qui a désactivé sa
 * protection. Les confondre ferait relancer le mauvais flux.
 */
export type TwoFactorStatus = 'ENABLED' | 'PENDING' | 'DISABLED';

export interface SecurityAccount {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly roleId: string;
  readonly roleLabel: string;
  /** Nature du compte ; défaut PROFESSIONAL pour les comptes historiques. */
  readonly accountType?: AccountType;
  /** Champs de profil facultatifs, renseignés à la création. */
  readonly phone?: string;
  readonly jobTitle?: string;
  readonly organization?: string;
  readonly department?: string;
  readonly status: AccountStatus;
  readonly twoFactor: TwoFactorStatus;
  /**
   * Horodatage ISO 8601, porté par l'attribut `datetime` — lisible par la machine.
   * `null` lorsque le compte ne s'est jamais connecté : ce n'est pas une date zéro.
   */
  readonly lastLoginAt: string | null;
  /**
   * Libellé fr-ML déjà formaté par la source.
   *
   * Le formatage est fait à la source et non par un pipe : le rendu doit être
   * identique quel que soit le fuseau de la machine qui affiche, faute de quoi les
   * captures de régression visuelle divergeraient d'un poste à l'autre.
   */
  readonly lastLoginLabel: string | null;
  /** Sessions ouvertes rattachées au compte ; jamais un identifiant de session. */
  readonly activeSessions: number;
}

export interface SecurityRole {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly accounts: number;
}

/** Autorisation d'un rôle sur une permission. Lecture seule dans cet écran. */
export interface PermissionGrant {
  readonly roleId: string;
  readonly roleLabel: string;
  readonly granted: boolean;
}

export interface PermissionRow {
  readonly id: string;
  readonly label: string;
  /** Domaine fonctionnel, pour situer la permission sans ouvrir la documentation. */
  readonly domain: string;
  /**
   * Cellules déjà ordonnées comme `roles`.
   *
   * La source livre l'ordre : l'écran n'a ainsi aucune table d'index à tenir, et une
   * colonne ne peut pas se décaler d'une cellule — un décalage silencieux ferait lire
   * les droits d'un rôle sous le nom d'un autre.
   */
  readonly grants: readonly PermissionGrant[];
}

export type SessionStatus = 'ACTIVE' | 'IDLE' | 'EXPIRED';

export interface SecuritySession {
  readonly id: string;
  readonly accountName: string;
  readonly accountEmail: string;
  /** Appareil et agent, en clair. Jamais d'empreinte ni de jeton de session. */
  readonly device: string;
  /** Localisation approximative. L'adresse IP complète n'est volontairement pas exposée. */
  readonly location: string;
  readonly startedAtLabel: string;
  readonly lastSeenAt: string;
  readonly lastSeenAtLabel: string;
  readonly status: SessionStatus;
  /** Session depuis laquelle l'écran est consulté ; la révoquer déconnecterait l'opérateur. */
  readonly current: boolean;
}

export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'BLOCKED';

export interface AuditEntry {
  readonly id: string;
  readonly occurredAt: string;
  readonly occurredAtLabel: string;
  readonly actor: string;
  readonly action: string;
  readonly target: string;
  readonly outcome: AuditOutcome;
  /** `correlationId` du contrat d'API — sert à relier les traces, jamais à authentifier. */
  readonly correlationId: string;
}

/** Couple libellé/valeur, compatible avec `CnpmDefinition` du design system. */
export interface SecurityPolicyItem {
  readonly label: string;
  readonly value: string;
}

/**
 * Agrégats de posture, calculés par la source.
 *
 * L'écran les recopie sans jamais les recalculer : un second calcul côté vue pourrait
 * diverger de celui qui alimente les tableaux et afficher un total que la liste
 * juste en dessous contredit.
 */
export interface SecurityPosture {
  readonly accountsTotal: number;
  readonly activeAccounts: number;
  readonly suspendedAccounts: number;
  readonly twoFactorEnabled: number;
  readonly openSessions: number;
}

/** Effectifs de chaque collection, avant application de la recherche. */
export interface SecurityCounts {
  readonly accounts: number;
  readonly roles: number;
  readonly permissions: number;
  readonly sessions: number;
  readonly auditEntries: number;
}

export interface AdminSecurityQuery {
  readonly tab: SecurityTabId;
  readonly search: string;
}

export interface AdminSecuritySnapshot {
  readonly accounts: readonly SecurityAccount[];
  readonly roles: readonly SecurityRole[];
  readonly permissions: readonly PermissionRow[];
  readonly sessions: readonly SecuritySession[];
  readonly audit: readonly AuditEntry[];
  readonly policy: readonly SecurityPolicyItem[];
  readonly posture: SecurityPosture;
  readonly counts: SecurityCounts;
  /**
   * Membres (adhésions) sans compte utilisateur, proposés à la création d'un compte membre.
   * Vide côté professionnel, mais toujours présent pour un contrat stable.
   */
  readonly membersWithoutAccount: readonly MemberWithoutAccount[];
  /**
   * Le compte courant peut-il MODIFIER la matrice des droits ? Décidé par la source (le
   * serveur reste l'autorité) : l'UI n'ouvre l'édition que si ce drapeau est vrai, sinon
   * la matrice reste en lecture seule.
   */
  readonly canManagePermissions: boolean;
}

/**
 * Création d'un compte.
 *
 * On ne collecte ici que l'identité que le modèle de compte porte réellement — prénom,
 * nom, adresse, rôle. Le profil étendu (téléphone, fonction, département, photo) relèvera
 * de l'API Utilisateurs dédiée : afficher des champs qu'aucun stockage ne reçoit serait
 * un formulaire mensonger. Aucun mot de passe n'est saisi : l'accès passe par le
 * fournisseur d'identité (Keycloak, ADR-003), le compte naît « invité », second facteur
 * « en attente », jamais connecté.
 */
/**
 * Nature du compte créé. Un compte PROFESSIONNEL est un agent/administrateur de la
 * plateforme ; un compte MEMBRE est un adhérent (accès à l'espace membre).
 */
export type AccountType = 'PROFESSIONAL' | 'MEMBER';

/**
 * Membre (adhésion) ne disposant pas encore d'un compte utilisateur.
 *
 * Sert à créer un COMPTE MEMBRE sans ressaisir l'identité : l'opérateur choisit le membre
 * dans la liste, et l'identité proposée (contact principal / représentant légal) pré-remplit
 * le formulaire. La source garantit qu'un membre déjà pourvu d'un compte n'y figure pas.
 */
export interface MemberWithoutAccount {
  readonly id: string;
  /** Raison sociale de l'entreprise adhérente. */
  readonly organizationName: string;
  readonly membershipNumber: string;
  readonly categoryLabel: string;
  readonly groupLabel?: string;
  /** Contact principal proposé pour amorcer le compte (modifiable par l'opérateur). */
  readonly contactFirstName?: string;
  readonly contactLastName?: string;
  readonly contactEmail?: string;
  readonly contactPhone?: string;
  readonly contactJobTitle?: string;
}

export interface NewAccountInput {
  readonly accountType: AccountType;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  /** Champs de profil optionnels. La source persiste ce qu'elle sait porter. */
  readonly phone?: string;
  readonly jobTitle?: string;
  readonly organization?: string;
  readonly department?: string;
  readonly roleId: string;
  /** Permissions accordées EN PLUS de celles du rôle ; le serveur reste l'autorité. */
  readonly extraPermissionIds?: readonly string[];
  /**
   * Membre rattaché lorsqu'il s'agit d'un compte MEMBER (choisi dans la liste des membres
   * sans compte). La source relie le compte à l'adhésion correspondante.
   */
  readonly memberId?: string;
}

export interface AdminSecurityGateway {
  load(query: AdminSecurityQuery): Observable<AdminSecuritySnapshot>;

  /**
   * Crée un compte et le renvoie tel qu'il sera listé. La validation réelle (unicité de
   * l'adresse, rôle autorisé, séparation des tâches) appartient à la source : une garde
   * d'interface ne protège rien côté serveur.
   */
  createAccount(input: NewAccountInput): Observable<SecurityAccount>;

  /**
   * Change le statut d'un compte (suspendre, réactiver). Le serveur applique la règle et
   * trace l'action ; l'écran ne fait que demander et rafraîchir. Renvoie le compte à jour.
   */
  changeAccountStatus(accountId: string, status: AccountStatus): Observable<SecurityAccount>;

  /**
   * Réinitialise le second facteur : le compte repasse « en attente » et devra réenrôler
   * à la prochaine connexion. Aucune 2FA n'est désactivée ici — on relance l'enrôlement,
   * on ne baisse pas la garde.
   *
   * `reason` est OBLIGATOIRE (critère BO-030 « le reset 2FA nécessite motif et audit ») :
   * le motif est transmis à la source pour être consigné dans l'événement d'audit corrélé.
   */
  resetTwoFactor(accountId: string, reason: string): Observable<SecurityAccount>;

  /**
   * Accorde ou retire une permission à un rôle dans la matrice. Le serveur applique la
   * règle (séparation des tâches, droit de gérer les permissions) et trace l'action ;
   * l'écran ne fait que demander et rafraîchir. Renvoie la ligne de permission à jour.
   */
  setPermissionGrant(
    permissionId: string,
    roleId: string,
    granted: boolean,
  ): Observable<PermissionRow>;
}

export const ADMIN_SECURITY_GATEWAY = new InjectionToken<AdminSecurityGateway>(
  'ADMIN_SECURITY_GATEWAY',
);

/**
 * Refus d'autorisation (403) renvoyé par le port.
 *
 * L'écran le distingue d'une panne : un refus de droit ne se « réessaie » pas —
 * proposer de recommencer inviterait à répéter une action que la politique condamne.
 */
export class AdminSecurityAccessError extends Error {
  constructor(message = 'Accès refusé à l’administration de la sécurité') {
    super(message);
    this.name = 'AdminSecurityAccessError';
  }
}
