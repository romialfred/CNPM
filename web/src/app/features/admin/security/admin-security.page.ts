import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideBan,
  LucideCheck,
  LucideKeyRound,
  LucideMinus,
  LucideSend,
  LucideTrash2,
  LucideUserCheck,
  LucideUserPlus,
} from '@lucide/angular';
import { catchError, map, type Observable, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { DialogComponent } from '../../../design-system/dialog/dialog.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
} from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TabsComponent, type CnpmTab } from '../../../design-system/tabs/tabs.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  ADMIN_SECURITY_GATEWAY,
  AdminSecurityAccessError,
  type AccountStatus,
  type AdminSecuritySnapshot,
  type AuditEntry,
  type AuditOutcome,
  type CredentialTokenResult,
  type PermissionGrant,
  type PermissionRow,
  type SecurityAccount,
  type SecuritySession,
  type SecurityTabId,
  type SessionStatus,
  type TwoFactorStatus,
} from './admin-security-gateway';

const TABS: readonly CnpmTab[] = [
  { id: 'comptes', label: 'Utilisateurs' },
  { id: 'roles', label: 'Rôles et permissions' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'audit', label: 'Journal d’audit' },
];

const TAB_IDS: readonly SecurityTabId[] = ['comptes', 'roles', 'sessions', 'audit'];
const DEFAULT_TAB: SecurityTabId = 'comptes';

/** Les onglets sans collection filtrable n'affichent pas de champ de recherche. */
const SEARCHABLE_TABS: readonly SecurityTabId[] = ['comptes', 'sessions', 'audit'];

const ACCOUNT_STATUS_LABELS: Readonly<Record<AccountStatus, string>> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  INVITED: 'Invitation en attente',
};

const ACCOUNT_STATUS_TONES: Readonly<Record<AccountStatus, CnpmBadgeTone>> = {
  ACTIVE: 'success',
  SUSPENDED: 'error',
  INVITED: 'info',
};

const TWO_FACTOR_LABELS: Readonly<Record<TwoFactorStatus, string>> = {
  ENABLED: 'Activée',
  PENDING: 'Inscription à terminer',
  DISABLED: 'Désactivée',
};

const TWO_FACTOR_TONES: Readonly<Record<TwoFactorStatus, CnpmBadgeTone>> = {
  ENABLED: 'success',
  PENDING: 'warning',
  DISABLED: 'error',
};

const SESSION_STATUS_LABELS: Readonly<Record<SessionStatus, string>> = {
  ACTIVE: 'Active',
  IDLE: 'Inactive',
  EXPIRED: 'Expirée',
};

const SESSION_STATUS_TONES: Readonly<Record<SessionStatus, CnpmBadgeTone>> = {
  ACTIVE: 'success',
  IDLE: 'warning',
  EXPIRED: 'neutral',
};

const AUDIT_OUTCOME_LABELS: Readonly<Record<AuditOutcome, string>> = {
  SUCCESS: 'Réussite',
  FAILURE: 'Échec',
  BLOCKED: 'Bloqué',
};

const AUDIT_OUTCOME_TONES: Readonly<Record<AuditOutcome, CnpmBadgeTone>> = {
  SUCCESS: 'success',
  FAILURE: 'error',
  BLOCKED: 'warning',
};

// Colonnes épurées (inspiration SafeX) : l'identité porte déjà le courriel, le statut et
// le second facteur suffisent au coup d'œil sécurité. Dernière connexion et sessions
// ouvertes ont quitté le tableau — elles relèvent du détail d'un compte, pas de la liste.
const ACCOUNT_COLUMNS: readonly DataTableColumn[] = [
  { key: 'account', label: 'Utilisateur' },
  { key: 'role', label: 'Rôle' },
  { key: 'status', label: 'Statut' },
  { key: 'twoFactor', label: 'Second facteur', note: '(2FA)' },
  { key: 'actions', label: 'Actions', align: 'end' },
];

/** Options du filtre de statut. `null` = tous. */
const STATUS_FILTERS: readonly { value: AccountStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'INVITED', label: 'Invitation en attente' },
];

