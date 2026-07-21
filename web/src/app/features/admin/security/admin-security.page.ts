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
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCheck, LucideKeyRound, LucideMinus, LucideUserPlus } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { DialogComponent } from '../../../design-system/dialog/dialog.component';
import { TextInputComponent } from '../../../design-system/text-input/text-input.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
} from '../../../design-system/data-table/data-table.model';
import { DefinitionListComponent } from '../../../design-system/definition-list/definition-list.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import {
  InsightSummaryComponent,
  type InsightStat,
} from '../../../design-system/insight-summary/insight-summary.component';
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
  type NewAccountInput,
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

const ACCOUNT_COLUMNS: readonly DataTableColumn[] = [
  { key: 'account', label: 'Utilisateur' },
  { key: 'role', label: 'Rôle' },
  { key: 'status', label: 'Statut du compte' },
  { key: 'twoFactor', label: 'Second facteur', note: '(2FA)' },
  { key: 'lastLogin', label: 'Dernière connexion' },
  { key: 'sessions', label: 'Sessions ouvertes', align: 'end' },
  { key: 'actions', label: 'Actions' },
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
    ReactiveFormsModule,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    DefinitionListComponent,
    DialogComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    InsightSummaryComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TabsComponent,
    TextInputComponent,
    LucideCheck,
    LucideKeyRound,
    LucideMinus,
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
  /** Six lignes au premier écran, puis la vue complète reste accessible par recherche. */
  protected readonly accountPreview = computed<readonly SecurityAccount[]>(() =>
    this.accounts().slice(0, 6),
  );
  protected readonly permissions = computed<readonly PermissionRow[]>(
    () => this.data()?.permissions ?? [],
  );
  protected readonly permissionPreview = computed<readonly PermissionRow[]>(() =>
    this.permissions().slice(0, 6),
  );
  protected readonly roles = computed(() => this.data()?.roles ?? []);
  protected readonly sessions = computed<readonly SecuritySession[]>(
    () => this.data()?.sessions ?? [],
  );
  protected readonly audit = computed<readonly AuditEntry[]>(() => this.data()?.audit ?? []);
  protected readonly policy = computed(() => this.data()?.policy ?? []);
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
        return this.accountPreview().length;
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
    // les confondre mène l'un des deux dans une impasse.
    return this.search() ? 'noResult' : 'empty';
  });

  /**
   * Agrégats de posture, recopiés tels quels depuis la source.
   *
   * Aucun n'est recalculé ici : un second calcul côté écran pourrait diverger de celui
   * qui alimente les tableaux, et afficher un total que la liste juste en dessous
   * contredit.
   */
  protected readonly postureStats = computed<readonly InsightStat[]>(() => {
    const posture = this.data()?.posture;
    if (!posture) {
      return [];
    }
    return [
      { label: 'Comptes ouverts', value: posture.accountsTotal },
      { label: 'Comptes actifs', value: posture.activeAccounts },
      { label: 'Comptes suspendus', value: posture.suspendedAccounts },
      { label: 'Second facteur activé', value: posture.twoFactorEnabled },
      { label: 'Sessions ouvertes', value: posture.openSessions, apart: true },
    ];
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
    this.patch({ onglet: tab === this.defaultTab ? null : tab, q: null });
  }

  protected applySearch(): void {
    this.patch({ q: this.searchDraft().trim() || null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ q: null });
  }

  /** Relance le chargement après une erreur récupérable, sans recharger la page. */
  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  // ------------------------------------------------------------ Création de compte

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly createOpen = signal(false);
  protected readonly creating = signal(false);
  /** Erreur globale du formulaire (refus de la source), distincte des erreurs de champ. */
  protected readonly createError = signal<string | null>(null);

  /**
   * Rôles proposés à la création : ceux réellement présents dans l'instantané. Aucun
   * rôle n'est inventé côté écran ; si la liste n'est pas encore chargée, elle est vide
   * et le formulaire ne peut pas être soumis.
   */
  protected readonly roleOptions = computed(() => this.roles());

  protected readonly createForm = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.maxLength(80)]),
    lastName: this.fb.control('', [Validators.required, Validators.maxLength(80)]),
    email: this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(160)]),
    roleId: this.fb.control('', [Validators.required]),
  });

  protected openCreate(): void {
    this.createForm.reset({ firstName: '', lastName: '', email: '', roleId: '' });
    this.createError.set(null);
    this.createOpen.set(true);
  }

  protected closeCreate(): void {
    // Ne pas fermer pendant l'envoi : l'opérateur perdrait le retour de l'opération.
    if (!this.creating()) {
      this.createOpen.set(false);
    }
  }

  /** Message d'erreur d'un champ, seulement une fois qu'il a été touché. */
  protected fieldError(control: keyof typeof this.createForm.controls): string | null {
    const field = this.createForm.controls[control];
    if (field.valid || !(field.touched || field.dirty)) {
      return null;
    }
    if (field.hasError('required')) {
      return 'Ce champ est obligatoire.';
    }
    if (field.hasError('email')) {
      return 'Adresse électronique invalide.';
    }
    if (field.hasError('maxlength')) {
      return 'Ce champ est trop long.';
    }
    return null;
  }

  protected submitCreate(): void {
    if (this.creating()) {
      return;
    }
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const raw = this.createForm.getRawValue();
    const input: NewAccountInput = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      roleId: raw.roleId,
    };
    this.creating.set(true);
    this.createError.set(null);
    this.gateway
      .createAccount(input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.creating.set(false);
          this.createOpen.set(false);
          // Le compte apparaîtra au rechargement ; le message le nomme pour lever le doute.
          this.toast.success(`Compte créé pour ${account.fullName}.`);
          this.retryTick.update((tick) => tick + 1);
        },
        error: (cause: unknown) => {
          this.creating.set(false);
          this.createError.set(
            cause instanceof AdminSecurityAccessError
              ? 'Vous n’avez pas le droit de créer un compte.'
              : 'La création a échoué. Réessayez ou contactez le support.',
          );
        },
      });
  }

  private patch(params: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
