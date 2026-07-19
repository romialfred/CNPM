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
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideBuilding2,
  LucideLayers,
  LucideRuler,
  LucideWrench,
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
  SHOWCASE_GATEWAY,
  type MemberShowcase,
  type ShowcaseProject,
  type ShowcaseResult,
} from '../showcase/showcase-gateway';

type ShowcaseDetailMode = 'activities' | 'project';
type ShowcaseDetailState =
  'loading' | 'ready' | 'not-public' | 'showcase-not-found' | 'project-not-found' | 'error';

interface DetailRequest {
  readonly mode: ShowcaseDetailMode;
  readonly slug: string;
  readonly projectId: string | null;
}

type DetailOutcome =
  | { readonly request: DetailRequest; readonly result: ShowcaseResult }
  | { readonly request: DetailRequest; readonly error: true };

/**
 * PUB-007 / PUB-008 — activités, réalisations et détail public d'une vitrine publiée.
 * La lecture reste adossée à PUB-006 : aucun endpoint de détail absent du draft R4
 * n'est simulé par ce composant.
 */
@Component({
  selector: 'cnpm-showcase-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LucideArrowLeft,
    LucideArrowRight,
    LucideBuilding2,
    LucideLayers,
    LucideRuler,
    LucideWrench,
    PublicShellComponent,
    RouterLink,
    SkeletonComponent,
  ],
  templateUrl: './showcase-detail.page.html',
  styleUrls: [
    './showcase-detail.page.scss',
    './showcase-detail.cards.scss',
    './showcase-detail.responsive.scss',
  ],
})
export class ShowcaseDetailPage {
  private readonly gateway = inject(SHOWCASE_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(PageSeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly retryRequest = new BehaviorSubject(0);
  private readonly pageTitle = viewChild<ElementRef<HTMLElement>>('pageTitle');

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly mode = signal<ShowcaseDetailMode>('activities');
  protected readonly state = signal<ShowcaseDetailState>('loading');
  protected readonly showcase = signal<MemberShowcase | null>(null);
  protected readonly project = signal<ShowcaseProject | null>(null);

  protected readonly isProjectMode = computed(() => this.mode() === 'project');
  protected readonly memberBadge = computed(() => this.showcase()?.name ?? null);

  constructor() {
    combineLatest([this.route.data, this.route.paramMap, this.retryRequest])
      .pipe(
        map(([data, params]): DetailRequest => ({
          mode: data['mode'] === 'project' ? 'project' : 'activities',
          slug: params.get('slug') ?? '',
          projectId: params.get('id'),
        })),
        tap((request) => {
          this.mode.set(request.mode);
          this.state.set('loading');
          this.showcase.set(null);
          this.project.set(null);
        }),
        switchMap((request) =>
          this.gateway.findBySlug(request.slug).pipe(
            map((result): DetailOutcome => ({ request, result })),
            catchError(() => of<DetailOutcome>({ request, error: true })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((outcome) => this.resolve(outcome));
  }

  protected retry(): void {
    this.retryRequest.next(this.retryRequest.value + 1);
  }

  private resolve(outcome: DetailOutcome): void {
    if ('error' in outcome) {
      this.state.set('error');
      this.blockIndexing(outcome.request, 'Contenu indisponible — CNPM');
      return;
    }
    if (outcome.result.outcome === 'not-public') {
      this.state.set('not-public');
      this.blockIndexing(outcome.request, 'Vitrine non publiée — CNPM');
      return;
    }
    if (outcome.result.outcome === 'not-found') {
      this.state.set('showcase-not-found');
      this.blockIndexing(outcome.request, 'Vitrine introuvable — CNPM');
      return;
    }

    const showcase = outcome.result.showcase;
    this.showcase.set(showcase);
    if (outcome.request.mode === 'project') {
      const project = showcase.projects.find((item) => item.id === outcome.request.projectId);
      if (!project) {
        this.state.set('project-not-found');
        this.blockIndexing(outcome.request, 'Réalisation introuvable — CNPM');
        return;
      }
      this.project.set(project);
    }
    this.state.set('ready');
    this.applySeo(showcase, this.project());
    afterNextRender(() => this.pageTitle()?.nativeElement.focus(), { injector: this.injector });
  }

  private applySeo(showcase: MemberShowcase, project: ShowcaseProject | null): void {
    const title = project
      ? `${project.title} — ${showcase.name}`
      : `Activités et réalisations — ${showcase.name}`;
    const canonicalPath = project
      ? (`/membres/${encodeURIComponent(showcase.slug)}/realisations/${encodeURIComponent(project.id)}` as const)
      : (`/membres/${encodeURIComponent(showcase.slug)}/activites` as const);
    this.seo.apply({
      title,
      description: project
        ? project.summary
        : `Activités et réalisations publiées par ${showcase.name}.`,
      robots:
        !showcase.isDemoContent && showcase.allowIndexing ? 'index,follow' : 'noindex,nofollow',
      canonicalPath,
    });
  }

  private blockIndexing(request: DetailRequest, title: string): void {
    const suffix =
      request.mode === 'project' && request.projectId
        ? `/realisations/${encodeURIComponent(request.projectId)}`
        : '/activites';
    this.seo.apply({
      title,
      description: 'Ce contenu de vitrine n’est pas disponible publiquement.',
      robots: 'noindex,nofollow',
      canonicalPath: `/membres/${encodeURIComponent(request.slug)}${suffix}`,
    });
  }
}
