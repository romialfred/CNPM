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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideBanknote,
  LucideBell,
  LucideFileText,
  LucidePencil,
  LucideReceiptText,
  LucideRefreshCw,
  LucideUsers,
} from '@lucide/angular';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import {
  DefinitionListComponent,
  type CnpmDefinition,
} from '../../../design-system/definition-list/definition-list.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  ORGANIZATIONS_GATEWAY,
  OrganizationAccessError,
  OrganizationNotFoundError,
} from './organizations-gateway';
import {
  buildOrganizationProfile,
  type ActivityKind,
  type OrganizationProfile,
} from './organization-profile';

/** BO-006 — fiche entreprise enrichie et « vivante » (activités, chiffres clés). */
@Component({
  selector: 'cnpm-organization-detail-page',
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
    LucideBanknote,
    LucideBell,
    LucideFileText,
    LucidePencil,
    LucideReceiptText,
    LucideRefreshCw,
    LucideUsers,
  ],
  templateUrl: './organization-detail.page.html',
  styleUrl: './organization-detail.page.scss',
})
export class OrganizationDetailPage {
  private readonly gateway = inject(ORGANIZATIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  protected readonly iconSize = CNPM_ICON_SIZE;
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly organizationId = computed(() => this.params().get('id') ?? '');
  protected readonly listQueryParams = computed<Record<string, string>>(() => {
    const query = this.queryParams();
    return Object.fromEntries(query.keys.map((key) => [key, query.get(key) ?? '']));
  });

  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({
    id: this.organizationId(),
    tick: this.retryTick(),
  }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.get(id).pipe(
          map((organization) => ({ kind: 'ready' as const, organization })),
          catchError((error: unknown) => {
            if (error instanceof OrganizationAccessError) return of({ kind: 'forbidden' as const });
            if (error instanceof OrganizationNotFoundError)
              return of({ kind: 'notFound' as const });
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed(() => this.result().kind);
  protected readonly organization = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.organization : null;
  });
  protected readonly pageTitle = computed(
    () => this.organization()?.legalName ?? 'Fiche entreprise',
  );
  protected readonly facts = computed<readonly CnpmDefinition[]>(() => {
    const organization = this.organization();
    if (!organization) return [];
    return [
      { label: 'Raison sociale', value: organization.legalName },
      { label: 'Nom commercial', value: organization.tradeName ?? 'Non renseigné' },
      { label: 'Type d’entreprise', value: organization.organizationType },
      { label: 'Secteur d’activité', value: this.sectorLabel(organization.sectorCode) },
    ];
  });

  /** Année civile courante, pour l'ancienneté et le fil d'activité du profil. */
  private readonly currentYear = new Date().getFullYear();

  /**
   * Profil enrichi (chiffres clés, activités) — DÉTERMINISTE et illustratif. La bannière de
   * la page indique clairement qu'il s'agit de données de démonstration, jamais de faits
   * officiels du registre.
   */
  protected readonly profile = computed<OrganizationProfile | null>(() => {
    const organization = this.organization();
    return organization ? buildOrganizationProfile(organization, this.currentYear) : null;
  });

  private readonly SECTOR_LABELS: Readonly<Record<string, string>> = {
    AGRICULTURE: 'Agriculture',
    BTP: 'BTP & Génie civil',
    COMMERCE: 'Commerce',
    ENERGIE: 'Énergie',
    FINANCE: 'Finance',
    INDUSTRIE: 'Industrie',
    MINES: 'Mines',
    SANTE: 'Santé',
    SERVICES: 'Services',
    TELECOM: 'Télécommunications',
    TRANSPORT: 'Transport & Logistique',
    TOURISME: 'Tourisme & Hôtellerie',
  };

  protected sectorLabel(code: string | null): string {
    if (!code) {
      return 'Non renseigné';
    }
    return this.SECTOR_LABELS[code.toUpperCase()] ?? code;
  }

  /** Initiale de l'entreprise pour l'avatar, à défaut de logo. */
  protected initial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  /** Date d'activité formatée fr-ML ; à défaut, la valeur brute. */
  protected activityDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return new Intl.DateTimeFormat('fr-ML', { dateStyle: 'long' }).format(date);
  }

  /** Classe de couleur de la pastille d'activité, selon la nature. */
  protected activityToneClass(kind: ActivityKind): string {
    return `cnpm-organization-detail__dot--${kind}`;
  }

  constructor() {
    effect(() => {
      const organization = this.organization();
      this.title.setTitle(
        organization
          ? `${organization.legalName} — Entreprise — Administration CNPM`
          : 'Fiche entreprise — Administration CNPM',
      );
    });
  }

  protected statusLabel(value: string): string {
    return (
      { ACTIVE: 'Active', DORMANT: 'Dormante', PROSPECT: 'Prospect' }[value] ??
      value.replaceAll('_', ' ')
    );
  }

  protected statusTone(value: string): CnpmBadgeTone {
    return value === 'ACTIVE'
      ? 'success'
      : value === 'DORMANT'
        ? 'warning'
        : value === 'PROSPECT'
          ? 'info'
          : 'neutral';
  }

  protected riskLabel(value: string): string {
    return value === 'NORMAL' ? 'Normal' : value.replaceAll('_', ' ');
  }

  protected riskTone(value: string): CnpmBadgeTone {
    return value === 'NORMAL' ? 'success' : 'neutral';
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected edit(): void {
    void this.router.navigate(['/admin/organizations', this.organizationId(), 'edit'], {
      queryParams: this.listQueryParams(),
    });
  }
}
