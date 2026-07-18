import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import {
  LucideArrowRight,
  LucideBuilding2,
  LucideCircleAlert,
  LucideCreditCard,
  LucideFileText,
  LucideHeadset,
  LucideReceiptText,
  LucideRefreshCw,
  LucideWalletCards,
} from '@lucide/angular';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { MemberHomeDashboardComponent } from './member-home-dashboard.component';
import {
  MEMBER_HOME_GATEWAY,
  MemberHomeAccessError,
  type MemberHomeSnapshot,
  type MembershipStatus,
} from './member-home-gateway';

type PageState = 'loading' | 'ready' | 'error' | 'forbidden';

interface MemberRequestDraft {
  readonly requestType: string;
  readonly subject: string;
  readonly message: string;
}

const REQUEST_DRAFT_STORAGE_KEY = 'cnpm-demo-member-request-draft';

const MEMBERSHIP_LABELS: Readonly<Record<MembershipStatus, string>> = {
  ACTIVE: 'Membre actif',
  DORMANT: 'Adhésion dormante',
  SUSPENDED: 'Adhésion suspendue',
};

/**
 * MP-001 — accueil du portail membre.
 *
 * La route fournit le port `MEMBER_HOME_GATEWAY`. Le composant ne fournit
 * volontairement aucun adaptateur : un montage HTTP peut donc remplacer la fixture de
 * démonstration sans modifier cette page.
 */
@Component({
  selector: 'cnpm-member-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    AlertComponent,
    ErrorStateComponent,
    SkeletonComponent,
    MemberPortalShellComponent,
    MemberHomeDashboardComponent,
    LucideArrowRight,
    LucideBuilding2,
    LucideCircleAlert,
    LucideCreditCard,
    LucideFileText,
    LucideHeadset,
    LucideReceiptText,
    LucideRefreshCw,
    LucideWalletCards,
  ],
  templateUrl: './member-home.page.html',
  styleUrl: './member-home.page.scss',
})
export class MemberHomePage {
  private readonly gateway = inject(MEMBER_HOME_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toasts = inject(ToastService);
  private readonly title = inject(Title);

  protected readonly state = signal<PageState>('loading');
  protected readonly snapshot = signal<MemberHomeSnapshot | null>(null);
  protected readonly draftStatus = signal('Brouillon local non enregistré');

  protected readonly requestForm = this.formBuilder.nonNullable.group({
    requestType: '',
    subject: '',
    message: '',
  });

  protected readonly identity = computed(() => this.snapshot()?.identity ?? null);
  protected readonly situation = computed(() => this.snapshot()?.situation ?? null);
  protected readonly contact = computed(() => this.snapshot()?.contact ?? null);
  protected readonly profile = computed(() => this.snapshot()?.profile ?? null);
  protected readonly support = computed(() => this.snapshot()?.support ?? null);
  protected readonly paymentCount = computed(() => this.snapshot()?.paymentCount ?? 0);
  protected readonly requestCount = computed(() => this.snapshot()?.requests.length ?? 0);
  protected readonly receiptCount = computed(() => this.snapshot()?.receipts.length ?? 0);
  protected readonly recentReceipts = computed(() => (this.snapshot()?.receipts ?? []).slice(0, 5));
  protected readonly activities = computed(() => (this.snapshot()?.activities ?? []).slice(0, 4));
  constructor() {
    this.title.setTitle('Accueil du portail membre — CNPM');
    this.restoreDraft();
    this.requestForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.persistDraft(false);
    });
    this.load();
  }

  protected membershipLabel(status: MembershipStatus): string {
    return MEMBERSHIP_LABELS[status];
  }

  protected saveDraft(): void {
    this.persistDraft(true);
  }

  /**
   * Les parcours cible n'existent pas encore dans `member.routes.ts`. L'action rend
   * donc l'indisponibilité explicite, sans simuler paiement, téléchargement ou envoi.
   */
  protected announceUnavailable(feature: string): void {
    this.toasts.info(
      `${feature} est indisponible dans cette démonstration. Aucune opération n’a été initiée.`,
    );
  }

  protected retry(): void {
    this.load();
  }

  private load(): void {
    this.state.set('loading');
    this.gateway
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (snapshot) => {
          this.snapshot.set(snapshot);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          this.state.set(error instanceof MemberHomeAccessError ? 'forbidden' : 'error');
        },
      });
  }

  private persistDraft(announce: boolean): void {
    try {
      sessionStorage.setItem(
        REQUEST_DRAFT_STORAGE_KEY,
        JSON.stringify(this.requestForm.getRawValue()),
      );
      this.draftStatus.set('Brouillon sauvegardé localement — aucun envoi au CNPM');
      if (announce) {
        this.toasts.info('Brouillon de démonstration sauvegardé localement. Aucun envoi au CNPM.');
      }
    } catch {
      this.draftStatus.set('Le stockage local du brouillon est indisponible');
    }
  }

  private restoreDraft(): void {
    try {
      const rawDraft = sessionStorage.getItem(REQUEST_DRAFT_STORAGE_KEY);
      if (!rawDraft) {
        return;
      }
      const draft = JSON.parse(rawDraft) as Partial<MemberRequestDraft>;
      this.requestForm.patchValue(
        {
          requestType: typeof draft.requestType === 'string' ? draft.requestType : '',
          subject: typeof draft.subject === 'string' ? draft.subject : '',
          message: typeof draft.message === 'string' ? draft.message : '',
        },
        { emitEvent: false },
      );
      this.draftStatus.set('Brouillon local restauré — aucun envoi au CNPM');
    } catch {
      sessionStorage.removeItem(REQUEST_DRAFT_STORAGE_KEY);
    }
  }
}
