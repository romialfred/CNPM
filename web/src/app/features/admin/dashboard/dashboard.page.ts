import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBuilding2,
  LucideMinus,
  LucideMoon,
  LucidePercent,
  LucideRefreshCw,
  LucideTarget,
  LucideTrendingDown,
  LucideTrendingUp,
  LucideUserPlus,
  LucideUsers,
  LucideWallet,
} from '@lucide/angular';
import { catchError, map, of, scan, startWith, switchMap } from 'rxjs';
import { AlertComponent, type CnpmAlertTone } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
} from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import {
  InsightSummaryComponent,
  type InsightStat,
} from '../../../design-system/insight-summary/insight-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  DASHBOARD_GATEWAY,
  DashboardAccessError,
  type DashboardAlertSeverity,
  type DashboardKpi,
  type DashboardMonthPoint,
  type DashboardPayment,
  type DashboardPaymentChannel,
  type DashboardPaymentStatus,
  type DashboardSnapshot,
} from './dashboard-gateway';

/**
 * Pictogrammes decoratifs des tuiles KPI.
 *
 * Nommes par intention et non par composant Lucide : la correspondance vit dans le
 * gabarit, seul endroit a reprendre si UX-DEC-009 ecarte la bibliotheque.
 */
export type DashboardKpiIcon =
  | 'wallet'
  | 'percent'
  | 'users'
  | 'dormant'
  | 'prospect'
  | 'company'
  | 'target';

/**
 * Accents de repli, dans l'ordre de `chart.categorical`. Ils servent aux cles de KPI
 * que la passerelle peut servir sans qu'elles soient connues ici.
 */
const DASHBOARD_KPI_ACCENTS = ['indigo', 'sky', 'teal', 'amber', 'blue'] as const;

const CHANNEL_LABELS: Readonly<Record<DashboardPaymentChannel, string>> = {
  MOBILE_MONEY: 'Mobile money',
  BANK_TRANSFER: 'Virement bancaire',
  CASH: 'Espèces',
};

const PAYMENT_STATUS_LABELS: Readonly<Record<DashboardPaymentStatus, string>> = {
  MATCHED: 'Rapproché',
  UNMATCHED: 'Non rapproché',
  PENDING: 'En attente',
};

const PAYMENT_STATUS_TONES: Readonly<Record<DashboardPaymentStatus, CnpmBadgeTone>> = {
  MATCHED: 'success',
  UNMATCHED: 'warning',
  PENDING: 'info',
};

/**
 * La gravité est portée par le ton de l'alerte, que `AlertComponent` double d'un
 * préfixe écrit (« Attention : », « Information : »). Aucune gravité ne se lit donc à
 * la seule couleur, comme l'exigent `ux-ui.md` et WCAG 2.2 (1.4.1).
 */
const ALERT_TONES: Readonly<Record<DashboardAlertSeverity, CnpmAlertTone>> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

/** Géométrie du donut. Rayon et circonférence sont liés : les séparer les ferait diverger. */
const DONUT_RADIUS = 52;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

type DashboardResult =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly data: DashboardSnapshot }
  | { readonly kind: 'error' }
  | { readonly kind: 'forbidden' };

/**
 * Résultat courant ET dernière donnée lisible.
 *
 * La fiche BO-001 impose que « le rafraîchissement conserve la dernière donnée
 * lisible » : vider l'écran pendant une actualisation, ou après une panne passagère,
 * priverait l'utilisateur de chiffres qu'il avait déjà sous les yeux.
 */
interface DashboardView {
  readonly result: DashboardResult;
  readonly last: DashboardSnapshot | null;
}

const INITIAL_VIEW: DashboardView = { result: { kind: 'loading' }, last: null };

interface DashboardShortcut {
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly queryParams: Readonly<Record<string, string>>;
}

/**
 * Raccourcis de navigation.
 *
 * Tous pointent vers `/admin/members` : c'est la seule rubrique livrée. Ajouter des
 * raccourcis vers Cotisations ou Paiements, annoncés « à venir » dans la navigation,
 * conduirait à des pages mortes.
 */
