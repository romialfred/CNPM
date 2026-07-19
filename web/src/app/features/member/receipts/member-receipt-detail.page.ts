import { DatePipe, DecimalPipe } from '@angular/common';
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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { memberReceiptStatusLabel, memberReceiptStatusTone } from './member-receipt-presenter';
import { MEMBER_RECEIPTS_GATEWAY, MemberReceiptNotFoundError } from './member-receipts-gateway';

type ReceiptDetailState = 'loading' | 'ready' | 'not-found' | 'error' | 'unavailable';

/** MP-008 — aperçu HTML consultatif, jamais une preuve officielle. */
@Component({
  selector: 'cnpm-member-receipt-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-receipt-detail.page.html',
  styleUrl: './member-receipt-detail.page.scss',
})
export class MemberReceiptDetailPage {
  private readonly gateway = inject(MEMBER_RECEIPTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly receiptId = computed(() => this.params().get('id') ?? '');
  protected readonly listQueryParams = computed(() => {
    const map = this.queryParams();
    return Object.fromEntries(map.keys.map((key) => [key, map.get(key)]));
  });
  private readonly retryTick = signal(0);
  private readonly pageHeader = viewChild(PageHeaderComponent);
  private focusPending = true;
  private readonly fetchTrigger = computed(() => ({
    id: this.receiptId(),
    retry: this.retryTick(),
  }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.loadDetail(id).pipe(
          map((detail) => ({ kind: 'ready' as const, detail })),
          catchError((error: unknown) => {
            if (error instanceof MemberReceiptNotFoundError) {
              return of({ kind: 'not-found' as const });
            }
            if (error instanceof UnavailableHttpFeatureError) {
              return of({ kind: 'unavailable' as const });
            }
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed<ReceiptDetailState>(() => this.result().kind);
  protected readonly detail = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.detail : null;
  });
  protected readonly statusLabel = memberReceiptStatusLabel;
  protected readonly statusTone = memberReceiptStatusTone;

  constructor() {
    effect(() => {
      const result = this.result();
      if (result.kind === 'loading' || !this.focusPending) return;
      this.focusPending = false;
      afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
    });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }
}
