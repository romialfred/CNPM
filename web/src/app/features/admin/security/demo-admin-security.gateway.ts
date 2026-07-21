import { Injectable } from '@angular/core';
import { delay, type Observable, of, throwError } from 'rxjs';
import type {
  AccountStatus,
  AdminSecurityGateway,
  AdminSecurityQuery,
  AdminSecuritySnapshot,
  AuditEntry,
  NewAccountInput,
  PermissionGrant,
  PermissionRow,
  SecurityAccount,
  SecurityCounts,
  SecurityPolicyItem,
  SecurityPosture,
  SecurityRole,
  SecuritySession,
} from './admin-security-gateway';

/**
 * Adaptateur de démonstration du port `ADMIN_SECURITY_GATEWAY`.
 *
 * Il tient le rôle de l'API : c'est lui qui filtre et qui agrège, exactement comme le
 * fera le backend. L'écran ne reçoit qu'un instantané déjà constitué, si bien que le
 * remplacer par l'adaptateur HTTP ne touchera aucune page.
 *
 * Toutes les données sont FICTIVES et manifestement synthétiques : personnes
 * inventées, domaines en `.example`, aucun compte, rôle ni événement réel du CNPM.
 * `CLAUDE.md` interdit toute donnée réelle dans une fixture.
 *
 * Aucun champ ne porte de secret : pas de mot de passe, pas de jeton, pas d'OTP, pas
 * d'empreinte de session ni d'adresse IP complète. Le contrat ne les expose pas, donc
 * l'écran ne peut pas les afficher par accident.
 */

/**
 * Rôles de démonstration. L'ordre fixe celui des colonnes de la matrice.
 *
 * Le nombre de comptes n'est pas saisi ici : il est dérivé des comptes, faute de quoi
 * deux chiffres tenus séparément finiraient par se contredire.
 */
const ROLE_SEED: readonly Omit<SecurityRole, 'accounts'>[] = [
  {
    id: 'admin-technique',
    label: 'Administrateur technique',
    description:
      'Exploitation de la plateforme, comptes et paramètres. Ne porte aucun droit financier.',
  },
  {
    id: 'gestionnaire-cotisations',
    label: 'Gestionnaire cotisations',
    description: 'Suivi des cotisations, émission des reçus et relances.',
  },
  {
    id: 'agent-recouvrement',
    label: 'Agent de recouvrement',
    description: 'Relances et suivi des encaissements, sans droit d’émission de reçu.',
  },
  {
    id: 'auditeur',
    label: 'Auditeur',
    description: 'Consultation et journal d’audit, sans droit d’écriture.',
  },
  {
    id: 'lecteur',
    label: 'Lecteur',
    description: 'Consultation restreinte des membres et du tableau de bord.',
  },
];

/**
 * Matrice des droits, en lecture seule.
 *
 * Les colonnes suivent l'ordre de `ROLE_SEED` ; `buildPermissions` fabrique les
 * cellules à partir de cet ordre unique, ce qui rend un décalage de colonne
 * structurellement impossible.
 *
 * L'administrateur technique n'a AUCUN droit sur les cotisations, les reçus, les
 * relances ni l'export : c'est la séparation des tâches exigée par la fiche BO-030,
 * et elle se lit directement dans la table.
 */
