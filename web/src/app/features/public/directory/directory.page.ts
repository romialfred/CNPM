import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, type ParamMap } from '@angular/router';
import {
  LucideArrowRight,
  LucideBuilding2,
  LucideMapPin,
  LucideRotateCcw,
  LucideSearch,
} from '@lucide/angular';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { PublicShellComponent } from '../public-shell.component';
import {
  SHOWCASE_GATEWAY,
  type PublicShowcasePage,
  type PublicShowcaseQuery,
} from '../showcase/showcase-gateway';

type DirectoryMode = 'directory' | 'search';
type DirectoryState = 'loading' | 'ready' | 'error';

interface LoadOutcome {
  readonly ok: boolean;
  readonly page: PublicShowcasePage | null;
}

const DEFAULT_PAGE_SIZE = 20;

/** PUB-004 / PUB-005 — annuaire public et recherche dans les vitrines publiées. */
@Component({
  selector: 'cnpm-directory-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    DecimalPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    FormsModule,
    LucideArrowRight,
    LucideBuilding2,
    LucideMapPin,
    LucideRotateCcw,
    LucideSearch,
    PaginationComponent,
    PublicShellComponent,
    RouterLink,
    SkeletonComponent,
  ],
  templateUrl: './directory.page.html',
  styleUrls: ['./directory.page.scss', './directory.cards.scss', './directory.responsive.scss'],
})
export class DirectoryPage {
  private readonly gateway = inject(SHOWCASE_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(PageSeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retryRequest = new BehaviorSubject(0);
  private readonly restoreResultsFocus = signal(false);
  private readonly resultsTitle = viewChild<ElementRef<HTMLElement>>('resultsTitle');

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly mode = signal<DirectoryMode>('directory');
  protected readonly state = signal<DirectoryState>('loading');
  protected readonly result = signal<PublicShowcasePage | null>(null);
  protected readonly query = signal<PublicShowcaseQuery>({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
  protected readonly qDraft = signal('');
  protected readonly sectorDraft = signal('');

  protected readonly isSearchMode = computed(() => this.mode() === 'search');
  protected readonly hasFilters = computed(() => Boolean(this.query().q || this.query().sector));
  protected readonly pageSizeOptions = computed<readonly number[]>(() => [
    ...new Set([this.query().pageSize, 6, 12, DEFAULT_PAGE_SIZE]),
  ]);

  constructor() {
    combineLatest([this.route.data, this.route.queryParamMap, this.retryRequest])
      .pipe(
        map(([data, params]) => ({
          mode: data['mode'] === 'search' ? ('search' as const) : ('directory' as const),
          query: this.parseQuery(params),
        })),
        tap(({ mode, query }) => {
          this.mode.set(mode);
          this.query.set(query);
          this.qDraft.set(query.q ?? '');
          this.sectorDraft.set(query.sector ?? '');
          this.result.set(null);
          this.state.set('loading');
          this.updateMetadata(mode);
        }),
        switchMap(({ query }) =>
          this.gateway.listPublished(query).pipe(
            map((page): LoadOutcome => ({ ok: true, page })),
            catchError(() => of<LoadOutcome>({ ok: false, page: null })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((outcome) => {
        if (
          outcome.page &&
          outcome.page.totalPages > 0 &&
          outcome.page.page >= outcome.page.totalPages
        ) {
          const lastPage = outcome.page.totalPages - 1;
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page: lastPage === 0 ? null : lastPage },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          return;
        }
        this.result.set(outcome.page);
        this.state.set(outcome.ok ? 'ready' : 'error');
        if (outcome.ok && this.restoreResultsFocus()) {
          this.restoreResultsFocus.set(false);
          queueMicrotask(() => this.resultsTitle()?.nativeElement.focus());
        }
      });
  }

  protected applySearch(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.clean(this.qDraft(), 120) || null,
        sector: this.clean(this.sectorDraft(), 80) || null,
        page: null,
        pageSize: this.query().pageSize === DEFAULT_PAGE_SIZE ? null : this.query().pageSize,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected clearFilters(): void {
    this.qDraft.set('');
    this.sectorDraft.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, sector: null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected changePage(readablePage: number): void {
    this.restoreResultsFocus.set(true);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: readablePage <= 1 ? null : readablePage - 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected changePageSize(pageSize: number): void {
    this.restoreResultsFocus.set(true);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: null,
        pageSize: pageSize === DEFAULT_PAGE_SIZE ? null : pageSize,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected retry(): void {
    this.retryRequest.next(this.retryRequest.value + 1);
  }

  private parseQuery(params: ParamMap): PublicShowcaseQuery {
    const q = this.clean(params.get('q') ?? '', 120);
    const sector = this.clean(params.get('sector') ?? '', 80);
    return {
      ...(q ? { q } : {}),
      ...(sector ? { sector } : {}),
      page: this.integerInRange(params.get('page'), 0, Number.MAX_SAFE_INTEGER, 0),
      pageSize: this.integerInRange(params.get('pageSize'), 1, 100, DEFAULT_PAGE_SIZE),
    };
  }

  private clean(value: string, maxLength: number): string {
    return value.trim().slice(0, maxLength);
  }

  private integerInRange(
    raw: string | null,
    minimum: number,
    maximum: number,
    fallback: number,
  ): number {
    if (raw === null || !/^\d+$/.test(raw)) {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
      ? parsed
      : fallback;
  }

  private updateMetadata(mode: DirectoryMode): void {
    const isSearch = mode === 'search';
    this.seo.apply({
      title: isSearch ? 'Rechercher un membre — CNPM' : 'Annuaire des membres — CNPM',
      description: isSearch
        ? 'Rechercher une vitrine membre publiée dans l’annuaire de démonstration du CNPM.'
        : 'Consulter les vitrines membres publiées dans l’annuaire de démonstration du CNPM.',
      // Le contenu R4 est fictif et son contrat n'est pas promu : aucune indexation du pilote.
      robots: 'noindex,nofollow',
      canonicalPath: isSearch ? '/membres/recherche' : '/membres',
    });
  }
}
