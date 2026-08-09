import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  PAYMENT_REFERENCES_GATEWAY,
  type PaymentReference,
} from '../payment-references/payment-references-gateway';
import {
  PAYMENTS_RECORDING_GATEWAY,
  PaymentsRecordingAccessError,
  PaymentsRecordingAuthenticationError,
  PaymentsRecordingConflictError,
  PaymentsRecordingValidationError,
  type PaymentChannel,
  type RecordedPayment,
} from './payments-recording-gateway';

type LoadState = 'loading' | 'ready' | 'error';

interface ChannelOption {
  readonly value: PaymentChannel;
  readonly label: string;
}

const CHANNELS: readonly ChannelOption[] = [
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'MTN_MONEY', label: 'MTN Money' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'CASH', label: 'Espèces' },
];

/**
 * Écran CNPM « Encaissements » (Lot 4 de la refonte, méthode A).
 *
 * <p>L'agent enregistre un encaissement reçu contre une référence VALIDÉE : le versement se
 * trouve ainsi rattaché au cotisant. L'écriture est idempotente et en ajout seul côté serveur ;
 * l'écran n'en est que la saisie.
 */
@Component({
  selector: 'cnpm-payments-recording-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DecimalPipe,
    SlicePipe,
    AdminShellComponent,
    EmptyStateComponent,
    SkeletonComponent,
    AlertComponent,
    ButtonComponent,
    PageHeaderComponent,
  ],
  templateUrl: './payments-recording.page.html',
  styleUrl: './payments-recording.page.scss',
})
export class PaymentsRecordingPage {
  private readonly gateway = inject(PAYMENTS_RECORDING_GATEWAY);
  private readonly references = inject(PAYMENT_REFERENCES_GATEWAY);
  private readonly session = inject(SESSION_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly title = inject(Title);
  // Actions/rechargement hors contexte d'injection → `DestroyRef` passé explicitement (NG0203).
  private readonly destroyRef = inject(DestroyRef);

  protected readonly channels = CHANNELS;

  private readonly sessionIdentity = toSignal(
    this.session.identity.pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly canRecord = computed(
    () => this.sessionIdentity()?.permissions.includes('PAYMENT.RECORD') ?? false,
  );

  protected readonly canConfirm = computed(
    () => this.sessionIdentity()?.permissions.includes('PAYMENT.CONFIRM') ?? false,
  );

  protected readonly payments = signal<readonly RecordedPayment[]>([]);
  protected readonly state = signal<LoadState>('loading');
  protected readonly confirmingId = signal<string | null>(null);
  /** Dernier reçu émis, avec son jeton de vérification (révélé une seule fois). */
  protected readonly issuedReceipt = signal<{
    readonly number: string;
    readonly token: string | null;
  } | null>(null);

  protected readonly showForm = signal(false);
  protected readonly validatedReferences = signal<readonly PaymentReference[]>([]);
  protected readonly loadingReferences = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  // Champs du formulaire.
  protected readonly referenceId = signal('');
  protected readonly channel = signal<PaymentChannel>('ORANGE_MONEY');
  protected readonly amount = signal('');
  protected readonly providerTransactionId = signal('');

  constructor() {
    this.title.setTitle('Encaissements — Administration COGEF');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payments) => {
          this.payments.set(payments);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected openForm(): void {
    if (!this.canRecord()) return;
    this.referenceId.set('');
    this.channel.set('ORANGE_MONEY');
    this.amount.set('');
    this.providerTransactionId.set('');
    this.formError.set(null);
    this.showForm.set(true);
    this.loadValidatedReferences();
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
  }

  private loadValidatedReferences(): void {
    this.loadingReferences.set(true);
    this.references
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (all) => {
          this.loadingReferences.set(false);
          this.validatedReferences.set(all.filter((reference) => reference.status === 'VALIDATED'));
        },
        error: () => {
          this.loadingReferences.set(false);
          this.formError.set('Le chargement des références validées a échoué.');
        },
      });
  }

  protected submit(): void {
    this.formError.set(null);
    if (!this.referenceId()) {
      this.formError.set('Sélectionnez la référence du cotisant.');
      return;
    }
    if (!/^\d{1,17}(\.\d{1,2})?$/.test(this.amount().trim())) {
      this.formError.set('Saisissez un montant valide (ex. 150000 ou 150000.00).');
      return;
    }
    this.submitting.set(true);
    this.gateway
      .record({
        referenceId: this.referenceId(),
        channel: this.channel(),
        amount: this.amount().trim(),
        providerTransactionId: this.providerTransactionId().trim() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.showForm.set(false);
          this.toast.success('Encaissement enregistré et rattaché au cotisant.');
          this.load();
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.formError.set(this.messageFor(error));
        },
      });
  }

  protected confirm(payment: RecordedPayment): void {
    if (!this.canConfirm() || this.confirmingId()) return;
    this.confirmingId.set(payment.id);
    this.gateway
      .confirm(payment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (confirmation) => {
          this.confirmingId.set(null);
          this.issuedReceipt.set({
            number: confirmation.receiptNumber,
            token: confirmation.verificationToken,
          });
          this.toast.success(`Reçu ${confirmation.receiptNumber} émis.`);
          this.load();
        },
        error: (error: unknown) => {
          this.confirmingId.set(null);
          this.toast.error(this.messageFor(error));
        },
      });
  }

  protected dismissReceipt(): void {
    this.issuedReceipt.set(null);
  }

  protected channelLabel(channel: PaymentChannel): string {
    return CHANNELS.find((option) => option.value === channel)?.label ?? channel;
  }

  private messageFor(error: unknown): string {
    if (error instanceof PaymentsRecordingAuthenticationError) {
      return 'Votre session a expiré. Reconnectez-vous avant de réessayer.';
    }
    if (error instanceof PaymentsRecordingAccessError) {
      return 'Le serveur a refusé l’opération : permission insuffisante.';
    }
    if (error instanceof PaymentsRecordingConflictError) {
      return error.message;
    }
    if (error instanceof PaymentsRecordingValidationError) {
      return error.message;
    }
    return 'L’opération a échoué. Vérifiez votre connexion puis réessayez.';
  }
}
