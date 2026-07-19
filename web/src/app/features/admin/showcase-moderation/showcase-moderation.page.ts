import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  SHOWCASE_MODERATION_GATEWAY,
  type ShowcaseModerationItem,
  type ShowcaseReviewCheckStatus,
} from './showcase-moderation-gateway';
import { ShowcaseModerationPreviewComponent } from './showcase-moderation-preview.component';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

const LOCKED_ACTIONS = [
  'Approuver',
  'Demander des modifications',
  'Rejeter avec un motif',
  'Planifier la publication',
  'Suspendre la vitrine',
  'Dépublier en urgence',
  'Restaurer la version approuvée',
] as const;

/** BO-037 — file fictive de modération, sans commande ni donnée publique réelle. */
@Component({
  selector: 'cnpm-showcase-moderation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
    ShowcaseModerationPreviewComponent,
  ],
  templateUrl: './showcase-moderation.page.html',
  styleUrl: './showcase-moderation.page.scss',
})
export class ShowcaseModerationPage {
  private readonly gateway = inject(SHOWCASE_MODERATION_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly retryTick = signal(0);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly demoMode = inject(CNPM_DATA_MODE) === 'demo';
  protected readonly lockedActions = LOCKED_ACTIONS;
  private readonly result = toSignal(
    toObservable(this.retryTick).pipe(
      switchMap(() =>
        this.gateway.loadQueue().pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) =>
            of({
              kind:
                error instanceof UnavailableHttpFeatureError
                  ? ('unavailable' as const)
                  : ('error' as const),
            }),
          ),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed(() => {
    const result = this.result();
    if (result.kind !== 'ready') return result.kind;
    return result.data.items.length > 0 ? ('ready' as const) : ('empty' as const);
  });
  protected readonly items = computed<readonly ShowcaseModerationItem[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.items : [];
  });
  protected readonly selected = computed(() => {
    const items = this.items();
    const requestedId = this.params().get('submission');
    return items.find((item) => item.id === requestedId) ?? items[0] ?? null;
  });

  protected select(id: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { submission: id },
      queryParamsHandling: 'merge',
    });
  }

  protected retry(): void {
    this.retryTick.update((value) => value + 1);
  }

  protected formatDate(value: string): string {
    return DATE_FORMATTER.format(new Date(value));
  }

  protected queueTone(item: ShowcaseModerationItem): CnpmBadgeTone {
    return item.queueLabel === 'Contrôle requis' ? 'warning' : 'info';
  }

  protected checkTone(status: ShowcaseReviewCheckStatus): CnpmBadgeTone {
    if (status === 'SAFE_DEMO') return 'success';
    if (status === 'REVIEW_REQUIRED') return 'warning';
    return 'neutral';
  }

  protected checkLabel(status: ShowcaseReviewCheckStatus): string {
    const labels: Readonly<Record<ShowcaseReviewCheckStatus, string>> = {
      SAFE_DEMO: 'Scénario sans alerte',
      REVIEW_REQUIRED: 'Examen requis',
      NOT_VERIFIED: 'Non vérifié',
      NOT_APPLICABLE: 'Non applicable',
    };
    return labels[status];
  }
}
