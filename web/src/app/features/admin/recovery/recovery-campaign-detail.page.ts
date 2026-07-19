import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  RECOVERY_GATEWAY,
  RecoveryAccessError,
  type CampaignChannel,
  type CampaignRow,
  type CampaignStatus,
  type RecoveryQuery,
} from './recovery-gateway';

const STATUS_LABELS: Readonly<Record<CampaignStatus, string>> = {
  DRAFT: 'Brouillon',
  SCHEDULED: 'Planifiée',
  RUNNING: 'En cours',
  PAUSED: 'En pause',
  COMPLETED: 'Terminée',
};

const STATUS_TONES: Readonly<Record<CampaignStatus, CnpmBadgeTone>> = {
  DRAFT: 'neutral',
  SCHEDULED: 'info',
  RUNNING: 'info',
  PAUSED: 'warning',
  COMPLETED: 'success',
};

const CHANNEL_LABELS: Readonly<Record<CampaignChannel, string>> = {
  EMAIL: 'E-mail',
  SMS: 'SMS',
};

const DETAIL_QUERY: RecoveryQuery = {
  tab: 'campaigns',
  search: '',
  channel: null,
  segment: null,
  status: null,
  sort: null,
  page: 1,
  pageSize: 50,
};

type DetailState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly campaign: CampaignRow }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'forbidden' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'error' };

/** BO-018 — détail consultatif d'une campagne, sans diffusion ni décision simulée. */
@Component({
  selector: 'cnpm-recovery-campaign-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './recovery-campaign-detail.page.html',
  styleUrl: './recovery-campaign-detail.page.scss',
})
export class RecoveryCampaignDetailPage {
  private readonly gateway = inject(RECOVERY_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly retryTick = signal(0);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  private readonly result = toSignal(
    toObservable(this.retryTick).pipe(
      switchMap(() =>
        this.gateway.search(DETAIL_QUERY).pipe(
          map((page): DetailState => {
            if (page.rows.kind !== 'campaigns') return { kind: 'error' };
            const campaign = page.rows.items.find((item) => item.id === this.id);
            return campaign ? { kind: 'ready', campaign } : { kind: 'not-found' };
          }),
          catchError((error: unknown) => {
            if (error instanceof RecoveryAccessError) return of<DetailState>({ kind: 'forbidden' });
            if (error instanceof UnavailableHttpFeatureError) {
              return of<DetailState>({ kind: 'unavailable' });
            }
            return of<DetailState>({ kind: 'error' });
          }),
          startWith<DetailState>({ kind: 'loading' }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' } as DetailState },
  );

  protected readonly state = computed(() => this.result());
  protected readonly campaign = computed(() => {
    const state = this.result();
    return state.kind === 'ready' ? state.campaign : null;
  });
  protected readonly bamakoOffset = '+0000';

  protected statusLabel(status: CampaignStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: CampaignStatus): CnpmBadgeTone {
    return STATUS_TONES[status];
  }

  protected channelLabel(channel: CampaignChannel): string {
    return CHANNEL_LABELS[channel];
  }

  protected deliveryRate(campaign: CampaignRow): number | null {
    return campaign.sent === 0 ? null : (campaign.delivered / campaign.sent) * 100;
  }

  protected openRate(campaign: CampaignRow): number | null {
    return campaign.openable === 0 ? null : (campaign.opened / campaign.openable) * 100;
  }

  protected conversionRate(campaign: CampaignRow): number | null {
    return campaign.delivered === 0 ? null : (campaign.pledgeCount / campaign.delivered) * 100;
  }

  protected retry(): void {
    this.retryTick.update((value) => value + 1);
  }
}
