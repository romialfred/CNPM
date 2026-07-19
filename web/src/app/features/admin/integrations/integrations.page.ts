import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
} from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TabsComponent, type CnpmTab } from '../../../design-system/tabs/tabs.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  INTEGRATIONS_GATEWAY,
  IntegrationsAccessError,
  type ExchangeAuthorization,
  type IntegrationDirection,
  type IntegrationDirectionFilter,
  type IntegrationHealth,
  type IntegrationHealthFilter,
  type IntegrationLogEntry,
  type IntegrationLogOutcome,
  type IntegrationsSnapshot,
  type IntegrationsView,
} from './integrations-gateway';

const VIEWS: readonly CnpmTab[] = [
  { id: 'partners', label: 'Partenaires et flux' },
  { id: 'journal', label: 'Journal technique' },
];

const VIEW_IDS: readonly IntegrationsView[] = ['partners', 'journal'];
const HEALTH_IDS: readonly IntegrationHealthFilter[] = [
  'all',
  'HEALTHY',
  'DEGRADED',
  'PAUSED',
  'UNAVAILABLE',
];
const DIRECTION_IDS: readonly IntegrationDirectionFilter[] = ['all', 'INBOUND', 'OUTBOUND'];

const HEALTH_LABELS: Readonly<Record<IntegrationHealth, string>> = {
  HEALTHY: 'Opérationnel',
  DEGRADED: 'Dégradé',
  PAUSED: 'Suspendu',
  UNAVAILABLE: 'Indisponible',
};

const HEALTH_TONES: Readonly<Record<IntegrationHealth, CnpmBadgeTone>> = {
  HEALTHY: 'success',
  DEGRADED: 'warning',
  PAUSED: 'neutral',
  UNAVAILABLE: 'error',
};

const AUTHORIZATION_TONES: Readonly<Record<ExchangeAuthorization, CnpmBadgeTone>> = {
  DOCUMENTED: 'success',
  PENDING: 'warning',
  BLOCKED: 'error',
};

const DIRECTION_LABELS: Readonly<Record<IntegrationDirection, string>> = {
  INBOUND: 'Entrant',
  OUTBOUND: 'Sortant',
};

const OUTCOME_LABELS: Readonly<Record<IntegrationLogOutcome, string>> = {
  SUCCESS: 'Réussi',
  REJECTED: 'Rejeté',
  RETRYING: 'En reprise',
  BLOCKED: 'Bloqué',
};

const OUTCOME_TONES: Readonly<Record<IntegrationLogOutcome, CnpmBadgeTone>> = {
  SUCCESS: 'success',
  REJECTED: 'error',
  RETRYING: 'warning',
  BLOCKED: 'error',
};

const LOG_COLUMNS: readonly DataTableColumn[] = [
  { key: 'occurredAt', label: 'Horodatage' },
  { key: 'partner', label: 'Partenaire' },
  { key: 'exchange', label: 'Échange' },
  { key: 'direction', label: 'Sens' },
  { key: 'outcome', label: 'Résultat' },
  { key: 'trace', label: 'Traçabilité' },
];

type LoadResult =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly snapshot: IntegrationsSnapshot }
  | { readonly kind: 'forbidden' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'error' };

/**
 * BO-038 — Supervision consultative des intégrations.
 *
 * L'URL conserve la vue et les filtres partageables. Le port ne contient aucun secret
 * ni détail de raccordement, et n'expose aucune commande. En mode HTTP, le contrat
 * `/integration-partners` ne fournit encore qu'un `PageResource` générique : le point
 * de composition injecte donc un adaptateur indisponible, sans repli vers les fixtures.
 */
