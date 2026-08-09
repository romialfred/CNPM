import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DialogComponent } from '../../../design-system/dialog/dialog.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TextInputComponent } from '../../../design-system/text-input/text-input.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  COLLECTION_ACCOUNTS_GATEWAY,
  CollectionAccountConflictError,
  CollectionAccountsAccessError,
  CollectionAccountsAuthenticationError,
  CollectionAccountValidationError,
  type CollectionAccount,
  type CollectionAccountChannel,
  type CollectionAccountStatus,
} from './collection-accounts-gateway';

type LoadState = 'loading' | 'ready' | 'error';

interface ChannelOption {
  readonly value: CollectionAccountChannel;
  readonly label: string;
}

const CHANNELS: readonly ChannelOption[] = [
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'MTN_MONEY', label: 'MTN Money' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
];

/**
 * Écran « Comptes d'encaissement de la COGEF » (Lot 1 de la refonte).
 *
 * <p>La COGEF y configure ses coordonnées d'encaissement (Orange Money, Wave, MTN, banque). Un
 * compte naît en brouillon et n'est diffusable qu'après validation par un SECOND agent — la
 * porte de non-diffusion est tenue par le serveur ; l'écran n'en est que le reflet.
 */
@Component({
  selector: 'cnpm-collection-accounts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AdminShellComponent,
    DialogComponent,
    EmptyStateComponent,
    SkeletonComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    PageHeaderComponent,
    TextInputComponent,
  ],
  templateUrl: './collection-accounts.page.html',
  styleUrl: './collection-accounts.page.scss',
})
export class CollectionAccountsPage {
  private readonly gateway = inject(COLLECTION_ACCOUNTS_GATEWAY);
  private readonly session = inject(SESSION_GATEWAY);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly title = inject(Title);
  // `load()` et les actions (créer/valider/désactiver) s'exécutent hors contexte
  // d'injection : `takeUntilDestroyed()` sans argument y lèverait NG0203.
  private readonly destroyRef = inject(DestroyRef);

  protected readonly channels = CHANNELS;

  /** Dialogue de désactivation (remplace `prompt()` : dialogue accessible du design system,
   *  piège de focus, Échap, motif tracé). `null` = fermé. */
  protected readonly pendingDisable = signal<CollectionAccount | null>(null);
  protected readonly disableReason = new FormControl('', { nonNullable: true });
  protected readonly disableError = signal<string | null>(null);

  private readonly sessionIdentity = toSignal(
    this.session.identity.pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly canWrite = computed(
    () => this.sessionIdentity()?.permissions.includes('ADMIN.PARAMETER.WRITE') ?? false,
  );
  protected readonly canApprove = computed(
    () => this.sessionIdentity()?.permissions.includes('ADMIN.REFERENTIAL.APPROVE') ?? false,
  );

  protected readonly accounts = signal<readonly CollectionAccount[]>([]);
  protected readonly state = signal<LoadState>('loading');
  protected readonly submitting = signal(false);
  protected readonly busyId = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly showForm = signal(false);

  protected readonly draftCount = computed(
    () => this.accounts().filter((account) => account.status === 'DRAFT').length,
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    channel: ['ORANGE_MONEY' as CollectionAccountChannel, [Validators.required]],
    label: ['', [Validators.required, Validators.maxLength(120)]],
    accountHolder: ['', [Validators.required, Validators.maxLength(160)]],
    accountIdentifier: ['', [Validators.required, Validators.maxLength(120)]],
    bankName: ['', [Validators.maxLength(120)]],
    instructions: ['', [Validators.maxLength(2000)]],
  });

  protected readonly isBankTransfer = toSignal(
    this.form.controls.channel.valueChanges.pipe(),
    { initialValue: this.form.controls.channel.value },
  );

  constructor() {
    this.title.setTitle('Comptes d’encaissement — Administration COGEF');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (accounts) => {
          this.accounts.set(accounts);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected openForm(): void {
    if (!this.canWrite()) return;
    this.form.reset({
      channel: 'ORANGE_MONEY',
      label: '',
      accountHolder: '',
      accountIdentifier: '',
      bankName: '',
      instructions: '',
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    this.formError.set(null);
    const raw = this.form.getRawValue();
    if (raw.channel === 'BANK_TRANSFER' && !raw.bankName.trim()) {
      this.form.controls.bankName.setErrors({ required: true });
    }
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.gateway
      .create({
        channel: raw.channel,
        label: raw.label.trim(),
        accountHolder: raw.accountHolder.trim(),
        accountIdentifier: raw.accountIdentifier.trim(),
        bankName: raw.bankName.trim() || undefined,
        instructions: raw.instructions.trim() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.showForm.set(false);
          this.toast.success('Compte d’encaissement enregistré en brouillon.');
          this.load();
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.formError.set(this.messageFor(error));
        },
      });
  }

  protected approve(account: CollectionAccount): void {
    if (!this.canApprove() || this.busyId()) return;
    this.busyId.set(account.id);
    this.gateway
      .approve(account.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.toast.success('Compte validé : il est désormais diffusable au paiement.');
          this.load();
        },
        error: (error: unknown) => {
          this.busyId.set(null);
          this.toast.error(this.messageFor(error));
        },
      });
  }

  /** Ouvre le dialogue de désactivation (le motif est saisi puis validé dans le dialogue). */
  protected disable(account: CollectionAccount): void {
    if (!this.canWrite() || this.busyId()) return;
    this.disableReason.setValue('');
    this.disableError.set(null);
    this.pendingDisable.set(account);
  }

  protected cancelDisable(): void {
    this.pendingDisable.set(null);
  }

  protected confirmDisable(): void {
    const account = this.pendingDisable();
    if (!account) return;
    const reason = this.disableReason.value.trim();
    if (reason.length < 3) {
      this.disableError.set('Un motif d’au moins 3 caractères est requis.');
      return;
    }
    this.pendingDisable.set(null);
    this.disableError.set(null);
    this.busyId.set(account.id);
    this.gateway
      .disable(account.id, reason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.toast.success('Compte désactivé : il n’est plus proposé au paiement.');
          this.load();
        },
        error: (error: unknown) => {
          this.busyId.set(null);
          this.toast.error(this.messageFor(error));
        },
      });
  }

  protected channelLabel(channel: CollectionAccountChannel): string {
    return CHANNELS.find((option) => option.value === channel)?.label ?? channel;
  }

  protected statusLabel(status: CollectionAccountStatus): string {
    return { DRAFT: 'Brouillon', ACTIVE: 'Actif · diffusable', DISABLED: 'Désactivé' }[status];
  }

  protected statusTone(status: CollectionAccountStatus): CnpmBadgeTone {
    return status === 'ACTIVE' ? 'success' : status === 'DRAFT' ? 'warning' : 'neutral';
  }

  private messageFor(error: unknown): string {
    if (error instanceof CollectionAccountsAuthenticationError) {
      return 'Votre session a expiré. Reconnectez-vous avant de réessayer.';
    }
    if (error instanceof CollectionAccountsAccessError) {
      return 'Le serveur a refusé l’opération : permission insuffisante.';
    }
    if (error instanceof CollectionAccountConflictError) {
      return error.message;
    }
    if (error instanceof CollectionAccountValidationError) {
      return error.message;
    }
    return 'L’opération a échoué. Vérifiez votre connexion puis réessayez.';
  }
}