const SESSION_COLUMNS: readonly DataTableColumn[] = [
  { key: 'account', label: 'Utilisateur' },
  { key: 'device', label: 'Appareil' },
  { key: 'location', label: 'Localisation approximative' },
  { key: 'startedAt', label: 'Ouverture' },
  { key: 'lastSeen', label: 'Dernière activité' },
  { key: 'status', label: 'Statut' },
  { key: 'actions', label: 'Actions' },
];

const AUDIT_COLUMNS: readonly DataTableColumn[] = [
  { key: 'occurredAt', label: 'Horodatage' },
  { key: 'actor', label: 'Acteur' },
  { key: 'action', label: 'Action' },
  { key: 'target', label: 'Objet' },
  { key: 'outcome', label: 'Résultat' },
  { key: 'correlation', label: 'Corrélation' },
];

/**
 * BO-030 — Administration et sécurité.
 *
 * Quatre sections : comptes, matrice des rôles et permissions (lecture seule),
 * sessions et journal d'audit. L'onglet actif et la recherche vivent dans l'URL :
 * `frontend-angular.md` l'exige pour toute vue partageable, et c'est ce qui permet à
 * un opérateur de transmettre exactement la vue qu'il commente.
 *
 * Trois partis pris tiennent aux critères d'acceptation de la fiche :
 *
 * 1. Aucun secret n'est affiché — le port ne transporte ni mot de passe, ni jeton, ni
 *    OTP, ni empreinte de session, ni adresse IP complète. La garantie tient dans le
 *    contrat, pas dans la vigilance du gabarit.
 * 2. La matrice est en lecture seule et les opérations sensibles (invitation,
 *    suspension, réinitialisation 2FA, révocation de session) sont des flux distincts
 *    soumis à réauthentification. Faute de ces flux, les commandes sont neutralisées
 *    et annoncent pourquoi, plutôt que d'ouvrir sur un écran absent.
 * 3. Les permissions et les agrégats viennent de la source. Rien n'est recalculé ici :
 *    un second calcul pourrait contredire le tableau affiché juste à côté.
 *
 * Les onglets « 2FA » et « Paramètres » de la fiche ne sont pas rendus : leurs écrans
 * et leur politique ne sont pas arbitrés. Un onglet affiché mais inerte promettrait un
 * réglage qui n'existe pas. L'état du second facteur reste visible, colonne par
 * colonne, dans l'onglet « Comptes ».
 */
