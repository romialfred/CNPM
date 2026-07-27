import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { MEMBERS_GATEWAY, type MemberRow } from '../members/members-gateway';
import {
  PAYMENT_REFERENCES_GATEWAY,
  PaymentReferenceConflictError,
  PaymentReferencesAccessError,
  PaymentReferencesAuthenticationError,
  PaymentReferenceValidationError,
  type PaymentReference,
  type PaymentReferenceStatus,
} from './payment-references-gateway';

type LoadState = 'loading' | 'ready' | 'error';

interface SelectedMember {
  readonly id: string;
  readonly code: string;
  readonly organization: string;
}

/**
 * Écran CNPM « Références de paiement » (Lot 2 de la refonte).
 *
 * <p>La CNPM y génère la référence unique d'un cotisant, la valide avant diffusion, ou la
 * révoque. La souveraineté reste au serveur : une référence n'est diffusable qu'une fois
 * validée, et chaque action exige sa permission. Le sélecteur de cotisant réutilise la
 * recherche de membres existante, sans dupliquer de source.
 */
@Component({
  selector: 'cnpm-payment-references-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AdminShellComponent,
    EmptyStateComponent,
    SkeletonComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    PageHeaderComponent,
  ],
  templateUrl: './payment-references.page.html',
  styleUrl: './payment-references.page.scss',
})
export class PaymentReferencesPage {
  private readonly gateway = inject(PAYMENT_REFERENCES_GATEWAY);
  private readonly members = inject(MEMBERS_GATEWAY);
  private readonly session = inject(SESSION_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly title = inject(Title);
  // Actions/rechargement hors contexte d'injection → `DestroyRef` passé explicitement (NG0203).
  private readonly destroyRef = inject(DestroyRef);

  private readonly sessionIdentity = toSignal(
    this.session.identity.pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly canGenerate = computed(
    () => this.sessionIdentity()?.permissions.includes('PAYMENT.RECORD') ?? false,
  );
  protected readonly canValidate = computed(
    () => this.sessionIdentity()?.permissions.includes('PAYMENT.CONFIRM') ?? false,
  );
  protected readonly canRevoke = computed(
    () => this.sessionIdentity()?.permissions.includes('PAYMENT.CANCEL') ?? false,
  );

  protected readonly references = signal<readonly PaymentReference[]>([]);
  protected readonly state = signal<LoadState>('loading');
  protected readonly busyId = signal<string | null>(null);
  protected readonly pendingCount = computed(
    () => this.references().filter((reference) => reference.status === 'PENDING_VALIDATION').length,
  );

  // Panneau de génération.
  protected readonly showForm = signal(false);
  protected readonly memberSearch = signal('');
  protected readonly searching = signal(false);
  protected readonly searchResults = signal<readonly SelectedMember[]>([]);
  protected readonly selectedMember = signal<SelectedMember | null>(null);
  protected readonly exercise = signal(new Date().getFullYear());
  protected readonly generating = signal(false);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    this.title.setTitle('Références de paiement — Administration CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (references) => {
          this.references.set(references);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected openForm(): void {
    if (!this.canGenerate()) return;
    this.memberSearch.set('');
    this.searchResults.set([]);
    this.selectedMember.set(null);
    this.exercise.set(new Date().getFullYear());
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
  }

  protected searchMembers(): void {
    const term = this.memberSearch().trim();
    if (term.length < 2) {
      this.formError.set('Saisissez au moins deux caractères pour rechercher un cotisant.');
      return;
    }
    this.formError.set(null);
    this.searching.set(true);
    this.members
      .search({
        search: term,
        status: null,
        category: null,
        group: null,
        sort: null,
        page: 1,
        pageSize: 8,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.searching.set(false);
          this.searchResults.set(page.rows.map(toSelectedMember));
        },
        error: () => {
          this.searching.set(false);
          this.formError.set('La recherche de cotisants a échoué. Réessayez.');
        },
      });
  }

  protected chooseMember(member: SelectedMember): void {
    this.selectedMember.set(member);
    this.searchResults.set([]);
    this.memberSearch.set(`${member.organization} (${member.code})`);
  }

  protected generate(): void {
    const member = this.selectedMember();
    if (!member) {
      this.formError.set('Sélectionnez d’abord un cotisant.');
      return;
    }
    const exercise = this.exercise();
    if (!Number.isInteger(exercise) || exercise < 2000 || exercise > 2100) {
      this.formError.set('Saisissez un exercice valide.');
      return;
    }
    this.formError.set(null);
    this.generating.set(true);
    this.gateway
      .generate({ membershipId: member.id, exercise })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.generating.set(false);
          this.showForm.set(false);
          this.toast.success('Référence générée (en attente de validation CNPM).');
          this.load();
        },
        error: (error: unknown) => {
          this.generating.set(false);
          this.formError.set(this.messageFor(error));
        },
      });
  }

  protected validate(reference: PaymentReference): void {
    if (!this.canValidate() || this.busyId()) return;
    this.busyId.set(reference.id);
    this.gateway
      .validate(reference.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.toast.success('Référence validée : elle est désormais diffusable au cotisant.');
          this.load();
        },
        error: (error: unknown) => {
          this.busyId.set(null);
          this.toast.error(this.messageFor(error));
        },
      });
  }

  protected revoke(reference: PaymentReference): void {
    if (!this.canRevoke() || this.busyId()) return;
    const reason = globalThis.prompt('Motif de la révocation de cette référence ?');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      this.toast.error('Un motif d’au moins 3 caractères est requis.');
      return;
    }
    this.busyId.set(reference.id);
    this.gateway
      .revoke(reference.id, reason.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.toast.success('Référence révoquée : elle n’est plus exploitable.');
          this.load();
        },
        error: (error: unknown) => {
          this.busyId.set(null);
          this.toast.error(this.messageFor(error));
        },
      });
  }

  protected updateSearch(value: string): void {
    this.memberSearch.set(value);
    if (this.selectedMember()) {
      this.selectedMember.set(null);
    }
  }

  protected updateExercise(value: string): void {
    const parsed = Number.parseInt(value, 10);
    this.exercise.set(Number.isNaN(parsed) ? 0 : parsed);
  }

  protected statusLabel(status: PaymentReferenceStatus): string {
    return {
      PENDING_VALIDATION: 'En attente de validation',
      VALIDATED: 'Validée · diffusable',
      REVOKED: 'Révoquée',
    }[status];
  }

  protected statusTone(status: PaymentReferenceStatus): CnpmBadgeTone {
    return status === 'VALIDATED' ? 'success' : status === 'PENDING_VALIDATION' ? 'warning' : 'neutral';
  }

  private messageFor(error: unknown): string {
    if (error instanceof PaymentReferencesAuthenticationError) {
      return 'Votre session a expiré. Reconnectez-vous avant de réessayer.';
    }
    if (error instanceof PaymentReferencesAccessError) {
      return 'Le serveur a refusé l’opération : permission insuffisante.';
    }
    if (error instanceof PaymentReferenceConflictError) {
      return error.message;
    }
    if (error instanceof PaymentReferenceValidationError) {
      return error.message;
    }
    return 'L’opération a échoué. Vérifiez votre connexion puis réessayez.';
  }
}

function toSelectedMember(row: MemberRow): SelectedMember {
  return { id: row.id, code: row.code, organization: row.organization };
}
