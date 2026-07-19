import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideClock3,
  LucideMapPin,
  LucideNewspaper,
  LucideRotateCcw,
  LucideSearch,
} from '@lucide/angular';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { PublicShellComponent } from '../public-shell.component';
import {
  EDITORIAL_GATEWAY,
  type PublicDemoArticle,
  type PublicDemoEvent,
} from './editorial-gateway';

type EditorialMode = 'news' | 'article' | 'agenda';
type EditorialState = 'loading' | 'ready' | 'empty' | 'error' | 'not-found';

interface EditorialQuery {
  readonly q: string;
  readonly category: string;
}

type LoadOutcome =
  | { readonly ok: true; readonly articles: readonly PublicDemoArticle[] }
  | { readonly ok: true; readonly article: PublicDemoArticle | null }
  | { readonly ok: true; readonly events: readonly PublicDemoEvent[] }
  | { readonly ok: false };

/** PUB-009 / PUB-010 / PUB-011 — actualités et agenda publics. */
@Component({
  selector: 'cnpm-editorial-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    DatePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    FormsModule,
    LucideArrowLeft,
    LucideArrowRight,
    LucideCalendarDays,
    LucideClock3,
    LucideMapPin,
    LucideNewspaper,
    LucideRotateCcw,
    LucideSearch,
    PublicShellComponent,
    RouterLink,
    SkeletonComponent,
  ],
  templateUrl: './editorial.page.html',
  styleUrls: ['./editorial.page.scss', './editorial.cards.scss', './editorial.responsive.scss'],
})
export class EditorialPage {
  private readonly gateway = inject(EDITORIAL_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(PageSeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly retryRequest = new BehaviorSubject(0);
  private readonly pageTitle = viewChild<ElementRef<HTMLElement>>('pageTitle');

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly mode = signal<EditorialMode>('news');
  protected readonly state = signal<EditorialState>('loading');
  protected readonly articles = signal<readonly PublicDemoArticle[]>([]);
  protected readonly article = signal<PublicDemoArticle | null>(null);
  protected readonly events = signal<readonly PublicDemoEvent[]>([]);
  protected readonly query = signal<EditorialQuery>({ q: '', category: '' });
  protected readonly qDraft = signal('');
  protected readonly categoryDraft = signal('');

  protected readonly categories = computed(() => [
    ...new Set(this.articles().map((item) => item.category)),
  ]);
  protected readonly filteredArticles = computed(() => {
    const q = this.query().q.toLocaleLowerCase('fr');
    const category = this.query().category;
    return this.articles().filter((item) => {
      const matchesCategory = !category || item.category === category;
      const haystack = `${item.title} ${item.summary} ${item.category}`.toLocaleLowerCase('fr');
      return matchesCategory && (!q || haystack.includes(q));
    });
  });
  protected readonly hasFilters = computed(() => Boolean(this.query().q || this.query().category));

  constructor() {
    combineLatest([
      this.route.data,
      this.route.paramMap,
      this.route.queryParamMap,
      this.retryRequest,
    ])
      .pipe(
        map(([data, params, queryParams]) => ({
          mode: this.resolveMode(data['mode']),
          slug: params.get('slug') ?? '',
          query: {
            q: this.clean(queryParams.get('q'), 120),
            category: this.clean(queryParams.get('categorie'), 80),
          },
        })),
        tap(({ mode, query }) => {
          this.mode.set(mode);
          this.query.set(query);
          this.qDraft.set(query.q);
          this.categoryDraft.set(query.category);
          this.article.set(null);
          this.state.set('loading');
          this.applySeo(mode);
        }),
        switchMap(({ mode, slug }) => {
          if (mode === 'article') {
            return this.gateway.findArticle(slug).pipe(
              map((article): LoadOutcome => ({ ok: true, article })),
              catchError(() => of<LoadOutcome>({ ok: false })),
            );
          }
          if (mode === 'agenda') {
            return this.gateway.listEvents().pipe(
              map((events): LoadOutcome => ({ ok: true, events })),
              catchError(() => of<LoadOutcome>({ ok: false })),
            );
          }
          return this.gateway.listArticles().pipe(
            map((articles): LoadOutcome => ({ ok: true, articles })),
            catchError(() => of<LoadOutcome>({ ok: false })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((outcome) => this.applyOutcome(outcome));
  }

  protected applyFilters(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.clean(this.qDraft(), 120) || null,
        categorie: this.clean(this.categoryDraft(), 80) || null,
      },
    });
  }

  protected clearFilters(): void {
    this.qDraft.set('');
    this.categoryDraft.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, categorie: null },
    });
  }

  protected retry(): void {
    this.retryRequest.next(this.retryRequest.value + 1);
  }

  private applyOutcome(outcome: LoadOutcome): void {
    if (!outcome.ok) {
      this.state.set('error');
      return;
    }
    if ('article' in outcome) {
      this.article.set(outcome.article);
      this.state.set(outcome.article ? 'ready' : 'not-found');
      if (outcome.article) {
        this.seo.apply({
          title: `${outcome.article.title} — CNPM`,
          description: outcome.article.summary,
          robots: 'noindex,nofollow',
          canonicalPath: `/actualites/${outcome.article.slug}`,
        });
      }
      this.focusPageTitle();
      return;
    }
    if ('events' in outcome) {
      this.events.set(outcome.events);
      this.state.set(outcome.events.length > 0 ? 'ready' : 'empty');
      this.focusPageTitle();
      return;
    }
    this.articles.set(outcome.articles);
    this.state.set(outcome.articles.length > 0 ? 'ready' : 'empty');
    this.focusPageTitle();
  }

  private resolveMode(value: unknown): EditorialMode {
    return value === 'article' || value === 'agenda' ? value : 'news';
  }

  private applySeo(mode: EditorialMode): void {
    if (mode === 'agenda') {
      this.seo.apply({
        title: 'Agenda — CNPM',
        description: 'Les prochains rendez-vous publics du CNPM et de son réseau.',
        robots: 'noindex,nofollow',
        canonicalPath: '/agenda',
      });
      return;
    }
    this.seo.apply({
      title: mode === 'article' ? 'Actualité — CNPM' : 'Actualités — CNPM',
      description: 'L’espace éditorial public du CNPM et de son réseau d’entreprises.',
      robots: 'noindex,nofollow',
      canonicalPath: '/actualites',
    });
  }

  private clean(value: string | null, maxLength: number): string {
    return (value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
  }

  private focusPageTitle(): void {
    afterNextRender(() => this.pageTitle()?.nativeElement.focus(), { injector: this.injector });
  }
}
