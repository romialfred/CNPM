import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_REQUESTS_GATEWAY,
  MemberRequestsAuthenticationError,
  MemberRequestNotFoundError,
  type MemberRequestStatus,
  type MemberRequestSummary,
  type MemberRequestType,
} from './member-requests-gateway';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  REQUEST_TYPE_LABELS,
} from './member-request-labels';

type LoadState = 'loading' | 'ready' | 'error' | 'noMembership';

/**
 * Espace membre — « Mes requêtes » (MP-009) : la liste réelle des requêtes de l'organisation.
 */
@Component({
  selector: 'cnpm-member-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlicePipe,
    RouterLink,
    MemberPortalShellComponent,
    PageHeaderComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  templateUrl: './member-requests.page.html',
  styleUrl: './member-requests.page.scss',
})
export class MemberRequestsPage {
  private readonly gateway = inject(MEMBER_REQUESTS_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);

  protected readonly state = signal<LoadState>('loading');
  protected readonly requests = signal<readonly MemberRequestSummary[]>([]);

  constructor() {
    this.title.setTitle('Mes requêtes — Espace membre COGEF');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list(0, 50)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.requests.set(page.items);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          this.state.set(
            error instanceof MemberRequestNotFoundError ||
              error instanceof MemberRequestsAuthenticationError
              ? 'noMembership'
              : 'error',
          );
        },
      });
  }

  protected typeLabel(type: MemberRequestType): string {
    return REQUEST_TYPE_LABELS[type];
  }

  protected statusLabel(status: MemberRequestStatus): string {
    return REQUEST_STATUS_LABELS[status];
  }

  protected statusTone(status: MemberRequestStatus): CnpmBadgeTone {
    return REQUEST_STATUS_TONES[status];
  }
}