const PERMISSION_SEED: readonly {
  readonly id: string;
  readonly label: string;
  readonly domain: string;
  /** Rôles autorisés ; tout rôle absent est refusé. */
  readonly allowed: readonly string[];
}[] = [
  {
    id: 'dashboard-read',
    label: 'Tableau de bord et reporting',
    domain: 'Pilotage',
    allowed: [
      'admin-technique',
      'gestionnaire-cotisations',
      'agent-recouvrement',
      'auditeur',
      'lecteur',
    ],
  },
  {
    id: 'members-read',
    label: 'Consultation des membres',
    domain: 'Membres',
    allowed: [
      'admin-technique',
      'gestionnaire-cotisations',
      'agent-recouvrement',
      'auditeur',
      'lecteur',
    ],
  },
  {
    id: 'members-write',
    label: 'Création et modification des membres',
    domain: 'Membres',
    allowed: ['gestionnaire-cotisations'],
  },
  {
    id: 'contributions-manage',
    label: 'Cotisations et paiements',
    domain: 'Finance',
    allowed: ['gestionnaire-cotisations', 'agent-recouvrement'],
  },
  {
    id: 'receipts-issue',
    label: 'Émission des reçus',
    domain: 'Finance',
    allowed: ['gestionnaire-cotisations'],
  },
  {
    id: 'reminders-send',
    label: 'Relances et recouvrement',
    domain: 'Finance',
    allowed: ['gestionnaire-cotisations', 'agent-recouvrement'],
  },
  {
    id: 'exports-sensitive',
    label: 'Export de données sensibles',
    domain: 'Finance',
    allowed: ['gestionnaire-cotisations'],
  },
  {
    id: 'security-admin',
    label: 'Administration et sécurité',
    domain: 'Plateforme',
    allowed: ['admin-technique'],
  },
  {
    id: 'audit-read',
    label: 'Consultation du journal d’audit',
    domain: 'Plateforme',
    allowed: ['admin-technique', 'auditeur'],
  },
];

/** Comptes fictifs. `activeSessions` n'est pas saisi ici : il est dérivé des sessions. */
const ACCOUNT_SEED: readonly Omit<SecurityAccount, 'activeSessions' | 'roleLabel'>[] = [
  {
    id: 'acc-01',
    fullName: 'Aminata Konaté',
    email: 'a.konate@cnpm-demo.example',
    roleId: 'admin-technique',
    status: 'ACTIVE',
    twoFactor: 'ENABLED',
    lastLoginAt: '2026-07-17T09:41:00+00:00',
    lastLoginLabel: '17 juillet 2026, 09:41',
  },
  {
    id: 'acc-02',
    fullName: 'Boubacar Sidibé',
    email: 'b.sidibe@cnpm-demo.example',
    roleId: 'gestionnaire-cotisations',
    status: 'ACTIVE',
    twoFactor: 'ENABLED',
    lastLoginAt: '2026-07-17T08:15:00+00:00',
    lastLoginLabel: '17 juillet 2026, 08:15',
  },
  {
    id: 'acc-03',
    fullName: 'Fanta Traoré',
    email: 'f.traore@cnpm-demo.example',
    roleId: 'agent-recouvrement',
    status: 'ACTIVE',
    twoFactor: 'ENABLED',
    lastLoginAt: '2026-07-16T17:32:00+00:00',
    lastLoginLabel: '16 juillet 2026, 17:32',
  },
  {
    id: 'acc-04',
    fullName: 'Issa Dembélé',
    email: 'i.dembele@cnpm-demo.example',
    roleId: 'auditeur',
    status: 'ACTIVE',
    twoFactor: 'ENABLED',
    lastLoginAt: '2026-07-16T14:08:00+00:00',
    lastLoginLabel: '16 juillet 2026, 14:08',
  },
  {
    id: 'acc-05',
    fullName: 'Salif Coulibaly',
    email: 's.coulibaly@cnpm-demo.example',
    roleId: 'lecteur',
    status: 'SUSPENDED',
    twoFactor: 'DISABLED',
    lastLoginAt: '2026-07-04T11:22:00+00:00',
    lastLoginLabel: '4 juillet 2026, 11:22',
  },
  {
    id: 'acc-06',
    fullName: 'Kadidia Maïga',
    email: 'k.maiga@cnpm-demo.example',
    roleId: 'gestionnaire-cotisations',
    status: 'INVITED',
    twoFactor: 'PENDING',
    // Jamais connectée : l'absence de date se dit « — », pas « 01/01/1970 ».
    lastLoginAt: null,
    lastLoginLabel: null,
  },
  {
    id: 'acc-07',
    fullName: 'Oumar Sangaré',
    email: 'o.sangare@cnpm-demo.example',
    roleId: 'lecteur',
    status: 'ACTIVE',
    twoFactor: 'ENABLED',
    lastLoginAt: '2026-07-17T07:50:00+00:00',
    lastLoginLabel: '17 juillet 2026, 07:50',
  },
  {
    id: 'acc-08',
    fullName: 'Nènè Diallo',
    email: 'n.diallo@cnpm-demo.example',
    roleId: 'agent-recouvrement',
    status: 'ACTIVE',
    twoFactor: 'PENDING',
    lastLoginAt: '2026-07-15T16:04:00+00:00',
    lastLoginLabel: '15 juillet 2026, 16:04',
  },
];

