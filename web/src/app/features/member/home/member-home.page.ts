import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCreditCard, LucideFileDown, LucideRefreshCw } from '@lucide/angular';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type {
  DataTableColumn,
  DataTableState,
} from '../../../design-system/data-table/data-table.model';
import {
  DefinitionListComponent,
  type CnpmDefinition,
} from '../../../design-system/definition-list/definition-list.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import {
  InsightSummaryComponent,
  type InsightStat,
} from '../../../design-system/insight-summary/insight-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TabsComponent, type CnpmTab } from '../../../design-system/tabs/tabs.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { DemoMemberHomeGateway } from './demo-member-home.gateway';
import {
  MEMBER_HOME_GATEWAY,
  MemberHomeAccessError,
  type ContributionCall,
  type ContributionCallStatus,
  type MemberDocument,
  type MemberHomeSnapshot,
  type MemberReceipt,
  type MemberRequest,
  type MemberRequestStatus,
  type MembershipStatus,
} from './member-home-gateway';

type PageState = 'loading' | 'ready' | 'error' | 'forbidden';

const MEMBERSHIP_LABELS: Readonly<Record<MembershipStatus, string>> = {
  ACTIVE: 'Adhésion active',
  DORMANT: 'Adhésion dormante',
  SUSPENDED: 'Adhésion suspendue',
};

const MEMBERSHIP_TONES: Readonly<Record<MembershipStatus, CnpmBadgeTone>> = {
  ACTIVE: 'success',
  DORMANT: 'warning',
  SUSPENDED: 'error',
};

const CALL_LABELS: Readonly<Record<ContributionCallStatus, string>> = {
  SETTLED: 'Soldé',
  PARTIAL: 'Partiellement réglé',
  PENDING: 'À échoir',
  OVERDUE: 'Échu',
};

const CALL_TONES: Readonly<Record<ContributionCallStatus, CnpmBadgeTone>> = {
  SETTLED: 'success',
  PARTIAL: 'warning',
  PENDING: 'info',
  OVERDUE: 'error',
};

const REQUEST_LABELS: Readonly<Record<MemberRequestStatus, string>> = {
  RECEIVED: 'Reçue',
  IN_PROGRESS: 'En cours de traitement',
  ANSWERED: 'Réponse apportée',
  CLOSED: 'Clôturée',
};

const REQUEST_TONES: Readonly<Record<MemberRequestStatus, CnpmBadgeTone>> = {
  RECEIVED: 'info',
  IN_PROGRESS: 'warning',
  ANSWERED: 'success',
  CLOSED: 'neutral',
};

/**
 * MP-001 — Accueil de l'espace membre.
 *
 * Vue côté adhérent, jamais côté administration : la fiche interdit explicitement
 * d'exposer ici les KPI globaux du CNPM. Tout ce qui est affiché appartient au
 * périmètre du membre authentifié, et ce périmètre est établi par le backend — la vue
 * ne le choisit pas et n'envoie aucun identifiant.
 *
 * Aucun shell membre n'existe encore : la page porte donc elle-même ses repères
 * (`main`, titre de rang 1, sections titrées) plutôt que d'introduire un cadre partagé
 * qui n'a pas été spécifié.
 *
 * L'exercice sélectionné vit dans l'URL (`?exercice=2025`) : la vue redevient ainsi
 * partageable et se retrouve à l'identique au retour, comme l'exige
 * `.claude/rules/frontend-angular.md`.
 */
