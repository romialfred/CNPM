import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideDownload, LucidePlus, LucideUpload } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { BulkActionBarComponent } from '../../../design-system/bulk-action-bar/bulk-action-bar.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
  SortState,
} from '../../../design-system/data-table/data-table.model';
import { FilterBarComponent, type FilterChip } from '../../../design-system/filter-bar/filter-bar.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import {
  InsightSummaryComponent,
  type InsightStat,
} from '../../../design-system/insight-summary/insight-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  MEMBERS_GATEWAY,
  MembersAccessError,
  type MemberQuery,
  type MemberRow,
  type MemberStatus,
} from './members-gateway';

const STATUS_LABELS: Readonly<Record<MemberStatus, string>> = {
  ACTIVE: 'Actif',
  DORMANT: 'Dormant',
  PROSPECT: 'Prospect',
};

const STATUS_TONES: Readonly<Record<MemberStatus, CnpmBadgeTone>> = {
  ACTIVE: 'success',
  DORMANT: 'warning',
  PROSPECT: 'info',
};

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

/**
 * BO-002 — liste des membres.
 *
 * Filtres, tri et page vivent dans l'URL : la fiche l'exige, et c'est ce qui rend la
 * vue partageable et permet au retour depuis une fiche de retrouver son contexte.
 *
 * Quatre filtres de la maquette ne sont pas rendus, faute de donnée pour les
 * alimenter (secteur d'activité, région, niveau de cotisation, période d'adhésion) —
 * voir DATA-DEC-002. Un filtre affiché mais inerte promet un tri qui n'a pas lieu.
 */
