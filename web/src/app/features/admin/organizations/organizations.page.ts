import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideEye, LucidePencil } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
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
  ORGANIZATIONS_GATEWAY,
  OrganizationAccessError,
  type Organization,
  type OrganizationQuery,
} from './organizations-gateway';

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;
const KNOWN_STATUSES = ['ACTIVE', 'DORMANT', 'PROSPECT'] as const;
const SORT_KEYS = new Set(['legalName', 'status']);

/** Géométrie du donut, alignée sur le tableau de bord. */
const DONUT_RADIUS = 52;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_GAP = 4;

/** BO-005 — liste paginée des entreprises, partageable par son URL. */
@Component({
  selector: 'cnpm-organizations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink,
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
    LucideEye,
    LucidePencil,
  ],
  templateUrl: './organizations.page.html',
  styleUrl: './organizations.page.scss',
})
export class OrganizationsPage {
  private readonly gateway = inject(ORGANIZATIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly statuses = KNOWN_STATUSES;
  protected readonly filtersExpanded = signal(true);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly status = computed(() => this.params().get('statut'));
  protected readonly statusIsKnown = computed(() =>
    KNOWN_STATUSES.includes(this.status() as (typeof KNOWN_STATUSES)[number]),
  );
  protected readonly organizationType = computed(() => this.params().get('type'));
  protected readonly sectorCode = computed(() => this.params().get('secteur'));
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const size = positiveInteger(this.params().get('taille'), DEFAULT_PAGE_SIZE);
    return (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
  });
  protected readonly sort = computed<SortState | null>(() => {
    const key = this.params().get('tri');
    if (!key || !SORT_KEYS.has(key)) {
      return { key: 'legalName', direction: 'asc' };
    }
    return { key, direction: this.params().get('ordre') === 'desc' ? 'desc' : 'asc' };
  });

  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly typeDraft = signal(this.route.snapshot.queryParamMap.get('type') ?? '');
  protected readonly sectorDraft = signal(this.route.snapshot.queryParamMap.get('secteur') ?? '');

