import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  LOCALE_ID,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink, type Params } from '@angular/router';
import { LucideMail, LucidePencil, LucidePhone, LucidePrinter } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
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
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TabsComponent, type CnpmTab } from '../../../design-system/tabs/tabs.component';
import {
  VerificationBadgeComponent,
  type CnpmVerificationStatus,
} from '../../../design-system/verification-badge/verification-badge.component';
import { MemberCategoryLabelPipe } from '../../../core/formatting/member-category-label.pipe';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  MEMBER_DETAIL_GATEWAY,
  MemberDetailAccessError,
  MemberDetailNotFoundError,
  type ActionPriority,
  type ContributionLine,
  type ContributionStatus,
  type DocumentStatus,
  type HistoryEntry,
  type MemberDocument,
  type MemberStatus,
  type PaymentChannel,
  type PaymentLine,
  type PaymentStatus,
  type RiskLevel,
} from './member-detail-gateway';

/** Onglets de la fiche. L'identifiant voyage dans l'URL : chaque onglet est adressable. */
type MemberTab = 'synthese' | 'adhesion' | 'cotisations' | 'paiements' | 'documents' | 'historique';

const TABS: readonly CnpmTab[] = [
  { id: 'synthese', label: 'Vue d’ensemble' },
  { id: 'adhesion', label: 'Adhésion' },
  { id: 'cotisations', label: 'Cotisations' },
  { id: 'paiements', label: 'Paiements' },
  { id: 'documents', label: 'Documents' },
  { id: 'historique', label: 'Historique' },
];

const TAB_IDS: readonly string[] = TABS.map((tab) => tab.id);
const DEFAULT_TAB: MemberTab = 'synthese';

/** L'historique est paginé : la fiche l'impose, et il croît sans limite. */
const HISTORY_PAGE_SIZE = 5;

const MEMBER_STATUS_LABELS: Readonly<Record<MemberStatus, string>> = {
  ACTIVE: 'Membre actif',
  DORMANT: 'Membre dormant',
  PROSPECT: 'Prospect',
};

const MEMBER_STATUS_TONES: Readonly<Record<MemberStatus, CnpmBadgeTone>> = {
  ACTIVE: 'success',
  DORMANT: 'warning',
  PROSPECT: 'info',
};

const CONTRIBUTION_STATUS_LABELS: Readonly<Record<ContributionStatus, string>> = {
  PAID: 'Réglée',
  PARTIAL: 'Partiellement réglée',
  OVERDUE: 'Échue',
  UPCOMING: 'À venir',
};

const CONTRIBUTION_STATUS_TONES: Readonly<Record<ContributionStatus, CnpmBadgeTone>> = {
  PAID: 'success',
  PARTIAL: 'warning',
  OVERDUE: 'error',
  UPCOMING: 'neutral',
};

const PAYMENT_STATUS_LABELS: Readonly<Record<PaymentStatus, string>> = {
  MATCHED: 'Rapproché',
  PENDING: 'En attente de rapprochement',
  UNMATCHED: 'Non rapproché',
};

const PAYMENT_STATUS_TONES: Readonly<Record<PaymentStatus, CnpmBadgeTone>> = {
  MATCHED: 'success',
  PENDING: 'info',
  UNMATCHED: 'warning',
};

const CHANNEL_LABELS: Readonly<Record<PaymentChannel, string>> = {
  BANK_TRANSFER: 'Virement bancaire',
  MOBILE_MONEY: 'Mobile money',
  CASH: 'Espèces',
  CHEQUE: 'Chèque',
};

const DOCUMENT_STATUS_LABELS: Readonly<Record<DocumentStatus, string>> = {
  VALID: 'Valide',
  EXPIRING: 'À renouveler',
  MISSING: 'Manquant',
};

const DOCUMENT_STATUS_TONES: Readonly<Record<DocumentStatus, CnpmBadgeTone>> = {
  VALID: 'success',
  EXPIRING: 'warning',
  MISSING: 'error',
};

const RISK_LEVEL_LABELS: Readonly<Record<RiskLevel, string>> = {
  LOW: 'Risque faible',
  MEDIUM: 'Risque moyen',
  HIGH: 'Risque élevé',
};