const SESSIONS: readonly SecuritySession[] = [
  {
    id: 'ses-01',
    accountName: 'Aminata Konaté',
    accountEmail: 'a.konate@cnpm-demo.example',
    device: 'Poste Windows 11 · Chrome',
    location: 'Bamako, Mali',
    startedAtLabel: '17 juillet 2026, 09:41',
    lastSeenAt: '2026-07-17T10:12:00+00:00',
    lastSeenAtLabel: '17 juillet 2026, 10:12',
    status: 'ACTIVE',
    current: true,
  },
  {
    id: 'ses-02',
    accountName: 'Aminata Konaté',
    accountEmail: 'a.konate@cnpm-demo.example',
    device: 'Mobile Android · application CNPM',
    location: 'Bamako, Mali',
    startedAtLabel: '17 juillet 2026, 07:05',
    lastSeenAt: '2026-07-17T08:30:00+00:00',
    lastSeenAtLabel: '17 juillet 2026, 08:30',
    status: 'IDLE',
    current: false,
  },
  {
    id: 'ses-03',
    accountName: 'Boubacar Sidibé',
    accountEmail: 'b.sidibe@cnpm-demo.example',
    device: 'Poste Windows 11 · Edge',
    location: 'Ségou, Mali',
    startedAtLabel: '17 juillet 2026, 08:15',
    lastSeenAt: '2026-07-17T10:04:00+00:00',
    lastSeenAtLabel: '17 juillet 2026, 10:04',
    status: 'ACTIVE',
    current: false,
  },
  {
    id: 'ses-04',
    accountName: 'Fanta Traoré',
    accountEmail: 'f.traore@cnpm-demo.example',
    device: 'Mobile Android · application CNPM',
    location: 'Sikasso, Mali',
    startedAtLabel: '16 juillet 2026, 17:32',
    lastSeenAt: '2026-07-17T09:58:00+00:00',
    lastSeenAtLabel: '17 juillet 2026, 09:58',
    status: 'ACTIVE',
    current: false,
  },
  {
    id: 'ses-05',
    accountName: 'Issa Dembélé',
    accountEmail: 'i.dembele@cnpm-demo.example',
    device: 'Poste macOS · Safari',
    location: 'Bamako, Mali',
    startedAtLabel: '16 juillet 2026, 14:08',
    lastSeenAt: '2026-07-16T16:20:00+00:00',
    lastSeenAtLabel: '16 juillet 2026, 16:20',
    status: 'IDLE',
    current: false,
  },
  {
    id: 'ses-06',
    accountName: 'Oumar Sangaré',
    accountEmail: 'o.sangare@cnpm-demo.example',
    device: 'Poste Windows 10 · Firefox',
    location: 'Mopti, Mali',
    startedAtLabel: '17 juillet 2026, 07:50',
    lastSeenAt: '2026-07-17T08:02:00+00:00',
    lastSeenAtLabel: '17 juillet 2026, 08:02',
    status: 'EXPIRED',
    current: false,
  },
];