@Component({
  selector: 'cnpm-member-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    DefinitionListComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    InsightSummaryComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TabsComponent,
    LucideCreditCard,
    LucideFileDown,
    LucideRefreshCw,
  ],
  // Le port est fourni au niveau de l'écran : la route n'a qu'à charger le composant.
  // Le remplacer par l'adaptateur HTTP ne touchera que cette ligne.
  providers: [{ provide: MEMBER_HOME_GATEWAY, useClass: DemoMemberHomeGateway }],
  templateUrl: './member-home.page.html',
  styleUrl: './member-home.page.scss',
})
export class MemberHomePage {
  private readonly gateway = inject(MEMBER_HOME_GATEWAY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly title = inject(Title);

  protected readonly iconSize = CNPM_ICON_SIZE;

  protected readonly state = signal<PageState>('loading');
  protected readonly snapshot = signal<MemberHomeSnapshot | null>(null);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly identity = computed(() => this.snapshot()?.identity ?? null);
  protected readonly situation = computed(() => this.snapshot()?.situation ?? null);
  protected readonly contact = computed(() => this.snapshot()?.contact ?? null);
  protected readonly profile = computed(() => this.snapshot()?.profile ?? null);
  protected readonly support = computed(() => this.snapshot()?.support ?? null);

  protected readonly exercises = computed(() => this.situation()?.exercises ?? []);

  protected readonly exerciseTabs = computed<readonly CnpmTab[]>(() =>
    this.exercises().map((exercise) => ({
      id: String(exercise.year),
      label: `Exercice ${exercise.year}`,
    })),
  );

  /**
   * Exercice affiché. L'URL prime, mais seulement si elle désigne un exercice qui
   * existe : un paramètre fantaisiste laisserait sinon l'écran vide sans explication.
   */
  protected readonly selectedExercise = computed(() => {
    const years = this.exercises().map((exercise) => String(exercise.year));
    const requested = this.params().get('exercice');
    if (requested && years.includes(requested)) {
      return requested;
    }
    return years[0] ?? '';
  });

  /** Vrai quand l'URL restreint réellement la vue : distingue « vide » de « aucun résultat ». */
  protected readonly hasExerciseFilter = computed(() => {
    const requested = this.params().get('exercice');
    const years = this.exercises().map((exercise) => String(exercise.year));
    return Boolean(requested && years.includes(requested));
  });

  /**
   * Totaux de l'exercice affiché, repris tels quels de la source.
   *
   * Rien n'est additionné ici : un second calcul pourrait contredire les lignes du
   * tableau, ce que la fiche interdit.
   */
  protected readonly exerciseSummary = computed(
    () =>
      this.exercises().find((exercise) => String(exercise.year) === this.selectedExercise()) ??
      null,
  );

  protected readonly exerciseStats = computed<readonly InsightStat[]>(() => {
    const summary = this.exerciseSummary();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Cotisation appelée', value: summary.called },
      { label: 'Déjà réglé', value: summary.settled },
      { label: 'Reste dû', value: summary.outstanding, apart: true },
    ];
  });

  protected readonly calls = computed<readonly ContributionCall[]>(() =>
    (this.snapshot()?.calls ?? []).filter((call) => String(call.year) === this.selectedExercise()),
  );

  protected readonly receipts = computed<readonly MemberReceipt[]>(() =>
    (this.snapshot()?.receipts ?? []).filter(
      (receipt) => String(receipt.year) === this.selectedExercise(),
    ),
  );

  protected readonly documents = computed<readonly MemberDocument[]>(
    () => this.snapshot()?.documents ?? [],
  );

  protected readonly requests = computed<readonly MemberRequest[]>(
    () => this.snapshot()?.requests ?? [],
  );

  protected readonly callsState = computed<DataTableState>(() =>
    this.tableState(this.calls().length, this.hasExerciseFilter()),
  );
  protected readonly receiptsState = computed<DataTableState>(() =>
    this.tableState(this.receipts().length, this.hasExerciseFilter()),
  );
  protected readonly documentsState = computed<DataTableState>(() =>
    this.tableState(this.documents().length, false),
  );
  protected readonly requestsState = computed<DataTableState>(() =>
    this.tableState(this.requests().length, false),
  );

  protected readonly contactFacts = computed<readonly CnpmDefinition[]>(() => {
    const identity = this.identity();
    const contact = this.contact();
    if (!identity || !contact) {
      return [];
    }
    // Seules les valeurs réellement renseignées sont rendues : une entrée vide
    // laisserait un espace mort dans la liste de définitions.
    return [
      { label: 'Raison sociale', value: identity.organization },
      { label: 'Numéro d’adhérent', value: identity.memberCode },
      { label: 'Catégorie', value: identity.category },
      { label: 'Groupement', value: identity.group },
      { label: 'Contact principal', value: `${contact.contactName} — ${contact.role}` },
      { label: 'Téléphone', value: contact.phone },
      { label: 'Courriel', value: contact.email },
      { label: 'Adresse', value: contact.address },
    ].filter((fact) => Boolean(fact.value));
  });

