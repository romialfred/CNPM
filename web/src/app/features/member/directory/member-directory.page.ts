import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_DIRECTORY_GATEWAY,
  type DirectoryOrganization,
} from './member-directory.gateway';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Espace membre — « Annuaire des membres » (MP-018) : les organisations membres actives, réelles.
 */
@Component({
  selector: 'cnpm-member-directory-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlicePipe,
    ReactiveFormsModule,
    MemberPortalShellComponent,
    PageHeaderComponent,
    AlertComponent,
    ButtonComponent,
  ],
  templateUrl: './member-directory.page.html',
  styleUrl: './member-directory.page.scss',
})
export class MemberDirectoryPage {
  private readonly gateway = inject(MEMBER_DIRECTORY_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);

  protected readonly state = signal<LoadState>('loading');
  protected readonly organizations = signal<readonly DirectoryOrganization[]>([]);
  protected readonly search = new FormControl('', { nonNullable: true });

  constructor() {
    this.title.setTitle('Annuaire des membres — Espace membre CNPM');
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list(this.search.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (organizations) => {
          this.organizations.set(organizations);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }
}
