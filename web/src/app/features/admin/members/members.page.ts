import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideDownload,
  LucideEye,
  LucideHistory,
  LucideLayoutGrid,
  LucideMoon,
  LucidePercent,
  LucidePlus,
  LucideTable,
  LucideUpload,
  LucideUserCheck,
  LucideUsers,
  LucideWallet,
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
import {
  FilterBarComponent,
  type FilterChip,
} from '../../../design-system/filter-bar/filter-bar.component';
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
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  MEMBERS_GATEWAY,
  MembersAccessError,
  type MemberQuery,
  type MemberRow,
  type MembersOverview,
  type MemberStatus,
} from './members-gateway';

/**
 * Une tuile du bandeau d'indicateurs de la base de membres.
 *
 * `value` accepte `null` : `recoveryRate` l'est lorsqu'aucun montant n'est attendu, et
 * un taux absent n'est pas un taux nul.
 */
interface MembersOverviewKpi {
  readonly key: string;
  readonly icon: 'total' | 'active' | 'dormant' | 'recovery';
  /** Classe d'accent de `_accents.scss`, issue de `chart.categorical`. */
  readonly accent: string;
  readonly label: string;
  readonly value: number | null;
  /** Format `DecimalPipe`. */
  readonly format: string;
  readonly suffix: string;
  readonly caption: string;
}

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

/** Présentation de la liste. Le tableau reste le défaut : il porte le tri et la sélection. */
type MembersView = 'table' | 'tiles';
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
    RouterLink,
    FormsModule,
    AdminShellComponent,
    BadgeComponent,
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
    LucideEye,
    LucideHistory,
    LucidePlus,
    LucideLayoutGrid,
    LucideMoon,
    LucidePercent,
    LucideTable,
    LucideUpload,
    LucideUserCheck,
    LucideUsers,
  ],
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss', './members.kpi.scss'],
})
export class MembersPage {
  private readonly gateway = inject(MEMBERS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SESSION_GATEWAY);

  protected readonly iconSize = CNPM_ICON_SIZE;

  /**
   * Pictogrammes des panneaux de synthese.
   *
   * On passe la DONNEE d'icone (`.icon`), pas son nom. `LucideDynamicIcon` accepte bien
   * une chaine, mais elle suppose un registre nom -> icone que ce depot n'installe pas :
   * `provideCnpmIcons()` ne configure que taille, trait et couleur, l'API par icone etant
   * retenue pour son tree-shaking. Une chaine leve donc « Unable to resolve icon » a
   * l'execution, et l'exception vide tout le panneau — c'est arrive.
   */
  protected readonly panelIcons = {
    membres: LucideUsers.icon,
    cotisations: LucideWallet.icon,
  } as const;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statuses = Object.keys(STATUS_LABELS) as readonly MemberStatus[];

  protected readonly filtersExpanded = signal(true);
  private readonly sessionIdentity = toSignal(
    this.session.identity.pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly canStartEnrollment = computed(
    () => this.sessionIdentity()?.permissions.includes('ENROLLMENT.CREATE') ?? false,
  );

  /** L'URL est l'unique source de vérité du filtre ; aucun état parallèle. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** Vue courante ; `tuiles` seulement si l'URL le demande, le tableau reste le défaut. */
  protected readonly view = computed<MembersView>(() =>
    this.params().get('vue') === 'tuiles' ? 'tiles' : 'table',
  );

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
  protected readonly rows = computed<readonly MemberRow[]>(() => this.data()?.rows ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalItems ?? 0);
  protected readonly categories = computed(() => this.data()?.categories ?? null);
  protected readonly groups = computed(() => this.data()?.groups ?? null);

  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.status() || this.category() || this.group()),
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

  protected readonly columns = computed<readonly DataTableColumn[]>(() => {
    const supported = new Set(
      this.data()?.supportedSortKeys ?? [
        'code',
        'organization',
        'due',
        'paid',
        'status',
        'lastActivity',
      ],
    );
    return [
      { key: 'code', label: 'Code membre', sortable: supported.has('code') },
      {
        key: 'organization',
        label: 'Raison sociale',
        sortable: supported.has('organization'),
      },
      { key: 'group', label: 'Groupement', sortable: supported.has('group') },
      // Seul le nom du contact est colonné. Téléphone et courriel restaient sur trois
      // lignes par ligne de tableau, triplant sa hauteur ; ils demeurent accessibles sur
      // la fiche du membre, et cette liste peut être exportée — y étaler les coordonnées
      // personnelles de chaque représentant facilite un export nominatif de masse.
      { key: 'contact', label: 'Contact' },
      {
        // « Due » et « Payée » plutôt que « Cotisation due » et « Cotisation payée » :
        // les intitulés longs se coupaient sur deux lignes et gonflaient l'en-tête.
        // L'unité reste portée par la note, et la légende du tableau nomme la mesure.
        key: 'due',
        label: 'Due',
        note: '(FCFA)',
        align: 'end',
        sortable: supported.has('due'),
      },
      {
        key: 'paid',
        label: 'Payée',
        note: '(FCFA)',
        align: 'end',
        sortable: supported.has('paid'),
      },
      { key: 'status', label: 'Statut', sortable: supported.has('status') },
      // « Dernière activité » est retirée à la demande du client. La donnée reste au
      // contrat et sur la fiche du membre ; seule la colonne disparaît.
      { key: 'actions', label: 'Actions' },
    ];
  });

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
   * Bandeau d'indicateurs de la base de membres.
   *
   * Les quatre valeurs sont recopiées de `MembersOverview`, jamais recalculées : c'est
   * la source qui alimente déjà le tableau, et deux calculs concurrents sur un même
   * écran finissent par diverger.
   *
   * Les libellés ne reprennent PAS ceux de la maquette de référence, qui décrivent une
   * autre base : elle annonce « tous statuts confondus » pour un total qui, ici,
   * n'inclut pas les prospects. `ux-ui.md` interdit de recopier les incohérences de
   * libellés d'une image de conception ; les légendes ci-dessous disent donc ce que les
   * chiffres mesurent réellement.
   *
   * Aucune cible de recouvrement n'est affichée : le contrat n'en porte aucune, et un
   * objectif inventé sur un indicateur financier serait lu comme un engagement.
   */
  /**
   * Classe d'accent d'une tuile membre, portant la couleur de son liseré supérieur.
   *
   * Le liseré DOUBLE le badge de statut, il ne le remplace pas : le statut reste écrit
   * en toutes lettres sur la tuile, et retirer la couleur n'enlève aucune information
   * (`ux-ui.md`, WCAG 2.2 critère 1.4.1). Les teintes reprennent celles du badge, pour
   * qu'un même statut ne se présente pas sous deux couleurs sur le même écran.
   */
  protected statusAccentClass(status: MemberStatus): string {
    const accents: Readonly<Record<MemberStatus, string>> = {
      ACTIVE: 'cnpm-members__tile--active',
      DORMANT: 'cnpm-members__tile--dormant',
      PROSPECT: 'cnpm-members__tile--prospect',
    };
    return accents[status];
  }

