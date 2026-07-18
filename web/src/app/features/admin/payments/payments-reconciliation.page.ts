import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideDownload, LucideRefreshCw } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent, type CnpmAlertTone } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { BulkActionBarComponent } from '../../../design-system/bulk-action-bar/bulk-action-bar.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
  SortState,
} from '../../../design-system/data-table/data-table.model';
import {
  DefinitionListComponent,
  type CnpmDefinition,
} from '../../../design-system/definition-list/definition-list.component';
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
import {
  InsightSummaryComponent,
  type InsightStat,
} from '../../../design-system/insight-summary/insight-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TabsComponent, type CnpmTab } from '../../../design-system/tabs/tabs.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { DemoPaymentsGateway } from './demo-payments.gateway';
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

const QUEUES: readonly CnpmTab[] = [
  { id: 'a-rapprocher', label: 'À rapprocher' },
  { id: 'a-confirmer', label: 'À confirmer' },
  { id: 'traites', label: 'Traités' },
];

const QUEUE_IDS: readonly ReconciliationQueue[] = ['a-rapprocher', 'a-confirmer', 'traites'];

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
 * Seuil au-delà duquel une correspondance est jugée sûre.
 *
 * Il borne la seule action de masse de l'écran. Un rapprochement en lot sur des scores
 * moyens produirait des écritures financières que personne n'a examinées une à une.
 */
const AUTO_MATCH_THRESHOLD = 90;

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

type AllocationMode = 'complete' | 'partial';

interface PanelFeedback {
  readonly tone: CnpmAlertTone;
  readonly title: string;
  readonly body: string;
}

/**
 * BO-014 — rapprochement des paiements.
 *
 * File, filtres, tri, page et ligne examinée vivent dans l'URL : la vue reste
 * partageable, et un agent peut transmettre exactement la ligne qu'il examine.
 *
 * Trois zones de la fiche sur ≥1440 px — liste, rapprochement, aperçu du reçu. L'aperçu
 * du reçu n'est pas rendu ici : il relève de l'émission du reçu, dont le gabarit, le
 * cachet et le QR de vérification ne sont pas arbitrés. La fiche interdit explicitement
 * un faux cachet en production ; en dessiner un ici en ferait une maquette trompeuse.
 * L'écran couvre donc la liste, le rapprochement et la piste d'audit.
 */