const SHORTCUTS: readonly DashboardShortcut[] = [
  {
    label: 'Liste des membres',
    description: 'Base complète, sans filtre.',
    route: '/admin/members',
    queryParams: {},
  },
  {
    label: 'Cotisants dormants',
    description: 'Membres de la base sans activité récente.',
    route: '/admin/members',
    queryParams: { statut: 'DORMANT' },
  },
  {
    label: 'Prospects',
    description: 'Contacts hors base de membres.',
    route: '/admin/members',
    queryParams: { statut: 'PROSPECT' },
  },
];

/**
 * BO-001 — tableau de bord d'administration.
 *
 * L'exercice consulté vit dans l'URL : la vue reste partageable et le filtre survit au
 * rechargement, comme l'exige `frontend-angular.md`.
 *
 * L'écran n'agrège rien. Tous les chiffres, l'ordre des alertes et les libellés
 * viennent du port ; un second calcul ici pourrait contredire celui de la source, et
 * deux totaux discordants sur un même écran ruinent la confiance dans les deux.
 *
 * Écarts assumés avec la composition normative de la fiche, faute de spécification
 * disponible : le filtre de période se limite à l'exercice (le « périmètre » n'est
 * défini nulle part), et les KPI financiers ne sont pas cliquables puisque les
 * rubriques Cotisations et Paiements ne sont pas livrées — un KPI qui ouvre une page
 * morte est pire qu'un KPI inerte.
 */
