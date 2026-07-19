import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideBadgeCheck,
  LucideFileSearch2,
  LucideSearch,
  LucideShieldCheck,
} from '@lucide/angular';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { PublicShellComponent } from '../public-shell.component';
import {
  RECEIPT_VERIFICATION_GATEWAY,
  type PublicReceiptVerificationDemo,
  type PublicReceiptVerificationResult,
} from './receipt-verification-gateway';

type VerificationState = 'loading' | 'found' | 'not-found' | 'error';

type LoadOutcome =
  | { readonly ok: true; readonly result: PublicReceiptVerificationResult }
  | { readonly ok: false };

/** PUB-015 / REC-006 — vérification publique limitée d’un aperçu de reçu. */
@Component({
  selector: 'cnpm-receipt-verification-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CurrencyPipe,
    DatePipe,
    ErrorStateComponent,
    FormsModule,
    LucideBadgeCheck,
    LucideFileSearch2,
    LucideSearch,
    LucideShieldCheck,
    PublicShellComponent,
    SkeletonComponent,
  ],
  templateUrl: './receipt-verification.page.html',
  styleUrls: ['./receipt-verification.page.scss', './receipt-verification.responsive.scss'],
})
export class ReceiptVerificationPage {
  private readonly gateway = inject(RECEIPT_VERIFICATION_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(PageSeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly retryRequest = new BehaviorSubject(0);
  private readonly pageTitle = viewChild<ElementRef<HTMLElement>>('pageTitle');

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly state = signal<VerificationState>('loading');
  protected readonly result = signal<PublicReceiptVerificationDemo | null>(null);
  protected readonly code = signal('');
  protected readonly codeDraft = signal('');

  constructor() {
    combineLatest([this.route.paramMap, this.retryRequest])
      .pipe(
        map(([params]) => this.clean(params.get('code'))),
        tap((code) => {
          this.code.set(code);
          this.codeDraft.set(code);
          this.result.set(null);
          this.state.set('loading');
          this.seo.apply({
            title: 'Vérification d’un aperçu de reçu — CNPM',
            description:
              'Vérification publique limitée d’un aperçu de reçu, conformément à REC-006.',
            robots: 'noindex,nofollow',
            canonicalPath: `/verification/${encodeURIComponent(code || 'code')}`,
          });
        }),
        switchMap((code) =>
          this.gateway.verify(code).pipe(
            map((result): LoadOutcome => ({ ok: true, result })),
            catchError(() => of<LoadOutcome>({ ok: false })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((outcome) => {
        if (!outcome.ok) {
          this.state.set('error');
          this.focusTitle();
          return;
        }
        if (outcome.result.outcome === 'not-found') {
          this.state.set('not-found');
          this.focusTitle();
          return;
        }
        this.result.set(outcome.result.verification);
        this.state.set('found');
        this.focusTitle();
      });
  }

  protected submitCode(): void {
    const code = this.clean(this.codeDraft());
    if (!code) return;
    void this.router.navigate(['/verification', code]);
  }

  protected retry(): void {
    this.retryRequest.next(this.retryRequest.value + 1);
  }

  private clean(value: string | null): string {
    return (value ?? '').trim().replace(/\s+/g, '').slice(0, 96).toUpperCase();
  }

  private focusTitle(): void {
    afterNextRender(() => this.pageTitle()?.nativeElement.focus(), { injector: this.injector });
  }
}
