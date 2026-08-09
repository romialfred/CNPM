import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideUserCheck, LucideUsers } from '@lucide/angular';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { MonogramComponent } from '../../../design-system/monogram/monogram.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import {
  type CnpmViewMode,
  ViewToggleComponent,
} from '../../../design-system/view-toggle/view-toggle.component';
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
    MonogramComponent,
    ViewToggleComponent,
    LucideUsers,
    LucideUserCheck,
  ],
  templateUrl: './member-users.page.html',
  styleUrl: './member-users.page.scss',
})
export class MemberUsersPage {
  private readonly gateway = inject(MEMBER_USERS_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly state = signal<LoadState>('loading');
  protected readonly users = signal<readonly MemberUser[]>([]);
  protected readonly activeCount = computed(
    () => this.users().filter((user) => user.status === 'ACTIVE').length,
  );
  /** Mode d'affichage, reflété dans l'URL (`?vue=grille`) pour rester partageable. */
  protected readonly view = signal<CnpmViewMode>('liste');

  constructor() {
    this.title.setTitle('Utilisateurs de l’entreprise — Espace membre COGEF');
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.view.set(params.get('vue') === 'grille' ? 'grille' : 'liste'));
    this.load();
  }

  protected setView(mode: CnpmViewMode): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vue: mode === 'grille' ? 'grille' : null },
      queryParamsHandling: 'merge',
    });
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
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
