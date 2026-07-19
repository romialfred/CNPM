import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, startWith, switchMap, take } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import {
  memberRequestCategoryLabel,
  memberRequestKindLabel,
  memberRequestSlaLabel,
  memberRequestSlaTone,
  memberRequestStatusLabel,
  memberRequestStatusTone,
} from './member-request-presenter';
import {
  MEMBER_REQUESTS_GATEWAY,
  MemberRequestNotFoundError,
  type MemberRequestDetail,
  type SimulatedMemberAttachment,
} from './member-requests-gateway';
import {
  formatSimulatedAttachmentSize,
  MAX_SIMULATED_ATTACHMENTS,
  selectSimulatedAttachments,
} from './simulated-attachment';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-ML', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

type DetailState = 'loading' | 'ready' | 'not-found' | 'error' | 'unavailable';

/** MP-011 — détail et conversation strictement partagée d'une requête membre. */
@Component({
  selector: 'cnpm-member-request-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-request-detail.page.html',
  styleUrl: './member-request-detail.page.scss',
})
export class MemberRequestDetailPage {
  private readonly gateway = inject(MEMBER_REQUESTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly requestId = computed(() => this.params().get('id') ?? '');
  protected readonly createdLocally = computed(() => this.queryParams().get('created') === '1');
  protected readonly listQueryParams = computed(() => {
    const map = this.queryParams();
    return Object.fromEntries(
      map.keys.filter((key) => key !== 'created').map((key) => [key, map.get(key)]),
    );
  });

  private readonly retryTick = signal(0);
  private readonly localDetail = signal<MemberRequestDetail | null>(null);
  private readonly fetchTrigger = computed(() => ({
    id: this.requestId(),
    retry: this.retryTick(),
  }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.loadDetail(id).pipe(
          map((detail) => ({ kind: 'ready' as const, detail })),
          catchError((error: unknown) => {
            if (error instanceof MemberRequestNotFoundError) {
              return of({ kind: 'not-found' as const });
            }
            if (error instanceof UnavailableHttpFeatureError) {
              return of({ kind: 'unavailable' as const });
            }
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed<DetailState>(() => this.result().kind);
  protected readonly detail = computed(() => {
    const local = this.localDetail();
    if (local) return local;
    const result = this.result();
    return result.kind === 'ready' ? result.detail : null;
  });
  protected readonly canReply = computed(() => {
    const status = this.detail()?.status;
    return status !== 'CLOSED' && status !== 'RESOLVED';
  });

  protected readonly replyForm = this.formBuilder.group({
    body: this.formBuilder.control('', [
      trimmedRequired,
      trimmedMinLength(5),
      Validators.maxLength(2000),
    ]),
  });
  protected readonly replySubmitted = signal(false);
  protected readonly replying = signal(false);
  protected readonly replyError = signal<string | null>(null);
  protected readonly replySuccess = signal<string | null>(null);
  protected readonly attachments = signal<readonly SimulatedMemberAttachment[]>([]);
  protected readonly attachmentError = signal<string | null>(null);
  protected readonly maxAttachments = MAX_SIMULATED_ATTACHMENTS;
  private readonly conversationTitle = viewChild<ElementRef<HTMLElement>>('conversationTitle');

  protected readonly statusLabel = memberRequestStatusLabel;
  protected readonly statusTone = memberRequestStatusTone;
  protected readonly kindLabel = memberRequestKindLabel;
  protected readonly categoryLabel = memberRequestCategoryLabel;
  protected readonly slaLabel = memberRequestSlaLabel;
  protected readonly slaTone = memberRequestSlaTone;
  protected readonly formatAttachmentSize = formatSimulatedAttachmentSize;

  constructor() {
    effect(() => {
      this.requestId();
      this.localDetail.set(null);
      this.replySuccess.set(null);
    });
  }

  protected sendReply(): void {
    this.replySubmitted.set(true);
    this.replyError.set(null);
    this.replySuccess.set(null);
    this.replyForm.markAllAsTouched();
    if (this.replyForm.invalid || this.replying() || !this.canReply()) return;

    this.replying.set(true);
    this.gateway
      .addMessage(this.requestId(), {
        body: this.replyForm.controls.body.value.trim(),
        attachments: this.attachments(),
      })
      .pipe(
        take(1),
        finalize(() => this.replying.set(false)),
      )
      .subscribe({
        next: (detail) => {
          this.localDetail.set(detail);
          this.replyForm.reset();
          this.replySubmitted.set(false);
          this.attachments.set([]);
          this.attachmentError.set(null);
          this.replySuccess.set(
            'Message ajouté à la conversation.',
          );
          queueMicrotask(() => this.conversationTitle()?.nativeElement.focus());
        },
        error: () => {
          this.replyError.set(
            'Le message n’a pas pu être ajouté. La saisie et les pièces jointes sont conservées.',
          );
        },
      });
  }

  protected selectFiles(input: HTMLInputElement): void {
    const selection = selectSimulatedAttachments(
      input.files,
      this.attachments().length,
      'member-request-reply-attachment',
    );
    if (selection.accepted.length > 0) {
      this.attachments.update((current) => [...current, ...selection.accepted]);
    }
    this.attachmentError.set(selection.error);
    input.value = '';
  }

  protected removeAttachment(id: string): void {
    this.attachments.update((current) => current.filter((attachment) => attachment.id !== id));
    this.attachmentError.set(null);
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected formatDate(value: string | null): string {
    return value ? `${DATE_FORMATTER.format(new Date(value))} UTC` : 'Sans date cible';
  }

  protected requestedDocumentLabel(state: 'REQUESTED' | 'PROVIDED'): string {
    return state === 'REQUESTED' ? 'Pièce demandée' : 'Pièce fournie';
  }
}

function trimmedRequired(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

function trimmedMinLength(minimum: number) {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    control.value.trim().length >= minimum ? null : { minlengthTrimmed: { minimum } };
}
