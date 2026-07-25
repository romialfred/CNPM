import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  RECEIPTS_REGISTRY_GATEWAY,
  type IssuedReceipt,
} from './receipts-registry-gateway';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Écran CNPM « Reçus » (Lot 6) : registre des reçus officiels délivrés, en lecture réelle.
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
    PageHeaderComponent,
  ],
  templateUrl: './receipts-registry.page.html',
  styleUrl: './receipts-registry.page.scss',
})
export class ReceiptsRegistryPage {
  private readonly gateway = inject(RECEIPTS_REGISTRY_GATEWAY);
  private readonly title = inject(Title);

  protected readonly receipts = signal<readonly IssuedReceipt[]>([]);
  protected readonly state = signal<LoadState>('loading');

  constructor() {
    this.title.setTitle('Reçus — Administration CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (receipts) => {
          this.receipts.set(receipts);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }
}