  private readonly query = computed<OrganizationQuery>(() => ({
    search: this.search(),
    status: this.status(),
    organizationType: this.organizationType(),
    sectorCode: this.sectorCode(),
    sort: this.sort(),
    page: this.page(),
    pageSize: this.pageSize(),
  }));

  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({ query: this.query(), tick: this.retryTick() }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.search(query).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) =>
            of(
              error instanceof OrganizationAccessError
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

  protected readonly state = computed(() => {
    const result = this.result();
    if (result.kind !== 'ready') {
      return result.kind;
    }
    if (result.data.rows.length > 0) {
      return 'ready' as const;
    }
    return this.hasFilters() ? ('noResult' as const) : ('empty' as const);
  });
  protected readonly rows = computed<readonly Organization[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.rows : [];
  });
  protected readonly totalItems = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.totalItems : 0;
  });
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.status() || this.organizationType() || this.sectorCode()),
  );

  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) chips.push({ key: 'q', label: `Recherche : ${this.search()}` });
    if (this.status())
      chips.push({ key: 'statut', label: `Statut : ${this.statusLabel(this.status()!)}` });
    if (this.organizationType())
      chips.push({ key: 'type', label: `Type : ${this.organizationType()}` });
    if (this.sectorCode())
      chips.push({ key: 'secteur', label: `Secteur : ${this.sectorLabel(this.sectorCode())}` });
    return chips;
  });

  protected readonly visibleCount = computed(() => this.rows().length);

  /** Plage affichée, du type « Affichage de 11 à 20 » — repère de pagination classique. */
  protected readonly rangeLabel = computed(() => {
    const total = this.totalItems();
    const shown = this.visibleCount();
    if (total === 0 || shown === 0) {
      return '';
    }
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = start + shown - 1;
    return `Affichage de ${start} à ${end}`;
  });

  /**
   * Portée volontairement limitée à la page affichée : le contrat R0 ne fournit aucun
   * agrégat global. La note du panneau l'énonce, et l'échelle des barres est le nombre
   * de lignes visibles — un panneau qui prétendrait totaliser l'ensemble serait
   * précisément le « total incohérent » que la conception proscrit.
   */
  protected readonly pageScopeNote = computed(() => {
    const shown = this.visibleCount();
    const total = this.totalItems();
    const noun = shown === 1 ? 'entreprise affichée' : 'entreprises affichées';
    return `Portée : ${shown} ${noun} sur cette page, sur ${total} au total.`;
  });

  /** Rayon du donut, aligné sur celui du tableau de bord pour un rendu homogène. */
  protected readonly donutRadius = DONUT_RADIUS;

  /**
   * Répartition par statut, rendue en donut. Chaque segment porte sa part (0–100) et une
   * clé de couleur ; le total au centre est le nombre d'entreprises de la page.
   */
  protected readonly statusSegments = computed(() => {
    const rows = this.rows();
    const total = rows.length;
    return {
      total,
      segments: KNOWN_STATUSES.map((status) => {
        const count = rows.filter((organization) => organization.status === status).length;
        return {
          key: status.toLowerCase(),
          label: this.statusLabel(status),
          count,
          percent: total > 0 ? Math.round((count / total) * 100) : 0,
        };
      }),
    };
  });

  /** Arcs SVG du donut, calculés comme au tableau de bord (vide de séparation compris). */
  protected readonly statusArcs = computed(() => {
    const { segments } = this.statusSegments();
    const total = segments.reduce((sum, segment) => sum + segment.count, 0);
    if (total === 0) {
      return [];
    }
    let start = 0;
    return segments
      .filter((segment) => segment.count > 0)
      .map((segment) => {
        const length = (segment.count / total) * DONUT_CIRCUMFERENCE;
        const visible = Math.max(0, length - DONUT_GAP);
        const arc = {
          key: segment.key,
          dashArray: `${visible} ${DONUT_CIRCUMFERENCE - visible}`,
          dashOffset: -start,
        };
        start += length;
        return arc;
      });
  });

  /**
   * Principaux secteurs : nom, effectif, part et une couleur distincte par rang. La barre
   * situe la part face au plus gros secteur, la valeur restant lue en clair et en pourcent.
   */
  protected readonly sectorBars = computed(() => {
    const rows = this.rows();
    const total = rows.length;
    const counts = new Map<string, number>();
    for (const organization of rows) {
      const label = this.sectorLabel(organization.sectorCode);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'fr'),
    );
    const max = ranked.length > 0 ? ranked[0][1] : 0;
    return ranked.slice(0, 5).map(([label, value], index) => ({
      label,
      value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
      // Largeur de barre relative au plus gros secteur, pour que le premier remplisse la piste.
      fill: max > 0 ? Math.round((value / max) * 100) : 0,
      colorIndex: index % 5,
    }));
  });

  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'legalName', label: 'Entreprise', sortable: true },
    { key: 'tradeName', label: 'Sigle' },
    { key: 'organizationType', label: 'Type' },
    { key: 'sectorCode', label: 'Secteur' },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'riskLevel', label: 'Risque' },
    { key: 'actions', label: 'Actions' },
  ];
  protected readonly rowKey = (organization: Organization): string => organization.id;

  protected statusLabel(value: string): string {
    return knownLabel(value, { ACTIVE: 'Active', DORMANT: 'Dormante', PROSPECT: 'Prospect' });
  }

  protected statusTone(value: string): CnpmBadgeTone {
    return value === 'ACTIVE'
      ? 'success'
      : value === 'DORMANT'
        ? 'warning'
        : value === 'PROSPECT'
          ? 'info'
          : 'neutral';
  }

  protected riskLabel(value: string): string {
    return knownLabel(value, { NORMAL: 'Normal' });
  }

  protected riskTone(value: string): CnpmBadgeTone {
    return value === 'NORMAL' ? 'success' : 'neutral';
  }

  /** Rend lisible un code de secteur brut (`SECTEUR_FABRICATION` → « Fabrication »). */
  protected sectorLabel(value: string | null): string {
    if (!value || !value.trim()) {
      return 'Non renseigné';
    }
    const code = normalizeSectorCode(value);
    return SECTOR_LABELS[code] ?? titleCaseWords(code.replaceAll('_', ' '));
  }

  /**
   * Vignette illustrative de l'entreprise. La photo est réelle mais purement décorative
   * (`alt=""`) : la raison sociale, adjacente, porte l'information. Les mots-clés suivent
   * le secteur pour rester topiques ; le verrou déterministe, dérivé de l'identifiant,
   * garde la même image d'un rendu à l'autre.
   */
  protected logoUrl(organization: Organization): string {
    const code = organization.sectorCode ? normalizeSectorCode(organization.sectorCode) : '';
    const keywords = SECTOR_IMAGE_KEYWORDS[code] ?? 'office,building';
    return `https://loremflickr.com/96/96/${keywords}?lock=${imageLock(organization.id)}`;
  }

  protected listQueryParams(): Record<string, string> {
    const query = this.params();
    return Object.fromEntries(query.keys.map((key) => [key, query.get(key) ?? '']));
  }

  protected viewOrganization(id: string): void {
    void this.router.navigate(['/admin/organizations', id], {
      queryParams: this.listQueryParams(),
    });
  }

  protected editOrganization(id: string): void {
    void this.router.navigate(['/admin/organizations', id, 'edit'], {
      queryParams: this.listQueryParams(),
    });
  }

  protected applyTextFilters(): void {
    this.patch({
      q: clean(this.searchDraft()),
      type: clean(this.typeDraft()),
      secteur: clean(this.sectorDraft()),
      page: null,
    });
  }

  protected setStatus(value: string): void {
    this.patch({ statut: clean(value), page: null });
  }

  protected removeChip(key: string): void {
    if (key === 'q') this.searchDraft.set('');
    if (key === 'type') this.typeDraft.set('');
    if (key === 'secteur') this.sectorDraft.set('');
    this.patch({ [key]: null, page: null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.typeDraft.set('');
    this.sectorDraft.set('');
    this.patch({ q: null, statut: null, type: null, secteur: null, page: null });
  }

  protected onSortChange(sort: SortState): void {
    this.patch({
      tri: sort.key === 'legalName' ? null : sort.key,
      ordre: sort.direction === 'asc' ? null : sort.direction,
      page: null,
    });
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(size: number): void {
    this.patch({ taille: size === DEFAULT_PAGE_SIZE ? null : size, page: null });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patch(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function clean(value: string): string | null {
  return value.trim() || null;
}

function knownLabel(value: string, labels: Readonly<Record<string, string>>): string {
  return labels[value] ?? value.replaceAll('_', ' ');
}

/**
 * Libellés lisibles des secteurs. Les codes du contrat sont en capitales, parfois
 * préfixés `SECTEUR_` : le préfixe est retiré avant lecture. Un code inconnu retombe
 * sur une mise en casse titre — jamais sur du texte tout en capitales.
 */
const SECTOR_LABELS: Readonly<Record<string, string>> = {
  FABRICATION: 'Fabrication',
  SERVICES: 'Services',
  LOGISTIQUE: 'Logistique',
  NUMERIQUE: 'Numérique',
  DISTRIBUTION: 'Distribution',
  ENERGIE: 'Énergie',
  TRANSFORMATION: 'Transformation',
  EMBALLAGE: 'Emballage',
  CONSTRUCTION: 'Construction',
  TEXTILE: 'Textile',
  MAINTENANCE: 'Maintenance',
  AGROALIMENTAIRE: 'Agroalimentaire',
  AGRICULTURE: 'Agriculture',
  COMMERCE: 'Commerce',
  SANTE: 'Santé',
  FINANCE: 'Finance',
  TRANSPORT: 'Transport',
  TOURISME: 'Tourisme',
  ARTISANAT: 'Artisanat',
  MINES: 'Mines',
  TELECOMMUNICATIONS: 'Télécommunications',
};

/** Mots-clés topiques par secteur pour l'illustration décorative de la ligne. */
const SECTOR_IMAGE_KEYWORDS: Readonly<Record<string, string>> = {
  FABRICATION: 'factory',
  SERVICES: 'office',
  LOGISTIQUE: 'warehouse,logistics',
  NUMERIQUE: 'technology,computer',
  DISTRIBUTION: 'warehouse',
  ENERGIE: 'energy,power',
  TRANSFORMATION: 'agriculture,factory',
  EMBALLAGE: 'packaging',
  CONSTRUCTION: 'construction',
  TEXTILE: 'textile',
  MAINTENANCE: 'industrial,machine',
  AGROALIMENTAIRE: 'food,factory',
  AGRICULTURE: 'agriculture',
  COMMERCE: 'shop,store',
  SANTE: 'clinic,health',
  FINANCE: 'finance,office',
  TRANSPORT: 'transport,truck',
  TOURISME: 'hotel,travel',
  ARTISANAT: 'craft,workshop',
  MINES: 'mine,industry',
  TELECOMMUNICATIONS: 'telecom,antenna',
};

function normalizeSectorCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/^SECTEUR[_ ]+/, '');
}

function titleCaseWords(value: string): string {
  return value
    .toLocaleLowerCase('fr')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('fr') + word.slice(1))
    .join(' ');
}

/**
 * Verrou déterministe pour `loremflickr`, dérivé de l'identifiant : la même entreprise
 * garde la même image. Les quatre derniers chiffres suffisent quand l'identifiant en
 * contient ; sinon un condensé simple de la chaîne prend le relais.
 */
function imageLock(id: string): number {
  const digits = id.replace(/\D/g, '');
  if (digits) {
    const tail = Number(digits.slice(-4));
    if (Number.isFinite(tail) && tail > 0) {
      return tail;
    }
  }
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 100000;
  }
  return hash + 1;
}