  protected readonly supportFacts = computed<readonly CnpmDefinition[]>(() => {
    const support = this.support();
    if (!support) {
      return [];
    }
    return [
      { label: 'Interlocuteur', value: support.channel },
      { label: 'Horaires', value: support.hours },
      { label: 'Téléphone', value: support.phone },
      { label: 'Courriel', value: support.email },
    ].filter((fact) => Boolean(fact.value));
  });

  protected readonly callColumns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence' },
    { key: 'period', label: 'Période' },
    { key: 'dueOn', label: 'Échéance' },
    { key: 'amount', label: 'Montant appelé', note: '(FCFA)', align: 'end' },
    { key: 'settled', label: 'Déjà réglé', note: '(FCFA)', align: 'end' },
    { key: 'outstanding', label: 'Reste dû', note: '(FCFA)', align: 'end' },
    { key: 'status', label: 'Statut' },
  ];

  protected readonly receiptColumns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Numéro de reçu' },
    { key: 'paidOn', label: 'Date de paiement' },
    { key: 'period', label: 'Période' },
    { key: 'amount', label: 'Montant', note: '(FCFA)', align: 'end' },
    { key: 'file', label: 'Fichier' },
    { key: 'actions', label: 'Actions' },
  ];

  protected readonly documentColumns: readonly DataTableColumn[] = [
    { key: 'name', label: 'Document' },
    { key: 'kind', label: 'Type' },
    { key: 'issuedOn', label: 'Délivré le' },
    { key: 'validity', label: 'Validité' },
    { key: 'file', label: 'Fichier' },
    { key: 'actions', label: 'Actions' },
  ];

  protected readonly requestColumns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence' },
    { key: 'subject', label: 'Objet' },
    { key: 'submittedOn', label: 'Déposée le' },
    { key: 'status', label: 'Statut' },
  ];

  // `rowKey` est obligatoire même sans sélection : le tableau s'en sert pour tracer les
  // lignes. Sans lui, toutes les lignes partageraient la même clé de suivi.
  protected readonly callKey = (row: ContributionCall): string => row.id;
  protected readonly receiptKey = (row: MemberReceipt): string => row.id;
  protected readonly documentKey = (row: MemberDocument): string => row.id;
  protected readonly requestKey = (row: MemberRequest): string => row.id;

  constructor() {
    this.title.setTitle('Espace membre — CNPM');
    this.load();
  }

  protected membershipLabel(status: MembershipStatus): string {
    return MEMBERSHIP_LABELS[status];
  }

  protected membershipTone(status: MembershipStatus): CnpmBadgeTone {
    return MEMBERSHIP_TONES[status];
  }

  protected callLabel(status: ContributionCallStatus): string {
    return CALL_LABELS[status];
  }

  protected callTone(status: ContributionCallStatus): CnpmBadgeTone {
    return CALL_TONES[status];
  }

  protected requestLabel(status: MemberRequestStatus): string {
    return REQUEST_LABELS[status];
  }

  protected requestTone(status: MemberRequestStatus): CnpmBadgeTone {
    return REQUEST_TONES[status];
  }

  protected setExercise(year: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { exercice: year },
      queryParamsHandling: 'merge',
    });
  }

  /** Relance le chargement après une panne, sans recharger la page ni perdre l'URL. */
  protected retry(): void {
    this.load();
  }

  /**
   * Les parcours de paiement et de téléchargement ne sont pas raccordés à cet
   * environnement de démonstration. L'action l'annonce explicitement plutôt que de
   * rester silencieuse : un bouton qui ne répond rien passe pour un défaut, et un
   * bouton qui simulerait un paiement serait un mensonge.
   */
  protected announceUnavailable(what: string): void {
    this.toasts.info(`Démonstration : ${what} n’est pas raccordé à cet environnement.`);
  }

  private tableState(count: number, filtered: boolean): DataTableState {
    const state = this.state();
    if (state === 'loading') {
      return 'loading';
    }
    if (state === 'forbidden') {
      return 'forbidden';
    }
    if (state === 'error') {
      return 'error';
    }
    if (count > 0) {
      return 'ready';
    }
    // Une collection réellement vide et un exercice sans ligne appellent des gestes
    // opposés — patienter, ou changer d'exercice. Les confondre mène à une impasse.
    return filtered ? 'noResult' : 'empty';
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
        // Un refus de droit n'est pas une panne : il ne se réessaie pas.
        error: (error: unknown) => {
          this.state.set(error instanceof MemberHomeAccessError ? 'forbidden' : 'error');
        },
      });
  }
}