@Component({
  selector: 'cnpm-members-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormsModule,
    AdminShellComponent,
    BadgeComponent,
    BulkActionBarComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    InsightSummaryComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    LucideDownload,
    LucidePlus,
    LucideUpload,
  ],
  templateUrl: './members.page.html',
  styleUrl: './members.page.scss',
})
export class MembersPage {
  private readonly gateway = inject(MEMBERS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statuses = Object.keys(STATUS_LABELS) as readonly MemberStatus[];

  protected readonly filtersExpanded = signal(true);
  /** Sélection bornée à la page affichée — la fiche impose une portée explicite. */
  protected readonly selected = signal<ReadonlySet<string>>(new Set<string>());

  /** L'URL est l'unique source de vérité du filtre ; aucun état parallèle. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly status = computed<MemberStatus | null>(() => {
    const value = this.params().get('statut');
    return value && value in STATUS_LABELS ? (value as MemberStatus) : null;
  });
  protected readonly category = computed(() => this.params().get('categorie'));
  protected readonly group = computed(() => this.params().get('groupement'));
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

  /** Saisie en cours du champ de recherche ; ne devient un filtre qu'à la validation. */
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  private readonly query = computed<MemberQuery>(() => ({
    search: this.search(),
    status: this.status(),
    category: this.category(),
    group: this.group(),
    sort: this.sort(),
    page: this.page(),
    pageSize: this.pageSize(),
  }));

  /**
   * Relance manuelle d'une erreur récupérable. Incrémenter ce compteur ré-émet la
   * même requête sans toucher à l'URL : le « Réessayer » de l'état d'erreur relance le
   * chargement en place, comme l'exige la matrice `loading-empty-error.md`, plutôt que
   * de forcer un rechargement de page entière.
   */
  private readonly retryTick = signal(0);

  private readonly fetchTrigger = computed(() => ({ query: this.query(), tick: this.retryTick() }));

  /**
   * `switchMap` abandonne la requête précédente dès qu'un filtre change : sans lui,
   * une réponse lente à un filtre déjà abandonné écraserait la réponse courante.
   *
   * Un refus d'accès (403) est distingué d'une panne temporaire : le premier n'est pas
   * « réessayable », le second l'est.
   */
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.search(query).pipe(
          map((page) => ({ kind: 'ready' as const, page })),
          // Deux objets distincts, pas un `kind` à type-union : c'est ce qui permet à
          // `tableState()` de discriminer proprement 'forbidden' de 'error'.
          catchError((error: unknown) =>
            of(
              error instanceof MembersAccessError
                ? ({ kind: 'forbidden' as const })
                : ({ kind: 'error' as const }),
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
  protected readonly rows = computed<readonly MemberRow[]>(() => this.data()?.rows ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalItems ?? 0);
  protected readonly categories = computed(() => this.data()?.categories ?? []);
  protected readonly groups = computed(() => this.data()?.groups ?? []);

  protected readonly hasFilters = computed(
    () => Boolean(this.search() || this.status() || this.category() || this.group()),
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
    // créer un premier membre, ou élargir la recherche. Les confondre mène l'un des
    // deux dans une impasse.
    return this.hasFilters() ? 'noResult' : 'empty';
  });

  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'code', label: 'Code membre', sortable: true },
    { key: 'organization', label: 'Raison sociale', sortable: true },
    { key: 'category', label: 'Catégorie' },
    { key: 'group', label: 'Groupement' },
    { key: 'contact', label: 'Contact principal' },
    { key: 'due', label: 'Cotisation due', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'paid', label: 'Cotisation payée', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'lastActivity', label: 'Dernière activité', sortable: true },
    { key: 'actions', label: 'Actions' },
  ];

  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const search = this.search();
    if (search) {
      chips.push({ key: 'q', label: `Recherche : ${search}` });
    }
    const status = this.status();
    if (status) {
      chips.push({ key: 'statut', label: `Statut : ${STATUS_LABELS[status]}` });
    }
    const category = this.category();
    if (category) {
      chips.push({ key: 'categorie', label: `Catégorie : ${category}` });
    }
    const group = this.group();
    if (group) {
      chips.push({ key: 'groupement', label: `Groupement : ${group}` });
    }
    return chips;
  });

  /**
   * Les statistiques sont recopiées telles quelles depuis la source ; aucune n'est
   * recalculée ici. Un second calcul côté écran pourrait diverger de celui qui
   * alimente le tableau, et c'est exactement le total incohérent que la fiche proscrit.
   */
  protected readonly memberStats = computed<readonly InsightStat[]>(() => {
    const summary = this.overview();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Base de membres', value: summary.membersTotal },
      { label: 'Actifs', value: summary.active },
      { label: 'Dormants', value: summary.dormant },
      { label: 'Grands cotisants', value: summary.largeContributors },
      { label: 'Prospects', value: summary.prospects, apart: true },
    ];
  });

  protected readonly contributionStats = computed<readonly InsightStat[]>(() => {
    const summary = this.overview();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Total dû', value: summary.expected },
      { label: 'Total payé', value: summary.collected },
      {
        label: 'Taux de recouvrement',
        value: summary.recoveryRate,
        suffix: ' %',
        decimals: 1,
        apart: true,
      },
    ];
  });

  protected readonly rowKey = (row: MemberRow): string => row.id;
  protected readonly rowLabel = (row: MemberRow): string => `${row.organization} (${row.code})`;

  protected statusLabel(status: MemberStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: MemberStatus): CnpmBadgeTone {
    return STATUS_TONES[status];
  }

  /**
   * Part réglée, en pourcentage. `null` quand rien n'est dû : afficher « 0 % » pour
   * un membre qui ne doit rien le présenterait comme mauvais payeur.
   */
  protected paidShare(row: MemberRow): number | null {
    return row.due === 0 ? null : (row.paid / row.due) * 100;
  }

  protected applySearch(): void {
    this.patch({ q: this.searchDraft().trim() || null, page: null });
  }

  protected setStatus(value: string): void {
    this.patch({ statut: value || null, page: null });
  }

  protected setCategory(value: string): void {
    this.patch({ categorie: value || null, page: null });
  }

  protected setGroup(value: string): void {
    this.patch({ groupement: value || null, page: null });
  }

  protected onSortChange(sort: SortState): void {
    this.patch({ tri: sort.key, ordre: sort.direction, page: null });
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(size: number): void {
    // La page repart à 1 : rester en page 12 après être passé à 50 par page
    // renverrait au-delà de la fin du jeu.
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
    this.patch({ q: null, statut: null, categorie: null, groupement: null, page: null });
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
    // La portée est la page affichée, jamais le jeu filtré entier : cocher l'en-tête
    // ne doit pas silencieusement viser des lignes que personne n'a vues.
    this.selected.set(checked ? new Set(this.rows().map(this.rowKey)) : new Set());
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  /** Relance le chargement après une erreur récupérable, sans recharger la page. */
  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patch(params: Record<string, string | number | null>): void {
    this.clearSelection();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