const RISK_LEVEL_TONES: Readonly<Record<RiskLevel, CnpmBadgeTone>> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
};

const PRIORITY_LABELS: Readonly<Record<ActionPriority, string>> = {
  HIGH: 'Priorité haute',
  MEDIUM: 'Priorité moyenne',
  LOW: 'Priorité basse',
};

const PRIORITY_TONES: Readonly<Record<ActionPriority, CnpmBadgeTone>> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

const VERIFICATION_LABELS: Readonly<Record<CnpmVerificationStatus, string>> = {
  VERIFIED: 'Membre vérifié par le CNPM',
  PENDING: 'Vérification en cours',
  EXPIRED: 'Vérification expirée',
  SUSPENDED: 'Membre suspendu',
};

const VERIFICATION_TONES: Readonly<Record<CnpmVerificationStatus, CnpmBadgeTone>> = {
  VERIFIED: 'success',
  PENDING: 'info',
  EXPIRED: 'warning',
  SUSPENDED: 'error',
};

/** Marque explicitement une donnée absente, jamais confondue avec une valeur vide. */
const MISSING = 'Non renseigné';

/**
 * Grande famille d'activité de la vitrine. La source ne transmet qu'un `sector` libre
 * (« Bâtiment et travaux publics », « Services aux entreprises »…) ; la fiche le classe
 * dans une de ces familles pour choisir une illustration et des activités cohérentes.
 */
type SectorKey =
  | 'BTP'
  | 'AGRICULTURE'
  | 'MINES'
  | 'FINANCE'
  | 'COMMERCE'
  | 'ENERGIE'
  | 'INDUSTRIE'
  | 'TRANSPORT'
  | 'TELECOM'
  | 'SANTE'
  | 'TOURISME'
  | 'SERVICES'
  | 'DEFAULT';

/** Une tuile « Activités principales » : un intitulé et une courte description. */
interface SectorActivity {
  readonly title: string;
  readonly description: string;
}

interface SectorProfile {
  /** Mots-clés loremflickr de l'illustration topique du secteur. */
  readonly imageKeywords: string;
  /** Accroche courte affichée dans le héros, propre au secteur. */
  readonly tagline: string;
  /** Trois à six activités générées selon le secteur, rendues en tuiles. */
  readonly activities: readonly SectorActivity[];
}

/** Enlève diacritiques et casse pour un classement robuste du libellé de secteur. */
function normalizeSectorText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Jetons de reconnaissance par famille, du plus spécifique au plus générique :
 * « Services » ne doit capter que ce qu'aucune famille précise n'a déjà reconnu.
 * Le libellé de secteur ET le groupement sont fouillés, l'un complétant l'autre.
 */
const SECTOR_MATCHERS: readonly (readonly [SectorKey, readonly string[]])[] = [
  ['BTP', ['btp', 'batiment', 'travaux publics', 'construction', 'infrastructure', 'immobilier', 'genie civil']],
  ['AGRICULTURE', ['agricultur', 'agro', 'ferme', 'elevage', 'peche', 'agroalimentaire']],
  ['MINES', ['mine', 'minier', 'extractif', 'carriere', 'aurifere', 'orpaillage']],
  ['FINANCE', ['financ', 'banque', 'assurance', 'microfinance', 'credit', 'monetique']],
  ['ENERGIE', ['energie', 'energ', 'solaire', 'electric', 'petrol', 'hydrocarbure', 'renouvelable']],
  ['TRANSPORT', ['transport', 'logistique', 'fret', 'mobilite', 'acheminement']],
  ['TELECOM', ['telecom', 'reseau', 'numerique', 'digital', 'informatique', 'internet', 'ntic']],
  ['SANTE', ['sante', 'pharma', 'medical', 'clinique', 'hopital']],
  ['TOURISME', ['tourisme', 'hotel', 'hospitalit', 'restaur', 'voyage', 'loisir']],
  ['COMMERCE', ['commerce', 'distribution', 'negoce', 'detail', 'import', 'export']],
  ['INDUSTRIE', ['industrie', 'manufactur', 'usine', 'transformation', 'fabrication']],
  ['SERVICES', ['service', 'conseil', 'consulting', 'prestation']],
];

