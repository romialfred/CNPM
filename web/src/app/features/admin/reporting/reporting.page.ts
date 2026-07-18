import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideFileSpreadsheet, LucideFileText } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
  SortState,
} from '../../../design-system/data-table/data-table.model';
import {
  DefinitionListComponent,
  type CnpmDefinition,
} from '../../../design-system/definition-list/definition-list.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import type { FilterChip } from '../../../design-system/filter-bar/filter-bar.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import type { InsightStat } from '../../../design-system/insight-summary/insight-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TabsComponent, type CnpmTab } from '../../../design-system/tabs/tabs.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { EXERCISE_LABELS, PERIOD_LABELS } from './demo-reporting.gateway';
import {
  REPORTING_GATEWAY,
  REPORT_CATALOGUE,
  ReportingAccessError,
  type ExerciseId,
  type PeriodId,
  type ReportDescriptor,
  type ReportId,
  type ReportInsightKind,
  type ReportQuery,
  type ReportRow,
} from './reporting-gateway';

const DEFAULT_REPORT: ReportId = 'recouvrement-mensuel';
const DEFAULT_EXERCISE: ExerciseId = '2024';
const DEFAULT_PERIOD: PeriodId = 'annee';

/** Nombre de lignes de l'ossature de chargement, calé sur la taille usuelle d'un rapport. */
const SKELETON_ROWS = 6;

/**
 * Géométrie du graphique, en unités du `viewBox`.
 *
 * Le tracé est vectoriel et se redimensionne avec son conteneur : aucune dimension en
 * pixels ne fuit dans la mise en page, et le reflow à 320 px n'introduit pas de
 * défilement horizontal.
 */
const CHART = {
  width: 720,
  height: 240,
  paddingTop: 12,
  paddingBottom: 34,
  paddingSide: 8,
} as const;

const CHART_BASELINE = CHART.height - CHART.paddingBottom;
const CHART_PLOT_HEIGHT = CHART_BASELINE - CHART.paddingTop;
const CHART_PLOT_WIDTH = CHART.width - CHART.paddingSide * 2;
const CHART_GRID_FRACTIONS: readonly number[] = [0, 0.25, 0.5, 0.75, 1];

export interface ReportChartBar {
  readonly key: string;
  readonly label: string;
  readonly labelX: number;
  readonly barWidth: number;
  readonly expectedX: number;
  readonly expectedY: number;
  readonly expectedHeight: number;
  readonly collectedX: number;
  readonly collectedY: number;
  readonly collectedHeight: number;
}

export interface ReportChart {
  readonly bars: readonly ReportChartBar[];
  readonly gridY: readonly number[];
  readonly max: number;
}

const INSIGHT_LABELS: Readonly<Record<ReportInsightKind, string>> = {
  fact: 'Fait constaté',
  anomaly: 'Anomalie détectée',
  recommendation: 'Recommandation automatique',
};

const INSIGHT_TONES: Readonly<Record<ReportInsightKind, CnpmBadgeTone>> = {
  fact: 'info',
  anomaly: 'warning',
  recommendation: 'neutral',
};