@Component({
  selector: 'cnpm-admin-security-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormsModule,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    DialogComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TabsComponent,
    LucideBan,
    LucideCheck,
    LucideKeyRound,
    LucideMinus,
    LucideSend,
    LucideTrash2,
    LucideUserCheck,
    LucideUserPlus,
  ],
  templateUrl: './admin-security.page.html',
  styleUrl: './admin-security.page.scss',
})
export class AdminSecurityPage {
  private readonly gateway = inject(ADMIN_SECURITY_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * BO-030 et BO-031 partagent le même espace de travail. La route canonique
   * `/security/roles` ouvre directement la matrice, sans dupliquer son rendu ni
   * introduire un second état local concurrent de l'URL.
   */
  private readonly defaultTab: SecurityTabId = TAB_IDS.includes(
    this.route.snapshot.data['defaultTab'] as SecurityTabId,
  )
    ? (this.route.snapshot.data['defaultTab'] as SecurityTabId)
    : DEFAULT_TAB;

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly tabs = TABS;

  /** Identifiants d'aides textuelles, reliées aux commandes par `aria-describedby`. */
  protected readonly sensitiveHintId = 'cnpm-security-flux-sensibles';
  protected readonly matrixHintId = 'cnpm-security-matrice-lecture';

  /** L'URL est l'unique source de vérité de l'onglet et du filtre ; aucun état parallèle. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly activeTab = computed<SecurityTabId>(() => {
    const value = this.params().get('onglet');
    return value && (TAB_IDS as readonly string[]).includes(value)
      ? (value as SecurityTabId)
      : this.defaultTab;
  });

  protected readonly search = computed(() => this.params().get('q') ?? '');

  /** Filtres du tableau des comptes, portés par l'URL (vue partageable). */
  protected readonly statusFilter = computed<AccountStatus | ''>(() => {
    const value = this.params().get('statut');
    return value === 'ACTIVE' || value === 'SUSPENDED' || value === 'INVITED' ? value : '';
  });
  protected readonly roleFilter = computed(() => this.params().get('role') ?? '');
  protected readonly statusFilters = STATUS_FILTERS;

  /** Ne propose « Réinitialiser » que lorsqu'il y a réellement quelque chose à défaire. */
  protected readonly hasActiveFilters = computed(
    () => Boolean(this.search()) || Boolean(this.statusFilter()) || Boolean(this.roleFilter()),
  );

  /** Saisie en cours ; ne devient un filtre qu'à la validation du formulaire. */
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  protected readonly supportsSearch = computed(() =>
    (SEARCHABLE_TABS as readonly string[]).includes(this.activeTab()),
  );

  /**
   * Perte de connexion.
   *
   * Un échec réseau et une panne du service appellent des messages différents : dire
   * « le service est indisponible » à quelqu'un dont le Wi-Fi est coupé l'enverrait
   * chercher un incident qui n'existe pas. L'état hors ligne exigé par `CLAUDE.md` est
   * donc distingué au moment du rendu de l'erreur.
   */
  protected readonly offline = signal(!navigator.onLine);

  /** Relance manuelle d'une erreur récupérable, sans toucher à l'URL ni recharger la page. */
  private readonly retryTick = signal(0);

  private readonly fetchTrigger = computed(() => ({
    query: { tab: this.activeTab(), search: this.search() },
    tick: this.retryTick(),
  }));

  /**
   * `switchMap` abandonne la requête précédente dès que l'onglet ou le filtre change :
   * sans lui, une réponse lente à un onglet déjà quitté écraserait la réponse courante.
   *
   * Un refus d'accès (403) est distingué d'une panne temporaire : le premier n'est pas
   * « réessayable », le second l'est.
   */
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.load(query).pipe(
          map((snapshot) => ({ kind: 'ready' as const, snapshot })),
          catchError((error: unknown) =>
            of(
              error instanceof AdminSecurityAccessError
                ? { kind: 'forbidden' as const }
                : { kind: 'error' as const },
            ),
          ),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly data = computed<AdminSecuritySnapshot | null>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.snapshot : null;
  });

  protected readonly accounts = computed<readonly SecurityAccount[]>(
    () => this.data()?.accounts ?? [],
  );
  /**
   * Comptes affichés : la recherche est déjà appliquée par la source ; on filtre en plus
   * par statut et par rôle (filtres portés par l'URL). La liste complète s'affiche —
   * plus de coupe à six lignes, comme une gestion des utilisateurs standard.
   */
  protected readonly filteredAccounts = computed<readonly SecurityAccount[]>(() => {
    const status = this.statusFilter();
    const role = this.roleFilter();
    return this.accounts().filter(
      (account) => (!status || account.status === status) && (!role || account.roleId === role),
    );
  });
  /** Rôles présents parmi les comptes, pour alimenter le filtre de rôle. */
  protected readonly accountRoleOptions = computed(() => {
    const seen = new Map<string, string>();
    for (const account of this.accounts()) {
      if (!seen.has(account.roleId)) {
        seen.set(account.roleId, account.roleLabel);
      }
    }
    return [...seen].map(([value, label]) => ({ value, label }));
  });
  protected readonly permissions = computed<readonly PermissionRow[]>(
    () => this.data()?.permissions ?? [],
  );
  protected readonly roles = computed(() => this.data()?.roles ?? []);
  /** L'édition de la matrice n'est ouverte que si la source y autorise le compte courant. */
  protected readonly canManagePermissions = computed(
    () => this.data()?.canManagePermissions ?? false,
  );
  /** Cellules en cours d'enregistrement, clef « permissionId:roleId » : évite le double clic. */
  private readonly savingGrants = signal<ReadonlySet<string>>(new Set());

  protected isGrantSaving(permissionId: string, roleId: string): boolean {
    return this.savingGrants().has(`${permissionId}:${roleId}`);
  }

