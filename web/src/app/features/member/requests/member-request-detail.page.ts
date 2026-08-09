import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  MEMBER_REQUESTS_GATEWAY,
  MemberRequestNotFoundError,
  type MemberRequestDetail,
  type MemberRequestMessageSender,
  type MemberRequestStatus,
  type MemberRequestType,
} from './member-requests-gateway';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  REQUEST_TYPE_LABELS,
} from './member-request-labels';

type LoadState = 'loading' | 'ready' | 'error' | 'notFound';

/**
 * Espace membre — détail d'une requête (MP-011) : en-tête, conversation partagée et réponse.
 */
@Component({
  selector: 'cnpm-member-request-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MemberPortalShellComponent,
    PageHeaderComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  templateUrl: './member-request-detail.page.html',
  styleUrl: './member-request-detail.page.scss',
})
export class MemberRequestDetailPage {
  private readonly gateway = inject(MEMBER_REQUESTS_GATEWAY);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);

  /** Identifiant de la requête, lu depuis la route. */
  private readonly requestId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly state = signal<LoadState>('loading');
  protected readonly request = signal<MemberRequestDetail | null>(null);
  protected readonly sending = signal(false);

  protected readonly replyForm = this.formBuilder.nonNullable.group({
    body: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(4000)]),
  });

  constructor() {
    this.title.setTitle('Détail de la requête — Espace membre COGEF');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .loadDetail(this.requestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.request.set(detail);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          this.state.set(error instanceof MemberRequestNotFoundError ? 'notFound' : 'error');
        },
      });
  }

  protected reply(): void {
    if (this.replyForm.invalid || this.sending()) {
      this.replyForm.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.gateway
      .addMessage(this.requestId, this.replyForm.getRawValue().body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.request.set(detail);
          this.replyForm.reset({ body: '' });
          this.sending.set(false);
        },
        error: () => {
          this.sending.set(false);
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

  protected senderLabel(sender: MemberRequestMessageSender): string {
    return sender === 'MEMBER' ? 'Vous' : 'COGEF';
  }
}