const RATE_FORMAT = new Intl.NumberFormat('fr-ML', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Arrondi d'affichage : deux décimales suffisent au tracé et évitent des attributs illisibles. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * BO-028 — reporting décisionnel.
 *
 * Rapport sélectionné, exercice, période, recherche et tri vivent dans l'URL : c'est ce
 * qui rend une analyse citable dans un compte rendu et retrouvable à l'identique par
 * son destinataire. Un état gardé en mémoire ne survivrait ni au partage ni au
 * rechargement.
 *
 * Trois éléments de la fiche ne sont volontairement pas rendus :
 *
 * - `ExportMenu` — le flux d'export asynchrone avec notification n'est pas spécifié.
 *   Les deux actions restent visibles mais inertes, en énonçant leur indisponibilité :
 *   un export qui échoue en silence coûte plus cher qu'un export annoncé absent.
 * - `MapPanel` — la fiche exige « un actif officiel validé, pas une approximation
 *   générée ». Aucun fond de carte du Mali validé n'existe dans le dépôt ; les taux
 *   régionaux sont donc listés, ce qui les rend au passage lisibles au clavier et au
 *   lecteur d'écran.
 * - Le clic sur une série pour filtrer ou ouvrir le détail : la cible de ce détail
 *   n'est pas spécifiée, et un graphique cliquable sans destination est un piège.
 */
@Component({
  selector: 'cnpm-reporting-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormsModule,
    AdminShellComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    DefinitionListComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TabsComponent,
    LucideFileSpreadsheet,
    LucideFileText,
  ],
  templateUrl: './reporting.page.html',
  styleUrl: './reporting.page.scss',
})
export class ReportingPage {
  private readonly gateway = inject(REPORTING_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly skeletonRows = SKELETON_ROWS;

  protected readonly exerciseLabels = EXERCISE_LABELS;
  protected readonly periodLabels = PERIOD_LABELS;
  protected readonly exercises = Object.keys(EXERCISE_LABELS) as readonly ExerciseId[];
  protected readonly periods = Object.keys(PERIOD_LABELS) as readonly PeriodId[];

  /** Onglets du catalogue de rapports, dérivés du contrat et non d'une liste parallèle. */
  protected readonly catalogue: readonly CnpmTab[] = REPORT_CATALOGUE.map((report) => ({
    id: report.id,
    label: report.label,
  }));

  protected readonly filtersExpanded = signal(true);

  /** L'URL est l'unique source de vérité des filtres ; aucun état parallèle. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly reportId = computed<ReportId>(() => {
    const value = this.params().get('rapport');
    const found = REPORT_CATALOGUE.find((report) => report.id === value);
    return found ? found.id : DEFAULT_REPORT;
  });

  protected readonly exercise = computed<ExerciseId>(() => {
    const value = this.params().get('exercice');
    return value === '2023' || value === '2024' ? value : DEFAULT_EXERCISE;
  });

  protected readonly period = computed<PeriodId>(() => {
    const value = this.params().get('periode');
    return value !== null && value in PERIOD_LABELS ? (value as PeriodId) : DEFAULT_PERIOD;
  });

  protected readonly search = computed(() => this.params().get('q') ?? '');

  protected readonly sort = computed<SortState | null>(() => {
    const key = this.params().get('tri');
    if (!key) {
      return null;
    }
    return { key, direction: this.params().get('ordre') === 'desc' ? 'desc' : 'asc' };
  });

  /** Saisie en cours ; ne devient un filtre qu'à la validation du formulaire. */
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  /**
   * Fiche du rapport courant, lue dans le catalogue et non dans la réponse.
   *
   * Les en-têtes de colonnes et le titre du panneau sont ainsi connus pendant le
   * chargement : l'ossature a la forme de ce qui arrive, au lieu d'un bloc anonyme.
   */
  protected readonly descriptor = computed<ReportDescriptor>(() => {
    const id = this.reportId();
    return REPORT_CATALOGUE.find((report) => report.id === id) ?? REPORT_CATALOGUE[0];
  });

  private readonly query = computed<ReportQuery>(() => ({
    reportId: this.reportId(),
    exercise: this.exercise(),
    period: this.period(),
    search: this.search(),
    sort: this.sort(),
  }));

  /**
   * Relance manuelle après une erreur récupérable. Incrémenter ce compteur ré-émet la
   * même requête sans toucher à l'URL : « Réessayer » recharge en place, comme l'exige
   * la matrice `loading-empty-error.md`.
   */
  private readonly retryTick = signal(0);

  private readonly fetchTrigger = computed(() => ({ query: this.query(), tick: this.retryTick() }));

  /**
   * `switchMap` abandonne la requête précédente dès qu'un filtre change : sans lui, une
   * réponse lente à une période déjà abandonnée écraserait la réponse courante, et le
   * tableau afficherait des chiffres qui ne correspondent plus aux filtres visibles.
   */
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.load(query).pipe(
          map((report) => ({ kind: 'ready' as const, report })),
          catchError((error: unknown) =>
            of(
              error instanceof ReportingAccessError
                ? { kind: 'forbidden' as const }
                : { kind: 'error' as const },
            ),
          ),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly data = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.report : null;
  });

  protected readonly loading = computed(() => this.result().kind === 'loading');
  protected readonly rows = computed<readonly ReportRow[]>(() => this.data()?.rows ?? []);
  protected readonly totals = computed(() => this.data()?.totals ?? null);
  protected readonly insights = computed(() => this.data()?.insights ?? []);
  protected readonly periodLabel = computed(() => this.data()?.periodLabel ?? '');
  protected readonly updatedAt = computed(() => this.data()?.updatedAt ?? '');

