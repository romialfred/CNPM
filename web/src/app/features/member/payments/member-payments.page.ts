import { DecimalPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { LucideCircleCheckBig, LucideReceiptText, LucideWallet } from '@lucide/angular';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_PAYMENTS_GATEWAY,
  MemberPaymentsNoMembershipError,
  type MemberPayment,
  type MemberPaymentChannel,
} from './member-payments-gateway';

type LoadState = 'loading' | 'ready' | 'error' | 'noMembership';

const CHANNEL_LABELS: Readonly<Record<MemberPaymentChannel, string>> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  MTN_MONEY: 'MTN Money',
  BANK_TRANSFER: 'Virement bancaire',
  CASH: 'Espèces',
};

/**
 * Espace membre — « Mes paiements » (MP-004) : l'historique réel des encaissements du cotisant.
 */
@Component({
  selector: 'cnpm-member-payments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    SlicePipe,
    MemberPortalShellComponent,
    PageHeaderComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    LucideWallet,
    LucideCircleCheckBig,
    LucideReceiptText,
  ],
  templateUrl: './member-payments.page.html',
  styleUrl: './member-payments.page.scss',
})
export class MemberPaymentsPage {
  private readonly gateway = inject(MEMBER_PAYMENTS_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);

  protected readonly state = signal<LoadState>('loading');
  protected readonly payments = signal<readonly MemberPayment[]>([]);

  protected readonly total = computed(() =>
    this.payments().reduce((sum, payment) => sum + payment.amount, 0),
  );
  protected readonly confirmedCount = computed(
    () => this.payments().filter((payment) => payment.confirmed).length,
  );

  constructor() {
    this.title.setTitle('Mes paiements — Espace membre CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payments) => {
          this.payments.set(payments);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          this.state.set(
            error instanceof MemberPaymentsNoMembershipError ? 'noMembership' : 'error',
          );
        },
      });
  }

  protected channelLabel(channel: MemberPaymentChannel): string {
    return CHANNEL_LABELS[channel];
  }

  protected statusLabel(confirmed: boolean): string {
    return confirmed ? 'Confirmé' : 'En attente de confirmation';
  }

  protected statusTone(confirmed: boolean): CnpmBadgeTone {
    return confirmed ? 'success' : 'warning';
  }
}