@Component({
  selector: 'cnpm-payments-reconciliation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Le port est fourni ici pour que l'écran fonctionne sans toucher aux routes. Au
  // câblage définitif, déplacer cette fourniture dans `admin.routes.ts`, à côté de
  // `MEMBERS_GATEWAY` : un seul point d'assemblage pour tous les adaptateurs.
  providers: [{ provide: PAYMENTS_GATEWAY, useClass: DemoPaymentsGateway }],
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    BulkActionBarComponent,
    ButtonComponent,
    DataTableComponent,
    DefinitionListComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    InlineErrorSummaryComponent,
    InsightSummaryComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    TabsComponent,
    LucideDownload,
    LucideRefreshCw,
  ],
  templateUrl: './payments-reconciliation.page.html',
  styleUrl: './payments-reconciliation.page.scss',
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
  protected readonly autoMatchThreshold = AUTO_MATCH_THRESHOLD;

  /** Ancres des messages d'erreur ; le résumé y renvoie le focus. */
  protected readonly suggestionFieldId = 'rapprochement-correspondance';
  protected readonly amountFieldId = 'rapprochement-montant';
  protected readonly commentFieldId = 'rapprochement-commentaire';
  protected readonly anomalyFieldId = 'anomalie-type';

  protected readonly filtersExpanded = signal(true);
  /** Sélection bornée à la page affichée : une action de masse ne vise jamais des lignes jamais vues. */
  protected readonly selected = signal<ReadonlySet<string>>(new Set<string>());
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

  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'payer', label: 'Payeur', sortable: true },
    { key: 'amount', label: 'Montant encaissé', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'channel', label: 'Canal' },
    { key: 'status', label: 'Statut' },
    { key: 'suggestion', label: 'Correspondance proposée', sortable: true },
    { key: 'valueDate', label: 'Date de valeur', sortable: true },
    { key: 'actions', label: 'Actions' },
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
   * Les compteurs sont recopiés tels quels depuis la source ; aucun n'est recalculé ici.
   * Un second calcul côté écran pourrait diverger de celui qui alimente la table.
   */
  protected readonly queueStats = computed<readonly InsightStat[]>(() => {
    const summary = this.overview();
    if (!summary) {
      return [];
    }
    return [
      { label: 'À rapprocher', value: summary.toReconcile },
      { label: 'À confirmer', value: summary.toConfirm },
      { label: 'Anomalies', value: summary.anomalies },
      { label: 'Montant à affecter (FCFA)', value: summary.amountToReconcile, apart: true },
    ];
  });

  /** Ligne examinée, résolue sur la page courante. */
  protected readonly examined = computed<StatementLine | null>(() => {
    const id = this.examinedId();
    return id ? (this.lines().find((line) => line.id === id) ?? null) : null;
  });

  protected readonly suggestions = computed<readonly MatchSuggestion[]>(
    () => this.examined()?.suggestions ?? [],
  );

  /**
   * Lignes sélectionnées éligibles au rapprochement en lot : encore non rapprochées et
   * portant une correspondance au-dessus du seuil. Les autres exigent un examen.
   */
  protected readonly autoMatchable = computed<readonly StatementLine[]>(() =>
    this.lines().filter((line) => {
      if (!this.selected().has(line.id) || line.status !== 'UNMATCHED') {
        return false;
      }
      const best = line.suggestions[0];
      return best !== undefined && best.score >= AUTO_MATCH_THRESHOLD;
    }),
  );

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

  protected readonly allocationMode = toSignal(this.form.controls.allocationMode.valueChanges, {
    initialValue: 'complete' as AllocationMode,
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

  /** Reste à affecter après l'opération ; `null` tant que le montant est illisible. */
  protected readonly remainder = computed<number | null>(() => {
    const line = this.examined();
    const amount = this.effectiveAmount();
    if (!line || amount === null) {
      return null;
    }
    return line.amount - amount;
  });

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

  /** Détail immuable de la ligne examinée : la fiche impose une sélection non modifiable. */
  protected readonly paymentDetails = computed<readonly CnpmDefinition[]>(() => {
    const line = this.examined();
    if (!line) {
      return [];
    }
    return [
      { label: 'Référence paiement', value: line.reference },
      { label: 'Payeur', value: line.payer },
      { label: 'Canal', value: CHANNEL_LABELS[line.channel] },
      { label: 'N° de transaction', value: line.transactionReference },
    ];
  });

  protected readonly allocationDetails = computed<readonly CnpmDefinition[]>(() => {
    const allocation = this.examined()?.allocation;
    if (!allocation) {
      return [];
    }
    return [
      { label: 'Membre', value: `${allocation.memberName} (${allocation.memberCode})` },
      { label: 'Cotisation', value: allocation.contributionLabel },
      { label: 'Montant affecté (FCFA)', value: this.formatAmount(allocation.allocatedAmount) },
      { label: 'Reste à affecter (FCFA)', value: this.formatAmount(allocation.remainder) },
    ];
  });

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

  /** Ouvre une ligne dans le panneau, sans perdre les filtres ni la sélection de masse. */
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

  protected toggleRow(key: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  protected toggleAll(checked: boolean): void {
    // La portée est la page affichée, jamais la file entière : cocher l'en-tête ne doit
    // pas viser silencieusement des lignes que personne n'a vues.
    this.selected.set(checked ? new Set(this.lines().map(this.rowKey)) : new Set());
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
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
            `${line.reference} est en attente de confirmation par un second agent.`,
          ),
        error: (error: unknown) => this.onWriteFailure(error),
      });
  }

  /** Rapproche en lot les correspondances au-dessus du seuil, et elles seules. */
  protected reconcileSelected(): void {
    const eligible = this.autoMatchable();
    if (eligible.length === 0 || this.submitting()) {
      return;
    }

    const assignments: readonly ReconciliationAssignment[] = eligible.map((line) => ({
      lineId: line.id,
      suggestionId: line.suggestions[0].id,
      allocatedAmount: line.amount,
    }));

    this.submitting.set(true);
    this.gateway
      .reconcile({
        idempotencyKey: this.idempotencyKey('bulk', assignments),
        assignments,
        comment: null,
      })
      .subscribe({
        next: (outcome) =>
          this.onWriteSuccess(
            outcome.replayed,
            'Rapprochement en lot enregistré',
            `${outcome.affectedCount} ligne(s) passent en attente de confirmation.`,
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

  private formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-ML').format(value);
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
    this.clearSelection();
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
    this.clearSelection();
    this.feedback.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