  /** Vrai lorsque la période sélectionnée ne porte aucune donnée, recherche exclue. */
  protected readonly periodWithoutData = computed(
    () => this.data() !== null && this.totals() === null,
  );

  protected readonly tableState = computed<DataTableState>(() => {
    const result = this.result();
    if (result.kind === 'loading') {
      return 'loading';
    }
    if (result.kind === 'error') {
      return 'error';
    }
    if (result.kind === 'forbidden') {
      return 'forbidden';
    }
    if (result.report.rows.length > 0) {
      return 'ready';
    }
    // Une période sans donnée et une recherche trop étroite appellent des gestes
    // opposés : changer de période, ou élargir la recherche. Les confondre mène l'un
    // des deux dans une impasse.
    return this.search() && result.report.totalRows > 0 ? 'noResult' : 'empty';
  });

  protected readonly columns = computed<readonly DataTableColumn[]>(() => {
    const descriptor = this.descriptor();
    const columns: DataTableColumn[] = [
      { key: 'label', label: descriptor.dimensionLabel, sortable: true },
      {
        key: 'expected',
        label: 'Cotisations attendues',
        note: '(FCFA)',
        align: 'end',
        sortable: true,
      },
      { key: 'collected', label: 'Encaissements', note: '(FCFA)', align: 'end', sortable: true },
      { key: 'gap', label: 'Écart', note: '(FCFA)', align: 'end', sortable: true },
      {
        key: 'recoveryRate',
        label: 'Taux de recouvrement',
        note: '(%)',
        align: 'end',
        sortable: true,
      },
      { key: 'share', label: 'Part des encaissements', note: '(%)', align: 'end' },
    ];
    if (descriptor.hasMembers) {
      columns.push({ key: 'members', label: 'Membres actifs', align: 'end', sortable: true });
    }
    return columns;
  });

  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const period = this.period();
    if (period !== DEFAULT_PERIOD) {
      chips.push({ key: 'periode', label: `Période : ${PERIOD_LABELS[period]}` });
    }
    const search = this.search();
    if (search) {
      chips.push({ key: 'q', label: `Recherche : ${search}` });
    }
    return chips;
  });

  /**
   * Bandeau d'indicateurs, borné à six mesures comme l'impose la fiche.
   *
   * Les valeurs sont recopiées telles quelles depuis la source. Aucune n'est recalculée
   * ici : un second calcul côté écran pourrait diverger de celui qui alimente le
   * tableau, et donner le total incohérent que la fiche proscrit.
   */
  protected readonly contributionStats = computed<readonly InsightStat[]>(() => {
    const totals = this.totals();
    return [
      { label: 'Cotisations attendues', value: totals?.expected ?? null },
      { label: 'Encaissements', value: totals?.collected ?? null },
      { label: 'Reste à recouvrer', value: totals?.outstanding ?? null, apart: true },
    ];
  });

  protected readonly performanceStats = computed<readonly InsightStat[]>(() => {
    const totals = this.totals();
    return [
      {
        label: 'Taux de recouvrement',
        value: totals?.recoveryRate ?? null,
        suffix: ' %',
        decimals: 1,
      },
      { label: 'Membres actifs en fin de période', value: totals?.activeMembers ?? null },
      { label: 'Nouvelles adhésions', value: totals?.newMembers ?? null, apart: true },
    ];
  });

  /** Fiche méthodologique du rapport : définition, source, période, mise à jour. */
  protected readonly metricDefinitions = computed<readonly CnpmDefinition[]>(() => {
    const descriptor = this.descriptor();
    return [
      { label: 'Définition', value: descriptor.definition },
      { label: 'Source', value: descriptor.source },
      { label: 'Période analysée', value: this.periodLabel() || 'Période en cours de chargement' },
      { label: 'Mise à jour', value: this.updatedAt() || 'En cours de chargement' },
    ];
  });

  /**
   * Résumé du tableau, annoncé avant l'entrée dans la grille.
   *
   * Il nomme le rapport ET la période : hors contexte visuel, « écart » et « taux » ne
   * disent pas sur quoi ils portent.
   */
  protected readonly tableCaption = computed(() => {
    const descriptor = this.descriptor();
    const period = this.periodLabel();
    const scope = period ? ` sur la période « ${period} »` : '';
    return `${descriptor.title}${scope} : cotisations attendues, encaissements, écart et taux de recouvrement par ${descriptor.dimensionLabel.toLocaleLowerCase('fr')}.`;
  });

  /**
   * Taux régionaux en liste, faute d'actif cartographique officiel.
   *
   * Une carte approximative serait un contresens sur un territoire : la fiche l'exclut
   * explicitement, et une liste se lit de toute façon au clavier.
   */
  protected readonly regionRates = computed<readonly CnpmDefinition[]>(() =>
    (this.data()?.regions ?? []).map((region) => ({
      label: region.label,
      value:
        region.recoveryRate === null
          ? 'Non calculable'
          : `${RATE_FORMAT.format(region.recoveryRate)}\u00A0%`,
    })),
  );

  /**
   * Histogramme groupé : attendu contre encaissé, deux teintes de la palette de marque.
   *
   * Le tracé reste décoratif — `aria-hidden` — et le tableau qui le suit porte les mêmes
   * chiffres : c'est l'alternative accessible exigée par la fiche. Doubler l'information
   * dans le SVG produirait une lecture bavarde et redondante.
   */
  protected readonly chart = computed<ReportChart | null>(() => {
    const rows = this.rows();
    if (rows.length === 0) {
      return null;
    }
    const max = rows.reduce((top, row) => Math.max(top, row.expected, row.collected), 0);
    if (max === 0) {
      return null;
    }

    const groupWidth = CHART_PLOT_WIDTH / rows.length;
    // Deux barres jointives au centre de leur groupe, avec un filet de séparation :
    // l'œil compare d'abord les deux valeurs d'un même mois, puis les mois entre eux.
    const barWidth = Math.min(groupWidth * 0.34, 28);

    const bars = rows.map((row, index) => {
      const center = CHART.paddingSide + index * groupWidth + groupWidth / 2;
      const expectedHeight = (row.expected / max) * CHART_PLOT_HEIGHT;
      const collectedHeight = (row.collected / max) * CHART_PLOT_HEIGHT;
      return {
        key: row.id,
        label: row.shortLabel,
        labelX: round(center),
        barWidth: round(barWidth),
        expectedX: round(center - barWidth - 1),
        expectedY: round(CHART_BASELINE - expectedHeight),
        expectedHeight: round(expectedHeight),
        collectedX: round(center + 1),
        collectedY: round(CHART_BASELINE - collectedHeight),
        collectedHeight: round(collectedHeight),
      };
    });

    return {
      bars,
      gridY: CHART_GRID_FRACTIONS.map((fraction) =>
        round(CHART_BASELINE - fraction * CHART_PLOT_HEIGHT),
      ),
      max,
    };
  });

  protected readonly chartViewBox = `0 0 ${CHART.width} ${CHART.height}`;
  protected readonly chartLeft = CHART.paddingSide;
  protected readonly chartRight = CHART.width - CHART.paddingSide;
  protected readonly chartLabelY = CHART_BASELINE + 20;

  protected readonly rowKey = (row: ReportRow): string => row.id;
  protected readonly rowLabel = (row: ReportRow): string => row.label;

  protected insightLabel(kind: ReportInsightKind): string {
    return INSIGHT_LABELS[kind];
  }

  protected insightTone(kind: ReportInsightKind): CnpmBadgeTone {
    return INSIGHT_TONES[kind];
  }

  protected selectReport(id: string): void {
    // Le tri est remis à zéro : une clé de tri valable pour un rapport ne l'est pas
    // toujours pour le suivant, dont les colonnes diffèrent.
    this.patch({ rapport: id === DEFAULT_REPORT ? null : id, tri: null, ordre: null });
  }

  protected setExercise(value: string): void {
    this.patch({ exercice: value === DEFAULT_EXERCISE ? null : value });
  }

  protected setPeriod(value: string): void {
    this.patch({ periode: value === DEFAULT_PERIOD ? null : value });
  }

  protected applySearch(): void {
    this.patch({ q: this.searchDraft().trim() || null });
  }

  protected onSortChange(sort: SortState): void {
    this.patch({ tri: sort.key, ordre: sort.direction });
  }

  protected removeChip(key: string): void {
    if (key === 'q') {
      this.searchDraft.set('');
    }
    this.patch({ [key]: null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ periode: null, q: null });
  }

  /** Relance le chargement après une erreur récupérable, sans recharger la page. */
  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patch(params: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
