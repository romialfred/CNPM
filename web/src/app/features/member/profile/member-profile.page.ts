import { DatePipe } from '@angular/common';
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
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { MEMBER_PROFILE_GATEWAY } from './member-profile-gateway';

/** MP-013 — profil d’entreprise fictif, strictement consultatif. */
@Component({
  selector: 'cnpm-member-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-profile.page.html',
  styleUrl: './member-profile.page.scss',
})
export class MemberProfilePage {
  private readonly gateway = inject(MEMBER_PROFILE_GATEWAY);
  private readonly injector = inject(Injector);
  private readonly retryTick = signal(0);
  private readonly pageHeader = viewChild(PageHeaderComponent);
  private focusPending = true;

  protected readonly result = toSignal(
    toObservable(this.retryTick).pipe(
      switchMap(() =>
        this.gateway.load().pipe(
          map((profile) =>
            profile ? { kind: 'ready' as const, profile } : { kind: 'empty' as const },
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
  protected readonly profile = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.profile : null;
  });

  constructor() {
    effect(() => {
      if (this.result().kind === 'loading' || !this.focusPending) return;
      this.focusPending = false;
      afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
    });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }
}
