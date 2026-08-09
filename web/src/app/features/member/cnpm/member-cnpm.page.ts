import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBookUser,
  LucideCalendarDays,
  LucideFolderArchive,
  LucideMessageSquareText,
  LucideStore,
} from '@lucide/angular';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { MEMBER_EVENTS_GATEWAY, type MemberEvent } from './member-events.gateway';

/** Un accès rapide vers un écran réel de l'espace membre. */
interface MemberCnpmShortcut {
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly icon: 'directory' | 'showcase' | 'requests' | 'documents';
}

/**
 * « La COGEF » — le point d'entrée institutionnel de l'espace membre.
 *
 * La page n'invente aucune actualité : sans flux officiel raccordé, la section reste en
 * état vide honnête (aucune communication fabriquée). Elle rassemble en revanche les
 * accès réels du membre à la vie du réseau, tous pointant vers des écrans existants.
 */
type EventsState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'cnpm-member-cnpm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    LucideArrowRight,
    LucideBookUser,
    LucideCalendarDays,
    LucideFolderArchive,
    LucideMessageSquareText,
    LucideStore,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
    PageHeaderComponent,
    MemberPortalShellComponent,
  ],
  templateUrl: './member-cnpm.page.html',
  styleUrl: './member-cnpm.page.scss',
})
export class MemberCnpmPage {
  private readonly gateway = inject(MEMBER_EVENTS_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly eventsState = signal<EventsState>('loading');
  protected readonly events = signal<readonly MemberEvent[]>([]);

  constructor() {
    this.loadEvents();
  }

  protected loadEvents(): void {
    this.eventsState.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.eventsState.set('ready');
        },
        error: () => this.eventsState.set('error'),
      });
  }

  protected readonly shortcuts: readonly MemberCnpmShortcut[] = [
    {
      label: 'Annuaire des membres',
      description: 'Explorez le réseau des entreprises adhérentes et leurs opportunités.',
      route: '/member/directory',
      icon: 'directory',
    },
    {
      label: 'Ma vitrine',
      description: 'Mettez à jour la page publique de votre organisation.',
      route: '/member/showcase/edit',
      icon: 'showcase',
    },
    {
      label: 'Mes requêtes',
      description: 'Adressez une demande à la COGEF et suivez ses réponses.',
      route: '/member/requests',
      icon: 'requests',
    },
    {
      label: 'Mes documents',
      description: 'Retrouvez vos attestations et pièces partagées.',
      route: '/member/documents',
      icon: 'documents',
    },
  ];
}
