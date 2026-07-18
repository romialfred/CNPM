import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideDownload, LucidePlus } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
  SortState,
} from '../../../design-system/data-table/data-table.model';
import {
  EmptyStateComponent,
  type CnpmEmptyStateVariant,
} from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  FilterBarComponent,
  type FilterChip,
} from '../../../design-system/filter-bar/filter-bar.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import {
  InsightSummaryComponent,
  type InsightStat,
} from '../../../design-system/insight-summary/insight-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TabsComponent, type CnpmTab } from '../../../design-system/tabs/tabs.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  RECOVERY_GATEWAY,
  RecoveryAccessError,
  type CampaignChannel,
  type CampaignRow,
  type CampaignStatus,
  type DeliveryRow,
  type DeliveryStatus,
  type PledgeRow,
  type PledgeStatus,
  type RecoveryQuery,
  type RecoveryTab,
} from './recovery-gateway';

const TABS: readonly CnpmTab[] = [
  { id: 'campaigns', label: 'Campagnes' },
  { id: 'deliveries', label: 'Journal des envois' },
  { id: 'pledges', label: 'Promesses de paiement' },
];

const TAB_IDS: readonly RecoveryTab[] = ['campaigns', 'deliveries', 'pledges'];

const CHANNEL_LABELS: Readonly<Record<CampaignChannel, string>> = {
  SMS: 'SMS',
  EMAIL: 'E-mail',
};

const CAMPAIGN_STATUS_LABELS: Readonly<Record<CampaignStatus, string>> = {
  DRAFT: 'Brouillon',
  SCHEDULED: 'Planifiée',
  RUNNING: 'En cours',
  PAUSED: 'En pause',
  COMPLETED: 'Terminée',
};

const CAMPAIGN_STATUS_TONES: Readonly<Record<CampaignStatus, CnpmBadgeTone>> = {
  DRAFT: 'neutral',
  SCHEDULED: 'info',
  RUNNING: 'info',
  PAUSED: 'warning',
  COMPLETED: 'success',
};

const DELIVERY_STATUS_LABELS: Readonly<Record<DeliveryStatus, string>> = {
  QUEUED: 'En file',
  SENT: 'Envoyé',
  DELIVERED: 'Délivré',
  OPENED: 'Ouvert',
  FAILED: 'Échec',
};

const DELIVERY_STATUS_TONES: Readonly<Record<DeliveryStatus, CnpmBadgeTone>> = {
  QUEUED: 'neutral',
  SENT: 'info',
  DELIVERED: 'success',
  OPENED: 'success',
  FAILED: 'error',
};

const PLEDGE_STATUS_LABELS: Readonly<Record<PledgeStatus, string>> = {
  PENDING: 'En attente',
  HONOURED: 'Honorée',
  PARTIAL: 'Partielle',
  BROKEN: 'Non tenue',
};

const PLEDGE_STATUS_TONES: Readonly<Record<PledgeStatus, CnpmBadgeTone>> = {
  PENDING: 'info',
  HONOURED: 'success',
  PARTIAL: 'warning',
  BROKEN: 'error',
};

const CHANNELS: readonly CampaignChannel[] = ['SMS', 'EMAIL'];

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

/**
 * Décalage de Bamako, appliqué explicitement à tout horodatage affiché.
 *
 * La fiche exige que « le fuseau et la date [soient] explicites ». Sans décalage
 * imposé, `DatePipe` rendrait l'heure du poste : la même campagne s'afficherait à
 * 09:00 à Bamako et à 11:00 sur un poste réglé sur Le Caire, sans que rien ne le
 * signale.
 */
const BAMAKO_OFFSET = '+0000';

interface StatusOption {
  readonly value: string;
  readonly label: string;
}

/**
 * BO-017 — campagnes de relance.
 *
 * Trois vues d'un même programme : les campagnes, le journal des envois et les
 * promesses obtenues. Onglet, filtres, tri et page vivent dans l'URL — la vue reste
 * partageable et retrouve son contexte au rechargement, comme l'impose
 * `frontend-angular.md`.
 *
 * Le builder en six étapes de la fiche n'est pas implémenté : sa spécification
 * détaillée (audience, cadence, planification) n'est pas arrêtée. Les contrôles
 * qu'il doit présenter avant lancement — exclusions, doublons, consentements et coût
 * estimé — sont en revanche rendus en lecture dans le panneau de synthèse, plutôt que
 * d'être passés sous silence. Le lancement effectif reste indisponible : aucun envoi
 * réel n'a lieu ici, ce que le critère d'acceptation de la fiche exige.
 */
