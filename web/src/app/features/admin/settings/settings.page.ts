import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
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
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { DataTableComponent } from '../../../design-system/data-table/data-table.component';
import type { DataTableColumn } from '../../../design-system/data-table/data-table.model';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { PaginationComponent } from '../../../design-system/pagination/pagination.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  ReferenceValueConflictError,
  ReferenceValueNotFoundError,
  ReferenceValuesAccessError,
  ReferenceValuesAuthenticationError,
  ReferenceValueValidationError,
  SETTINGS_GATEWAY,
  type ReferenceValue,
  type ReferenceValueInput,
  type ReferenceValueQuery,
  type ReferenceValueUpdate,
} from './settings-gateway';

const PAGE_SIZES = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

type EditorMode = 'closed' | 'create' | 'edit';
type SaveFailure =
  'authentication' | 'forbidden' | 'notFound' | 'conflict' | 'validation' | 'error' | null;
type EditableField = 'domain' | 'code' | 'label' | 'sortOrder';
interface EditorFormValue {
  readonly domain: string;
  readonly code: string;
  readonly label: string;
  readonly sortOrder: number;
  readonly active: boolean;
}

/** BO-033 — paramétrage fonctionnel des seules valeurs de référentiel contractuelles. */
@Component({
  selector: 'cnpm-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    InlineErrorSummaryComponent,
    PageHeaderComponent,
    PaginationComponent,
    SkeletonComponent,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  private readonly gateway = inject(SETTINGS_GATEWAY);
  private readonly session = inject(SESSION_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly title = inject(Title);
  private readonly toast = inject(ToastService);

  protected readonly pageSizes = PAGE_SIZES;

  private readonly sessionIdentity = toSignal(
    this.session.identity.pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly canWrite = computed(
    () => this.sessionIdentity()?.permissions.includes('ADMIN.REFERENTIAL.WRITE') ?? false,
  );

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly domain = computed(() => this.params().get('domain')?.trim() ?? '');
  protected readonly page = computed(() => positiveInteger(this.params().get('page'), 1));
  protected readonly pageSize = computed(() => {
    const value = positiveInteger(this.params().get('size'), DEFAULT_PAGE_SIZE);
    return (PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_PAGE_SIZE;
  });
  protected readonly hasDomainFilter = computed(() => this.domain().length > 0);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    domain: [this.domain(), [Validators.maxLength(80)]],
  });

  private readonly query = computed<ReferenceValueQuery>(() => ({
    domain: this.domain() || null,
    page: this.page(),
    pageSize: this.pageSize(),
  }));
  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({ query: this.query(), tick: this.retryTick() }));
  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ query }) =>
        this.gateway.list(query).pipe(
          map((data) => ({ kind: 'ready' as const, data })),
          catchError((error: unknown) => {
            if (error instanceof ReferenceValuesAuthenticationError) {
              return of({ kind: 'authentication' as const });
            }
            if (error instanceof ReferenceValuesAccessError) {
              return of({ kind: 'forbidden' as const });
            }
            if (error instanceof ReferenceValueNotFoundError) {
              return of({ kind: 'notFound' as const });
            }
            if (error instanceof ReferenceValueValidationError) {
              return of({ kind: 'invalidQuery' as const });
            }
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly rows = computed<readonly ReferenceValue[]>(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.rows : [];
  });
  protected readonly totalItems = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.data.totalItems : 0;
  });
  protected readonly state = computed(() => {
    const result = this.result();
    if (result.kind !== 'ready') return result.kind;
    if (result.data.rows.length > 0) return 'ready' as const;
    if (result.data.totalItems > 0) return 'pageEmpty' as const;
    return this.hasDomainFilter() ? ('noResult' as const) : ('empty' as const);
  });

  protected readonly columns: readonly DataTableColumn[] = [
    { key: 'domain', label: 'Domaine' },
    { key: 'code', label: 'Code' },
    { key: 'label', label: 'Libellé' },
    { key: 'sortOrder', label: 'Ordre', align: 'end' },
    { key: 'active', label: 'État' },
    { key: 'version', label: 'Version', align: 'end' },
    { key: 'actions', label: 'Action' },
  ];
  protected readonly rowKey = (value: ReferenceValue): string => value.id;

  protected readonly editorMode = signal<EditorMode>('closed');
  protected readonly selectedValue = signal<ReferenceValue | null>(null);
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveFailure = signal<SaveFailure>(null);
  protected readonly saveMessage = signal('');
  private readonly serverFieldErrors = signal<readonly CnpmFieldError[]>([]);
  private readonly validationTick = signal(0);
  private readonly editorHeading = viewChild<ElementRef<HTMLElement>>('editorHeading');
  private readonly registryHeading = viewChild<ElementRef<HTMLElement>>('registryHeading');
  private editorTrigger: HTMLElement | null = null;

  protected readonly editorForm = this.formBuilder.nonNullable.group({
    domain: ['', [trimmedRequired, Validators.maxLength(80)]],
    code: ['', [trimmedRequired, Validators.maxLength(80)]],
    label: ['', [trimmedRequired, Validators.maxLength(255)]],
    sortOrder: [0, [Validators.required, integer]],
    active: [true],
  });

  protected readonly formErrors = computed<readonly CnpmFieldError[]>(() => {
    this.validationTick();
    if (!this.submitted()) return this.serverFieldErrors();
    const errors: CnpmFieldError[] = [];
    const fields: readonly { readonly control: EditableField; readonly id: string }[] = [
      { control: 'domain', id: 'settings-domain' },
      { control: 'code', id: 'settings-code' },
      { control: 'label', id: 'settings-label' },
      { control: 'sortOrder', id: 'settings-sort-order' },
    ];
    for (const field of fields) {
      const message = this.fieldError(field.control);
      if (message) errors.push({ fieldId: field.id, message });
    }
    for (const serverError of this.serverFieldErrors()) {
      if (!errors.some((error) => error.fieldId === serverError.fieldId)) {
        errors.push(serverError);
      }
    }
    return errors;
  });

  constructor() {
    this.title.setTitle('Paramétrage fonctionnel — Administration CNPM');

    effect(() => {
      const domain = this.domain();
      if (this.filterForm.controls.domain.value !== domain) {
        this.filterForm.controls.domain.setValue(domain, { emitEvent: false });
      }
    });

    effect(() => {
      const mode = this.editorMode();
      const heading = this.editorHeading()?.nativeElement;
      if (mode !== 'closed' && heading) {
        queueMicrotask(() => heading.focus());
      }
    });

    this.editorForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.validationTick.update((tick) => tick + 1);
      if (this.serverFieldErrors().length > 0) this.serverFieldErrors.set([]);
      if (this.saveFailure() === 'validation') this.saveFailure.set(null);
    });
  }

  protected applyDomainFilter(): void {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid || !this.leaveEditorForListChange()) return;
    this.patch({ domain: clean(this.filterForm.controls.domain.value), page: null });
  }

  protected clearDomainFilter(): void {
    if (!this.leaveEditorForListChange()) return;
    this.filterForm.reset({ domain: '' });
    this.patch({ domain: null, page: null });
  }

  protected openCreate(): void {
    if (!this.canWrite() || !this.confirmDiscard()) return;
    this.rememberEditorTrigger();
    this.selectedValue.set(null);
    this.editorMode.set('create');
    this.editorForm.reset({
      domain: this.domain(),
      code: '',
      label: '',
      sortOrder: 0,
      active: true,
    });
    this.resetSaveState();
  }

  protected openEdit(value: ReferenceValue): void {
    if (!this.canWrite() || !this.confirmDiscard()) return;
    this.rememberEditorTrigger();
    this.selectedValue.set(value);
    this.editorMode.set('edit');
    this.editorForm.reset({
      domain: value.domain,
      code: value.code,
      label: value.label,
      sortOrder: value.sortOrder,
      active: value.active,
    });
    this.resetSaveState();
  }

  protected closeEditor(): void {
    if (!this.confirmDiscard()) return;
    this.discardEditor();
  }

  protected submitEditor(): void {
    this.submitted.set(true);
    this.saveFailure.set(null);
    this.saveMessage.set('');
    this.serverFieldErrors.set([]);
    this.editorForm.markAllAsTouched();
    if (this.editorForm.invalid || this.saving() || this.editorMode() === 'closed') return;

    const raw = this.editorForm.getRawValue();
    if (!raw.domain.trim() || !raw.code.trim() || !raw.label.trim()) return;

    this.saving.set(true);
    const request =
      this.editorMode() === 'create'
        ? this.gateway.create({
            domain: raw.domain.trim(),
            code: raw.code.trim(),
            label: raw.label.trim(),
            sortOrder: raw.sortOrder,
            active: raw.active,
          } satisfies ReferenceValueInput)
        : this.updateRequest(raw);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => this.handleSaved(saved),
      error: (error: unknown) => this.handleSaveError(error),
    });
  }

  protected fieldError(control: EditableField): string | null {
    const field = this.editorForm.controls[control];
    if (!field.invalid || (!field.touched && !this.submitted())) return null;
    if (field.hasError('required')) {
      return {
        domain: 'Le domaine est obligatoire.',
        code: 'Le code est obligatoire.',
        label: 'Le libellé est obligatoire.',
        sortOrder: 'L’ordre est obligatoire.',
      }[control];
    }
    if (field.hasError('maxlength')) {
      return control === 'label' ? 'Maximum 255 caractères.' : 'Maximum 80 caractères.';
    }
    if (field.hasError('integer')) return 'Saisissez un nombre entier.';
    return 'La valeur saisie est invalide.';
  }

  protected statusLabel(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }

  protected statusTone(active: boolean): CnpmBadgeTone {
    return active ? 'success' : 'neutral';
  }

  protected onPageChange(page: number): void {
    if (!this.leaveEditorForListChange()) return;
    this.patch({ page: page === 1 ? null : page });
  }

  protected onPageSizeChange(size: number): void {
    if (!this.leaveEditorForListChange()) return;
    this.patch({ size: size === DEFAULT_PAGE_SIZE ? null : size, page: null });
  }

  protected goToFirstPage(): void {
    if (!this.leaveEditorForListChange()) return;
    this.patch({ page: null });
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected abandonAndReload(): void {
    this.editorForm.markAsPristine();
    this.discardEditor();
    this.retry();
  }

  confirmNavigation(): boolean {
    if (this.saving()) return false;
    if (this.editorMode() === 'closed' || !this.editorForm.dirty) return true;
    return globalThis.confirm(
      'Quitter sans enregistrer les modifications du paramétrage fonctionnel ?',
    );
  }

  private updateRequest(raw: EditorFormValue) {
    const current = this.selectedValue();
    if (!current) {
      throw new Error('Aucune valeur de référentiel sélectionnée pour la modification.');
    }
    const changes: ReferenceValueUpdate = {
      ...(raw.label.trim() !== current.label ? { label: raw.label.trim() } : {}),
      ...(raw.sortOrder !== current.sortOrder ? { sortOrder: raw.sortOrder } : {}),
      ...(raw.active !== current.active ? { active: raw.active } : {}),
    };
    return this.gateway.update(current.id, current.version, changes);
  }

  private handleSaved(saved: ReferenceValue): void {
    const wasCreate = this.editorMode() === 'create';
    this.saving.set(false);
    this.editorForm.markAsPristine();
    this.discardEditor();
    this.toast.success(
      wasCreate
        ? 'La valeur de référentiel a été créée.'
        : 'La valeur de référentiel a été mise à jour.',
    );

    if (wasCreate && this.domain() && this.domain() !== saved.domain) {
      this.filterForm.reset({ domain: saved.domain });
      this.patch({ domain: saved.domain, page: null });
      return;
    }
    this.retry();
  }

  private handleSaveError(error: unknown): void {
    this.saving.set(false);
    if (error instanceof ReferenceValuesAuthenticationError) {
      this.saveFailure.set('authentication');
      this.saveMessage.set('Votre session a expiré. Reconnectez-vous avant de réessayer.');
    } else if (error instanceof ReferenceValuesAccessError) {
      this.saveFailure.set('forbidden');
      this.saveMessage.set(
        'Le serveur a refusé l’écriture : la permission ADMIN.REFERENTIAL.WRITE est absente ou n’est plus valide.',
      );
    } else if (error instanceof ReferenceValueNotFoundError) {
      this.saveFailure.set('notFound');
      this.saveMessage.set('Cette valeur n’existe plus. Rechargez la liste avant de poursuivre.');
    } else if (error instanceof ReferenceValueConflictError) {
      this.saveFailure.set('conflict');
      this.saveMessage.set(
        this.editorMode() === 'create'
          ? 'Ce domaine et ce code identifient déjà une valeur différente.'
          : 'Cette valeur a été modifiée depuis son chargement. Vos changements n’ont pas été écrasés.',
      );
    } else if (error instanceof ReferenceValueValidationError) {
      this.saveFailure.set('validation');
      this.saveMessage.set(error.message);
      this.serverFieldErrors.set(mapServerFieldErrors(error));
    } else {
      this.saveFailure.set('error');
      this.saveMessage.set('L’enregistrement a échoué. Vérifiez votre connexion puis réessayez.');
    }
  }

  private confirmDiscard(): boolean {
    if (this.saving()) return false;
    if (this.editorMode() === 'closed' || !this.editorForm.dirty) return true;
    return globalThis.confirm('Abandonner les changements non enregistrés ?');
  }

  private leaveEditorForListChange(): boolean {
    if (!this.confirmDiscard()) return false;
    this.discardEditor();
    return true;
  }

  private discardEditor(): void {
    this.editorMode.set('closed');
    this.selectedValue.set(null);
    this.editorForm.reset({ domain: '', code: '', label: '', sortOrder: 0, active: true });
    this.editorForm.markAsPristine();
    this.resetSaveState();
    this.restoreEditorFocus();
  }

  private rememberEditorTrigger(): void {
    const active = globalThis.document?.activeElement;
    this.editorTrigger = active instanceof HTMLElement ? active : null;
  }

  private restoreEditorFocus(): void {
    const trigger = this.editorTrigger;
    this.editorTrigger = null;
    queueMicrotask(() => {
      if (trigger?.isConnected) {
        trigger.focus();
      } else {
        this.registryHeading()?.nativeElement.focus();
      }
    });
  }

  private resetSaveState(): void {
    this.submitted.set(false);
    this.saving.set(false);
    this.saveFailure.set(null);
    this.saveMessage.set('');
    this.serverFieldErrors.set([]);
  }

  private patch(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}

function trimmedRequired(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

function integer(control: AbstractControl<number>): ValidationErrors | null {
  return Number.isInteger(control.value) ? null : { integer: true };
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function clean(value: string): string | null {
  return value.trim() || null;
}

function mapServerFieldErrors(error: ReferenceValueValidationError): readonly CnpmFieldError[] {
  const ids: Readonly<Record<string, string>> = {
    domain: 'settings-domain',
    code: 'settings-code',
    label: 'settings-label',
    sortOrder: 'settings-sort-order',
    active: 'settings-active',
  };
  return error.fieldErrors.flatMap((fieldError) => {
    const fieldId = fieldError.field ? ids[fieldError.field] : undefined;
    return fieldId && fieldError.message ? [{ fieldId, message: fieldError.message }] : [];
  });
}
