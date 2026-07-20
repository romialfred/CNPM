import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideBanknote,
  LucideCheck,
  LucideDownload,
  LucideFileText,
  LucideHistory,
  LucideLandmark,
  LucideRefreshCw,
  LucideScrollText,
  LucideSmartphone,
  LucideTarget,
  LucideUpload,
  LucideWallet,
  LucideWorkflow,
} from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent, type CnpmAlertTone } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
  SortState,
} from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  FilterBarComponent,
  type FilterChip,
} from '../../../design-system/filter-bar/filter-bar.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TabsComponent, type CnpmTab } from '../../../design-system/tabs/tabs.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  PAYMENTS_GATEWAY,
  PaymentsAccessError,
  PaymentsValidationError,
  type AnomalyType,
  type AuditEntry,
  type MatchSuggestion,
  type PaymentChannel,
  type PaymentsQuery,
  type ReconciliationAssignment,
  type ReconciliationQueue,
  type ReconciliationStatus,
  type StatementLine,
} from './payments-gateway';

/**
 * Files de travail. Les libellés nomment ce que la file contient réellement : le
 * troisième onglet regroupe les lignes rapprochées et confirmées, pas des reçus —
 * l'émission d'un reçu relève d'un autre écran et d'une décision non arbitrée (DEC-005).
 */
const QUEUES: readonly CnpmTab[] = [
  { id: 'a-rapprocher', label: 'À rapprocher' },
  { id: 'a-confirmer', label: 'À confirmer' },
  { id: 'traites', label: 'Traités' },
];

const QUEUE_IDS: readonly ReconciliationQueue[] = ['a-rapprocher', 'a-confirmer', 'traites'];

/** Nom du contenu d'une file, au singulier et au pluriel : le compteur les accorde. */
const QUEUE_NOUNS: Readonly<Record<ReconciliationQueue, string>> = {
  'a-rapprocher': 'à rapprocher',
  'a-confirmer': 'à confirmer',
  traites: 'traités',
};

const STATUS_LABELS: Readonly<Record<ReconciliationStatus, string>> = {
  UNMATCHED: 'Non rapproché',
  TO_CONFIRM: 'À confirmer',
  MATCHED: 'Rapproché',
  ANOMALY: 'Anomalie',
};

/**
 * Le ton double le libellé, il ne le remplace pas : `cnpm-badge` rend toujours le
 * texte, si bien qu'aucun statut n'est porté par la seule couleur.
 */
const STATUS_TONES: Readonly<Record<ReconciliationStatus, CnpmBadgeTone>> = {
  UNMATCHED: 'warning',
  TO_CONFIRM: 'info',
  MATCHED: 'success',
  ANOMALY: 'error',
};

const CHANNEL_LABELS: Readonly<Record<PaymentChannel, string>> = {
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement bancaire',
  CASH: 'Espèces',
  CHECK: 'Chèque',
};

const ANOMALY_LABELS: Readonly<Record<AnomalyType, string>> = {
  DUPLICATE: 'Encaissement en double',
  UNKNOWN_PAYER: 'Payeur non identifié',
  AMOUNT_MISMATCH: 'Montant incohérent',
  OUT_OF_SCOPE: 'Hors périmètre CNPM',
};

/**
 * Seuil de qualification d'une correspondance — **non arbitré, cf. FIN-DEC-001**.
 *
 * Cette valeur ne provient d'aucune source : ni la fiche BO-014, ni le contrat, ni le
 * TDR ne la fixent. Elle n'habilite plus aucune écriture : le rapprochement en lot,
 * que FIN-DEC-001 laisse explicitement en suspens (« le rapprochement en lot est-il
 * autorisé — et à partir de quel seuil ? »), est retiré de l'écran. Elle ne sert plus
 * qu'à traduire le score en mots, comportement conservé à l'identique tant que la
 * décision n'est pas rendue.
 */
const AUTO_MATCH_THRESHOLD = 90;

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

type AllocationMode = 'complete' | 'partial';

/** Avancement réel d'une étape ; jamais une position dans un assistant décoratif. */
type StepState = 'done' | 'current' | 'todo';

interface ReconciliationStep {
  readonly index: number;
  readonly title: string;
  readonly hint: string;
  readonly state: StepState;
  /** Avancement écrit ; l'étape n'est jamais signalée par la seule couleur. */
  readonly stateLabel: string;
}

interface PanelFeedback {
  readonly tone: CnpmAlertTone;
  readonly title: string;
  readonly body: string;
}

