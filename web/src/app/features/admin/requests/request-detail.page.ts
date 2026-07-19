import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import {
  DefinitionListComponent,
  type CnpmDefinition,
} from '../../../design-system/definition-list/definition-list.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  REQUESTS_GATEWAY,
  RequestAccessError,
  RequestNotFoundError,
  type ServiceRequestPriority,
  type ServiceRequestSlaState,
  type ServiceRequestStatus,
} from './requests-gateway';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

/** BO-022 — traitement borné d'une requête ou réclamation. */
@Component({
  selector: 'cnpm-request-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DefinitionListComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './request-detail.page.html',
  styleUrl: './request-detail.page.scss',
})
export class RequestDetailPage {
  private readonly gateway = inject(REQUESTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);

  protected readonly demoMode = inject(CNPM_DATA_MODE) === 'demo';
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly requestId = computed(() => this.params().get('id') ?? '');
  protected readonly listQueryParams = computed<Record<string, string>>(() => {
    const params = this.queryParams();
    return Object.fromEntries(params.keys.map((key) => [key, params.get(key) ?? '']));
  });

  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({
    id: this.requestId(),
    tick: this.retryTick(),
  }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.get(id).pipe(
          map((request) => ({ kind: 'ready' as const, request })),
          catchError((error: unknown) => {
            if (error instanceof RequestAccessError) return of({ kind: 'forbidden' as const });
            if (error instanceof RequestNotFoundError) return of({ kind: 'notFound' as const });
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed(() => this.result().kind);
  protected readonly request = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.request : null;
  });
  protected readonly pageTitle = computed(
    () => this.request()?.reference ?? 'Traitement du dossier',
  );
  protected readonly facts = computed<readonly CnpmDefinition[]>(() => {
    const request = this.request();
    if (!request) return [];
    return [
      { label: 'Demandeur', value: request.requesterLabel },
      { label: 'Catégorie', value: request.categoryLabel },
      { label: 'Service', value: request.serviceLabel },
      { label: 'Priorité', value: this.priorityLabel(request.priority) },
      { label: 'Confidentialité', value: request.confidentialityLabel },
      { label: 'Soumis le', value: this.formatDate(request.submittedAt) },
      { label: 'Responsable', value: request.assigneeLabel ?? 'Non assignée' },
    ];
  });

  protected readonly replyControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(1000)],
  });
  protected readonly preparedReply = signal<string | null>(null);

  constructor() {
    effect(() => {
      const request = this.request();
      this.title.setTitle(
        request
          ? `${request.reference} — Traitement — Administration CNPM`
          : 'Traitement d’un dossier — Administration CNPM',
      );
    });
  }

  protected prepareReply(value = this.replyControl.value): void {
    this.replyControl.markAsTouched();
    const reply = value.trim();
    if (!reply || reply.length > 1000 || !this.demoMode) return;
    this.preparedReply.set(reply);
  }

  protected clearPreparedReply(): void {
    this.preparedReply.set(null);
    this.replyControl.reset('');
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected statusLabel(value: ServiceRequestStatus): string {
    const labels: Record<ServiceRequestStatus, string> = {
      SUBMITTED: 'Soumise',
      TRIAGED: 'Qualifiée',
      ASSIGNED: 'Assignée',
      IN_PROGRESS: 'En traitement',
      WAITING_MEMBER: 'Attente membre',
      WAITING_INTERNAL: 'Attente interne',
      RESOLVED: 'Résolue',
      CLOSED: 'Clôturée',
      REOPENED: 'Rouverte',
    };
    return labels[value];
  }

  protected statusTone(value: ServiceRequestStatus): CnpmBadgeTone {
    if (value === 'CLOSED' || value === 'RESOLVED') return 'success';
    if (value === 'WAITING_MEMBER' || value === 'WAITING_INTERNAL') return 'warning';
    if (value === 'REOPENED') return 'error';
    return 'info';
  }

  protected priorityLabel(value: ServiceRequestPriority): string {
    return value === 'URGENT' ? 'Urgente' : value === 'HIGH' ? 'Haute' : 'Normale';
  }

  protected slaLabel(value: ServiceRequestSlaState): string {
    const labels: Record<ServiceRequestSlaState, string> = {
      ON_TRACK: 'Dans le scénario',
      DUE_SOON: 'Échéance proche',
      OVERDUE: 'Scénario dépassé',
      NOT_APPLICABLE: 'Sans échéance',
    };
    return labels[value];
  }

  protected slaTone(value: ServiceRequestSlaState): CnpmBadgeTone {
    return value === 'OVERDUE'
      ? 'error'
      : value === 'DUE_SOON'
        ? 'warning'
        : value === 'ON_TRACK'
          ? 'success'
          : 'neutral';
  }

  protected formatDate(value: string | null): string {
    return value ? DATE_FORMATTER.format(new Date(value)) : 'Non applicable';
  }
}
