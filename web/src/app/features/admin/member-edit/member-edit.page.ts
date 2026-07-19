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
import { ActivatedRoute, Router, RouterLink, type Params } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  MEMBER_EDIT_GATEWAY,
  MemberEditAccessError,
  MemberEditConflictError,
  MemberEditNotFoundError,
  type MemberCoreUpdate,
  MemberEditValidationError,
} from './member-edit-gateway';

type SaveFailure = 'forbidden' | 'notFound' | 'conflict' | 'validation' | 'error' | null;
type EditableField = keyof MemberEditPage['form']['controls'];

/**
 * BO-004 — modification canonique d'un dossier membre.
 *
 * La page est volontairement bornée au `OrganizationUpdate` contractuel. Elle ne
 * transforme pas les projections riches de BO-003 en données éditables et ne propose
 * aucune transition de statut, modification d'identifiant ou de contact.
 */
@Component({
  selector: 'cnpm-member-edit-page',
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
  templateUrl: './member-edit.page.html',
  styleUrl: './member-edit.page.scss',
})
export class MemberEditPage {
  private readonly gateway = inject(MEMBER_EDIT_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly title = inject(Title);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
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
  protected readonly memberId = computed(() => this.params().get('id') ?? '');

  /** Conserve le contexte de BO-002/003 au retour, y compris l'onglet de la fiche. */
  protected readonly detailQueryParams = computed<Params>(() => {
    const query = this.queryParams();
    return Object.fromEntries(
      query.keys.map((key) => {
        const values = query.getAll(key);
        return [key, values.length > 1 ? values : (values[0] ?? '')];
      }),
    );
  });

  private readonly retryTick = signal(0);
  private readonly fetchTrigger = computed(() => ({
    id: this.memberId(),
    tick: this.retryTick(),
  }));

  private readonly result = toSignal(
    toObservable(this.fetchTrigger).pipe(
      switchMap(({ id }) =>
        this.gateway.load(id).pipe(
          map((member) => ({ kind: 'ready' as const, member })),
          catchError((error: unknown) => {
            if (error instanceof MemberEditAccessError) return of({ kind: 'forbidden' as const });
            if (error instanceof MemberEditNotFoundError) return of({ kind: 'notFound' as const });
            return of({ kind: 'error' as const });
          }),
          startWith({ kind: 'loading' as const }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' as const } },
  );

  protected readonly state = computed(() => this.result().kind);
  protected readonly member = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.member : null;
  });
  protected readonly pageTitle = computed(() =>
    this.member()
      ? `Modifier le dossier de ${this.member()!.legalName}`
      : 'Modifier un dossier membre',
  );

  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveFailure = signal<SaveFailure>(null);
  protected readonly saveMessage = signal('');
  private hydratedKey = '';

  protected readonly formErrors = computed<readonly CnpmFieldError[]>(() => {
    if (!this.submitted()) return [];
    const errors: CnpmFieldError[] = [];
    const fields: readonly { readonly control: EditableField; readonly id: string }[] = [
      { control: 'legalName', id: 'member-legal-name' },
      { control: 'tradeName', id: 'member-trade-name' },
      { control: 'organizationType', id: 'member-organization-type' },
      { control: 'sectorCode', id: 'member-sector-code' },
    ];
    for (const field of fields) {
      const error = this.fieldError(field.control);
      if (error) errors.push({ fieldId: field.id, message: error });
    }
    return errors;
  });

  constructor() {
    effect(() => {
      const member = this.member();
      if (!member) return;
      const key = `${member.id}:${member.version}`;
      if (this.hydratedKey === key) return;
      this.hydratedKey = key;
      this.form.reset({
        legalName: member.legalName,
        tradeName: member.tradeName ?? '',
        organizationType: member.organizationType,
        sectorCode: member.sectorCode ?? '',
      });
      this.submitted.set(false);
      this.saveFailure.set(null);
      this.saveMessage.set('');
    });

    effect(() => {
      const member = this.member();
      this.title.setTitle(
        member
          ? `Modifier ${member.legalName} — Dossier membre — Administration CNPM`
          : 'Modifier un dossier membre — Administration CNPM',
      );
    });
  }

  protected fieldError(control: EditableField): string | null {
    const field = this.form.controls[control];
    if (!field.invalid || (!field.touched && !this.submitted())) return null;
    if (field.hasError('required')) {
      return control === 'legalName'
        ? 'La raison sociale est obligatoire.'
        : 'Le type d’entreprise est obligatoire.';
    }
    const limits: Readonly<Record<EditableField, number>> = {
      legalName: 255,
      tradeName: 255,
      organizationType: 40,
      sectorCode: 80,
    };
    return `Maximum ${limits[control]} caractères.`;
  }

  protected statusLabel(value: string): string {
    return (
      { ACTIVE: 'Membre actif', DORMANT: 'Membre dormant', PROSPECT: 'Prospect' }[value] ??
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
    return value === 'NORMAL' ? 'Niveau normal' : value.replaceAll('_', ' ');
  }

  protected submit(): void {
    this.submitted.set(true);
    this.saveFailure.set(null);
    this.saveMessage.set('');
    this.form.markAllAsTouched();
    const member = this.member();
    if (!member || this.form.invalid || this.saving()) return;

    const raw = this.form.getRawValue();
    const changes: MemberCoreUpdate = {
      legalName: raw.legalName.trim(),
      tradeName: raw.tradeName.trim(),
      organizationType: raw.organizationType.trim(),
      sectorCode: raw.sectorCode.trim(),
    };
    if (!changes.legalName || !changes.organizationType) return;

    this.saving.set(true);
    this.gateway
      .update(member.id, member.version, changes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.toast.success('Le noyau descriptif du dossier membre a été mis à jour.');
          void this.router.navigate(['/admin/members', updated.id], {
            queryParams: this.detailQueryParams(),
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          if (error instanceof MemberEditAccessError) {
            this.saveFailure.set('forbidden');
            this.saveMessage.set(
              'Le serveur a refusé la modification : le droit MEMBER.WRITE est absent ou n’est plus valide.',
            );
          } else if (error instanceof MemberEditNotFoundError) {
            this.saveFailure.set('notFound');
            this.saveMessage.set(
              'Le dossier n’existe plus ou n’est plus accessible. Revenez à la liste avant de poursuivre.',
            );
          } else if (error instanceof MemberEditConflictError) {
            this.saveFailure.set('conflict');
            this.saveMessage.set(error.message);
          } else if (error instanceof MemberEditValidationError) {
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

  protected reloadCurrent(): void {
    this.hydratedKey = '';
    this.retryTick.update((tick) => tick + 1);
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  protected cancel(): void {
    void this.router.navigate(['/admin/members', this.memberId()], {
      queryParams: this.detailQueryParams(),
    });
  }

  confirmNavigation(): boolean {
    if (!this.form.dirty || this.saving()) return true;
    return globalThis.confirm('Quitter sans enregistrer les modifications de ce dossier membre ?');
  }
}

function trimmedRequired(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}
