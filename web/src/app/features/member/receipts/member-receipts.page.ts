import { DecimalPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { LucideBadgeCheck, LucideReceiptText } from '@lucide/angular';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_RECEIPTS_GATEWAY,
  MemberReceiptsNoMembershipError,
  type MemberReceipt,
  type MemberReceiptChannel,
} from './member-receipts-gateway';

type LoadState = 'loading' | 'ready' | 'error' | 'noMembership';

const CHANNEL_LABELS: Readonly<Record<MemberReceiptChannel, string>> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  MTN_MONEY: 'MTN Money',
  BANK_TRANSFER: 'Virement bancaire',
  CASH: 'Espèces',
};

/**
 * Espace membre — « Mes reçus » (MP-007) : les reçus officiels réels du cotisant.
 */
@Component({
  selector: 'cnpm-member-receipts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    SlicePipe,
    MemberPortalShellComponent,
    PageHeaderComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    LucideReceiptText,
    LucideBadgeCheck,
  ],
  templateUrl: './member-receipts.page.html',
  styleUrl: './member-receipts.page.scss',
})
export class MemberReceiptsPage {
  private readonly gateway = inject(MEMBER_RECEIPTS_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);

  protected readonly state = signal<LoadState>('loading');
  protected readonly receipts = signal<readonly MemberReceipt[]>([]);

  protected readonly total = computed(() =>
    this.receipts().reduce((sum, receipt) => sum + receipt.amount, 0),
  );

  constructor() {
    this.title.setTitle('Mes reçus — Espace membre CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (receipts) => {
          this.receipts.set(receipts);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          this.state.set(
            error instanceof MemberReceiptsNoMembershipError ? 'noMembership' : 'error',
          );
        },
      });
  }

  protected channelLabel(channel: MemberReceiptChannel): string {
    return CHANNEL_LABELS[channel];
  }

  protected statusLabel(status: string): string {
    if (status === 'ISSUED') {
      return 'Émis';
    }
    if (status === 'CANCELLED') {
      return 'Annulé';
    }
    return status;
  }

  protected statusTone(status: string): CnpmBadgeTone {
    if (status === 'ISSUED') {
      return 'success';
    }
    if (status === 'CANCELLED') {
      return 'error';
    }
    return 'neutral';
  }
}
