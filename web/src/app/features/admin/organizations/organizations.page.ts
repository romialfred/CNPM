import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideEye, LucidePencil } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
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
import { MonogramComponent } from '../../../design-system/monogram/monogram.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TextInputComponent } from '../../../design-system/text-input/text-input.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { ENROLLMENTS_GATEWAY } from '../enrollments/enrollments-gateway';
import {
  type CnpmViewMode,
  ViewToggleComponent,
} from '../../../design-system/view-toggle/view-toggle.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  type CreateProspectInput,
  ORGANIZATIONS_GATEWAY,
  OrganizationAccessError,
  OrganizationValidationError,
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
    ReactiveFormsModule,
    RouterLink,
    AdminShellComponent,
    AlertComponent,
    MonogramComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    TextInputComponent,
    ViewToggleComponent,
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
  private readonly fb = inject(FormBuilder);
  private readonly enrollments = inject(ENROLLMENTS_GATEWAY);
  private readonly toast = inject(ToastService);

  /** Prospect en cours d'enrôlement (bouton en chargement). */
  protected readonly enrollingId = signal<string | null>(null);

  // Formulaire de création d'un prospect (inline, simple). Le statut naît PROSPECT côté
  // serveur ; un prospect enrôlé devient ensuite membre actif.
  protected readonly showForm = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly prospectForm = this.fb.nonNullable.group({
    legalName: ['', [Validators.required, Validators.maxLength(255)]],
    organizationType: ['', [Validators.required, Validators.maxLength(40)]],
    sectorCode: ['', [Validators.maxLength(80)]],
    identifierType: ['', [Validators.required, Validators.maxLength(40)]],
    identifierValue: ['', [Validators.required, Validators.maxLength(160)]],
    tradeName: ['', [Validators.maxLength(255)]],
  });

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

  /** Vue liste (table) ou tuiles (cartes), reflétée dans l'URL (`?vue=grille`). */
  protected readonly view = computed<CnpmViewMode>(() =>
    this.params().get('vue') === 'grille' ? 'grille' : 'liste',
  );

  protected setView(mode: CnpmViewMode): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vue: mode === 'grille' ? 'grille' : null },
      queryParamsHandling: 'merge',
    });
  }

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

  protected openForm(): void {
    this.formError.set(null);
    this.prospectForm.reset();
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
  }

  protected submitCreate(): void {
    if (this.submitting()) return;
    if (this.prospectForm.invalid) {
      this.prospectForm.markAllAsTouched();
      return;
    }
    const value = this.prospectForm.getRawValue();
    const input: CreateProspectInput = {
      legalName: value.legalName.trim(),
      tradeName: value.tradeName.trim(),
      organizationType: value.organizationType.trim(),
      sectorCode: value.sectorCode.trim(),
      identifierType: value.identifierType.trim(),
      identifierValue: value.identifierValue.trim(),
    };
    this.submitting.set(true);
    this.formError.set(null);
    this.gateway.create(input).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showForm.set(false);
        this.prospectForm.reset();
        // Recharge la liste pour faire apparaître le nouveau prospect.
        this.retry();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.formError.set(this.createErrorMessage(error));
      },
    });
  }

  /** Ouvre un dossier d'enrôlement pour ce prospect, puis mène à la liste des enrôlements. */
  protected enroll(organization: Organization): void {
    if (this.enrollingId()) return;
    this.enrollingId.set(organization.id);
    this.enrollments.enrollProspect(organization.id).subscribe({
      next: () => {
        this.enrollingId.set(null);
        this.toast.success(
          `Dossier d'enrôlement ouvert pour ${organization.legalName}. Poursuivez la revue puis approuvez pour créer le membre.`,
        );
        void this.router.navigate(['/admin/enrollments']);
      },
      error: () => {
        this.enrollingId.set(null);
        this.toast.error('L’enrôlement n’a pas pu être ouvert. Réessayez.');
      },
    });
  }

  private createErrorMessage(error: unknown): string {
    if (error instanceof OrganizationValidationError) {
      return error.message;
    }
    if (error instanceof OrganizationAccessError) {
      return "Vous n'avez pas le droit de créer un prospect.";
    }
    return 'La création a échoué. Vérifiez les informations et réessayez.';
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

