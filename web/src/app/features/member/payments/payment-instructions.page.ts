import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  PAYMENT_INSTRUCTIONS_GATEWAY,
  PaymentInstructionsNoMembershipError,
  type CollectionAccountLine,
  type CollectionChannel,
  type PaymentInstructions,
} from './payment-instructions-gateway';

type LoadState = 'loading' | 'ready' | 'error' | 'noMembership';

const CHANNEL_LABELS: Readonly<Record<CollectionChannel, string>> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  MTN_MONEY: 'MTN Money',
  BANK_TRANSFER: 'Virement bancaire',
};

/**
 * Espace membre — « Comment payer ma cotisation » (Lot 3 de la refonte).
 *
 * <p>Le cotisant choisit son canal (Orange Money / Wave / MTN / virement), lit les coordonnées
 * d'encaissement validées de la COGEF et sa référence, puis paie depuis son propre compte. Rien
 * n'est débité ici : la plateforme n'affiche que des instructions, le paiement se fait chez
 * l'opérateur ou la banque du cotisant, et le rapprochement suit côté CNPM.
 */
@Component({
  selector: 'cnpm-member-payment-instructions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MemberPortalShellComponent, PageHeaderComponent, AlertComponent, ButtonComponent],
  templateUrl: './payment-instructions.page.html',
  styleUrl: './payment-instructions.page.scss',
})
export class PaymentInstructionsPage {
  private readonly gateway = inject(PAYMENT_INSTRUCTIONS_GATEWAY);
  private readonly title = inject(Title);
  // `load()`/Réessayer hors contexte d'injection → `DestroyRef` passé explicitement (NG0203).
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<LoadState>('loading');
  protected readonly instructions = signal<PaymentInstructions | null>(null);
  protected readonly selectedChannel = signal<CollectionChannel | null>(null);

  /** Référence la plus récente : celle que le cotisant utilise pour payer. */
  protected readonly primaryReference = computed(
    () => this.instructions()?.references[0] ?? null,
  );

  /** Canaux réellement proposés par la CNPM, dédupliqués dans l'ordre d'apparition. */
  protected readonly channels = computed<readonly CollectionChannel[]>(() => {
    const accounts = this.instructions()?.collectionAccounts ?? [];
    const seen = new Set<CollectionChannel>();
    const ordered: CollectionChannel[] = [];
    for (const account of accounts) {
      if (!seen.has(account.channel)) {
        seen.add(account.channel);
        ordered.push(account.channel);
      }
    }
    return ordered;
  });

  protected readonly selectedAccounts = computed<readonly CollectionAccountLine[]>(() => {
    const channel = this.selectedChannel();
    if (!channel) return [];
    return (this.instructions()?.collectionAccounts ?? []).filter(
      (account) => account.channel === channel,
    );
  });

  constructor() {
    this.title.setTitle('Comment payer — Espace membre CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (instructions) => {
          this.instructions.set(instructions);
          this.selectedChannel.set(instructions.collectionAccounts[0]?.channel ?? null);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          this.state.set(
            error instanceof PaymentInstructionsNoMembershipError ? 'noMembership' : 'error',
          );
        },
      });
  }

  protected chooseChannel(channel: CollectionChannel): void {
    this.selectedChannel.set(channel);
  }

  protected channelLabel(channel: CollectionChannel): string {
    return CHANNEL_LABELS[channel];
  }
}