  /** Bascule un droit d'un rôle dans la matrice, si le compte courant en a le droit. */
  protected togglePermission(permission: PermissionRow, grant: PermissionGrant): void {
    const key = `${permission.id}:${grant.roleId}`;
    if (!this.canManagePermissions() || this.savingGrants().has(key)) {
      return;
    }
    this.savingGrants.update((current) => new Set(current).add(key));
    this.gateway
      .setPermissionGrant(permission.id, grant.roleId, !grant.granted)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (row) => {
          this.releaseGrant(key);
          const cell = row.grants.find((entry) => entry.roleId === grant.roleId);
          this.toast.success(
            `${cell?.granted ? 'Accordé' : 'Retiré'} : ${permission.label} · ${grant.roleLabel}.`,
          );
          this.retryTick.update((tick) => tick + 1);
        },
        error: () => {
          this.releaseGrant(key);
          this.toast.error('La modification du droit a échoué. Réessayez.');
        },
      });
  }

  private releaseGrant(key: string): void {
    this.savingGrants.update((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }
  protected readonly sessions = computed<readonly SecuritySession[]>(
    () => this.data()?.sessions ?? [],
  );
  protected readonly audit = computed<readonly AuditEntry[]>(() => this.data()?.audit ?? []);
  protected readonly counts = computed(() => this.data()?.counts ?? null);

  protected readonly accountColumns = ACCOUNT_COLUMNS;
  protected readonly sessionColumns = SESSION_COLUMNS;
  protected readonly auditColumns = AUDIT_COLUMNS;

  /**
   * Colonnes de la matrice : une par rôle, dans l'ordre livré par la source.
   *
   * Elles ne sont pas écrites en dur : un rôle ajouté côté backend apparaîtrait sinon
   * dans les cellules sans en-tête correspondant, et la table mentirait sur qui a quoi.
   */
  protected readonly permissionColumns = computed<readonly DataTableColumn[]>(() => [
    { key: 'permission', label: 'Permission' },
    ...this.roles().map((role) => ({ key: role.id, label: role.label })),
  ]);

  /** Nombre de lignes de l'onglet actif, pour dimensionner le squelette et le total. */
  protected readonly visibleRowCount = computed(() => {
    switch (this.activeTab()) {
      case 'comptes':
        return this.filteredAccounts().length;
      case 'roles':
        return this.permissions().length;
      case 'sessions':
        return this.sessions().length;
      case 'audit':
        return this.audit().length;
    }
  });

  protected readonly columnCount = computed(() => {
    switch (this.activeTab()) {
      case 'comptes':
        return ACCOUNT_COLUMNS.length;
      case 'roles':
        return this.permissionColumns().length;
      case 'sessions':
        return SESSION_COLUMNS.length;
      case 'audit':
        return AUDIT_COLUMNS.length;
    }
  });

  protected readonly totalRowCount = computed(() => {
    const counts = this.counts();
    if (!counts) {
      return 0;
    }
    switch (this.activeTab()) {
      case 'comptes':
        return counts.accounts;
      case 'roles':
        return counts.permissions;
      case 'sessions':
        return counts.sessions;
      case 'audit':
        return counts.auditEntries;
    }
  });

  protected readonly tableState = computed<DataTableState>(() => {
    const result = this.result();
    if (result.kind === 'loading') {
      return 'loading';
    }
    if (result.kind === 'error') {
      return 'error';
    }
    if (result.kind === 'forbidden') {
      return 'forbidden';
    }
    if (this.visibleRowCount() > 0) {
      return 'ready';
    }
    // Une collection vide et un filtre trop étroit appellent des gestes opposés :
    // les confondre mène l'un des deux dans une impasse. Le statut et le rôle comptent
    // autant que la recherche — sans eux, filtrer sur « Suspendu » sur une plateforme
    // sans compte suspendu annoncerait « aucun compte enregistré », ce qui est faux.
    return this.hasActiveFilters() ? 'noResult' : 'empty';
  });

  protected readonly accountKey = (row: SecurityAccount): string => row.id;
  protected readonly permissionKey = (row: PermissionRow): string => row.id;
  protected readonly sessionKey = (row: SecuritySession): string => row.id;
  protected readonly auditKey = (row: AuditEntry): string => row.id;

  constructor() {
    const goOffline = () => this.offline.set(true);
    const goOnline = () => this.offline.set(false);
    globalThis.addEventListener('offline', goOffline);
    globalThis.addEventListener('online', goOnline);
    this.destroyRef.onDestroy(() => {
      globalThis.removeEventListener('offline', goOffline);
      globalThis.removeEventListener('online', goOnline);
    });
  }

  protected accountStatusLabel(status: AccountStatus): string {
    return ACCOUNT_STATUS_LABELS[status];
  }

  protected accountStatusTone(status: AccountStatus): CnpmBadgeTone {
    return ACCOUNT_STATUS_TONES[status];
  }

  protected twoFactorLabel(status: TwoFactorStatus): string {
    return TWO_FACTOR_LABELS[status];
  }

  protected twoFactorTone(status: TwoFactorStatus): CnpmBadgeTone {
    return TWO_FACTOR_TONES[status];
  }

  protected sessionStatusLabel(status: SessionStatus): string {
    return SESSION_STATUS_LABELS[status];
  }

  protected sessionStatusTone(status: SessionStatus): CnpmBadgeTone {
    return SESSION_STATUS_TONES[status];
  }

  protected auditOutcomeLabel(outcome: AuditOutcome): string {
    return AUDIT_OUTCOME_LABELS[outcome];
  }

  protected auditOutcomeTone(outcome: AuditOutcome): CnpmBadgeTone {
    return AUDIT_OUTCOME_TONES[outcome];
  }

  /**
   * Changement d'onglet. La recherche est effacée au passage : un filtre saisi sur les
   * comptes n'a aucun sens sur le journal d'audit, et le laisser courir masquerait
   * silencieusement des lignes que personne n'a demandé d'écarter.
   */
  protected onTabChange(tab: string): void {
    this.searchDraft.set('');
    this.patch({ onglet: tab === this.defaultTab ? null : tab, q: null, statut: null, role: null });
  }

  protected applySearch(): void {
    this.patch({ q: this.searchDraft().trim() || null });
  }

  protected setStatusFilter(value: string): void {
    this.patch({ statut: value || null });
  }

  protected setRoleFilter(value: string): void {
    this.patch({ role: value || null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ q: null, statut: null, role: null });
  }

  /** Relance le chargement après une erreur récupérable, sans recharger la page. */
  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  // La création de compte a quitté cette page pour un écran plein (NewAccountPage,
  // /admin/security/accounts/new) : plus de formulaire modal ici.
  private readonly toast = inject(ToastService);

  // ------------------------------------------------------------ Actions de compte

  /**
   * Action en attente de confirmation. On demande toujours confirmation avant d'agir sur
   * un compte : suspendre ou relancer un enrôlement ne doit pas partir d'un clic seul.
   */
  protected readonly pendingAction = signal<AccountAction | null>(null);
  protected readonly actioning = signal(false);

  /**
   * Motif de l'action sensible. OBLIGATOIRE pour les trois gestes (BO-030) : suspendre,
   * réactiver et réinitialiser un second facteur se consignent au journal d'audit, et une
   * décision sans raison écrite ne peut ni s'expliquer ni se contester plus tard. On exige
   * un minimum de substance — quelques caractères — pour qu'un simple espace ne passe pas.
   */
  protected readonly actionReason = signal('');
  protected readonly actionReasonValid = computed(() => this.actionReason().trim().length >= 5);

  protected askSuspend(account: SecurityAccount): void {
    this.actionReason.set('');
    this.pendingAction.set({ kind: 'suspend', account });
  }

  protected askReactivate(account: SecurityAccount): void {
    this.actionReason.set('');
    this.pendingAction.set({ kind: 'reactivate', account });
  }

  protected askDelete(account: SecurityAccount): void {
    this.actionReason.set('');
    this.pendingAction.set({ kind: 'delete', account });
  }

  protected askResetTwoFactor(account: SecurityAccount): void {
    this.actionReason.set('');
    this.pendingAction.set({ kind: 'reset2fa', account });
  }

  protected updateActionReason(value: string): void {
    this.actionReason.set(value);
  }

  /** Libellé du champ de motif, propre au geste demandé. */
  protected readonly actionReasonLabel = computed(() => {
    switch (this.pendingAction()?.kind) {
      case 'suspend':
        return 'Motif de la suspension (obligatoire)';
      case 'reactivate':
        return 'Motif de la réactivation (obligatoire)';
      default:
        return 'Motif de la réinitialisation (obligatoire)';
    }
  });

  protected readonly actionReasonPlaceholder = computed(() => {
    switch (this.pendingAction()?.kind) {
      case 'suspend':
        return 'Ex. départ de l’organisation constaté le 12 juin';
      case 'reactivate':
        return 'Ex. retour de mission, accès rétabli à la demande du responsable';
      default:
        return 'Ex. demande du membre après perte de son téléphone';
    }
  });

  protected cancelAction(): void {
    if (!this.actioning()) {
      this.pendingAction.set(null);
      this.actionReason.set('');
    }
  }

  protected readonly actionTitle = computed(() => {
    switch (this.pendingAction()?.kind) {
      case 'suspend':
        return 'Suspendre le compte';
      case 'reactivate':
        return 'Réactiver le compte';
      case 'reset2fa':
        return 'Réinitialiser le second facteur';
      case 'delete':
        return 'Supprimer le compte';
      default:
        return '';
    }
  });

  protected readonly actionMessage = computed(() => {
    const action = this.pendingAction();
    if (!action) {
      return '';
    }
    const name = action.account.fullName;
    switch (action.kind) {
      case 'suspend':
        return `${name} ne pourra plus se connecter tant que le compte reste suspendu.`;
      case 'reactivate':
        return `${name} pourra de nouveau se connecter.`;
      case 'reset2fa':
        return `${name} devra réenrôler son second facteur à la prochaine connexion. La protection n’est pas désactivée, elle est relancée.`;
      case 'delete':
        return `Le compte de ${name} sera supprimé définitivement, avec ses rôles et son second facteur. Cette action est irréversible. Une adhésion rattachée redeviendra disponible pour un nouveau compte.`;
      default:
        return '';
    }
  });

  protected readonly actionConfirmLabel = computed(() => {
    switch (this.pendingAction()?.kind) {
      case 'suspend':
        return 'Suspendre';
      case 'reactivate':
        return 'Réactiver';
      case 'reset2fa':
        return 'Réinitialiser';
      case 'delete':
        return 'Supprimer définitivement';
      default:
        return 'Confirmer';
    }
  });

  /** L'action destructive porte un bouton de confirmation en variante critique. */
  protected readonly actionIsDestructive = computed(() => this.pendingAction()?.kind === 'delete');

  protected confirmAction(): void {
    const action = this.pendingAction();
    if (!action || this.actioning()) {
      return;
    }
    // Aucune action sensible ne part sans motif : garde-fou en plus du bouton désactivé.
    if (!this.actionReasonValid()) {
      return;
    }
    const reason = this.actionReason().trim();
    let request$: Observable<unknown>;
    switch (action.kind) {
      case 'reset2fa':
        request$ = this.gateway.resetTwoFactor(action.account.id, reason);
        break;
      case 'delete':
        request$ = this.gateway.deleteAccount(action.account.id, reason);
        break;
      default:
        request$ = this.gateway.changeAccountStatus(
          action.account.id,
          action.kind === 'suspend' ? 'SUSPENDED' : 'ACTIVE',
          reason,
        );
    }
    this.actioning.set(true);
    // Le nom vient de la ligne, pas de la réponse : la suppression ne renvoie aucun compte.
    const name = action.account.fullName;
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.actioning.set(false);
        this.pendingAction.set(null);
        this.actionReason.set('');
        this.toast.success(this.successMessage(action.kind, name));
        this.retryTick.update((tick) => tick + 1);
      },
      error: () => {
        this.actioning.set(false);
        this.toast.error('L’action a échoué. Réessayez ou contactez le support.');
      },
    });
  }

  private successMessage(kind: AccountActionKind, name: string): string {
    switch (kind) {
      case 'suspend':
        return `Compte de ${name} suspendu.`;
      case 'reactivate':
        return `Compte de ${name} réactivé.`;
      case 'reset2fa':
        return `Second facteur de ${name} réinitialisé.`;
      case 'delete':
        return `Compte de ${name} supprimé.`;
    }
  }

  // ------------------------------------------------- Lien d'activation / récupération

  /**
   * Émission d'un lien d'accès. Deux temps distincts : d'abord une confirmation
   * (`credentialCandidate`), puis l'affichage du lien produit (`issuedCredential`). Le lien
   * n'est montré QU'UNE FOIS — le serveur n'en garde que l'empreinte — d'où un dialogue
   * dédié plutôt qu'un simple toast qui disparaîtrait avant d'être copié.
   */
  protected readonly credentialCandidate = signal<SecurityAccount | null>(null);
  protected readonly issuingCredential = signal(false);
  protected readonly issuedCredential = signal<IssuedCredential | null>(null);
  protected readonly linkCopied = signal(false);

  protected askIssueCredential(account: SecurityAccount): void {
    this.credentialCandidate.set(account);
  }

  protected cancelIssueCredential(): void {
    if (!this.issuingCredential()) {
      this.credentialCandidate.set(null);
    }
  }

  /** Vrai lorsque le compte n'a encore jamais pu se connecter : c'est une activation. */
  protected readonly credentialIsActivation = computed(
    () => this.credentialCandidate()?.status === 'INVITED',
  );

  protected confirmIssueCredential(): void {
    const account = this.credentialCandidate();
    if (!account || this.issuingCredential()) {
      return;
    }
    this.issuingCredential.set(true);
    this.gateway
      .issueCredentialToken(account.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.issuingCredential.set(false);
          this.credentialCandidate.set(null);
          this.linkCopied.set(false);
          this.issuedCredential.set({
            accountName: account.fullName,
            link: this.buildCredentialLink(result, account),
            expiresAtLabel: this.formatExpiry(result.expiresAt),
            activation: result.activation,
          });
          // La liste rafraîchit l'état 2FA / statut, inchangé ici mais cohérent avec l'audit.
          this.retryTick.update((tick) => tick + 1);
        },
        error: () => {
          this.issuingCredential.set(false);
          this.toast.error('Le lien n’a pas pu être émis. Réessayez ou contactez le support.');
        },
      });
  }

  protected closeIssuedCredential(): void {
    this.issuedCredential.set(null);
    this.linkCopied.set(false);
  }

  /** Copie le lien dans le presse-papiers ; l'état copié double le retour visuel. */
  protected copyIssuedLink(): void {
    const issued = this.issuedCredential();
    if (!issued) {
      return;
    }
    void navigator.clipboard
      ?.writeText(issued.link)
      .then(() => this.linkCopied.set(true))
      .catch(() => this.linkCopied.set(false));
  }

  /**
   * Construit le lien que l'opérateur transmet. La route diffère selon qu'il s'agit d'une
   * activation ou d'une récupération : l'écran d'arrivée n'annonce pas la même chose.
   *
   * L'e-mail du titulaire est porté par le lien (`login`) pour enchaîner automatiquement,
   * après la pose du mot de passe, sur la connexion puis l'enrôlement du second facteur —
   * sans ressaisie. Ce n'est pas un secret (un jeton invalide échoue de toute façon) ; le
   * mot de passe, lui, ne transite jamais par l'URL.
   */
  private buildCredentialLink(result: CredentialTokenResult, account: SecurityAccount): string {
    const path = result.activation ? '/auth/activate' : '/auth/reset-password';
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    // Un compte membre atterrit dans l'espace membre, un compte professionnel dans le
    // back-office : l'espace guide la redirection finale après le second facteur.
    const space = account.accountType === 'MEMBER' ? 'member' : 'admin';
    return (
      `${origin}${path}?token=${encodeURIComponent(result.token)}` +
      `&login=${encodeURIComponent(account.email)}&space=${space}`
    );
  }

  /** Échéance formatée fr-ML ; à défaut d'une date lisible, on rend la valeur brute. */
  private formatExpiry(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return new Intl.DateTimeFormat('fr-ML', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  }

  private patch(params: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}

/** Lien d'accès émis, tel que le dialogue le présente à l'opérateur. */
interface IssuedCredential {
  readonly accountName: string;
  readonly link: string;
  readonly expiresAtLabel: string;
  readonly activation: boolean;
}

type AccountActionKind = 'suspend' | 'reactivate' | 'reset2fa' | 'delete';
interface AccountAction {
  readonly kind: AccountActionKind;
  readonly account: SecurityAccount;
}