@Component({
  selector: 'cnpm-recovery-campaigns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Le port est fourni au composant : l'écran s'assemble sans dépendre d'un point de
  // câblage extérieur. Basculer sur l'adaptateur HTTP ne touchera que cette ligne.
  imports: [
    DatePipe,
    DecimalPipe,
    NgTemplateOutlet,
    FormsModule,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterBarComponent,
    InsightSummaryComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
    TabsComponent,
    LucideDownload,
    LucidePlus,
  ],
  templateUrl: './recovery-campaigns.page.html',
  styleUrls: ['./recovery-campaigns.page.scss', './recovery-campaigns.metrics.scss'],
})
export class RecoveryCampaignsPage {
  private readonly gateway = inject(RECOVERY_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly tabs = TABS;
  protected readonly channels = CHANNELS;
  protected readonly channelLabels = CHANNEL_LABELS;
  protected readonly bamakoOffset = BAMAKO_OFFSET;

  protected readonly filtersExpanded = signal(true);

  /** L'URL est l'unique source de vérité des filtres ; aucun état parallèle. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly tab = computed<RecoveryTab>(() => {
    const value = this.params().get('onglet');
    return TAB_IDS.find((id) => id === value) ?? 'campaigns';
  });

  protected readonly search = computed(() => this.params().get('q') ?? '');

  protected readonly channel = computed<CampaignChannel | null>(() => {
    const value = this.params().get('canal');
    return CHANNELS.find((item) => item === value) ?? null;
  });

  protected readonly segment = computed(() => this.params().get('segment'));

  /**
   * Statut de la vue courante. Une valeur héritée d'un autre onglet est ignorée :
   * `FAILED` n'a aucun sens sur une campagne, et un filtre inerte mais affiché
   * promettrait un tri qui n'a pas lieu.
   */
  protected readonly status = computed<string | null>(() => {
    const value = this.params().get('statut');
    if (!value) {
      return null;
    }
    return this.statusOptions().some((option) => option.value === value) ? value : null;
  });

  protected readonly page = computed(() => {
    const value = Number(this.params().get('page'));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });

  protected readonly pageSize = computed(() => {
    const value = Number(this.params().get('taille'));
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_PAGE_SIZE;
  });

  protected readonly sort = computed<SortState | null>(() => {
    const key = this.params().get('tri');
    if (!key) {
      return null;
    }
    return { key, direction: this.params().get('ordre') === 'desc' ? 'desc' : 'asc' };
  });

  /** Saisie en cours ; ne devient un filtre qu'à la validation du formulaire. */
  protected readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  private readonly query = computed<RecoveryQuery>(() => ({
    tab: this.tab(),
    search: this.search(),
    channel: this.channel(),
    segment: this.segment(),
    status: this.status(),
    sort: this.sort(),
    page: this.page(),
    pageSize: this.pageSize(),
  }));

  /**
   * Relance manuelle d'une erreur récupérable. Incrémenter ce compteur ré-émet la
   * même requête sans toucher à l'URL : « Réessayer » recharge en place, comme
   * l'exige la matrice `loading-empty-error.md`.
   */
  private readonly retryTick = signal(0);

  private readonly fetchTrigger = computed(() => ({ query: this.query(), tick: this.retryTick() }));

  /**
   * `switchMap` abandonne la requête précédente dès qu'un filtre change : sans lui,
   * une réponse lente à un filtre déjà abandonné écraserait la réponse courante.
   *
   * Un refus d'accès (403) est distingué d'une panne temporaire : le premier n'est
   * pas « réessayable », le second l'est.
   */
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.search(query).pipe(
          map((page) => ({ kind: 'ready' as const, page })),
          catchError((error: unknown) =>
            of(
              error instanceof RecoveryAccessError
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
    return result.kind === 'ready' ? result.page : null;
  });

  protected readonly overview = computed(() => this.data()?.overview ?? null);
  protected readonly totalItems = computed(() => this.data()?.totalItems ?? 0);
  protected readonly segments = computed(() => this.data()?.segments ?? []);

  /**
   * Lignes typées par vue, obtenues par rétrécissement de l'union discriminée.
   * Aucun transtypage : le jour où une vue gagne une colonne, le compilateur le voit.
   */
  protected readonly campaignRows = computed<readonly CampaignRow[]>(() => {
    const rows = this.data()?.rows;
    return rows?.kind === 'campaigns' ? rows.items : [];
  });

  protected readonly deliveryRows = computed<readonly DeliveryRow[]>(() => {
    const rows = this.data()?.rows;
    return rows?.kind === 'deliveries' ? rows.items : [];
  });

  protected readonly pledgeRows = computed<readonly PledgeRow[]>(() => {
    const rows = this.data()?.rows;
    return rows?.kind === 'pledges' ? rows.items : [];
  });

  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.channel() || this.segment() || this.status()),
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
    if (result.page.totalItems > 0) {
      return 'ready';
    }
    // Une collection vide et un filtre trop étroit appellent des gestes opposés :
    // créer une première campagne, ou élargir la recherche. Les confondre mène l'un
    // des deux dans une impasse.
    return this.hasFilters() ? 'noResult' : 'empty';
  });

  protected readonly campaignColumns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'label', label: 'Campagne', sortable: true },
    { key: 'segment', label: 'Segment cible' },
    { key: 'scenario', label: 'Scénario' },
    { key: 'channels', label: 'Canaux' },
    { key: 'schedule', label: 'Planification', note: '(Africa/Bamako)', sortable: true },
    { key: 'audience', label: 'Audience', align: 'end', sortable: true },
    { key: 'delivery', label: 'Délivrés', align: 'end', sortable: true },
    { key: 'opened', label: 'Ouverts', align: 'end' },
    { key: 'conversion', label: 'Conversion', note: '(promesses)', align: 'end', sortable: true },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'actions', label: 'Actions' },
  ];

  protected readonly deliveryColumns: readonly DataTableColumn[] = [
    { key: 'campaign', label: 'Campagne' },
    { key: 'organization', label: 'Membre', sortable: true },
    { key: 'destination', label: 'Destination' },
    { key: 'channel', label: 'Canal' },
    { key: 'sentAt', label: 'Horodatage', note: '(Africa/Bamako)', sortable: true },
    { key: 'status', label: 'Diffusion', sortable: true },
    { key: 'failureReason', label: 'Motif' },
  ];

  protected readonly pledgeColumns: readonly DataTableColumn[] = [
    { key: 'memberCode', label: 'Code membre' },
    { key: 'organization', label: 'Membre', sortable: true },
    { key: 'campaign', label: 'Campagne d’origine' },
    { key: 'amount', label: 'Montant promis', note: '(FCFA)', align: 'end', sortable: true },
    { key: 'dueDate', label: 'Échéance annoncée', sortable: true },
    { key: 'status', label: 'Statut', sortable: true },
  ];

  /** Colonnes de la vue active — dimensionne le squelette de chargement. */
  protected readonly activeColumns = computed<readonly DataTableColumn[]>(() => {
    switch (this.tab()) {
      case 'deliveries':
        return this.deliveryColumns;
      case 'pledges':
        return this.pledgeColumns;
      default:
        return this.campaignColumns;
    }
  });

  /** Vocabulaire de statut propre à la vue : les trois n'ont rien en commun. */
  protected readonly statusOptions = computed<readonly StatusOption[]>(() => {
    switch (this.tab()) {
      case 'deliveries':
        return Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => ({ value, label }));
      case 'pledges':
        return Object.entries(PLEDGE_STATUS_LABELS).map(([value, label]) => ({ value, label }));
      default:
        return Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => ({ value, label }));
    }
  });

  protected readonly statusFilterLabel = computed(() => {
    switch (this.tab()) {
      case 'deliveries':
        return 'Statut de diffusion';
      case 'pledges':
        return 'Statut de la promesse';
      default:
        return 'Statut de la campagne';
    }
  });

  protected readonly tableCaption = computed(() => {
    switch (this.tab()) {
      case 'deliveries':
        return 'Journal des envois de relance : campagne, membre destinataire, canal, horodatage, statut de diffusion et motif d’échec.';
      case 'pledges':
        return 'Promesses de paiement obtenues à la suite des relances : membre, campagne d’origine, montant promis, échéance et statut.';
      default:
        return 'Campagnes de relance du CNPM : référence, segment cible, scénario, canaux, planification, audience, diffusion, conversion et statut.';
    }
  });

  protected readonly totalLabel = computed(() => {
    const total = this.totalItems();
    switch (this.tab()) {
      case 'deliveries':
        return total === 1 ? 'envoi journalisé' : 'envois journalisés';
      case 'pledges':
        return total === 1 ? 'promesse' : 'promesses';
      default:
        return total === 1 ? 'campagne' : 'campagnes';
    }
  });

  protected readonly loadingLabel = computed(() => {
    switch (this.tab()) {
      case 'deliveries':
        return 'Chargement du journal des envois…';
      case 'pledges':
        return 'Chargement des promesses de paiement…';
      default:
        return 'Chargement des campagnes de relance…';
    }
  });

  /**
   * Une collection réellement vide n'appelle pas le même geste selon la vue :
   * les campagnes se créent, tandis que le journal et les promesses ne se remplissent
   * qu'en conséquence d'un envoi. Proposer « créez une campagne » depuis le journal
   * serait une impasse.
   */
  protected readonly emptyVariant = computed<CnpmEmptyStateVariant>(() =>
    this.tab() === 'campaigns' ? 'first-use' : 'no-data',
  );

  protected readonly emptyTitle = computed(() => {
    switch (this.tab()) {
      case 'deliveries':
        return 'Aucun envoi journalisé';
      case 'pledges':
        return 'Aucune promesse enregistrée';
      default:
        return 'Aucune campagne de relance';
    }
  });

  protected readonly emptyDescription = computed(() => {
    switch (this.tab()) {
      case 'deliveries':
        return 'Le journal se remplit dès qu’une campagne est lancée.';
      case 'pledges':
        return 'Les promesses apparaissent ici lorsqu’un membre s’engage à régler après une relance.';
      default:
        return 'Créez une première campagne pour lancer le recouvrement.';
    }
  });

  protected readonly chips = computed<readonly FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const search = this.search();
    if (search) {
      chips.push({ key: 'q', label: `Recherche : ${search}` });
    }
    const channel = this.channel();
    if (channel) {
      chips.push({ key: 'canal', label: `Canal : ${CHANNEL_LABELS[channel]}` });
    }
    const segment = this.segment();
    if (segment) {
      chips.push({ key: 'segment', label: `Segment : ${segment}` });
    }
    const status = this.status();
    if (status) {
      const option = this.statusOptions().find((item) => item.value === status);
      chips.push({
        key: 'statut',
        label: `${this.statusFilterLabel()} : ${option?.label ?? status}`,
      });
    }
    return chips;
  });

  /**
   * Les statistiques sont recopiées telles quelles depuis la source ; aucune n'est
   * recalculée ici. Un second calcul côté écran pourrait diverger de celui qui
   * alimente le tableau.
   */
  protected readonly programStats = computed<readonly InsightStat[]>(() => {
    const summary = this.overview();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Campagnes', value: summary.campaignsTotal },
      { label: 'En cours', value: summary.running },
      { label: 'Planifiées', value: summary.scheduled },
      { label: 'Brouillons', value: summary.drafts, apart: true },
    ];
  });

  protected readonly deliveryStats = computed<readonly InsightStat[]>(() => {
    const summary = this.overview();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Audience ciblée', value: summary.audience },
      { label: 'Messages envoyés', value: summary.sent },
      { label: 'Délivrés', value: summary.delivered },
      { label: 'Taux de délivrance', value: summary.deliveryRate, suffix: ' %', decimals: 1 },
      {
        label: 'Taux d’ouverture',
        value: summary.openRate,
        suffix: ' %',
        decimals: 1,
        apart: true,
      },
    ];
  });

  protected readonly conversionStats = computed<readonly InsightStat[]>(() => {
    const summary = this.overview();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Promesses obtenues', value: summary.pledgeCount },
      { label: 'Montant promis', value: summary.pledgedAmount },
      {
        label: 'Taux de conversion',
        value: summary.conversionRate,
        suffix: ' %',
        decimals: 1,
        apart: true,
      },
    ];
  });

  protected readonly controlStats = computed<readonly InsightStat[]>(() => {
    const summary = this.overview();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Exclusions appliquées', value: summary.exclusions },
      { label: 'Doublons écartés', value: summary.duplicates },
      { label: 'Consentements manquants', value: summary.missingConsents },
      { label: 'Coût estimé', value: summary.estimatedCost, suffix: ' FCFA', apart: true },
    ];
  });

  protected readonly campaignKey = (row: CampaignRow): string => row.id;
  protected readonly campaignLabel = (row: CampaignRow): string =>
    `${row.label} (${row.reference})`;

  protected readonly deliveryKey = (row: DeliveryRow): string => row.id;
  protected readonly deliveryLabel = (row: DeliveryRow): string =>
    `${row.organization} — ${row.campaignReference}`;

  protected readonly pledgeKey = (row: PledgeRow): string => row.id;
  protected readonly pledgeLabel = (row: PledgeRow): string =>
    `${row.organization} (${row.memberCode})`;

  protected channelLabel(channel: CampaignChannel): string {
    return CHANNEL_LABELS[channel];
  }

  protected campaignStatusLabel(status: CampaignStatus): string {
    return CAMPAIGN_STATUS_LABELS[status];
  }

  protected campaignStatusTone(status: CampaignStatus): CnpmBadgeTone {
    return CAMPAIGN_STATUS_TONES[status];
  }

  protected deliveryStatusLabel(status: DeliveryStatus): string {
    return DELIVERY_STATUS_LABELS[status];
  }

  protected deliveryStatusTone(status: DeliveryStatus): CnpmBadgeTone {
    return DELIVERY_STATUS_TONES[status];
  }

  protected pledgeStatusLabel(status: PledgeStatus): string {
    return PLEDGE_STATUS_LABELS[status];
  }

  protected pledgeStatusTone(status: PledgeStatus): CnpmBadgeTone {
    return PLEDGE_STATUS_TONES[status];
  }

  /** Part des messages effectivement remis. `null` tant que rien n'est parti. */
  protected deliveryRate(row: CampaignRow): number | null {
    return row.sent === 0 ? null : (row.delivered / row.sent) * 100;
  }

  /**
   * Taux d'ouverture. `null` quand aucune diffusion n'est mesurable — une campagne
   * SMS n'a pas un taux d'ouverture de 0 %, elle n'en a pas du tout, et afficher
   * « 0 % » la ferait passer pour un échec.
   */
  protected openRate(row: CampaignRow): number | null {
    return row.openable === 0 ? null : (row.opened / row.openable) * 100;
  }

  /** Promesses obtenues rapportées aux membres réellement joints. */
  protected conversionRate(row: CampaignRow): number | null {
    return row.delivered === 0 ? null : (row.pledgeCount / row.delivered) * 100;
  }

  protected setTab(value: string): void {
    const tab = TAB_IDS.find((id) => id === value) ?? 'campaigns';
    // Statut et tri sont remis à zéro : leurs vocabulaires diffèrent d'une vue à
    // l'autre, et conserver `tri=amount` sur le journal des envois trierait sur une
    // colonne qui n'y existe pas.
    this.patch({
      onglet: tab === 'campaigns' ? null : tab,
      statut: null,
      tri: null,
      ordre: null,
      page: null,
    });
  }

  protected applySearch(): void {
    this.patch({ q: this.searchDraft().trim() || null, page: null });
  }

  protected setChannel(value: string): void {
    this.patch({ canal: value || null, page: null });
  }

  protected setSegment(value: string): void {
    this.patch({ segment: value || null, page: null });
  }

  protected setStatus(value: string): void {
    this.patch({ statut: value || null, page: null });
  }

  /** Raccourci du panneau d'alerte : ouvre le journal filtré sur les échecs. */
  protected showFailures(): void {
    this.patch({ onglet: 'deliveries', statut: 'FAILED', tri: null, ordre: null, page: null });
  }

  protected onSortChange(sort: SortState): void {
    this.patch({ tri: sort.key, ordre: sort.direction, page: null });
  }

  protected onPageChange(page: number): void {
    this.patch({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(size: number): void {
    // La page repart à 1 : rester en page 12 après être passé à 50 par page
    // renverrait au-delà de la fin du jeu.
    this.patch({ taille: size === DEFAULT_PAGE_SIZE ? null : size, page: null });
  }

  protected removeChip(key: string): void {
    if (key === 'q') {
      this.searchDraft.set('');
    }
    this.patch({ [key]: null, page: null });
  }

  protected resetFilters(): void {
    this.searchDraft.set('');
    this.patch({ q: null, canal: null, segment: null, statut: null, page: null });
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