/** Journal fictif, du plus récent au plus ancien. Immuable : aucune écriture ici. */
const AUDIT: readonly AuditEntry[] = [
  {
    id: 'aud-01',
    occurredAt: '2026-07-17T10:12:00+00:00',
    occurredAtLabel: '17 juillet 2026, 10:12',
    actor: 'Aminata Konaté',
    action: 'Consultation du journal d’audit',
    target: 'Journal d’audit',
    outcome: 'SUCCESS',
    correlationId: 'CNPM-AUD-0114',
  },
  {
    id: 'aud-02',
    occurredAt: '2026-07-17T09:58:00+00:00',
    occurredAtLabel: '17 juillet 2026, 09:58',
    actor: 'Aminata Konaté',
    action: 'Modification de rôle',
    target: 'Compte n.diallo@cnpm-demo.example',
    outcome: 'SUCCESS',
    correlationId: 'CNPM-AUD-0113',
  },
  {
    id: 'aud-03',
    occurredAt: '2026-07-17T09:41:00+00:00',
    occurredAtLabel: '17 juillet 2026, 09:41',
    actor: 'Aminata Konaté',
    action: 'Ouverture de session',
    target: 'Espace administration',
    outcome: 'SUCCESS',
    correlationId: 'CNPM-AUD-0112',
  },
  {
    id: 'aud-04',
    occurredAt: '2026-07-17T08:22:00+00:00',
    occurredAtLabel: '17 juillet 2026, 08:22',
    actor: 'Salif Coulibaly',
    action: 'Tentative de connexion',
    target: 'Compte s.coulibaly@cnpm-demo.example',
    outcome: 'FAILURE',
    correlationId: 'CNPM-AUD-0111',
  },
  {
    id: 'aud-05',
    occurredAt: '2026-07-17T08:20:00+00:00',
    occurredAtLabel: '17 juillet 2026, 08:20',
    actor: 'Salif Coulibaly',
    action: 'Tentative de connexion',
    target: 'Compte s.coulibaly@cnpm-demo.example',
    outcome: 'FAILURE',
    correlationId: 'CNPM-AUD-0110',
  },
  {
    id: 'aud-06',
    occurredAt: '2026-07-17T08:18:00+00:00',
    occurredAtLabel: '17 juillet 2026, 08:18',
    actor: 'Plateforme',
    action: 'Suspension automatique après échecs répétés',
    target: 'Compte s.coulibaly@cnpm-demo.example',
    outcome: 'BLOCKED',
    correlationId: 'CNPM-AUD-0109',
  },
  {
    id: 'aud-07',
    occurredAt: '2026-07-16T18:05:00+00:00',
    occurredAtLabel: '16 juillet 2026, 18:05',
    actor: 'Boubacar Sidibé',
    action: 'Export de données de cotisations',
    target: 'Export approuvé, expirable',
    outcome: 'SUCCESS',
    correlationId: 'CNPM-AUD-0108',
  },
  {
    id: 'aud-08',
    occurredAt: '2026-07-16T17:32:00+00:00',
    occurredAtLabel: '16 juillet 2026, 17:32',
    actor: 'Fanta Traoré',
    action: 'Ouverture de session',
    target: 'Espace administration',
    outcome: 'SUCCESS',
    correlationId: 'CNPM-AUD-0107',
  },
  {
    id: 'aud-09',
    occurredAt: '2026-07-16T15:11:00+00:00',
    occurredAtLabel: '16 juillet 2026, 15:11',
    actor: 'Aminata Konaté',
    action: 'Réinitialisation du second facteur (motif consigné)',
    target: 'Compte n.diallo@cnpm-demo.example',
    outcome: 'SUCCESS',
    correlationId: 'CNPM-AUD-0106',
  },
  {
    id: 'aud-10',
    occurredAt: '2026-07-16T09:03:00+00:00',
    occurredAtLabel: '16 juillet 2026, 09:03',
    actor: 'Compte non identifié',
    action: 'Accès depuis un appareil non reconnu',
    target: 'Espace administration',
    outcome: 'BLOCKED',
    correlationId: 'CNPM-AUD-0105',
  },
];

/**
 * Politique affichée dans le panneau latéral.
 *
 * Ce sont des VALEURS DE DÉMONSTRATION, pas une politique arbitrée : `CLAUDE.md`
 * interdit d'inventer une règle et `documentation.md` impose de marquer toute
 * hypothèse non validée. Le panneau le dit explicitement à l'écran, plutôt que de
 * laisser croire à un paramétrage officiel.
 */
