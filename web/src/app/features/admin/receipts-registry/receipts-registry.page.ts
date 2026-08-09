import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  RECEIPTS_REGISTRY_GATEWAY,
  type IssuedReceipt,
} from './receipts-registry-gateway';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Écran COGEF « Reçus » (Lot 6) : registre des reçus officiels délivrés, en lecture réelle.
 */
@Component({
  selector: 'cnpm-receipts-registry-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    SlicePipe,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './receipts-registry.page.html',
  styleUrl: './receipts-registry.page.scss',
})
export class ReceiptsRegistryPage {
  private readonly gateway = inject(RECEIPTS_REGISTRY_GATEWAY);
  private readonly title = inject(Title);
  // `load()`/Réessayer hors contexte d'injection → `DestroyRef` passé explicitement (NG0203).
  private readonly destroyRef = inject(DestroyRef);

  protected readonly receipts = signal<readonly IssuedReceipt[]>([]);
  protected readonly state = signal<LoadState>('loading');

  constructor() {
    this.title.setTitle('Reçus — Administration COGEF');
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
        error: () => this.state.set('error'),
      });
  }

  /** Libellé français du statut du reçu (même correspondance que l'écran membre). */
  protected statusLabel(status: string): string {
    if (status === 'ISSUED') {
      return 'Émis';
    }
    if (status === 'CANCELLED') {
      return 'Annulé';
    }
    return status;
  }

  /** Tonalité du badge : un reçu annulé n'est pas « vert » — le statut n'est pas porté par
   *  la seule couleur, mais la couleur ne doit pas non plus contredire le libellé. */
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
