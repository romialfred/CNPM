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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { MEMBER_SHOWCASE_GATEWAY, type MemberShowcaseDraft } from './member-showcase-gateway';
import { MemberShowcaseTemplateComponent } from './member-showcase-template.component';
import { memberShowcaseIssues } from './member-showcase-validation';

export type ShowcasePreviewViewport = 'desktop' | 'tablet' | 'mobile';
const VIEWPORTS: readonly ShowcasePreviewViewport[] = ['desktop', 'tablet', 'mobile'];

/** MP-016 — aperçu privé noindex, sans capacité de soumission ou publication. */
@Component({
  selector: 'cnpm-member-showcase-preview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MemberPortalShellComponent,
    MemberShowcaseTemplateComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-showcase-preview.page.html',
  styleUrl: './member-showcase-preview.page.scss',
})
export class MemberShowcasePreviewPage {
  private readonly gateway = inject(MEMBER_SHOWCASE_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(PageSeoService);
  private readonly injector = inject(Injector);
  private readonly pageHeader = viewChild(PageHeaderComponent);
  private readonly retryTick = signal(0);
  private focusPending = true;

  protected readonly viewports = VIEWPORTS;
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly viewport = computed<ShowcasePreviewViewport>(() => {
    const value = this.params().get('viewport');
    return value && (VIEWPORTS as readonly string[]).includes(value)
      ? (value as ShowcasePreviewViewport)
      : 'desktop';
  });
  protected readonly result = toSignal(
    toObservable(this.retryTick).pipe(
      switchMap(() =>
        this.gateway.loadDraft('MP-016').pipe(
          map((draft) => (draft ? { kind: 'ready' as const, draft } : { kind: 'empty' as const })),
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
  protected readonly draft = computed<MemberShowcaseDraft | null>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.draft : null;
  });
  protected readonly issues = computed(() => {
    const draft = this.draft();
    return draft ? memberShowcaseIssues(draft) : [];
  });

  constructor() {
    this.seo.apply({
      title: 'Aperçu privé de la vitrine — CNPM',
      description: 'Aperçu privé et non indexable d’un brouillon fictif de vitrine membre.',
      robots: 'noindex,nofollow',
      canonicalPath: '/member/showcase/preview',
    });
    effect(() => {
      if (this.result().kind === 'loading' || !this.focusPending) return;
      this.focusPending = false;
      afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
    });
  }

  protected selectViewport(viewport: ShowcasePreviewViewport): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { viewport },
      queryParamsHandling: 'merge',
    });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }
}
