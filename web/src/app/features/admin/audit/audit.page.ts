import { DecimalPipe } from '@angular/common';
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
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type { DataTableColumn } from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  AUDIT_GATEWAY,
  AuditAccessError,
  AuditAuthenticationError,
  type AuditEvent,
  type AuditEventQuery,
} from './audit-gateway';

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 25;
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-ML', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

/** Casse de phrase (« Compte créé ») à partir d'un fragment déjà espacé et en minuscules. */
function humanize(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : trimmed;
}

/** Libellés lisibles des actions d'audit connues. Les inconnues retombent sur `humanize`. */
const ACTION_LABELS: Readonly<Record<string, string>> = {
  'USER_ACCOUNT.CREATED': 'Compte créé',
  'USER_ACCOUNT.CREDENTIAL_TOKEN_ISSUED': 'Lien d’activation envoyé',
  'USER_ACCOUNT.PASSWORD_SET': 'Mot de passe défini',
  'USER_ACCOUNT.SUSPENDED': 'Compte suspendu',
  'USER_ACCOUNT.REACTIVATED': 'Compte réactivé',
  'USER_ACCOUNT.MFA_RESET': 'Second facteur réinitialisé',
  'USER_ACCOUNT.DELETED': 'Compte supprimé',
  'ROLE_PERMISSION.GRANTED': 'Permission accordée',
  'ROLE_PERMISSION.REVOKED': 'Permission retirée',
  'PROFESSIONAL_GROUP.CREATED': 'Groupement créé',
};

/** Nature des objets concernés, en clair. */
const OBJECT_LABELS: Readonly<Record<string, string>> = {
  'iam.user_account': 'Compte utilisateur',
  'iam.role_permission': 'Droit de rôle',
  'iam.role': 'Rôle',
  'member.professional_group': 'Groupement professionnel',
  'member.organization': 'Entreprise',
  'member.membership': 'Adhésion',
  'member.person': 'Personne',
};

/** Types d'acteur, en clair. */
const ACTOR_LABELS: Readonly<Record<string, string>> = {
  USER: 'Utilisateur',
  SYSTEM: 'Système',
  SERVICE: 'Service',
};

type AuditViewState = 'loading' | 'ready' | 'empty' | 'error' | 'authentication' | 'forbidden';

/**
 * BO-032 — journaux d'audit.
 *
 * Cette page est volontairement en lecture seule. Son périmètre s'arrête au contrat
 * `GET /audit-events?page&size` protégé par `PERM_AUDIT.READ` : aucun filtre temporel,
 * export, mécanisme d'alerte ou paramétrage de conservation n'est simulé dans la vue.
 */
@Component({
  selector: 'cnpm-audit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
  ],
  templateUrl: './audit.page.html',
  styleUrl: './audit.page.scss',
})
export class AuditPage {
  private readonly gateway = inject(AUDIT_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'createdAt', label: 'Horodatage' },
    { key: 'actor', label: 'Acteur' },
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Objet' },
  ];

  /** L'URL reste l'unique source de vérité de la pagination partageable. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly page = computed(() => {
    const value = Number(this.params().get('page'));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });

  protected readonly pageSize = computed(() => {
    const value = Number(this.params().get('size'));
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_PAGE_SIZE;
  });

  private readonly query = computed<AuditEventQuery>(() => ({
    page: this.page(),
    size: this.pageSize(),
  }));

  private readonly retryTick = signal(0);
  private readonly restoreResultsFocus = signal(false);
  private readonly journalTitle = viewChild<ElementRef<HTMLElement>>('journalTitle');
  private readonly fetchTrigger = computed(() => ({
    query: this.query(),
    retry: this.retryTick(),
  }));

  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.search(query).pipe(
          map((page) => ({ kind: 'ready' as const, page })),
          catchError((error: unknown) =>
            of(
              error instanceof AuditAuthenticationError
                ? { kind: 'authentication' as const }
                : error instanceof AuditAccessError
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

  protected readonly events = computed<readonly AuditEvent[]>(() => this.data()?.items ?? []);
  protected readonly totalItems = computed(() => this.data()?.totalElements ?? 0);
  protected readonly state = computed<AuditViewState>(() => {
    const result = this.result();
    if (result.kind === 'loading') return 'loading';
    if (result.kind === 'error') return 'error';
    if (result.kind === 'authentication') return 'authentication';
    if (result.kind === 'forbidden') return 'forbidden';
    return result.page.items.length > 0 ? 'ready' : 'empty';
  });

  protected readonly rowKey = (event: AuditEvent): string => event.id;

  constructor() {
    effect(() => {
      const result = this.result();
      if (result.kind !== 'ready') return;

      const lastPage = Math.max(1, result.page.totalPages);
      if (this.page() > lastPage) {
        this.patchUrl({ page: lastPage });
        return;
      }

      if (this.restoreResultsFocus()) {
        this.restoreResultsFocus.set(false);
        queueMicrotask(() => this.journalTitle()?.nativeElement.focus());
      }
    });
  }

  protected formatTimestamp(value: string): string {
    return `${DATE_FORMATTER.format(new Date(value))} UTC`;
  }

  /**
   * Traduit un code d'action technique en libellé lisible (français). Les codes connus
   * sont nommés explicitement ; tout code inconnu retombe sur une mise en forme générique
   * (dernier segment, underscores en espaces, casse de phrase) plutôt que le brut.
   */
  protected actionLabel(code: string): string {
    return (
      ACTION_LABELS[code] ??
      humanize((code.split('.').pop() ?? code).replace(/_/g, ' '))
    );
  }

  /** Nature de l'objet concerné, en clair (« Compte utilisateur » plutôt que iam.user_account). */
  protected objectLabel(entityType: string): string {
    return (
      OBJECT_LABELS[entityType] ??
      humanize((entityType.split('.').pop() ?? entityType).replace(/_/g, ' '))
    );
  }

  /** Type d'acteur en clair (« Utilisateur » plutôt que USER). */
  protected actorLabel(actorType: string): string {
    return ACTOR_LABELS[actorType] ?? humanize(actorType.replace(/_/g, ' '));
  }

  /** Identifiant technique raccourci pour l'affichage (les 8 premiers caractères). */
  protected shortId(id: string | null | undefined): string {
    return id ? id.slice(0, 8) : '';
  }

  protected onPageChange(page: number): void {
    this.restoreResultsFocus.set(true);
    this.patchUrl({ page });
  }

  protected onPageSizeChange(size: number): void {
    this.restoreResultsFocus.set(true);
    this.patchUrl({ page: 1, size });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private patchUrl(queryParams: Record<string, number>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
