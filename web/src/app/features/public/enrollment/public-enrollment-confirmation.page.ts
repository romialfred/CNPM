import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PublicShellComponent } from '../public-shell.component';
import { PublicEnrollmentSession } from './public-enrollment-session';

/** PUB-013 — confirmation de session, sans valeur de dépôt officiel. */
@Component({
  selector: 'cnpm-public-enrollment-confirmation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AlertComponent, ButtonComponent, ErrorStateComponent, PublicShellComponent],
  templateUrl: './public-enrollment-confirmation.page.html',
  styleUrl: './public-enrollment-confirmation.page.scss',
})
export class PublicEnrollmentConfirmationPage {
  private readonly dataMode = inject(CNPM_DATA_MODE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(PublicEnrollmentSession);
  private readonly seo = inject(PageSeoService);
  private readonly injector = inject(Injector);
  private readonly pageTitle = viewChild<ElementRef<HTMLElement>>('pageTitle');
  private readonly reference = signal<string | null>(null);

  protected readonly isDemo = this.dataMode === 'demo';
  protected readonly result = computed(() => {
    const confirmation = this.session.confirmation();
    return confirmation?.reference === this.reference() ? confirmation : null;
  });

  constructor() {
    this.seo.apply({
      title: 'Confirmation locale d’adhésion — CNPM',
      description:
        'Confirmation locale fictive ne créant aucun dossier officiel et ne transmettant aucune donnée.',
      robots: 'noindex,nofollow',
      canonicalPath: '/adhesion/confirmation',
    });
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.reference.set(params.get('reference')));
    afterNextRender(() => this.pageTitle()?.nativeElement.focus(), { injector: this.injector });
  }

  protected restart(): void {
    this.session.clear();
    void this.router.navigate(['/adhesion'], { queryParams: { etape: 'entreprise' } });
  }
}