const POLICY: readonly SecurityPolicyItem[] = [
  { label: 'Second facteur', value: 'Obligatoire pour les rôles sensibles (TOTP ou WebAuthn)' },
  { label: 'Opérations sensibles', value: 'Réauthentification demandée avant exécution' },
  { label: 'Expiration de session', value: 'Après une période d’inactivité' },
  { label: 'Séparation des tâches', value: 'Aucun droit financier attaché au rôle technique' },
  { label: 'Journal d’audit', value: 'Append-only : ni modification ni suppression' },
];

/**
 * Comparaison insensible à la casse et aux diacritiques.
 *
 * Sans dépliage des accents, chercher « Konate » ne trouverait pas « Aminata Konaté » :
 * l'opérateur qui tape vite, ou sur un clavier sans accents, n'obtiendrait rien.
 */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

@Injectable()
export class DemoAdminSecurityGateway implements AdminSecurityGateway {
  private readonly roles = buildRoles();
  private readonly permissions = buildPermissions();
  private readonly sessions = SESSIONS;
  private readonly audit = AUDIT;
  /**
   * Mutable — les comptes créés en session s'y ajoutent, de sorte qu'un rechargement les
   * fasse apparaître. La démo simule ainsi la persistance de la source réelle sans
   * jamais toucher à un stockage.
   */
  private accounts: SecurityAccount[] = [...buildAccounts()];
  private createdCount = 0;

  load(query: AdminSecurityQuery): Observable<AdminSecuritySnapshot> {
    const term = fold(query.search.trim());

    // Seule la collection de l'onglet actif est filtrée : une recherche saisie sur les
    // comptes n'a aucune raison d'amputer silencieusement le journal d'audit.
    const snapshot: AdminSecuritySnapshot = {
      accounts:
        query.tab === 'comptes'
          ? this.accounts.filter((row) => matchesAccount(row, term))
          : this.accounts,
      roles: this.roles,
      permissions: this.permissions,
      sessions:
        query.tab === 'sessions'
          ? this.sessions.filter((row) => matchesSession(row, term))
          : this.sessions,
      audit:
        query.tab === 'audit' ? this.audit.filter((row) => matchesAudit(row, term)) : this.audit,
      policy: POLICY,
      posture: this.posture(),
      counts: this.counts(),
    };

    // Latence simulée : sans elle, l'état de chargement ne serait jamais peint, donc
    // jamais éprouvé.
    return of(snapshot).pipe(delay(140));
  }

  createAccount(input: NewAccountInput): Observable<SecurityAccount> {
    this.createdCount += 1;
    const fullName = `${input.firstName} ${input.lastName}`.replace(/\s+/gu, ' ').trim();
    const account: SecurityAccount = {
      id: `acc-demo-${this.createdCount}`,
      fullName,
      email: input.email.trim(),
      roleId: input.roleId,
      roleLabel: this.roles.find((role) => role.id === input.roleId)?.label ?? 'Rôle inconnu',
      // Un compte créé n'est pas encore actif : il est invité, son second facteur reste à
      // enrôler et il ne s'est jamais connecté. C'est exactement l'état qui déclenchera
      // la popup d'enrôlement à la première connexion.
      status: 'INVITED',
      twoFactor: 'PENDING',
      lastLoginAt: null,
      lastLoginLabel: null,
      activeSessions: 0,
    };
    // En tête de liste : l'opérateur voit immédiatement le compte qu'il vient de créer.
    this.accounts = [account, ...this.accounts];
    return of(account).pipe(delay(180));
  }

  changeAccountStatus(accountId: string, status: AccountStatus): Observable<SecurityAccount> {
    return this.mutate(accountId, (account) => ({ ...account, status }));
  }

  resetTwoFactor(accountId: string): Observable<SecurityAccount> {
    // On relance l'enrôlement (PENDING), on ne désactive pas la protection.
    return this.mutate(accountId, (account) => ({ ...account, twoFactor: 'PENDING' }));
  }