const STEP_STATE_LABELS: Readonly<Record<StepState, string>> = {
  done: 'Étape franchie',
  current: 'Étape en cours',
  todo: 'Étape à venir',
};

const STEP_DEFINITIONS: readonly { readonly title: string; readonly hint: string }[] = [
  { title: 'Paiement sélectionné', hint: 'Choisir un paiement à rapprocher' },
  { title: 'Rapprochement', hint: 'Vérifier la correspondance' },
  { title: 'Confirmation', hint: 'Valider et générer le reçu' },
];

/**
 * Avancement par statut de la ligne examinée. Aucun statut n'est franchi d'avance :
 * une ligne encore non rapprochée n'a pas « passé » l'étape de rapprochement.
 */
const STEP_STATES: Readonly<Record<ReconciliationStatus, readonly StepState[]>> = {
  UNMATCHED: ['done', 'current', 'todo'],
  // Une anomalie sort la ligne du parcours d'affectation sans faire avancer la
  // confirmation : l'étape 2 reste celle où se joue le traitement.
  ANOMALY: ['done', 'current', 'todo'],
  TO_CONFIRM: ['done', 'done', 'current'],
  MATCHED: ['done', 'done', 'done'],
};

/** Aucun paiement choisi : rien n'est franchi, tout commence à l'étape 1. */
const STEP_STATES_IDLE: readonly StepState[] = ['current', 'todo', 'todo'];

/**
 * BO-014 — paiements et rapprochement.
 *
 * File, filtres, tri, page et ligne examinée vivent dans l'URL : la vue reste
 * partageable, et un agent peut transmettre exactement la ligne qu'il examine.
 *
 * Trois fonctions de la maquette ne sont pas rendues, faute de support au contrat
 * (FIN-DEC-002) : l'import de relevé et l'export sont présents mais explicitement
 * indisponibles ; l'enregistrement en brouillon et le filtre par période sont absents,
 * un contrôle qui ne produit rien étant un mensonge d'interface.
 */
