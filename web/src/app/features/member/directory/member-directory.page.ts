import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  FilterBarComponent,
  type FilterChip,
} from '../../../design-system/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_DIRECTORY_GATEWAY,
  type MemberDirectorySector,
  type MemberDirectorySort,
  type MemberDirectoryTheme,
  type MemberDirectoryZone,
} from './member-directory.gateway';

type DirectoryView = 'cards' | 'compact';
type DirectoryState = 'loading' | 'ready' | 'empty' | 'no-result' | 'error' | 'unavailable';
const SECTORS: readonly MemberDirectorySector[] = ['AGRI', 'SERVICES', 'CRAFT'];
const ZONES: readonly MemberDirectoryZone[] = ['ZONE_A', 'ZONE_B', 'ZONE_C'];
const THEMES: readonly MemberDirectoryTheme[] = ['SKILLS', 'LOGISTICS', 'TRAINING'];
const SORTS: readonly MemberDirectorySort[] = ['name', 'sector'];
const VIEWS: readonly DirectoryView[] = ['cards', 'compact'];
const MAX_SEARCH_LENGTH = 80;
const SEARCH_CHIP_LENGTH = 16;

/** MP-018 — annuaire privé local sans coordonnées ni action commerciale. */
@Component({
  selector: 'cnpm-member-directory-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-directory.page.html',
  styleUrl: './member-directory.page.scss',
})
export class MemberDirectoryPage {
  private readonly gateway = inject(MEMBER_DIRECTORY_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(PageSeoService);
  private readonly injector = inject(Injector);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly pageHeader = viewChild(PageHeaderComponent);
  private readonly resultsTitle = viewChild<ElementRef<HTMLElement>>('resultsTitle');
  private readonly retryTick = signal(0);
  private readonly restoreResultsFocus = signal(false);
  private initialPageFocusPending = true;

  protected readonly sectors = SECTORS;
  protected readonly zones = ZONES;
  protected readonly themes = THEMES;
  protected readonly filtersExpanded = signal(true);
  protected readonly filterForm = this.formBuilder.group({
    search: '',
    sector: '',
    zone: '',
    theme: '',
    sort: 'name',
  });

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly rawSearch = computed(() => this.params().get('q')?.trim() ?? '');
  protected readonly search = computed(() => this.rawSearch().slice(0, MAX_SEARCH_LENGTH));
  protected readonly sector = computed(() => known(this.params().get('sector'), SECTORS));
  protected readonly zone = computed(() => known(this.params().get('zone'), ZONES));
  protected readonly theme = computed(() => known(this.params().get('theme'), THEMES));
  protected readonly sort = computed<MemberDirectorySort>(
    () => known(this.params().get('sort'), SORTS) ?? 'name',
  );
  protected readonly view = computed<DirectoryView>(
    () => known(this.params().get('view'), VIEWS) ?? 'cards',
  );
  private readonly query = computed(() => ({
    search: this.search(),
    sector: this.sector() ?? undefined,
    zone: this.zone() ?? undefined,
    theme: this.theme() ?? undefined,
    sort: this.sort(),
  }));
  private readonly fetchTrigger = computed(() => ({
    query: this.query(),
    retry: this.retryTick(),
  }));
  protected readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.list(query).pipe(
          map((snapshot) => ({ kind: 'ready' as const, snapshot })),
          catchError((error: unknown) =>
            of(
              error instanceof UnavailableHttpFeatureError
                ? { kind: 'unavailable' as const }
                : { kind: 'error' as const },
            ),
          ),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );
  protected readonly snapshot = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.snapshot : null;
  });
  protected readonly organizations = computed(() => this.snapshot()?.items ?? []);
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.sector() || this.zone() || this.theme()),
  );
  protected readonly state = computed<DirectoryState>(() => {
    const result = this.result();
    if (result.kind !== 'ready') return result.kind;
    if (result.snapshot.items.length) return 'ready';
    return this.hasFilters() ? 'no-result' : 'empty';
  });
  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.search()) {
      chips.push({ key: 'q', label: `Recherche : ${truncate(this.search(), SEARCH_CHIP_LENGTH)}` });
    }
    if (this.sector()) {
      chips.push({ key: 'sector', label: `Secteur : ${sectorLabel(this.sector()!)}` });
    }
    if (this.zone()) chips.push({ key: 'zone', label: `Zone : ${zoneLabel(this.zone()!)}` });
    if (this.theme()) {
      chips.push({ key: 'theme', label: `Thème : ${themeLabel(this.theme()!)}` });
    }
    return chips;
  });

  protected readonly sectorLabel = sectorLabel;
  protected readonly zoneLabel = zoneLabel;
  protected readonly themeLabel = themeLabel;

  constructor() {
    this.seo.apply({
      title: 'Annuaire privé — CNPM',
      description: 'Annuaire privé des organisations membres du CNPM.',
      robots: 'noindex,nofollow',
      canonicalPath: '/member/directory',
    });
    effect(() => {
      if (this.rawSearch().length > MAX_SEARCH_LENGTH) {
        this.patch({ q: this.search() || null }, true);
      }
    });
    effect(() => {
      this.filterForm.setValue(
        {
          search: this.search(),
          sector: this.sector() ?? '',
          zone: this.zone() ?? '',
          theme: this.theme() ?? '',
          sort: this.sort(),
        },
        { emitEvent: false },
      );
    });
    effect(() => {
      if (this.result().kind === 'loading') return;
      if (this.restoreResultsFocus()) {
        this.restoreResultsFocus.set(false);
        afterNextRender(() => this.resultsTitle()?.nativeElement.focus(), {
          injector: this.injector,
        });
      } else if (this.initialPageFocusPending) {
        this.initialPageFocusPending = false;
        afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
      }
    });
  }

  protected applyFilters(): void {
    const values = this.filterForm.getRawValue();
    this.restoreResultsFocus.set(true);
    this.patch({
      q: values.search.trim().slice(0, MAX_SEARCH_LENGTH) || null,
      sector: known(values.sector, SECTORS),
      zone: known(values.zone, ZONES),
      theme: known(values.theme, THEMES),
      sort: known(values.sort, SORTS) ?? 'name',
    });
  }

  protected removeFilter(key: string): void {
    this.restoreResultsFocus.set(true);
    this.patch({ [key]: null });
  }

  protected resetFilters(): void {
    this.restoreResultsFocus.set(true);
    this.patch({ q: null, sector: null, zone: null, theme: null });
  }

  protected selectView(view: DirectoryView): void {
    this.patch({ view });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patch(queryParams: Record<string, string | null>, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      ...(replaceUrl ? { replaceUrl: true } : {}),
    });
  }
}

function known<T extends string>(value: string | null, values: readonly T[]): T | null {
  return value && (values as readonly string[]).includes(value) ? (value as T) : null;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function sectorLabel(sector: MemberDirectorySector): string {
  switch (sector) {
    case 'AGRI':
      return 'Agriculture';
    case 'CRAFT':
      return 'Fabrication';
    default:
      return 'Services';
  }
}

function zoneLabel(zone: MemberDirectoryZone): string {
  switch (zone) {
    case 'ZONE_A':
      return 'Zone A';
    case 'ZONE_B':
      return 'Zone B';
    default:
      return 'Zone C';
  }
}

function themeLabel(theme: MemberDirectoryTheme): string {
  switch (theme) {
    case 'SKILLS':
      return 'Partage de compétences';
    case 'LOGISTICS':
      return 'Mutualisation logistique';
    default:
      return 'Formation';
  }
}
