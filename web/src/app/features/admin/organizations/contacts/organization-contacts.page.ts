import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { CNPM_DATA_MODE } from '../../../../core/api/api.config';
import { AlertComponent } from '../../../../design-system/alert/alert.component';
import {
  BadgeComponent,
  type CnpmBadgeTone,
} from '../../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../../layout/admin-shell/admin-shell.component';
import { DemoOrganizationContactsGateway } from './demo-organization-contacts.gateway';
import {
  ORGANIZATION_CONTACTS_GATEWAY,
  OrganizationContactsAccessError,
  UNAVAILABLE_ORGANIZATION_CONTACTS_GATEWAY,
  type OrganizationContact,
  type OrganizationContactRole,
} from './organization-contacts.gateway';

type ContactStateFilter = 'ACTIVE' | 'INACTIVE' | '';

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr')
    .trim();
}

@Component({
  selector: 'cnpm-organization-contacts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  providers: [
    DemoOrganizationContactsGateway,
    {
      provide: ORGANIZATION_CONTACTS_GATEWAY,
      useFactory: () =>
        inject(CNPM_DATA_MODE) === 'demo'
          ? inject(DemoOrganizationContactsGateway)
          : UNAVAILABLE_ORGANIZATION_CONTACTS_GATEWAY,
    },
  ],
  templateUrl: './organization-contacts.page.html',
  styleUrl: './organization-contacts.page.scss',
})
export class OrganizationContactsPage {
  private readonly gateway = inject(ORGANIZATION_CONTACTS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly organizationId = computed(() => this.params().get('id') ?? '');
  protected readonly search = computed(() => (this.query().get('q') ?? '').slice(0, 80));
  protected readonly role = computed<OrganizationContactRole | ''>(() => {
    const value = this.query().get('role');
    return value === 'DIRECTION' ||
      value === 'FINANCE' ||
      value === 'ADMINISTRATION' ||
      value === 'TECHNIQUE'
      ? value
      : '';
  });
  protected readonly status = computed<ContactStateFilter>(() => {
    const value = this.query().get('statut');
    return value === 'ACTIVE' || value === 'INACTIVE' ? value : '';
  });

  protected readonly filters = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    role: new FormControl<OrganizationContactRole | ''>('', { nonNullable: true }),
    status: new FormControl<ContactStateFilter>('', { nonNullable: true }),
  });

  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({
    id: this.organizationId(),
    tick: this.retryTick(),
  }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.load(id).pipe(
          map((view) => ({ kind: 'ready' as const, view })),
          catchError((error: unknown) =>
            of(
              error instanceof OrganizationContactsAccessError
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

  protected readonly state = computed(() => this.result().kind);
  protected readonly view = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.view : null;
  });
  protected readonly contacts = computed(() => {
    const term = fold(this.search());
    return (this.view()?.contacts ?? []).filter((contact) => {
      const searchable = fold(`${contact.displayName} ${contact.functionLabel} ${contact.email}`);
      const matchesStatus =
        !this.status() || (this.status() === 'ACTIVE' ? contact.active : !contact.active);
      return (
        (!term || searchable.includes(term)) &&
        (!this.role() || contact.role === this.role()) &&
        matchesStatus
      );
    });
  });
  protected readonly activeCount = computed(
    () => this.view()?.contacts.filter((contact) => contact.active).length ?? 0,
  );
  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.role() || this.status()),
  );

  constructor() {
    effect(() => {
      this.filters.setValue(
        { q: this.search(), role: this.role(), status: this.status() },
        { emitEvent: false },
      );
    });
  }

  protected applyFilters(): void {
    const value = this.filters.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: value.q.trim().slice(0, 80) || null,
        role: value.role || null,
        statut: value.status || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected resetFilters(): void {
    this.filters.reset({ q: '', role: '', status: '' });
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, role: null, statut: null },
      queryParamsHandling: 'merge',
    });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected roleLabel(role: OrganizationContactRole): string {
    return {
      DIRECTION: 'Direction',
      FINANCE: 'Finance',
      ADMINISTRATION: 'Administration',
      TECHNIQUE: 'Technique',
    }[role];
  }

  protected statusTone(contact: OrganizationContact): CnpmBadgeTone {
    return contact.active ? 'success' : 'neutral';
  }
}
