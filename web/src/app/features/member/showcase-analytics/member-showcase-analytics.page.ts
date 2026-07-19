import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_SHOWCASE_ANALYTICS_GATEWAY,
  type ShowcaseAnalyticsPeriod,
  type ShowcaseAnalyticsSnapshot,
  type ShowcaseDailyAggregate,
} from './member-showcase-analytics.gateway';

type AnalyticsDisplay = 'chart' | 'table';
const PERIODS: readonly ShowcaseAnalyticsPeriod[] = ['7d', '30d', '90d'];
const DISPLAYS: readonly AnalyticsDisplay[] = ['chart', 'table'];

/** MP-017 — statistiques agrégées locales, sans suivi individuel. */
@Component({
  selector: 'cnpm-member-showcase-analytics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    NgTemplateOutlet,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-showcase-analytics.page.html',
  styleUrls: [
    './member-showcase-analytics.page.scss',
    './member-showcase-analytics.page.responsive.scss',
  ],
})
export class MemberShowcaseAnalyticsPage {
  private readonly gateway = inject(MEMBER_SHOWCASE_ANALYTICS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(PageSeoService);
  private readonly injector = inject(Injector);
  private readonly retryTick = signal(0);
  private readonly pageHeader = viewChild(PageHeaderComponent);
  private focusPending = true;

  protected readonly periods = PERIODS;
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly period = computed<ShowcaseAnalyticsPeriod>(
    () => known(this.params().get('period'), PERIODS) ?? '30d',
  );
  protected readonly display = computed<AnalyticsDisplay>(
    () => known(this.params().get('display'), DISPLAYS) ?? 'chart',
  );
  private readonly fetchTrigger = computed(() => ({
    period: this.period(),
    retry: this.retryTick(),
  }));
  protected readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ period }) =>
        this.gateway.load({ period }).pipe(
          map((snapshot) =>
            snapshot?.days.length
              ? { kind: 'ready' as const, snapshot }
              : { kind: 'empty' as const },
          ),
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
  protected readonly snapshot = computed<ShowcaseAnalyticsSnapshot | null>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.snapshot : null;
  });
  protected readonly days = computed(() => this.snapshot()?.days ?? []);
  protected readonly plottedDays = computed(() =>
    this.period() === '90d' ? this.days().slice(-30) : this.days(),
  );
  protected readonly totalViews = computed(() =>
    this.plottedDays().reduce((total, day) => total + day.views, 0),
  );
  protected readonly averageViews = computed(() =>
    this.plottedDays().length ? Math.round(this.totalViews() / this.plottedDays().length) : 0,
  );
  protected readonly peakDay = computed<ShowcaseDailyAggregate | null>(() =>
    this.plottedDays().reduce<ShowcaseDailyAggregate | null>(
      (peak, day) => (!peak || day.views > peak.views ? day : peak),
      null,
    ),
  );
  protected readonly maxViews = computed(() =>
    Math.max(1, ...this.plottedDays().map((day) => day.views)),
  );
  protected readonly plottedPeriodLabel = computed(() => {
    switch (this.period()) {
      case '7d':
        return '7 derniers jours';
      case '90d':
        return '30 derniers jours tracés sur 90 jours sélectionnés';
      default:
        return '30 derniers jours';
    }
  });
  protected readonly chartLabel = computed(
    () =>
      `${this.plottedPeriodLabel()} : ${this.totalViews()} vues agrégées, ` +
      `pic à ${this.peakDay()?.views ?? 0} vues. Aucun visiteur n’est identifiable.`,
  );

  constructor() {
    this.seo.apply({
      title: 'Statistiques privées de la vitrine — CNPM',
      description: 'Statistiques agrégées et anonymes d’une vitrine membre.',
      robots: 'noindex,nofollow',
      canonicalPath: '/member/showcase/analytics',
    });
    effect(() => {
      if (this.result().kind === 'loading' || !this.focusPending) return;
      this.focusPending = false;
      afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
    });
  }

  protected selectPeriod(value: string): void {
    this.patch({ period: known(value, PERIODS) ?? '30d' });
  }

  protected selectDisplay(display: AnalyticsDisplay): void {
    this.patch({ display });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patch(queryParams: Record<string, string>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}

function known<T extends string>(value: string | null, values: readonly T[]): T | null {
  return value && (values as readonly string[]).includes(value) ? (value as T) : null;
}