@Component({
  selector: 'cnpm-payments-reconciliation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    InlineErrorSummaryComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    TabsComponent,
    LucideBanknote,
    LucideCheck,
    LucideDownload,
    LucideFileText,
    LucideHistory,
    LucideLandmark,
    LucideRefreshCw,
    LucideScrollText,
    LucideSmartphone,
    LucideTarget,
    LucideUpload,
    LucideWallet,
    LucideWorkflow,
  ],
  templateUrl: './payments-reconciliation.page.html',
  styleUrls: [
    './payments-reconciliation.page.scss',
    './payments-reconciliation.workbench.scss',
  ],
})
export class PaymentsReconciliationPage {
  private readonly gateway = inject(PAYMENTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly queues = QUEUES;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly channelLabels = CHANNEL_LABELS;
  protected readonly anomalyLabels = ANOMALY_LABELS;
  protected readonly anomalyTypes = Object.keys(ANOMALY_LABELS) as readonly AnomalyType[];

  /** Ancres des messages d'erreur ; le résumé y renvoie le focus. */
  protected readonly suggestionFieldId = 'rapprochement-correspondance';
  protected readonly amountFieldId = 'rapprochement-montant';
  protected readonly commentFieldId = 'rapprochement-commentaire';
  protected readonly anomalyFieldId = 'anomalie-type';
  protected readonly alternativesId = 'rapprochement-alternatives';

  protected readonly filtersExpanded = signal(true);
  protected readonly alternativesOpen = signal(false);
  protected readonly submitting = signal(false);
  protected readonly feedback = signal<PanelFeedback | null>(null);
  protected readonly formErrors = signal<readonly CnpmFieldError[]>([]);

  /** L'URL est l'unique source de vérité des filtres ; aucun état parallèle. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly queue = computed<ReconciliationQueue>(() => {
    const value = this.params().get('file');
    return QUEUE_IDS.includes(value as ReconciliationQueue)
      ? (value as ReconciliationQueue)
      : 'a-rapprocher';
  });

  protected readonly search = computed(() => this.params().get('q') ?? '');

  protected readonly channel = computed<PaymentChannel | null>(() => {
    const value = this.params().get('canal');
    return value && value in CHANNEL_LABELS ? (value as PaymentChannel) : null;
  });

  protected readonly page = computed(() => {
    const value = Number(this.params().get('page'));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });

  protected readonly pageSize = computed(() => {
    const value = Number(this.params().get('taille'));
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_PAGE_SIZE;
  });

  protected readonly sort = computed<SortState | null>(() => {
    const key = this.params().get('tri');
    if (!key) {
      return null;
    }
    return { key, direction: this.params().get('ordre') === 'desc' ? 'desc' : 'asc' };
  });

  /** Ligne examinée dans le panneau de rapprochement ; portée par l'URL, donc partageable. */
  protected readonly examinedId = computed(() => this.params().get('ligne'));

  /** Saisie en cours de la recherche ; ne devient un filtre qu'à la validation. */
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  private readonly query = computed<PaymentsQuery>(() => ({
    queue: this.queue(),
    search: this.search(),
    channel: this.channel(),
    sort: this.sort(),
    page: this.page(),
    pageSize: this.pageSize(),
  }));

  /**
   * Relance manuelle. Incrémenter ce compteur ré-émet la même requête sans toucher à
   * l'URL : « Réessayer » recharge en place, et une écriture réussie rafraîchit la file
   * sans perdre les filtres.
   */
  private readonly refreshTick = signal(0);

  private readonly fetchTrigger = computed(() => ({
    query: this.query(),
    tick: this.refreshTick(),
  }));

  /**
   * `switchMap` abandonne la requête précédente dès qu'un filtre change : sans lui, une
   * réponse lente à un filtre déjà abandonné écraserait la réponse courante.
   */
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.search(query).pipe(
          map((page) => ({ kind: 'ready' as const, page })),
          catchError((error: unknown) =>
            of(
              error instanceof PaymentsAccessError
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

  private readonly data = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.page : null;
  });

  protected readonly lines = computed<readonly StatementLine[]>(() => this.data()?.lines ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalItems ?? 0);
  protected readonly overview = computed(() => this.data()?.overview ?? null);
  protected readonly auditTrail = computed<readonly AuditEntry[]>(
    () => this.data()?.auditTrail ?? [],
  );
  protected readonly channels = computed<readonly PaymentChannel[]>(
    () => this.data()?.channels ?? [],
  );

  protected readonly hasFilters = computed(() => Boolean(this.search() || this.channel()));

  /** Compteur de tête : il décrit exactement la liste affichée sous lui. */
  protected readonly queueCountLabel = computed(() => {
    const total = this.totalItems();
    const noun = QUEUE_NOUNS[this.queue()];
    return `${total} ${total === 1 ? 'paiement' : 'paiements'} ${noun}`;
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
    if (result.page.lines.length > 0) {
      return 'ready';
    }
    // Une file vide et un filtre trop étroit appellent des gestes opposés : attendre
    // le prochain encaissement, ou élargir la recherche.
    return this.hasFilters() ? 'noResult' : 'empty';
  });

  /**
   * La première colonne porte la sélection unique de la maquette. Elle est déclarée ici
   * plutôt que déléguée à `selectable` du tableau : ce dernier rend des cases à cocher,
   * donc une sélection multiple, qui ouvrirait la porte à des écritures en lot que
   * FIN-DEC-001 laisse sans arbitrage.
   */
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'select', label: 'Choix' },
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'payer', label: 'Payeur', sortable: true },
    { key: 'valueDate', label: 'Date', sortable: true },
    { key: 'channel', label: 'Canal' },
    { key: 'amount', label: 'Montant', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'status', label: 'Statut' },
  ];

  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const search = this.search();
    if (search) {
      chips.push({ key: 'q', label: `Recherche : ${search}` });
    }
    const channel = this.channel();
    if (channel) {
      chips.push({ key: 'canal', label: `Canal : ${CHANNEL_LABELS[channel]}` });
    }
    return chips;
  });

  /**
   * Ligne examinée. Rien n'est examiné tant que l'URL ne nomme pas de ligne : présélectionner
   * la première ferait mentir l'indicateur d'étapes, qui annoncerait un paiement choisi
   * alors que personne n'a choisi.
   */
  protected readonly examined = computed<StatementLine | null>(() => {
    const id = this.examinedId();
    return (id ? this.lines().find((line) => line.id === id) : null) ?? null;
  });

  protected readonly suggestions = computed<readonly MatchSuggestion[]>(
    () => this.examined()?.suggestions ?? [],
  );

  /** Correspondance en tête de la liste rendue par la source ; l'écran ne la reclasse pas. */
  protected readonly recommended = computed<MatchSuggestion | null>(
    () => this.suggestions()[0] ?? null,
  );

  protected readonly alternatives = computed<readonly MatchSuggestion[]>(() =>
    this.suggestions().slice(1),
  );

  /**
   * Avancement réel du parcours. Ce n'est pas un assistant : rien n'y est cliquable et
   * rien n'y empêche de revenir en arrière — l'indicateur décrit l'état, il ne le pilote pas.
   */
  protected readonly steps = computed<readonly ReconciliationStep[]>(() => {
    const line = this.examined();
    const states = line ? STEP_STATES[line.status] : STEP_STATES_IDLE;
    return STEP_DEFINITIONS.map((definition, index) => ({
      index: index + 1,
      title: definition.title,
      hint: definition.hint,
      state: states[index],
      stateLabel: STEP_STATE_LABELS[states[index]],
    }));
  });

  protected readonly form = this.fb.group({
    suggestionId: [''],
    allocationMode: ['complete' as AllocationMode],
    /** Chaîne, non `number` : un champ vidé rend `''`, que `number` transformerait en 0. */
    allocatedAmount: [''],
    comment: [''],
    anomalyType: ['' as AnomalyType | ''],
  });

  /** Suit la saisie du montant pour recalculer le solde à mesure. */
  private readonly amountDraft = toSignal(this.form.controls.allocatedAmount.valueChanges, {
    initialValue: '',
  });

  private readonly suggestionDraft = toSignal(this.form.controls.suggestionId.valueChanges, {
    initialValue: '',
  });

  protected readonly allocationMode = toSignal(this.form.controls.allocationMode.valueChanges, {
    initialValue: 'complete' as AllocationMode,
  });

  /** Correspondance réellement cochée : c'est elle que le résumé décrit, pas la recommandée. */
  protected readonly chosenSuggestion = computed<MatchSuggestion | null>(() => {
    const id = this.suggestionDraft();
    return this.suggestions().find((suggestion) => suggestion.id === id) ?? this.recommended();
  });

  /**
   * Montant qui serait effectivement affecté. En mode « complète », c'est le montant
   * encaissé : proposer un champ modifiable qui n'est pas lu induirait en erreur.
   */
  protected readonly effectiveAmount = computed<number | null>(() => {
    const line = this.examined();
    if (!line) {
      return null;
    }
    return this.allocationMode() === 'complete'
      ? line.amount
      : this.parseAmount(this.amountDraft());
  });

  /** Écart restant après l'opération ; `null` tant que le montant est illisible. */
  protected readonly remainder = computed<number | null>(() => {
    const line = this.examined();
    const amount = this.effectiveAmount();
    if (!line || amount === null) {
      return null;
    }
    return line.amount - amount;
  });

  /** L'écart est qualifié par un mot ; la couleur ne le porte jamais seule. */
  protected readonly remainderLabel = computed(() => {
    const remainder = this.remainder();
    if (remainder === null) {
      return 'Montant à affecter illisible';
    }
    return remainder === 0 ? 'Affectation complète, aucun reste' : 'Reste à affecter';
  });

  protected readonly remainderTone = computed<CnpmBadgeTone>(() =>
    this.remainder() === 0 ? 'success' : 'warning',
  );

  constructor() {
    // Changer de ligne remet le formulaire à son état neutre, avec la meilleure
    // correspondance présélectionnée. Sans cette remise à zéro, le montant saisi pour
    // une ligne s'appliquerait à la suivante — une écriture financière sur la mauvaise
    // ligne, sans que rien ne l'annonce.
    effect(() => {
      const line = this.examined();
      this.form.reset({
        suggestionId: line?.suggestions[0]?.id ?? '',
        allocationMode: 'complete',
        allocatedAmount: line ? String(line.amount) : '',
        comment: '',
        anomalyType: '',
      });
      this.formErrors.set([]);
      this.alternativesOpen.set(false);
    });
  }

  protected readonly rowKey = (line: StatementLine): string => line.id;
  protected readonly rowLabel = (line: StatementLine): string =>
    `${line.reference} — ${line.payer}`;

  protected statusLabel(status: ReconciliationStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: ReconciliationStatus): CnpmBadgeTone {
    return STATUS_TONES[status];
  }

  protected channelLabel(channel: PaymentChannel): string {
    return CHANNEL_LABELS[channel];
  }

  /**
   * Qualificatif de confiance. Le score seul n'est pas un statut lisible : « 74 » ne
   * dit pas s'il faut vérifier. Le mot accompagne le chiffre, jamais une couleur seule.
   *
   * Les bornes restent celles d'avant la refonte : FIN-DEC-001 les bloque, et la
   * maquette propose un qualificatif plus affirmatif encore (« Correspondance très
   * fiable ») qu'aucune source ne justifie.
   */
  protected confidenceLabel(score: number): string {
    if (score >= AUTO_MATCH_THRESHOLD) {
      return 'Confiance élevée';
    }
    return score >= 70 ? 'Confiance moyenne' : 'Confiance faible';
  }

  protected confidenceTone(score: number): CnpmBadgeTone {
    if (score >= AUTO_MATCH_THRESHOLD) {
      return 'success';
    }
    return score >= 70 ? 'warning' : 'neutral';
  }

  protected outcomeLabel(outcome: AuditEntry['outcome']): string {
    switch (outcome) {
      case 'success':
        return 'Réussi';
      case 'pending':
        return 'En attente';
      default:
        return 'Rejeté';
    }
  }

  protected outcomeTone(outcome: AuditEntry['outcome']): CnpmBadgeTone {
    switch (outcome) {
      case 'success':
        return 'success';
      case 'pending':
        return 'info';
      default:
        return 'error';
    }
  }

  protected setQueue(queue: string): void {
    this.patch({ file: queue === 'a-rapprocher' ? null : queue, page: null, ligne: null });
  }

  protected applySearch(): void {
    this.patch({ q: this.searchDraft().trim() || null, page: null, ligne: null });
  }

  protected setChannel(value: string): void {
    this.patch({ canal: value || null, page: null, ligne: null });
  }

  protected onSortChange(sort: SortState): void {
    this.patch({ tri: sort.key, ordre: sort.direction, page: null, ligne: null });
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page, ligne: null });
  }

  protected onPageSizeChange(size: number): void {
    // La page repart à 1 : rester en page 12 après être passé à 50 par page renverrait
    // au-delà de la fin du jeu.
    this.patch({ taille: size === DEFAULT_PAGE_SIZE ? null : size, page: null, ligne: null });
  }

  protected removeChip(key: string): void {
    if (key === 'q') {
      this.searchDraft.set('');
    }
    this.patch({ [key]: null, page: null, ligne: null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ q: null, canal: null, page: null, ligne: null });
  }

  /** Ouvre une ligne dans le plan de travail, sans perdre les filtres. */
  protected examine(line: StatementLine): void {
    this.feedback.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ligne: line.id },
      queryParamsHandling: 'merge',
    });
  }

  protected closePanel(): void {
    this.feedback.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ligne: null },
      queryParamsHandling: 'merge',
    });
  }

  protected isExamined(line: StatementLine): boolean {
    return this.examined()?.id === line.id;
  }

  protected toggleAlternatives(): void {
    this.alternativesOpen.update((open) => !open);
  }

  protected refresh(): void {
    this.refreshTick.update((tick) => tick + 1);
  }

  /**
   * Rapproche la ligne examinée.
   *
   * La clé d'idempotence est dérivée de l'intention (ligne, correspondance, montant) :
   * un second envoi identique — double clic, renvoi réseau — porte la même clé et la
   * source rend l'écriture déjà enregistrée au lieu d'en créer une seconde. Un client
   * HTTP réel génèrera un UUID une fois par intention et le rejouera tel quel.
   */
  protected reconcileExamined(): void {
    const line = this.examined();
    if (!line || this.submitting()) {
      return;
    }

    const errors = this.validateMatch(line);
    this.formErrors.set(errors);
    if (errors.length > 0) {
      return;
    }

    const amount = this.effectiveAmount();
    if (amount === null) {
      return;
    }

    const { suggestionId, comment } = this.form.getRawValue();
    const assignments: readonly ReconciliationAssignment[] = [
      { lineId: line.id, suggestionId, allocatedAmount: amount },
    ];

    this.submitting.set(true);
    this.gateway
      .reconcile({
        idempotencyKey: this.idempotencyKey('match', assignments),
        assignments,
        comment: comment.trim() || null,
      })
      .subscribe({
        next: (outcome) =>
          this.onWriteSuccess(
            outcome.replayed,
            'Rapprochement enregistré',
            `${line.reference} est en attente de validation par un second agent.`,
          ),
        error: (error: unknown) => this.onWriteFailure(error),
      });
  }

  /** Signale une anomalie : type ET commentaire, l'un sans l'autre est refusé. */
  protected reportAnomaly(): void {
    const line = this.examined();
    if (!line || this.submitting()) {
      return;
    }

    const { anomalyType, comment } = this.form.getRawValue();
    const errors: CnpmFieldError[] = [];
    if (!anomalyType) {
      errors.push({
        fieldId: this.anomalyFieldId,
        message: 'Choisissez le type d’anomalie à signaler.',
      });
    }
    if (!comment.trim()) {
      errors.push({
        fieldId: this.commentFieldId,
        message: 'Décrivez l’anomalie dans le commentaire ; il est obligatoire.',
      });
    }
    this.formErrors.set(errors);
    if (errors.length > 0 || !anomalyType) {
      return;
    }

    this.submitting.set(true);
    this.gateway
      .reportAnomaly({
        idempotencyKey: `anomaly|${line.id}|${anomalyType}|${comment.trim()}`,
        lineId: line.id,
        type: anomalyType,
        comment: comment.trim(),
      })
      .subscribe({
        next: (outcome) =>
          this.onWriteSuccess(
            outcome.replayed,
            'Anomalie signalée',
            `${line.reference} est sortie de la file de rapprochement et reste tracée.`,
          ),
        error: (error: unknown) => this.onWriteFailure(error),
      });
  }

  private validateMatch(line: StatementLine): readonly CnpmFieldError[] {
    const errors: CnpmFieldError[] = [];
    const { suggestionId, allocationMode, allocatedAmount } = this.form.getRawValue();

    if (!suggestionId) {
      errors.push({
        fieldId: this.suggestionFieldId,
        message: 'Choisissez la cotisation à rapprocher.',
      });
    }

    if (allocationMode === 'partial') {
      const amount = this.parseAmount(allocatedAmount);
      if (amount === null) {
        errors.push({
          fieldId: this.amountFieldId,
          message: 'Saisissez le montant à affecter en chiffres, sans décimale.',
        });
      } else if (amount <= 0) {
        errors.push({
          fieldId: this.amountFieldId,
          message: 'Le montant à affecter doit être supérieur à zéro.',
        });
      } else if (amount > line.amount) {
        errors.push({
          fieldId: this.amountFieldId,
          message: 'Le montant à affecter ne peut pas dépasser le montant encaissé.',
        });
      }
    }

    return errors;
  }

  /**
   * Lit un montant entier en FCFA. Espaces et espaces insécables sont tolérés : un
   * agent qui recopie « 12 500 000 » depuis un relevé ne doit pas être refusé pour la
   * mise en forme. Toute autre écriture rend `null` — jamais un `NaN` silencieux.
   */
  private parseAmount(raw: string): number | null {
    // `\s` couvre déjà l'espace insécable et l'espace fine insécable produits par le
    // formatage fr-ML : recoller « 12 500 000 » ne demande pas de classe sur mesure.
    const cleaned = raw.replace(/\s/g, '');
    if (!/^\d+$/.test(cleaned)) {
      return null;
    }
    const value = Number(cleaned);
    return Number.isSafeInteger(value) ? value : null;
  }

  private idempotencyKey(scope: string, assignments: readonly ReconciliationAssignment[]): string {
    return [
      scope,
      ...assignments
        .map((item) => `${item.lineId}:${item.suggestionId}:${item.allocatedAmount}`)
        .sort(),
    ].join('|');
  }

  private onWriteSuccess(replayed: boolean, title: string, body: string): void {
    this.submitting.set(false);
    this.formErrors.set([]);
    this.feedback.set(
      replayed
        ? {
            tone: 'info',
            title: 'Opération déjà enregistrée',
            body: 'Cette opération avait déjà été prise en compte ; rien n’a été écrit une seconde fois.',
          }
        : { tone: 'success', title, body },
    );
    // La file a changé d'état côté source : la relire évite d'afficher une ligne dans
    // une file qu'elle vient de quitter.
    this.refresh();
  }

  private onWriteFailure(error: unknown): void {
    this.submitting.set(false);
    if (error instanceof PaymentsValidationError) {
      // Refus métier de la source. Le message vient d'elle : c'est elle qui fait
      // autorité sur les montants, la vérification côté écran n'est qu'un confort.
      this.feedback.set({ tone: 'error', title: 'Opération refusée', body: error.message });
      return;
    }
    if (error instanceof PaymentsAccessError) {
      this.feedback.set({
        tone: 'error',
        title: 'Accès refusé',
        body: 'Vous n’avez pas les droits nécessaires pour cette opération.',
      });
      return;
    }
    this.feedback.set({
      tone: 'error',
      title: 'L’opération n’a pas abouti',
      body: 'Le service est momentanément indisponible. Votre saisie est conservée ; réessayez dans un instant.',
    });
  }

  private patch(params: Record<string, string | number | null>): void {
    this.feedback.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
