import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { TextInputComponent } from '../../../design-system/text-input/text-input.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  ADMIN_SECURITY_GATEWAY,
  type AccountType,
  type AdminSecuritySnapshot,
  type MemberWithoutAccount,
  type NewAccountInput,
  type PermissionRow,
  type SecurityRole,
} from './admin-security-gateway';

type PageState = 'loading' | 'ready' | 'error';

const MEMBER_ROLE_ID = 'membre-cnpm';

/**
 * Création d'un compte — écran PLEINE PAGE (BO-030).
 *
 * La création n'est plus une boîte modale : c'est un formulaire de plein droit, comme le
 * veut la ligne « éviter les formulaires modaux ». On y choisit le TYPE de compte
 * (professionnel ou membre), les informations de profil, le RÔLE et, le cas échéant, des
 * PERMISSIONS supplémentaires. Aucun mot de passe n'est saisi : le compte naît « invité »,
 * il définira son mot de passe et enrôlera son 2FA à la première connexion.
 */
@Component({
  selector: 'cnpm-new-account-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AdminShellComponent,
    PageHeaderComponent,
    TextInputComponent,
    ButtonComponent,
    AlertComponent,
  ],
  templateUrl: './new-account.page.html',
  styleUrl: './new-account.page.scss',
})
export class NewAccountPage {
  private readonly gateway = inject(ADMIN_SECURITY_GATEWAY);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<PageState>('loading');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  private readonly snapshot = signal<AdminSecuritySnapshot | null>(null);
  /** Permissions accordées EN PLUS du rôle, cochées par l'opérateur. */
  private readonly extraPermissions = signal<ReadonlySet<string>>(new Set());

  protected readonly form = this.fb.group({
    accountType: this.fb.control<AccountType>('PROFESSIONAL'),
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    phone: ['', [Validators.maxLength(40)]],
    jobTitle: ['', [Validators.maxLength(120)]],
    organization: ['', [Validators.maxLength(160)]],
    department: ['', [Validators.maxLength(120)]],
    roleId: ['', [Validators.required]],
    /** Membre rattaché pour un compte membre ; renseigné par le sélecteur. */
    memberId: [''],
  });

  private readonly submitted = signal(false);

  /** Filtre de recherche du sélecteur de membre. */
  protected readonly memberSearch = signal('');

  private readonly accountType = toSignal(this.form.controls.accountType.valueChanges, {
    initialValue: this.form.controls.accountType.value,
  });
  private readonly selectedRoleId = toSignal(this.form.controls.roleId.valueChanges, {
    initialValue: this.form.controls.roleId.value,
  });

  protected readonly isMember = computed(() => this.accountType() === 'MEMBER');

  /** Rôles proposés : les rôles pro hors « membre » côté pro ; uniquement « membre » côté membre. */
  protected readonly roleOptions = computed<readonly SecurityRole[]>(() => {
    const roles = this.snapshot()?.roles ?? [];
    return this.isMember()
      ? roles.filter((role) => role.id === MEMBER_ROLE_ID)
      : roles.filter((role) => role.id !== MEMBER_ROLE_ID);
  });

  /** Permissions déjà accordées par le rôle choisi — aperçu du « profil » du compte. */
  protected readonly rolePermissions = computed<readonly PermissionRow[]>(() => {
    const roleId = this.selectedRoleId();
    if (!roleId) {
      return [];
    }
    return (this.snapshot()?.permissions ?? []).filter((permission) =>
      permission.grants.some((grant) => grant.roleId === roleId && grant.granted),
    );
  });

  /** Permissions restantes, proposées en supplément (non déjà accordées par le rôle). */
  protected readonly extraPermissionOptions = computed<readonly PermissionRow[]>(() => {
    const grantedIds = new Set(this.rolePermissions().map((permission) => permission.id));
    return (this.snapshot()?.permissions ?? []).filter(
      (permission) => !grantedIds.has(permission.id),
    );
  });

  /** Membres (adhésions) sans compte, proposés à la création d'un compte membre. */
  protected readonly membersWithoutAccount = computed<readonly MemberWithoutAccount[]>(
    () => this.snapshot()?.membersWithoutAccount ?? [],
  );