const SECTOR_PROFILES: Readonly<Record<SectorKey, SectorProfile>> = {
  BTP: {
    imageKeywords: 'construction,building',
    tagline: 'Construire les infrastructures qui font avancer le Mali.',
    activities: [
      { title: 'Gros œuvre et structures', description: 'Fondations, ossatures et bâtiments livrés clés en main.' },
      { title: 'Voirie et réseaux divers', description: 'Routes, assainissement et réseaux enterrés.' },
      { title: 'Génie civil', description: 'Ouvrages d’art, ponts et infrastructures publiques.' },
      { title: 'Réhabilitation', description: 'Rénovation et mise aux normes du bâti existant.' },
    ],
  },
  AGRICULTURE: {
    imageKeywords: 'agriculture,farm',
    tagline: 'Nourrir le pays et valoriser les filières agricoles.',
    activities: [
      { title: 'Production végétale', description: 'Cultures vivrières et cultures de rente.' },
      { title: 'Élevage', description: 'Filières bovine, avicole et laitière.' },
      { title: 'Agro-transformation', description: 'Conditionnement et valorisation des récoltes.' },
      { title: 'Intrants et semences', description: 'Approvisionnement et appui aux exploitations.' },
    ],
  },
  MINES: {
    imageKeywords: 'mining',
    tagline: 'Valoriser les ressources minières de façon responsable.',
    activities: [
      { title: 'Exploration', description: 'Prospection et évaluation des gisements.' },
      { title: 'Extraction', description: 'Exploitation minière et traitement du minerai.' },
      { title: 'Logistique minière', description: 'Transport et stockage de la production.' },
      { title: 'Réhabilitation des sites', description: 'Remise en état et suivi environnemental.' },
    ],
  },
  FINANCE: {
    imageKeywords: 'bank,office',
    tagline: 'Financer la croissance des entreprises maliennes.',
    activities: [
      { title: 'Financement', description: 'Crédits et lignes de trésorerie aux entreprises.' },
      { title: 'Moyens de paiement', description: 'Comptes, cartes et transferts.' },
      { title: 'Assurance', description: 'Couverture des risques professionnels.' },
      { title: 'Conseil financier', description: 'Structuration et gestion d’actifs.' },
    ],
  },
  COMMERCE: {
    imageKeywords: 'retail,store',
    tagline: 'Distribuer et approvisionner les marchés du pays.',
    activities: [
      { title: 'Distribution de gros', description: 'Approvisionnement du réseau de revendeurs.' },
      { title: 'Vente au détail', description: 'Réseau de points de vente de proximité.' },
      { title: 'Import-export', description: 'Sourcing et négoce à l’international.' },
      { title: 'Logistique commerciale', description: 'Entreposage et livraison des commandes.' },
    ],
  },
  ENERGIE: {
    imageKeywords: 'solar,energy',
    tagline: 'Produire une énergie fiable et durable.',
    activities: [
      { title: 'Production d’énergie', description: 'Solaire, thermique et hydroélectrique.' },
      { title: 'Distribution', description: 'Raccordement et fourniture aux clients.' },
      { title: 'Solutions solaires', description: 'Installations photovoltaïques sur mesure.' },
      { title: 'Maintenance', description: 'Exploitation des installations énergétiques.' },
    ],
  },
  INDUSTRIE: {
    imageKeywords: 'factory,industry',
    tagline: 'Transformer localement pour créer de la valeur.',
    activities: [
      { title: 'Fabrication', description: 'Lignes de production et assemblage.' },
      { title: 'Transformation', description: 'Valorisation des matières premières.' },
      { title: 'Contrôle qualité', description: 'Normes et certification des produits.' },
      { title: 'Maintenance industrielle', description: 'Fiabilité de l’outil de production.' },
    ],
  },
  TRANSPORT: {
    imageKeywords: 'logistics,truck',
    tagline: 'Relier les territoires et fluidifier les échanges.',
    activities: [
      { title: 'Transport de marchandises', description: 'Fret routier et messagerie.' },
      { title: 'Logistique et entreposage', description: 'Stockage et gestion des flux.' },
      { title: 'Affrètement', description: 'Organisation des acheminements.' },
      { title: 'Dernier kilomètre', description: 'Livraison finale aux destinataires.' },
    ],
  },
  TELECOM: {
    imageKeywords: 'telecom,network',
    tagline: 'Connecter les entreprises à l’économie numérique.',
    activities: [
      { title: 'Réseaux et connectivité', description: 'Déploiement et exploitation des liens.' },
      { title: 'Services numériques', description: 'Solutions logicielles et cloud.' },
      { title: 'Infrastructure', description: 'Centres de données et équipements réseau.' },
      { title: 'Support et intégration', description: 'Accompagnement technique des clients.' },
    ],
  },
  SANTE: {
    imageKeywords: 'pharmacy,health',
    tagline: 'Rendre les soins et les produits de santé accessibles.',
    activities: [
      { title: 'Distribution pharmaceutique', description: 'Approvisionnement en médicaments.' },
      { title: 'Équipements médicaux', description: 'Matériel et dispositifs de soin.' },
      { title: 'Services de soin', description: 'Offre clinique et diagnostic.' },
      { title: 'Prévention', description: 'Programmes de santé et sensibilisation.' },
    ],
  },
  TOURISME: {
    imageKeywords: 'hotel,tourism',
    tagline: 'Faire rayonner l’accueil et le patrimoine malien.',
    activities: [
      { title: 'Hébergement', description: 'Hôtellerie et résidences.' },
      { title: 'Restauration', description: 'Services de bouche et événementiel.' },
      { title: 'Voyages et séjours', description: 'Organisation de circuits.' },
      { title: 'Accueil et animation', description: 'Expérience client et loisirs.' },
    ],
  },
  SERVICES: {
    imageKeywords: 'office,business',
    tagline: 'Accompagner les organisations dans leur activité quotidienne.',
    activities: [
      { title: 'Conseil aux entreprises', description: 'Accompagnement stratégique et opérationnel.' },
      { title: 'Services support', description: 'Externalisation de fonctions clés.' },
      { title: 'Solutions sur mesure', description: 'Prestations adaptées au besoin.' },
      { title: 'Formation', description: 'Montée en compétences des équipes.' },
    ],
  },
  DEFAULT: {
    imageKeywords: 'business,office',
    tagline: 'Un membre engagé au sein du patronat malien.',
    activities: [
      { title: 'Cœur de métier', description: 'Activité principale de l’organisation.' },
      { title: 'Services aux clients', description: 'Offre commerciale et relation client.' },
      { title: 'Partenariats', description: 'Réseau de fournisseurs et de clients.' },
      { title: 'Développement', description: 'Croissance et ouverture de nouveaux marchés.' },
    ],
  },
};

