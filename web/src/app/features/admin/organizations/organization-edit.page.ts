import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  FormBuilder,
  type ValidationErrors,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  ORGANIZATIONS_GATEWAY,
  OrganizationAccessError,
  OrganizationConflictError,
  OrganizationNotFoundError,
  OrganizationValidationError,
  type OrganizationUpdate,
} from './organizations-gateway';

type SaveFailure = 'conflict' | 'validation' | 'error' | null;

/** BO-004 — modification descriptive d'une entreprise sous verrou optimiste. */
@Component({
  selector: 'cnpm-organization-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ErrorStateComponent,
    InlineErrorSummaryComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './organization-edit.page.html',
  styleUrl: './organization-edit.page.scss',
})
export class OrganizationEditPage {
  private readonly gateway = inject(ORGANIZATIONS_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly title = inject(Title);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    legalName: ['', [trimmedRequired, Validators.maxLength(255)]],
    tradeName: ['', [Validators.maxLength(255)]],
    organizationType: ['', [trimmedRequired, Validators.maxLength(40)]],
    sectorCode: ['', [Validators.maxLength(80)]],
  });

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
  protected readonly pageTitle = computed(() =>
    this.organization() ? `Modifier ${this.organization()!.legalName}` : 'Modifier une entreprise',
  );
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveFailure = signal<SaveFailure>(null);
  protected readonly saveMessage = signal('');
  private hydratedKey = '';

  protected readonly formErrors = computed<readonly CnpmFieldError[]>(() => {
    if (!this.submitted()) return [];
    const errors: CnpmFieldError[] = [];
    if (this.form.controls.legalName.hasError('required')) {
      errors.push({
        fieldId: 'organization-legal-name',
        message: 'La raison sociale est obligatoire.',
      });
    } else if (this.form.controls.legalName.hasError('maxlength')) {
      errors.push({
        fieldId: 'organization-legal-name',
        message: 'La raison sociale ne peut pas dépasser 255 caractères.',
      });
    }
    if (this.form.controls.tradeName.hasError('maxlength')) {
      errors.push({
        fieldId: 'organization-trade-name',
        message: 'Le nom commercial ne peut pas dépasser 255 caractères.',
      });
    }
    if (this.form.controls.organizationType.hasError('required')) {
      errors.push({
        fieldId: 'organization-type-edit',
        message: 'Le type d’entreprise est obligatoire.',
      });
    } else if (this.form.controls.organizationType.hasError('maxlength')) {
      errors.push({
        fieldId: 'organization-type-edit',
        message: 'Le type d’entreprise ne peut pas dépasser 40 caractères.',
      });
    }
    if (this.form.controls.sectorCode.hasError('maxlength')) {
      errors.push({
        fieldId: 'organization-sector-edit',
        message: 'Le code secteur ne peut pas dépasser 80 caractères.',
      });
    }
    return errors;
  });

  constructor() {
    effect(() => {
      const organization = this.organization();
      if (!organization) return;
      const key = `${organization.id}:${organization.version}`;
      if (this.hydratedKey === key) return;
      this.hydratedKey = key;
      this.form.reset({
        legalName: organization.legalName,
        tradeName: organization.tradeName ?? '',
        organizationType: organization.organizationType,
        sectorCode: organization.sectorCode ?? '',
      });
      this.submitted.set(false);
      this.saveFailure.set(null);
    });

    effect(() => {
      const organization = this.organization();
      this.title.setTitle(
        organization
          ? `Modifier ${organization.legalName} — Administration CNPM`
          : 'Modifier une entreprise — Administration CNPM',
      );
    });
  }

  protected fieldError(control: keyof typeof this.form.controls): string | null {
    const field = this.form.controls[control];
    if (!field.invalid || (!field.touched && !this.submitted())) return null;
    if (field.hasError('required')) {
      return control === 'legalName'
        ? 'La raison sociale est obligatoire.'
        : 'Le type d’entreprise est obligatoire.';
    }
    const limits: Readonly<Record<keyof typeof this.form.controls, number>> = {
      legalName: 255,
      tradeName: 255,
      organizationType: 40,
      sectorCode: 80,
    };
    return `Maximum ${limits[control]} caractères.`;
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

  protected submit(): void {
    this.submitted.set(true);
    this.saveFailure.set(null);
    this.form.markAllAsTouched();
    const organization = this.organization();
    if (!organization || this.form.invalid || this.saving()) return;

    const raw = this.form.getRawValue();
    const changes: OrganizationUpdate = {
      legalName: raw.legalName.trim(),
      tradeName: raw.tradeName.trim(),
      organizationType: raw.organizationType.trim(),
      sectorCode: raw.sectorCode.trim(),
    };
    if (!changes.legalName || !changes.organizationType) {
      this.form.controls.legalName.updateValueAndValidity();
      this.form.controls.organizationType.updateValueAndValidity();
      return;
    }

    this.saving.set(true);
    this.gateway
      .update(organization.id, organization.version, changes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.toast.success('Les informations de l’entreprise ont été mises à jour.');
          void this.router.navigate(['/admin/organizations', updated.id], {
            queryParams: this.listQueryParams(),
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          if (error instanceof OrganizationConflictError) {
            this.saveFailure.set('conflict');
            this.saveMessage.set(error.message);
          } else if (error instanceof OrganizationValidationError) {
            this.saveFailure.set('validation');
            this.saveMessage.set(error.message);
          } else {
            this.saveFailure.set('error');
            this.saveMessage.set(
              'L’enregistrement a échoué. Vérifiez votre connexion puis réessayez.',
            );
          }
        },
      });
  }

  protected reload(): void {
    this.hydratedKey = '';
    this.retryTick.update((tick) => tick + 1);
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected cancel(): void {
    void this.router.navigate(['/admin/organizations', this.organizationId()], {
      queryParams: this.listQueryParams(),
    });
  }

  confirmNavigation(): boolean {
    if (!this.form.dirty || this.saving()) return true;
    return globalThis.confirm('Quitter sans enregistrer les modifications de cette entreprise ?');
  }
}

function trimmedRequired(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}
