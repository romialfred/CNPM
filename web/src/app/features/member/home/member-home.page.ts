import { DecimalPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_HOME_GATEWAY,
  MemberHomeAccessError,
  MemberHomeNoMembershipError,
  type MemberDashboard,
  type MembershipStatus,
} from './member-home-gateway';

type PageState = 'loading' | 'ready' | 'error' | 'forbidden' | 'noMembership';

const MEMBERSHIP_LABELS: Readonly<Record<MembershipStatus, string>> = {
  ACTIVE: 'Adhésion active',
  DORMANT: 'Adhésion dormante',
  SUSPENDED: 'Adhésion suspendue',
};

const MEMBERSHIP_TONES: Readonly<Record<MembershipStatus, CnpmBadgeTone>> = {
  ACTIVE: 'success',
  DORMANT: 'neutral',
  SUSPENDED: 'error',
};

/**
 * MP-001 — tableau de bord du portail membre.
 *
 * La route fournit le port `MEMBER_HOME_GATEWAY` (adaptateur HTTP réel). L'écran n'affiche que des
 * données réelles bornées au compte connecté : situation de cotisation, indicateurs et raccourcis.
 */
@Component({
  selector: 'cnpm-member-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    SlicePipe,
    RouterLink,
    MemberPortalShellComponent,
    PageHeaderComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  templateUrl: './member-home.page.html',
  styleUrl: './member-home.page.scss',
})
export class MemberHomePage {
  private readonly gateway = inject(MEMBER_HOME_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);

  protected readonly state = signal<PageState>('loading');
  protected readonly dashboard = signal<MemberDashboard | null>(null);

  protected readonly identity = computed(() => this.dashboard()?.identity ?? null);
  protected readonly exercises = computed(() => this.dashboard()?.exercises ?? []);
  protected readonly hasOutstanding = computed(() => (this.dashboard()?.outstandingTotal ?? 0) > 0);
  protected readonly hasOverdue = computed(() => (this.dashboard()?.overdueAmount ?? 0) > 0);

  constructor() {
    this.title.setTitle('Accueil du portail membre — CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard) => {
          this.dashboard.set(dashboard);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          if (error instanceof MemberHomeNoMembershipError) {
            this.state.set('noMembership');
          } else if (error instanceof MemberHomeAccessError) {
            this.state.set('forbidden');
          } else {
            this.state.set('error');
          }
        },
      });
  }

  protected membershipLabel(status: MembershipStatus): string {
    return MEMBERSHIP_LABELS[status];
  }

  protected membershipTone(status: MembershipStatus): CnpmBadgeTone {
    return MEMBERSHIP_TONES[status];
  }
}