  protected overviewKpis(summary: MembersOverview): readonly MembersOverviewKpi[] {
    const part = (valeur: number) =>
      summary.membersTotal > 0
        ? `${Math.round((valeur / summary.membersTotal) * 100)} % de la base`
        : 'Base vide';
    return [
      {
        key: 'total',
        icon: 'total',
        accent: 'indigo',
        label: 'Base de membres',
        value: summary.membersTotal,
        format: '1.0-0',
        suffix: '',
        caption: 'Actifs et dormants ; prospects exclus.',
      },
      {
        key: 'active',
        icon: 'active',
        accent: 'teal',
        label: 'Membres actifs',
        value: summary.active,
        format: '1.0-0',
        suffix: '',
        caption: part(summary.active),
      },
      {
        key: 'dormant',
        icon: 'dormant',
        accent: 'amber',
        label: 'Cotisants dormants',
        value: summary.dormant,
        format: '1.0-0',
        suffix: '',
        caption: part(summary.dormant),
      },
      {
        key: 'recovery',
        icon: 'recovery',
        accent: 'sky',
        label: 'Taux de recouvrement',
        value: summary.recoveryRate,
        format: '1.1-1',
        suffix: ' %',
        caption: 'Part du montant attendu encaissée.',
      },
    ];
  }

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
    // Barres horizontales situees sur une meme echelle : la base de membres. Chaque
    // effectif se lit d'un coup d'oeil face au total, la valeur restant affichee en
    // clair. « Base de membres » est la reference — sa barre est donc pleine. Les
    // prospects, comptes hors base, gardent la meme echelle pour rester comparables.
    const base = summary.membersTotal;
    return [
      { label: 'Base de membres', value: base, display: 'barre', barMax: base },
      { label: 'Actifs', value: summary.active, display: 'barre', barMax: base },
      { label: 'Dormants', value: summary.dormant, display: 'barre', barMax: base },
      {
        label: 'Grands cotisants',
        value: summary.largeContributors,
        display: 'barre',
        barMax: base,
      },
      { label: 'Prospects', value: summary.prospects, display: 'barre', barMax: base, apart: true },
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
        // Rendu en jauge : une part se lit d'un coup d'œil sur une échelle, là où un
        // nombre seul demande de le rapporter mentalement à 100. Le chiffre reste
        // affiché à côté de la barre — une barre seule ne se lit pas, et la valeur ne
        // doit jamais dépendre de la seule longueur d'un trait.
        label: 'Taux de recouvrement',
        value: summary.recoveryRate,
        suffix: ' %',
        decimals: 1,
        display: 'jauge',
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




  /** BO-009 est le parcours canonique de création actuellement livré. */
  protected startEnrollment(): void {
    if (!this.canStartEnrollment()) {
      return;
    }
    void this.router.navigate(['/admin/enrollments/new']);
  }

  /**
   * Ouvre BO-003 en conservant les filtres, le tri et la page dans l'URL de la fiche.
   * Le retour navigateur restaure ainsi exactement le contexte de BO-002.
   */
  protected viewMember(memberId: string): void {
    void this.router.navigate(['/admin/members', memberId], {
      queryParamsHandling: 'preserve',
    });
  }

  /** L'action Historique adresse directement l'onglet partageable exigé par BO-003. */
  protected viewHistory(memberId: string): void {
    void this.router.navigate(['/admin/members', memberId], {
      queryParams: { onglet: 'historique', hpage: null },
      queryParamsHandling: 'merge',
    });
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

  /**
   * Bascule tableau / tuiles, conservée dans l'URL puisque la vue est partageable.
   *
   * Elle ne passe pas par `patch()` : celui-ci vide la sélection, ce qui serait
   * justifié pour un filtre — la ligne cochée pourrait disparaître — mais absurde ici,
   * changer de présentation n'ôte aucun membre de la liste.
   */
  protected setView(view: MembersView): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vue: view === 'tiles' ? 'tuiles' : null },
      queryParamsHandling: 'merge',
    });
  }
}