  /** Liste filtrée par la recherche (raison sociale, numéro, catégorie, contact). */
  protected readonly filteredMembers = computed<readonly MemberWithoutAccount[]>(() => {
    const term = this.memberSearch().trim().toLowerCase();
    const members = this.membersWithoutAccount();
    if (!term) {
      return members;
    }
    return members.filter((member) =>
      [
        member.organizationName,
        member.membershipNumber,
        member.categoryLabel,
        member.groupLabel,
        member.contactFirstName,
        member.contactLastName,
        member.contactEmail,
      ].some((value) => (value ?? '').toLowerCase().includes(term)),
    );
  });

  private readonly selectedMemberId = toSignal(this.form.controls.memberId.valueChanges, {
    initialValue: this.form.controls.memberId.value,
  });

  protected readonly selectedMember = computed<MemberWithoutAccount | null>(
    () => this.membersWithoutAccount().find((member) => member.id === this.selectedMemberId()) ?? null,
  );

  /** Pour un compte membre, un membre DOIT être choisi (l'identité en découle). */
  protected readonly memberSelectionError = computed<string | null>(() =>
    this.isMember() && this.submitted() && !this.selectedMemberId()
      ? 'Sélectionnez le membre à rattacher.'
      : null,
  );

  protected isMemberSelected(memberId: string): boolean {
    return this.selectedMemberId() === memberId;
  }

  protected updateMemberSearch(value: string): void {
    this.memberSearch.set(value);
  }

  /** Choisir un membre pré-remplit l'identité depuis son contact principal (modifiable). */
  protected selectMember(member: MemberWithoutAccount): void {
    this.form.patchValue({
      memberId: member.id,
      firstName: member.contactFirstName ?? '',
      lastName: member.contactLastName ?? '',
      email: member.contactEmail ?? '',
      phone: member.contactPhone ?? '',
      jobTitle: member.contactJobTitle ?? '',
      organization: member.organizationName,
    });
  }

  constructor() {
    // Le type de compte pilote le rôle : un membre reçoit d'office le rôle « Membre CNPM ».
    this.form.controls.accountType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.extraPermissions.set(new Set());
        // Changer de type repart d'une identité vierge : côté membre le sélecteur la
        // remplira, côté professionnel elle se saisit à la main.
        this.memberSearch.set('');
        this.form.patchValue({
          memberId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          jobTitle: '',
          organization: '',
          department: '',
        });
        if (type === 'MEMBER') {
          this.form.controls.roleId.setValue(MEMBER_ROLE_ID);
        } else if (this.form.controls.roleId.value === MEMBER_ROLE_ID) {
          this.form.controls.roleId.setValue('');
        }
      });
    // Changer de rôle réinitialise les permissions supplémentaires (elles dépendent du rôle).
    this.form.controls.roleId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.extraPermissions.set(new Set()));
    this.load();
  }

  protected fieldError(control: keyof typeof this.form.controls): string | null {
    const field = this.form.controls[control];
    if (!field.touched && !this.submitted()) {
      return null;
    }
    if (field.hasError('required')) {
      return 'Ce champ est requis.';
    }
    if (field.hasError('email')) {
      return 'Adresse électronique invalide.';
    }
    if (field.hasError('maxlength')) {
      return 'Ce champ est trop long.';
    }
    return null;
  }

  protected isExtraSelected(permissionId: string): boolean {
    return this.extraPermissions().has(permissionId);
  }

  protected toggleExtra(permissionId: string, checked: boolean): void {
    this.extraPermissions.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(permissionId);
      } else {
        next.delete(permissionId);
      }
      return next;
    });
  }

  protected retry(): void {
    this.load();
  }

  protected cancel(): void {
    void this.router.navigate(['/admin/security/users']);
  }

  protected submit(): void {
    this.submitted.set(true);
    this.submitError.set(null);
    // Un compte membre exige un membre rattaché : l'identité en découle.
    if (this.isMember() && !this.form.controls.memberId.value) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const input: NewAccountInput = {
      accountType: value.accountType,
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone,
      jobTitle: value.jobTitle,
      organization: value.organization,
      department: value.department,
      roleId: value.roleId,
      extraPermissionIds: [...this.extraPermissions()],
      memberId: value.memberId || undefined,
    };
    this.submitting.set(true);
    this.gateway
      .createAccount(input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.submitting.set(false);
          this.toasts.success(`Compte de ${account.fullName} créé. Il devra enrôler son 2FA.`);
          void this.router.navigate(['/admin/security/users']);
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('La création a échoué. Vérifiez les informations et réessayez.');
        },
      });
  }

  private load(): void {
    this.state.set('loading');
    this.gateway
      .load({ tab: 'roles', search: '' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (snapshot) => {
          this.snapshot.set(snapshot);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }
}