/** Une mesure du bandeau de profil : un intitulé, sa valeur, et l'absence signalée. */
interface ShowcaseFact {
  readonly label: string;
  readonly value: string;
  readonly muted?: boolean;
}

/**
 * BO-003 — fiche membre 360°.
 *
 * L'onglet actif et la page d'historique vivent dans l'URL : la fiche exige que
 * « chaque tab possède une URL », et c'est ce qui rend un onglet précis partageable et
 * restaurable au rechargement.
 *
 * L'écran ne calcule aucun agrégat financier : tout vient de la source, comme pour
 * BO-002. Un second calcul ici pourrait afficher un reste dû que la liste des membres
 * contredirait.
 *
 * Aucune écriture n'est offerte sur une transaction : la fiche impose que les actions
 * financières renvoient vers les écrans spécialisés.
 *
 * L'en-tête d'identité (`MemberIdentityHeader` de la fiche) est composé localement :
 * le design system ne le fournit pas encore, et `cnpm-page-header` ne sait pas porter
 * badges et métadonnées d'identité. Il reste à promouvoir dans le catalogue.
 */
@Component({
  selector: 'cnpm-member-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    DefinitionListComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    InsightSummaryComponent,
    PaginationComponent,
    SkeletonComponent,
    TabsComponent,
    VerificationBadgeComponent,
    MemberCategoryLabelPipe,
    LucideMail,
    LucidePencil,
    LucidePhone,
    LucidePrinter,
  ],
  templateUrl: './member-detail.page.html',
  styleUrls: ['./member-detail.page.scss', './member-detail.chart.scss'],
})
export class MemberDetailPage {
  private readonly gateway = inject(MEMBER_DETAIL_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private readonly pageTitle = inject(Title);

  protected readonly iconSize = CNPM_ICON_SIZE;

  /**
   * Hauteur d'une barre, en pourcentage du plus grand montant appelé de la série.
   *
   * L'échelle se cale sur le montant APPELÉ et non sur le maximum général : le réglé ne
   * dépasse jamais l'appelé, et prendre le maximum des deux ferait varier l'échelle d'un
   * membre à l'autre sans que la lecture y gagne. Un dénominateur nul rend zéro plutôt
   * qu'une division impossible.
   */
  protected chartShare(value: number, lines: readonly { expected: number }[]): number {
    const plafond = Math.max(...lines.map((line) => line.expected), 0);
    return plafond > 0 ? Math.round((value / plafond) * 100) : 0;
  }
  protected readonly tabs = TABS;
  protected readonly missingLabel = MISSING;
  protected readonly historyPageSize = HISTORY_PAGE_SIZE;
  /** Référence stable : un littéral dans le gabarit changerait d'identité à chaque cycle. */
  protected readonly historyPageSizes: readonly number[] = [HISTORY_PAGE_SIZE];

  /**
   * Explication du badge de vérification.
   *
   * Elle décrit ce qui a été constaté, sans énoncer de critère : la portée et la durée
   * de validité du badge relèvent d'UX-DEC-004, non tranchée. Un écran ne doit pas
   * inventer la règle qu'il affiche.
   */
  protected readonly verificationExplanation =
    'Le CNPM a constaté l’existence du membre et l’état de son dossier d’adhésion. Les critères détaillés et la durée de validité du badge restent à arrêter.';

  /**
   * Humanise le code de catégorie hors gabarit, là où la valeur alimente un composant
   * qui n'attend qu'une chaîne (la liste de définitions). Le même libellé que le pipe
   * du gabarit produit ainsi « Grande Entreprise » partout, code ou libellé en entrée.
   */
  private readonly categoryLabel = new MemberCategoryLabelPipe();

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly memberId = computed(() => this.params().get('id') ?? '');

  protected readonly activeTab = computed<MemberTab>(() => {
    const value = this.queryParams().get('onglet');
    return value && TAB_IDS.includes(value) ? (value as MemberTab) : DEFAULT_TAB;
  });

  /**
   * Contexte de BO-002 à restituer lors d'un retour explicite à la liste.
   * `onglet` et `hpage` appartiennent uniquement à BO-003 ; les propager vers la liste
   * laisserait des paramètres sans sens dans une URL partageable.
   */
  protected readonly listQueryParams = computed<Params>(() => {
    const query = this.queryParams();
    return Object.fromEntries(
      query.keys
        .filter((key) => key !== 'onglet' && key !== 'hpage')
        .map((key) => {
          const values = query.getAll(key);
          return [key, values.length > 1 ? values : (values[0] ?? '')];
        }),
    );
  });

  /**
   * Page d'historique demandée, bornée au nombre de pages réellement disponibles.
   * Sans ce plafond, une URL portant `hpage=99` afficherait un tableau vide sur un
   * historique pourtant fourni — un cas où l'écran paraîtrait en panne sans l'être.
   */
  protected readonly historyPage = computed(() => {
    const value = Number(this.queryParams().get('hpage'));
    const requested = Number.isInteger(value) && value > 0 ? value : 1;
    const total = this.detail()?.history.length ?? 0;
    const pages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));
    return Math.min(requested, pages);
  });

  /** Relance manuelle après une panne : ré-émet la requête sans recharger la page. */
  private readonly retryTick = signal(0);

  private readonly fetchTrigger = computed(() => ({
    id: this.memberId(),
    tick: this.retryTick(),
  }));

  /**
   * `switchMap` abandonne la requête précédente dès que l'identifiant change : sans
   * lui, une réponse lente sur un membre déjà quitté écraserait la fiche affichée.
   *
   * Trois échecs sont distingués parce qu'ils appellent trois gestes différents :
   * un refus de droit ne se réessaie pas, un identifiant inconnu appelle un retour à
   * la liste, une panne appelle une nouvelle tentative.
   */
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.load(id).pipe(
          map((detail) => ({ kind: 'ready' as const, detail })),
          catchError((error: unknown) => {
            if (error instanceof MemberDetailAccessError) {
              return of({ kind: 'forbidden' as const });
            }
            if (error instanceof MemberDetailNotFoundError) {
              return of({ kind: 'notFound' as const });
            }
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed(() => this.result().kind);

  protected readonly detail = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.detail : null;
  });

  constructor() {
    // Le titre du document suit le membre affiché : sur une route paramétrée, un titre
    // figé laisserait toutes les fiches indiscernables dans l'historique, les favoris
    // et les onglets — et pour un lecteur d'écran, à l'annonce de la page.
    effect(() => {
      const detail = this.detail();
      this.pageTitle.setTitle(
        detail
          ? `${detail.identity.organization} — Fiche membre — Administration CNPM`
          : 'Fiche membre — Administration CNPM',
      );
    });
  }

  // — Vitrine : secteur, illustration et activités ——————————————————————

  /** Famille d'activité déduite du secteur (et du groupement) de la source. */
  protected readonly sectorKey = computed<SectorKey>(() => {
    const identity = this.detail()?.identity;
    if (!identity) {
      return 'DEFAULT';
    }
    const haystack = `${normalizeSectorText(identity.sector)} ${normalizeSectorText(identity.group)}`;
    for (const [key, tokens] of SECTOR_MATCHERS) {
      if (tokens.some((token) => haystack.includes(token))) {
        return key;
      }
    }
    return 'DEFAULT';
  });

  protected readonly sectorProfile = computed<SectorProfile>(
    () => SECTOR_PROFILES[this.sectorKey()],
  );

  protected readonly sectorTagline = computed(() => this.sectorProfile().tagline);

  protected readonly sectorActivities = computed<readonly SectorActivity[]>(
    () => this.sectorProfile().activities,
  );

  /**
   * Illustration du héros, photo réelle et topique servie par loremflickr. Le paramètre
   * `lock`, dérivé du code membre, rend l'image déterministe (une fiche montre toujours
   * la même) tout en la différenciant d'un membre à l'autre. Décorative : `alt=""`.
   */
  protected readonly heroImage = computed(() => {
    const identity = this.detail()?.identity;
    if (!identity) {
      return '';
    }
    const lock = (this.hashCode(identity.code) % 1000) + 1;
    return `https://loremflickr.com/1280/420/${this.sectorProfile().imageKeywords}?lock=${lock}`;
  });

  /** Hachage stable et positif d'un code membre, pour un `lock` d'image reproductible. */
  private hashCode(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
  }

  /** Libellé et teinte du badge de vérification affiché dans le héros. */
  protected verificationLabel(status: CnpmVerificationStatus): string {
    return VERIFICATION_LABELS[status];
  }

  protected verificationTone(status: CnpmVerificationStatus): CnpmBadgeTone {
    return VERIFICATION_TONES[status];
  }

  /**
   * Bandeau de profil : secteur, localisation, effectif, adhésion, statut et ancienneté
   * d'appartenance. Chiffres et libellés viennent tels quels de la source ; rien n'est
   * recalculé. Une valeur absente est marquée pour ne pas se confondre avec un vide.
   */
  protected readonly showcaseFacts = computed<readonly ShowcaseFact[]>(() => {
    const detail = this.detail();
    if (!detail) {
      return [];
    }
    const { identity, profile } = detail;
    return [
      { label: 'Secteur', value: identity.sector },
      { label: 'Localisation', value: identity.region },
      profile.employeeRange
        ? { label: 'Effectif', value: profile.employeeRange }
        : { label: 'Effectif', value: MISSING, muted: true },
      { label: 'Date d’adhésion', value: this.formatDay(profile.joinedOn) },
      { label: 'Statut', value: MEMBER_STATUS_LABELS[identity.status] },
      { label: 'Membre CNPM', value: `Depuis ${profile.joinedOn.slice(0, 4)}` },
    ];
  });

  // — Informations générales et adhésion ————————————————————————————————

  protected readonly generalFacts = computed<readonly CnpmDefinition[]>(() => {
    const detail = this.detail();
    if (!detail) {
      return [];
    }
    const { identity, profile, permissions } = detail;
    const facts: CnpmDefinition[] = [
      { label: 'Forme juridique', value: identity.legalForm },
      { label: 'RCCM', value: profile.rccm ?? MISSING },
      { label: 'NIF', value: profile.nif ?? MISSING },
      { label: 'Adresse', value: identity.address },
      { label: 'Site web', value: profile.website ?? MISSING },
    ];
    // Les coordonnées sont masquées quand le rôle ne les autorise pas : la fiche
    // l'exige. Le backend reste seul juge — ce masquage n'est qu'un confort.
    if (permissions.canViewContacts) {
      const phone = profile.phone ?? MISSING;
      const email = profile.email ?? MISSING;
      facts.push({ label: 'Contacts', value: `${phone} · ${email}` });
    }
    return facts;
  });

  protected readonly membershipFacts = computed<readonly CnpmDefinition[]>(() => {
    const detail = this.detail();
    if (!detail) {
      return [];
    }
    const { identity, profile } = detail;
    return [
      { label: 'Code membre', value: identity.code },
      { label: 'Référence d’adhésion', value: profile.membershipReference },
      { label: 'Date d’adhésion', value: this.formatDay(profile.joinedOn) },
      {
        label: 'Ancienneté',
        value: `${profile.seniorityYears} an${profile.seniorityYears > 1 ? 's' : ''}`,
      },
      { label: 'Catégorie', value: this.categoryLabel.transform(identity.category) },
      { label: 'Groupement', value: identity.group },
      {
        label: 'Année de création',
        value: profile.foundedYear === null ? MISSING : String(profile.foundedYear),
      },
      { label: 'Statut d’adhésion', value: MEMBER_STATUS_LABELS[identity.status] },
    ];
  });

  // — Synthèse financière ————————————————————————————————————————————————

  protected readonly contributionStats = computed<readonly InsightStat[]>(() => {
    const summary = this.detail()?.summary;
    if (!summary) {
      return [];
    }
    return [
      { label: `Appelé ${summary.year}`, value: summary.expected },
      { label: 'Réglé', value: summary.paid },
      { label: 'Reste dû', value: summary.outstanding },
      {
        label: 'Taux de règlement',
        value: summary.settledShare,
        suffix: ' %',
        decimals: 1,
        apart: true,
      },
    ];
  });

  protected readonly followUpStats = computed<readonly InsightStat[]>(() => {
    const detail = this.detail();
    if (!detail) {
      return [];
    }
    return [
      { label: 'Périodes échues', value: detail.summary.overduePeriods },
      { label: 'Paiements enregistrés', value: detail.payments.length },
      { label: 'Reçus émis', value: detail.summary.receiptsIssued, apart: true },
    ];
  });

  // — Onglet historique ——————————————————————————————————————————————————

  protected readonly historyTotal = computed(() => this.detail()?.history.length ?? 0);

  /**
   * Découpage local d'un historique déjà transmis en entier avec la fiche. Quand le
   * backend paginera cette collection, la page passera la demande au port sans changer
   * de forme — l'URL porte déjà le numéro de page.
   */
  protected readonly historyRows = computed<readonly HistoryEntry[]>(() => {
    const history = this.detail()?.history ?? [];
    const start = (this.historyPage() - 1) * HISTORY_PAGE_SIZE;
    return history.slice(start, start + HISTORY_PAGE_SIZE);
  });

  // — Colonnes des tableaux ——————————————————————————————————————————————

  protected readonly contributionColumns: readonly DataTableColumn[] = [
    { key: 'period', label: 'Période' },
    { key: 'dueOn', label: 'Échéance' },
    { key: 'expected', label: 'Appelé', note: '(FCFA)', align: 'end' },
    { key: 'paid', label: 'Réglé', note: '(FCFA)', align: 'end' },
    { key: 'balance', label: 'Reste dû', note: '(FCFA)', align: 'end' },
    { key: 'status', label: 'Statut' },
  ];

  protected readonly paymentColumns: readonly DataTableColumn[] = [
    { key: 'reference', label: 'Référence' },
    { key: 'paidAt', label: 'Date du paiement' },
    { key: 'period', label: 'Période' },
    { key: 'amount', label: 'Montant', note: '(FCFA)', align: 'end' },
    { key: 'channel', label: 'Canal' },
    { key: 'receipt', label: 'Reçu' },
    { key: 'status', label: 'Rapprochement' },
  ];

  protected readonly documentColumns: readonly DataTableColumn[] = [
    { key: 'title', label: 'Document' },
    { key: 'kind', label: 'Type' },
    { key: 'issuedOn', label: 'Déposé le' },
    { key: 'expiresOn', label: 'Valable jusqu’au' },
    { key: 'sizeLabel', label: 'Poids' },
    { key: 'status', label: 'Statut' },
  ];

  protected readonly historyColumns: readonly DataTableColumn[] = [
    { key: 'at', label: 'Date' },
    { key: 'action', label: 'Événement' },
    { key: 'actor', label: 'Auteur' },
    { key: 'detail', label: 'Détail' },
  ];

  // Clés de ligne : sans elles, `@for` traquerait toutes les lignes sous la même clé.
  protected readonly contributionKey = (line: ContributionLine): string => line.period;
  protected readonly paymentKey = (line: PaymentLine): string => line.reference;
  protected readonly documentKey = (line: MemberDocument): string => line.id;
  protected readonly historyKey = (entry: HistoryEntry): string => entry.id;

  /** Une collection vide n'est pas une erreur : elle a son propre état, jamais un blanc. */
  protected tableState(count: number): DataTableState {
    return count > 0 ? 'ready' : 'empty';
  }

  // — Libellés ————————————————————————————————————————————————————————————

  protected memberStatusLabel(status: MemberStatus): string {
    return MEMBER_STATUS_LABELS[status];
  }

  protected memberStatusTone(status: MemberStatus): CnpmBadgeTone {
    return MEMBER_STATUS_TONES[status];
  }

  protected contributionStatusLabel(status: ContributionStatus): string {
    return CONTRIBUTION_STATUS_LABELS[status];
  }

  protected contributionStatusTone(status: ContributionStatus): CnpmBadgeTone {
    return CONTRIBUTION_STATUS_TONES[status];
  }

  protected paymentStatusLabel(status: PaymentStatus): string {
    return PAYMENT_STATUS_LABELS[status];
  }

  protected paymentStatusTone(status: PaymentStatus): CnpmBadgeTone {
    return PAYMENT_STATUS_TONES[status];
  }

  protected channelLabel(channel: PaymentChannel): string {
    return CHANNEL_LABELS[channel];
  }

  protected documentStatusLabel(status: DocumentStatus): string {
    return DOCUMENT_STATUS_LABELS[status];
  }

  protected documentStatusTone(status: DocumentStatus): CnpmBadgeTone {
    return DOCUMENT_STATUS_TONES[status];
  }

  protected riskLevelLabel(level: RiskLevel): string {
    return RISK_LEVEL_LABELS[level];
  }

  protected riskLevelTone(level: RiskLevel): CnpmBadgeTone {
    return RISK_LEVEL_TONES[level];
  }

  protected priorityLabel(priority: ActionPriority): string {
    return PRIORITY_LABELS[priority];
  }

  protected priorityTone(priority: ActionPriority): CnpmBadgeTone {
    return PRIORITY_TONES[priority];
  }

  /** Date longue `fr-ML` pour un texte suivi ; les tableaux gardent le format court. */
  protected formatDay(value: string): string {
    return formatDate(value, 'd MMMM y', this.locale);
  }

  // — Navigation ——————————————————————————————————————————————————————————

  protected onTabChange(tab: string): void {
    // La page d'historique repart à 1 : conserver « page 3 » en changeant d'onglet
    // renverrait, au retour, sur une position que plus rien n'explique.
    this.patch({ onglet: tab === DEFAULT_TAB ? null : tab, hpage: null });
  }

  protected onHistoryPageChange(page: number): void {
    this.patch({ hpage: page === 1 ? null : page });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected openMemberEdit(id: string): void {
    void this.router.navigate(['/admin/members', id, 'edit'], {
      queryParamsHandling: 'preserve',
    });
  }

  private patch(params: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
