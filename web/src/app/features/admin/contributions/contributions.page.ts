import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideChartColumnIncreasing,
  LucideDownload,
  LucideFileText,
  LucideReceiptText,
  LucideTrendingUp,
  LucideWalletCards,
} from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
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
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  CONTRIBUTIONS_GATEWAY,
  ContributionsAccessError,
  QUARTER_LABELS,
  QUARTERS,
  type ContributionCallQuery,
  type ContributionCallRow,
  type ContributionCallStatus,
  type Quarter,
} from './contributions-gateway';

const STATUS_LABELS: Readonly<Record<ContributionCallStatus, string>> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PARTIAL: 'Partiellement payé',
  // « Encaissé » et non « Encaisser » : critère d'acceptation de la fiche BO-011. La
  // maquette porte un impératif, donc une action, là où la colonne annonce un état.
  SETTLED: 'Encaissé',
  OVERDUE: 'En retard',
};

const STATUS_TONES: Readonly<Record<ContributionCallStatus, CnpmBadgeTone>> = {
  DRAFT: 'neutral',
  PENDING: 'info',
  PARTIAL: 'warning',
  SETTLED: 'success',
  OVERDUE: 'error',
};

const PAGE_SIZES = [5, 10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 5;

interface InstallmentView {
  readonly label: string;
  readonly dueDate: string;
  readonly amountDue: number;
  readonly amountPaid: number;
  readonly outstanding: number;
  readonly status: 'SETTLED' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

/**
 * BO-011 — appels de cotisation.
 *
 * Filtres, tri et page vivent dans l'URL : la vue reste partageable et le retour depuis
 * un détail retrouve son contexte, comme l'exige `frontend-angular.md`.
 *
 * Deux éléments de la fiche ne sont pas rendus ici, et le sont sciemment :
 *
 * - les onglets « Cotisations par membre » / « Appels générés » sont spécifiés comme
 *   *routés*, or le câblage des routes ne relève pas de cet écran ; un onglet non routé
 *   promettrait une adresse partageable qui n'existerait pas ;
 * - le détail d'échéancier et le graphique d'encaissements attendent respectivement un
 *   `Drawer` et un `ChartContainer`, absents du design system à ce jour. Les improviser
 *   dans une feature contredirait `ux-ui.md` (« réutiliser les composants du design
 *   system ») et créerait un composant hors catalogue.
 */
@Component({
  selector: 'cnpm-contributions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    AdminShellComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    LucideDownload,
    LucideFileText,
    LucideChartColumnIncreasing,
    LucideReceiptText,
    LucideTrendingUp,
    LucideWalletCards,
  ],
  templateUrl: './contributions.page.html',
  styleUrl: './contributions.page.scss',
})
export class ContributionsPage {
  private readonly gateway = inject(CONTRIBUTIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statuses = Object.keys(STATUS_LABELS) as readonly ContributionCallStatus[];
  protected readonly quarters = QUARTERS;
  protected readonly quarterLabels = QUARTER_LABELS;

  protected readonly filtersExpanded = signal(true);

  /** L'URL est l'unique source de vérité du filtre ; aucun état parallèle. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly fiscalYear = computed(() => this.params().get('exercice'));
  protected readonly quarter = computed<Quarter | null>(() => {
    const value = this.params().get('periode');
    return value && value in QUARTER_LABELS ? (value as Quarter) : null;
  });
  protected readonly status = computed<ContributionCallStatus | null>(() => {
    const value = this.params().get('statut');
    return value && value in STATUS_LABELS ? (value as ContributionCallStatus) : null;
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

  /** Saisie en cours ; ne devient un filtre qu'à la validation du formulaire. */
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  private readonly query = computed<ContributionCallQuery>(() => ({
    search: this.search(),
    fiscalYear: this.fiscalYear(),
    quarter: this.quarter(),
    status: this.status(),
    sort: this.sort(),
    page: this.page(),
    pageSize: this.pageSize(),
  }));

  /**
   * Relance manuelle d'une erreur récupérable. Incrémenter ce compteur ré-émet la même
   * requête sans toucher à l'URL : « Réessayer » recharge en place, comme l'impose la
   * matrice `loading-empty-error.md`, plutôt que de forcer un rechargement complet.
   */
  private readonly retryTick = signal(0);

  private readonly fetchTrigger = computed(() => ({ query: this.query(), tick: this.retryTick() }));

  /**
   * `switchMap` abandonne la requête précédente dès qu'un filtre change : sans lui, une
   * réponse lente à un filtre déjà abandonné écraserait la réponse courante.
   *
   * Un refus d'accès (403) est distingué d'une panne temporaire : le premier n'est pas
   * « réessayable », le second l'est.
   */
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.searchCalls(query).pipe(
          map((page) => ({ kind: 'ready' as const, page })),
          catchError((error: unknown) =>
            of(
              error instanceof ContributionsAccessError
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

  protected readonly data = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.page : null;
  });

  protected readonly overview = computed(() => this.data()?.overview ?? null);
  protected readonly rows = computed<readonly ContributionCallRow[]>(() => this.data()?.rows ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalItems ?? 0);
  protected readonly fiscalYears = computed(() => this.data()?.fiscalYears ?? []);
  protected readonly asOf = computed(() => this.data()?.asOf ?? null);

  /** La sélection locale actualise le détail sans modifier les filtres portés par l'URL. */
  protected readonly selectedCallId = signal<string | null>(null);
  protected readonly selectedCall = computed<ContributionCallRow | null>(() => {
    const rows = this.rows();
    const id = this.selectedCallId();
    return (id ? rows.find((call) => call.id === id) : null) ?? rows[0] ?? null;
  });

  /**
   * Simulation déterministe strictement fictive en trois tranches, explicitement
   * signalée dans l’écran. Elle sert la démonstration visuelle et ne constitue aucun
   * barème ou calendrier institutionnel.
   */
  protected readonly installments = computed<readonly InstallmentView[]>(() => {
    const call = this.selectedCall();
    if (!call) {
      return [];
    }
    const dates = this.installmentDates(call);
    const base = Math.floor(call.calledAmount / 3);
    const dues = [base, base, call.calledAmount - base * 2];
    let paid = call.paidAmount;

    return dues.map((amountDue, index) => {
      const amountPaid = Math.min(amountDue, paid);
      paid -= amountPaid;
      const outstanding = amountDue - amountPaid;
      const pastDue = dates[index] < (this.asOf() ?? dates[index]);
      return {
        label: `${index + 1}${index === 0 ? 're' : 'e'} tranche`,
        dueDate: dates[index],
        amountDue,
        amountPaid,
        outstanding,
        status:
          outstanding === 0
            ? 'SETTLED'
            : amountPaid > 0
              ? 'PARTIAL'
              : pastDue
                ? 'OVERDUE'
                : 'PENDING',
      };
    });
  });

  /** Même périmètre que le tableau : appelé, encaissé et solde proviennent du port. */
  protected readonly chart = computed(() => {
    const summary = this.overview();
    if (!summary) {
      return [];
    }
    const maximum = Math.max(summary.calledTotal, 1);
    return [
      { label: 'Appelé', value: summary.calledTotal, height: 100, tone: 'called' },
      {
        label: 'Encaissé',
        value: summary.collectedTotal,
        height: Math.max(4, (summary.collectedTotal / maximum) * 100),
        tone: 'collected',
      },
      {
        label: 'Solde',
        value: summary.outstandingTotal,
        height: Math.max(4, (summary.outstandingTotal / maximum) * 100),
        tone: 'outstanding',
      },
    ] as const;
  });

  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.fiscalYear() || this.quarter() || this.status()),
  );

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
    if (result.page.rows.length > 0) {
      return 'ready';
    }
    // Une collection vide et un filtre trop étroit appellent des gestes opposés :
    // générer un premier appel, ou élargir la recherche. Les confondre mène l'un des
    // deux dans une impasse.
    return this.hasFilters() ? 'noResult' : 'empty';
  });

  /**
   * L'unité est portée une fois par l'en-tête de colonne, jamais répétée sur chaque
   * ligne : mille répétitions de « FCFA » n'ajoutent rien et brouillent la comparaison
   * des ordres de grandeur.
   */
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'member', label: 'Membre', sortable: true },
    { key: 'period', label: 'Période', sortable: true },
    { key: 'called', label: 'Montant appelé', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'paid', label: 'Montant réglé', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'outstanding', label: 'Reste à payer', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'dueDate', label: 'Échéance', sortable: true },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'actions', label: 'Actions' },
  ];

  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const search = this.search();
    if (search) {
      chips.push({ key: 'q', label: `Recherche : ${search}` });
    }
    const fiscalYear = this.fiscalYear();
    if (fiscalYear) {
      chips.push({ key: 'exercice', label: `Exercice : ${fiscalYear}` });
    }
    const quarter = this.quarter();
    if (quarter) {
      chips.push({ key: 'periode', label: `Période : ${QUARTER_LABELS[quarter]}` });
    }
    const status = this.status();
    if (status) {
      chips.push({ key: 'statut', label: `Statut : ${STATUS_LABELS[status]}` });
    }
    return chips;
  });

  /**
   * Clé de suivi des lignes.
   *
   * Fournie bien que la sélection ne soit pas activée : `DataTable` s'en sert aussi
   * pour le `track` de sa boucle, et sa valeur par défaut renvoie une chaîne vide pour
   * toutes les lignes — Angular refuse alors des clés dupliquées (NG0955). L'identifiant
   * technique est stable, contrairement à l'index, qui reclasserait le DOM à chaque tri.
   */
  protected readonly rowKey = (call: ContributionCallRow): string => call.id;

  protected statusLabel(status: ContributionCallStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: ContributionCallStatus): CnpmBadgeTone {
    return STATUS_TONES[status];
  }

  protected periodLabel(call: ContributionCallRow): string {
    return `${call.quarter} ${call.fiscalYear}`;
  }

  /**
   * Un appel partiellement réglé mais échu s'affiche « En retard » : le retard prime,
   * parce qu'il commande la relance. Le règlement partiel reste signalé à côté du
   * statut, jamais à sa place — il resterait sinon invisible sur toute la colonne.
   */
  protected isPartiallySettled(call: ContributionCallRow): boolean {
    return call.status === 'OVERDUE' && call.paidAmount > 0;
  }

  /** Seul un appel non émis peut l'être ; le proposer ailleurs n'aurait aucun effet. */
  protected canEmit(call: ContributionCallRow): boolean {
    return call.status === 'DRAFT';
  }

  /**
   * La relance vise un appel émis dont le solde n'est pas soldé. Relancer un appel
   * encaissé harcèlerait un membre à jour ; relancer un brouillon relancerait sur une
   * créance que le membre n'a jamais reçue.
   */
  protected canRemind(call: ContributionCallRow): boolean {
    return call.status !== 'DRAFT' && call.status !== 'SETTLED';
  }

  protected selectCall(call: ContributionCallRow): void {
    this.selectedCallId.set(call.id);
  }

  protected installmentStatusLabel(status: InstallmentView['status']): string {
    return STATUS_LABELS[status];
  }

  protected installmentStatusTone(status: InstallmentView['status']): CnpmBadgeTone {
    return STATUS_TONES[status];
  }

  protected applySearch(): void {
    this.patch({ q: this.searchDraft().trim() || null, page: null });
  }

  protected setFiscalYear(value: string): void {
    this.patch({ exercice: value || null, page: null });
  }

  protected setQuarter(value: string): void {
    this.patch({ periode: value || null, page: null });
  }

  protected setStatus(value: string): void {
    this.patch({ statut: value || null, page: null });
  }

  protected onSortChange(sort: SortState): void {
    this.patch({ tri: sort.key, ordre: sort.direction, page: null });
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(size: number): void {
    // La page repart à 1 : rester en page 12 après être passé à 50 par page renverrait
    // au-delà de la fin du jeu.
    this.patch({ taille: size === DEFAULT_PAGE_SIZE ? null : size, page: null });
  }

  protected removeChip(key: string): void {
    if (key === 'q') {
      this.searchDraft.set('');
    }
    this.patch({ [key]: null, page: null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ q: null, exercice: null, periode: null, statut: null, page: null });
  }

  /** Relance le chargement après une erreur récupérable, sans recharger la page. */
  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patch(params: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  private installmentDates(call: ContributionCallRow): readonly [string, string, string] {
    const year = Number(call.fiscalYear);
    const february = year % 4 === 0 ? '02-29' : '02-28';
    const months: Readonly<Record<Quarter, readonly [string, string, string]>> = {
      T1: ['01-31', february, '03-31'],
      T2: ['04-30', '05-31', '06-30'],
      T3: ['07-31', '08-31', '09-30'],
      T4: ['10-31', '11-30', '12-31'],
    };
    const [first, second, third] = months[call.quarter];
    return [
      `${call.fiscalYear}-${first}`,
      `${call.fiscalYear}-${second}`,
      `${call.fiscalYear}-${third}`,
    ];
  }
}