@Component({
  selector: 'cnpm-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    InsightSummaryComponent,
    PageHeaderComponent,
    SkeletonComponent,
    LucideArrowRight,
    LucideBuilding2,
    LucideMinus,
    LucideMoon,
    LucidePercent,
    LucideRefreshCw,
    LucideTarget,
    LucideTrendingDown,
    LucideTrendingUp,
    LucideUserPlus,
    LucideUsers,
    LucideWallet,
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss', './dashboard.kpi.scss', './dashboard.responsive.scss'],
})
export class DashboardPage {
  private readonly gateway = inject(DASHBOARD_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly exercises = this.gateway.exercises;
  protected readonly donutRadius = DONUT_RADIUS;
  protected readonly shortcuts = SHORTCUTS;
  /** Emplacements de l'ossature de chargement : autant que de KPI attendus. */
  protected readonly kpiSlots = [1, 2, 3, 4, 5] as const;

  /** L'URL est l'unique source de vérité du filtre ; aucun état parallèle. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly exercise = computed(() => {
    const value = this.params().get('exercice');
    return value && this.exercises.includes(value) ? value : this.defaultExercise();
  });

  /**
   * Relance manuelle. Incrémenter ce compteur ré-émet la même requête sans toucher à
   * l'URL : « Réessayer » recharge en place, sans recharger la page entière.
   */
  private readonly retryTick = signal(0);

  private readonly fetchTrigger = computed(() => ({
    exercise: this.exercise(),
    tick: this.retryTick(),
  }));

  /**
   * `switchMap` abandonne la requête précédente dès que l'exercice change : sans lui,
   * une réponse lente à un exercice déjà quitté écraserait la réponse courante.
   *
   * `scan` retient la dernière donnée lisible à travers les états suivants. Un refus
   * d'accès (403) est distingué d'une panne temporaire : le premier n'est pas
   * « réessayable », le second l'est.
   */
  private readonly view = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ exercise }) =>
        this.gateway.load(exercise).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) =>
            of(
              error instanceof DashboardAccessError
                ? ({ kind: 'forbidden' as const })
                : ({ kind: 'error' as const }),
            ),
          ),
          startWith({ kind: 'loading' as const }),
        ),
      ),
      scan(
        (view: DashboardView, result: DashboardResult): DashboardView => ({
          result,
          last: result.kind === 'ready' ? result.data : view.last,
        }),
        INITIAL_VIEW,
      ),
    ),
    { initialValue: INITIAL_VIEW },
  );

  protected readonly data = computed(() => this.view().last);

  private readonly phase = computed(() => this.view().result.kind);

  /** Premier chargement : rien à conserver, on montre l'ossature de la page. */
  protected readonly initialLoading = computed(
    () => this.phase() === 'loading' && this.data() === null,
  );
  /** Actualisation : les chiffres précédents restent lisibles pendant le chargement. */
  protected readonly refreshing = computed(
    () => this.phase() === 'loading' && this.data() !== null,
  );
  protected readonly forbidden = computed(() => this.phase() === 'forbidden');
  /** Panne sans aucune donnée à montrer : l'écran entier bascule en erreur. */
  protected readonly blockingError = computed(
    () => this.phase() === 'error' && this.data() === null,
  );
  /** Panne alors qu'une donnée reste affichable : on la garde et on le dit. */
  protected readonly staleAfterError = computed(
    () => this.phase() === 'error' && this.data() !== null,
  );

  protected readonly kpis = computed(() => this.data()?.kpis ?? []);
  protected readonly months = computed(() => this.data()?.months ?? []);
  protected readonly trend = computed(() => this.data()?.trend ?? null);
  protected readonly payments = computed(() => this.data()?.payments ?? []);
  protected readonly alerts = computed(() => this.data()?.alerts ?? []);
  protected readonly activities = computed(() => this.data()?.activities ?? []);

  /** Cohortes qui composent la base ; seules celles-là entrent dans le donut. */
  protected readonly baseSegments = computed(() =>
    (this.data()?.segments ?? []).filter((segment) => segment.scope === 'base'),
  );
  /**
   * Cohortes hors base ou déjà comptées dans une autre. Les additionner aux
   * précédentes compterait deux fois les grands cotisants et ferait entrer les
   * prospects dans une base dont ils sont exclus.
   */
  protected readonly relatedSegments = computed(() =>
    (this.data()?.segments ?? []).filter((segment) => segment.scope !== 'base'),
  );

  protected readonly contributionStats = computed<readonly InsightStat[]>(() => {
    const contributions = this.data()?.contributions;
    if (!contributions) {
      return [];
    }
    return [
      { label: 'Total attendu', value: contributions.expected },
      { label: 'Total encaissé', value: contributions.collected },
      { label: 'Reste à recouvrer', value: contributions.outstanding },
      {
        label: 'Taux de recouvrement',
        value: contributions.recoveryRate,
        suffix: ' %',
        decimals: 1,
        apart: true,
      },
    ];
  });

  /**
   * Arcs du donut, en `stroke-dasharray`.
   *
   * Le graphique est décoratif : la légende porte les mêmes nombres en texte, si bien
   * qu'aucune information n'est perdue lorsque le SVG n'est pas restitué.
   */
  protected readonly donutArcs = computed(() => {
    const segments = this.baseSegments();
    const total = segments.reduce((sum, segment) => sum + segment.count, 0);
    if (total === 0) {
      return [];
    }

    let start = 0;
    return segments.map((segment) => {
      const length = (segment.count / total) * DONUT_CIRCUMFERENCE;
      const arc = {
        key: segment.key,
        dashArray: `${length} ${DONUT_CIRCUMFERENCE - length}`,
        dashOffset: -start,
      };
      start += length;
      return arc;
    });
  });

  /**
   * Échelle du graphique. `collected` entre dans le maximum au même titre
   * qu'`expected` : si un mois encaissait plus que prévu, une échelle bornée au seul
   * attendu ferait déborder la barre hors de son cadre.
   */
  private readonly chartScale = computed(() =>
    this.months().reduce((max, month) => Math.max(max, month.expected, month.collected), 0),
  );

  protected readonly paymentsState = computed<DataTableState>(() => {
    if (this.initialLoading()) {
      return 'loading';
    }
    return this.payments().length > 0 ? 'ready' : 'empty';
  });

  protected readonly monthColumns: readonly DataTableColumn[] = [
    { key: 'month', label: 'Mois' },
    { key: 'expected', label: 'Montant attendu', note: '(FCFA)', align: 'end' },
    { key: 'collected', label: 'Montant encaissé', note: '(FCFA)', align: 'end' },
    { key: 'rate', label: 'Taux de recouvrement', note: '(%)', align: 'end' },
  ];

  protected readonly paymentColumns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence' },
    { key: 'payer', label: 'Membre payeur' },
    { key: 'amount', label: 'Montant', note: '(FCFA)', align: 'end' },
    { key: 'channel', label: 'Canal' },
    { key: 'paidAt', label: 'Date' },
    { key: 'status', label: 'Statut' },
  ];

  /** `DataTable` suit les lignes par cette clé : sans elle, deux lignes partageraient
   *  la même identité et le rendu serait rejeté. */
  protected readonly monthKey = (month: DashboardMonthPoint): string => month.key;
  protected readonly paymentKey = (payment: DashboardPayment): string => payment.id;
  protected readonly paymentLabel = (payment: DashboardPayment): string =>
    `${payment.reference} — ${payment.payer}`;

  /** Format `DecimalPipe` du KPI ; entier par défaut. */
  protected kpiFormat(kpi: DashboardKpi): string {
    const decimals = kpi.decimals ?? 0;
    return `1.${decimals}-${decimals}`;
  }

  /**
   * Habillage décoratif d'un KPI : un accent et un pictogramme.
   *
   * Strictement décoratif. La clé d'un KPI vient de la passerelle, qui peut en servir
   * d'autres que celles connues ici — d'où le repli, qui garantit une tuile complète
   * pour n'importe quelle clé plutôt qu'une tuile amputée.
   *
   * Les accents viennent de `chart.categorical`, seule palette du handoff destinée à
   * différencier SANS porter de sens : la couleur d'une tuile ne signale ni alerte ni
   * conformité. Le rouge de marque en est exclu, il reste aux actions critiques.
   */
  protected kpiSkin(kpi: DashboardKpi, index: number): { accent: string; icon: DashboardKpiIcon } {
    const connus: Readonly<Record<string, { accent: string; icon: DashboardKpiIcon }>> = {
      collected: { accent: 'indigo', icon: 'wallet' },
      recovery: { accent: 'sky', icon: 'percent' },
      active: { accent: 'teal', icon: 'users' },
      dormant: { accent: 'amber', icon: 'dormant' },
      prospects: { accent: 'blue', icon: 'prospect' },
      large: { accent: 'blue', icon: 'company' },
    };
    const repli = DASHBOARD_KPI_ACCENTS[index % DASHBOARD_KPI_ACCENTS.length];
    return connus[kpi.key] ?? { accent: repli, icon: 'target' };
  }

  /** Hauteur du montant attendu, en pourcentage de l'échelle du graphique. */
  protected trackHeight(month: DashboardMonthPoint): number {
    const scale = this.chartScale();
    return scale === 0 ? 0 : (month.expected / scale) * 100;
  }

  /** Part encaissée à l'intérieur de l'attendu : la barre pleine EST le taux du mois. */
  protected fillHeight(month: DashboardMonthPoint): number {
    return month.expected === 0 ? 0 : Math.min(100, (month.collected / month.expected) * 100);
  }

  protected channelLabel(channel: DashboardPaymentChannel): string {
    return CHANNEL_LABELS[channel];
  }

  protected paymentStatusLabel(status: DashboardPaymentStatus): string {
    return PAYMENT_STATUS_LABELS[status];
  }

  protected paymentStatusTone(status: DashboardPaymentStatus): CnpmBadgeTone {
    return PAYMENT_STATUS_TONES[status];
  }

  protected alertTone(severity: DashboardAlertSeverity): CnpmAlertTone {
    return ALERT_TONES[severity];
  }

  protected trendTone(direction: 'up' | 'down' | 'flat'): CnpmBadgeTone {
    if (direction === 'up') {
      return 'success';
    }
    return direction === 'down' ? 'warning' : 'neutral';
  }

  protected setExercise(value: string): void {
    // L'exercice courant n'encombre pas l'URL ; les autres y sont écrits pour rester
    // partageables.
    this.patch({ exercice: value === this.defaultExercise() ? null : value });
  }

  /** Relance le chargement après une erreur récupérable, sans recharger la page. */
  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private defaultExercise(): string {
    return this.exercises[0] ?? '';
  }

  private patch(params: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
