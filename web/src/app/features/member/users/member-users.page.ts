import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_USERS_GATEWAY,
  MemberUsersNoMembershipError,
  type MemberUser,
  type MemberUserStatus,
} from './member-users-gateway';

type LoadState = 'loading' | 'ready' | 'error' | 'noMembership';

const STATUS_LABELS: Readonly<Record<MemberUserStatus, string>> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  SUSPENDED: 'Suspendu',
};

const STATUS_TONES: Readonly<Record<MemberUserStatus, CnpmBadgeTone>> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'error',
};

/**
 * Espace membre — « Utilisateurs de l'organisation » (MP-014) : la liste réelle des comptes.
 */
@Component({
  selector: 'cnpm-member-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlicePipe,
    MemberPortalShellComponent,
    PageHeaderComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  templateUrl: './member-users.page.html',
  styleUrl: './member-users.page.scss',
})
export class MemberUsersPage {
  private readonly gateway = inject(MEMBER_USERS_GATEWAY);
  private readonly title = inject(Title);

  protected readonly state = signal<LoadState>('loading');
  protected readonly users = signal<readonly MemberUser[]>([]);

  constructor() {
    this.title.setTitle('Utilisateurs de l’entreprise — Espace membre CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          this.state.set(
            error instanceof MemberUsersNoMembershipError ? 'noMembership' : 'error',
          );
        },
      });
  }

  protected statusLabel(status: MemberUserStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected statusTone(status: MemberUserStatus): CnpmBadgeTone {
    return STATUS_TONES[status] ?? 'neutral';
  }
}
