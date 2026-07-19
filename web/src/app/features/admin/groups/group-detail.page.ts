import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
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
import { GROUPS_GATEWAY, GroupAccessError, GroupNotFoundError } from './groups-gateway';

/** BO-025 — fiche descriptive d'un groupement, sans agrégat ni écriture inventés. */
@Component({
  selector: 'cnpm-group-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
  templateUrl: './group-detail.page.html',
  styleUrl: './group-detail.page.scss',
})
export class GroupDetailPage {
  private readonly gateway = inject(GROUPS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly groupId = computed(() => this.params().get('id') ?? '');
  protected readonly listQueryParams = computed<Record<string, string>>(() => {
    const query = this.queryParams();
    return Object.fromEntries(query.keys.map((key) => [key, query.get(key) ?? '']));
  });

  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({ id: this.groupId(), tick: this.retryTick() }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.get(id).pipe(
          map((group) => ({ kind: 'ready' as const, group })),
          catchError((error: unknown) => {
            if (error instanceof GroupAccessError) return of({ kind: 'forbidden' as const });
            if (error instanceof GroupNotFoundError) return of({ kind: 'notFound' as const });
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed(() => this.result().kind);
  protected readonly group = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.group : null;
  });
  protected readonly pageTitle = computed(() => this.group()?.name ?? 'Fiche groupement');
  protected readonly facts = computed<readonly CnpmDefinition[]>(() => {
    const group = this.group();
    if (!group) return [];
    return [
      { label: 'Code', value: group.code },
      { label: 'Dénomination', value: group.name },
      { label: 'Code secteur', value: group.sectorCode ?? 'Non renseigné' },
    ];
  });

  constructor() {
    effect(() => {
      const group = this.group();
      this.title.setTitle(
        group
          ? `${group.name} — Groupement — Administration CNPM`
          : 'Fiche groupement — Administration CNPM',
      );
    });
  }

  protected statusLabel(value: string): string {
    return value === 'ACTIVE' ? 'Actif' : value.replaceAll('_', ' ');
  }

  protected statusTone(value: string): CnpmBadgeTone {
    return value === 'ACTIVE' ? 'success' : 'neutral';
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }
}