@Component({
  selector: 'cnpm-integrations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AdminShellComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TabsComponent,
  ],
  templateUrl: './integrations.page.html',
  styleUrls: [
    './integrations.page.scss',
    './integrations.partners.scss',
    './integrations.journal.scss',
    './integrations.assurance.scss',
    './integrations.responsive.scss',
  ],
})
export class IntegrationsPage {
  private readonly gateway = inject(INTEGRATIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly views = VIEWS;
  protected readonly healthOptions = HEALTH_IDS;
  protected readonly directionOptions = DIRECTION_IDS;
  protected readonly logColumns = LOG_COLUMNS;

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly view = computed<IntegrationsView>(() => {
    const value = this.params().get('vue');
    return value && (VIEW_IDS as readonly string[]).includes(value)
      ? (value as IntegrationsView)
      : 'partners';
  });

  protected readonly health = computed<IntegrationHealthFilter>(() => {
    const value = this.params().get('etat');
    return value && (HEALTH_IDS as readonly string[]).includes(value)
      ? (value as IntegrationHealthFilter)
      : 'all';
  });

  protected readonly direction = computed<IntegrationDirectionFilter>(() => {
    const value = this.params().get('sens');
    return value && (DIRECTION_IDS as readonly string[]).includes(value)
      ? (value as IntegrationDirectionFilter)
      : 'all';
  });

  protected readonly search = computed(() => this.params().get('q')?.slice(0, 80) ?? '');
  protected readonly searchDraft = signal(
    this.route.snapshot.queryParamMap.get('q')?.slice(0, 80) ?? '',
  );
  private readonly synchronizeSearchDraft = effect(() => {
    this.searchDraft.set(this.search());
  });

  protected readonly hasFilters = computed(
    () =>
      this.search().length > 0 ||
      (this.view() === 'partners' ? this.health() !== 'all' : this.direction() !== 'all'),
  );

  protected readonly offline = signal(typeof navigator !== 'undefined' && !navigator.onLine);
  private readonly retryTick = signal(0);

  private readonly request = computed(() => ({
    query: {
      view: this.view(),
      health: this.health(),
      direction: this.direction(),
      search: this.search(),
    },
    retry: this.retryTick(),
  }));

  private readonly result = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ query }) =>
        this.gateway.load(query).pipe(
          map((snapshot) => ({ kind: 'ready' as const, snapshot })),
          catchError((error: unknown) => {
            if (error instanceof IntegrationsAccessError) {
              return of({ kind: 'forbidden' as const });
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
    { initialValue: { kind: 'loading' } as LoadResult },
  );

  protected readonly state = computed(() => this.result().kind);
  protected readonly snapshot = computed<IntegrationsSnapshot | null>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.snapshot : null;
  });
  protected readonly partners = computed(() => this.snapshot()?.partners ?? []);
  protected readonly logs = computed(() => this.snapshot()?.logs ?? []);
  protected readonly summary = computed(() => this.snapshot()?.summary ?? null);
  protected readonly resultsAnnouncement = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) {
      return '';
    }
    if (this.view() === 'partners') {
      const count = this.partners().length;
      return count === 1
        ? `1 partenaire affiché sur ${snapshot.totalPartners}.`
        : `${count} partenaires affichés sur ${snapshot.totalPartners}.`;
    }
    const count = this.logs().length;
    const detail =
      count === 1 ? '1 événement détaillé affiché' : `${count} événements détaillés affichés`;
    return `${detail} sur ${snapshot.summary.events24h} événements agrégés sur 24 heures.`;
  });
  protected readonly tableState = computed<DataTableState>(() =>
    this.logs().length > 0 ? 'ready' : this.hasFilters() ? 'noResult' : 'empty',
  );

  protected readonly logKey = (entry: IntegrationLogEntry): string => entry.id;

  constructor() {
    const goOffline = () => this.offline.set(true);
    const goOnline = () => this.offline.set(false);
    globalThis.addEventListener('offline', goOffline);
    globalThis.addEventListener('online', goOnline);
    this.destroyRef.onDestroy(() => {
      globalThis.removeEventListener('offline', goOffline);
      globalThis.removeEventListener('online', goOnline);
    });
  }

  protected healthLabel(health: IntegrationHealth): string {
    return HEALTH_LABELS[health];
  }

  protected healthTone(health: IntegrationHealth): CnpmBadgeTone {
    return HEALTH_TONES[health];
  }

  protected authorizationTone(authorization: ExchangeAuthorization): CnpmBadgeTone {
    return AUTHORIZATION_TONES[authorization];
  }

  protected directionLabel(direction: IntegrationDirection): string {
    return DIRECTION_LABELS[direction];
  }

  protected outcomeLabel(outcome: IntegrationLogOutcome): string {
    return OUTCOME_LABELS[outcome];
  }

  protected outcomeTone(outcome: IntegrationLogOutcome): CnpmBadgeTone {
    return OUTCOME_TONES[outcome];
  }

  protected mappingLabel(count: number): string {
    if (count === 0) {
      return 'Aucune correspondance liée';
    }
    return `${count} ${count === 1 ? 'correspondance liée' : 'correspondances liées'}`;
  }

  protected selectView(value: string): void {
    const view = (VIEW_IDS as readonly string[]).includes(value)
      ? (value as IntegrationsView)
      : 'partners';
    this.searchDraft.set('');
    this.patch({
      vue: view === 'partners' ? null : view,
      etat: null,
      sens: null,
      q: null,
    });
  }

  protected setHealth(value: IntegrationHealthFilter): void {
    this.patch({ etat: value === 'all' ? null : value });
  }

  protected setDirection(value: IntegrationDirectionFilter): void {
    this.patch({ sens: value === 'all' ? null : value });
  }

  protected applySearch(): void {
    this.patch({ q: this.searchDraft().trim().slice(0, 80) || null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ q: null, etat: null, sens: null });
  }

  protected retry(): void {
    this.retryTick.update((value) => value + 1);
  }

  private patch(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