  /** Applique une transformation à un compte et le renvoie ; erreur si l'identifiant est inconnu. */
  private mutate(
    accountId: string,
    change: (account: SecurityAccount) => SecurityAccount,
  ): Observable<SecurityAccount> {
    const index = this.accounts.findIndex((account) => account.id === accountId);
    if (index === -1) {
      return throwError(() => new Error('Compte introuvable')).pipe(delay(180));
    }
    const updated = change(this.accounts[index]);
    this.accounts = [...this.accounts.slice(0, index), updated, ...this.accounts.slice(index + 1)];
    return of(updated).pipe(delay(180));
  }

  /** Effectifs de référence, toujours calculés sur les collections complètes. */
  private counts(): SecurityCounts {
    return {
      accounts: this.accounts.length,
      roles: this.roles.length,
      permissions: this.permissions.length,
      sessions: this.sessions.length,
      auditEntries: this.audit.length,
    };
  }

  private posture(): SecurityPosture {
    return {
      accountsTotal: this.accounts.length,
      activeAccounts: this.accounts.filter((account) => account.status === 'ACTIVE').length,
      suspendedAccounts: this.accounts.filter((account) => account.status === 'SUSPENDED').length,
      twoFactorEnabled: this.accounts.filter((account) => account.twoFactor === 'ENABLED').length,
      // Une session expirée n'est plus ouverte : la compter gonflerait l'indicateur
      // exactement là où il sert à décider d'une révocation.
      openSessions: this.sessions.filter((session) => session.status !== 'EXPIRED').length,
    };
  }
}

/**
 * Fabrique les lignes de la matrice à partir de l'ordre unique de `ROLES`.
 *
 * Écrire les cellules à la main ouvrirait la porte à un décalage d'une colonne, qui
 * afficherait les droits d'un rôle sous le nom d'un autre — une erreur invisible à la
 * relecture et grave sur un écran de sécurité.
 */
function buildPermissions(): readonly PermissionRow[] {
  return PERMISSION_SEED.map((seed) => {
    const grants: readonly PermissionGrant[] = ROLE_SEED.map((role) => ({
      roleId: role.id,
      roleLabel: role.label,
      granted: seed.allowed.includes(role.id),
    }));
    return { id: seed.id, label: seed.label, domain: seed.domain, grants };
  });
}

/** Rôles complétés par leur nombre de comptes, dérivé et jamais saisi. */
function buildRoles(): readonly SecurityRole[] {
  return ROLE_SEED.map((role) => ({
    ...role,
    accounts: ACCOUNT_SEED.filter((account) => account.roleId === role.id).length,
  }));
}

/**
 * Complète chaque compte par son libellé de rôle et son nombre de sessions ouvertes.
 *
 * Le décompte est dérivé de la liste des sessions, jamais saisi : deux chiffres saisis
 * séparément finiraient par se contredire, et l'onglet « Sessions » démentirait la
 * colonne de l'onglet « Comptes ».
 */
function buildAccounts(): readonly SecurityAccount[] {
  return ACCOUNT_SEED.map((seed) => ({
    ...seed,
    roleLabel: ROLE_SEED.find((role) => role.id === seed.roleId)?.label ?? 'Rôle inconnu',
    activeSessions: SESSIONS.filter(
      (session) => session.accountEmail === seed.email && session.status !== 'EXPIRED',
    ).length,
  }));
}

function matchesAccount(account: SecurityAccount, term: string): boolean {
  if (!term) {
    return true;
  }
  return [account.fullName, account.email, account.roleLabel].some((field) =>
    fold(field).includes(term),
  );
}

function matchesSession(session: SecuritySession, term: string): boolean {
  if (!term) {
    return true;
  }
  return [session.accountName, session.accountEmail, session.device, session.location].some(
    (field) => fold(field).includes(term),
  );
}

function matchesAudit(entry: AuditEntry, term: string): boolean {
  if (!term) {
    return true;
  }
  return [entry.actor, entry.action, entry.target, entry.correlationId].some((field) =>
    fold(field).includes(term),
  );
}
