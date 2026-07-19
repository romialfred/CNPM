import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../../design-system/alert/alert.component';
import {
  BadgeComponent,
  type CnpmBadgeTone,
} from '../../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../../design-system/button/button.component';
import { ErrorStateComponent } from '../../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../../design-system/skeleton/skeleton.component';
import { AdminShellComponent } from '../../../../layout/admin-shell/admin-shell.component';
import {
  BANK_STATEMENT_IMPORT_GATEWAY,
  type BankStatementImportContext,
  type BankStatementInspection,
  type BankStatementLocalFile,
  type DemoStatementProfile,
  type StatementLineControlStatus,
} from './bank-statement-import-gateway';

type ImportStep = 'deposit' | 'control' | 'review';
const STEPS: readonly ImportStep[] = ['deposit', 'control', 'review'];
const PROFILES: readonly DemoStatementProfile[] = ['CNPM_DEMO_CSV_V0'];
const SAMPLE_FILE: BankStatementLocalFile = {
  fileName: 'releve-bancaire-juin.csv',
  size: 84_216,
  profile: 'CNPM_DEMO_CSV_V0',
};

@Component({
  selector: 'cnpm-bank-statement-import-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './bank-statement-import.page.html',
  styleUrls: ['./bank-statement-import.page.scss', './bank-statement-import.responsive.scss'],
})
export class BankStatementImportPage {
  private readonly gateway = inject(BANK_STATEMENT_IMPORT_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly form = new FormGroup({
    profile: new FormControl<DemoStatementProfile>('CNPM_DEMO_CSV_V0', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  protected readonly reviewAccepted = new FormControl(false, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });

  private readonly contextResult = toSignal(
    this.gateway.loadContext().pipe(
      map((context) => ({ kind: 'ready' as const, context })),
      catchError((error: unknown) =>
        of({
          kind: error instanceof UnavailableHttpFeatureError ? ('unavailable' as const) : ('error' as const),
          context: null,
        }),
      ),
      startWith({ kind: 'loading' as const, context: null }),
    ),
    { initialValue: { kind: 'loading' as const, context: null } },
  );

  protected readonly state = computed(() => this.contextResult().kind);
  protected readonly context = computed<BankStatementImportContext | null>(
    () => this.contextResult().context,
  );
  protected readonly step = computed<ImportStep>(() =>
    known(this.params().get('etape'), STEPS) ?? 'deposit',
  );
  protected readonly progress = computed(() =>
    ({ deposit: 33, control: 66, review: 100 })[this.step()],
  );
  protected readonly selectedFile = signal<BankStatementLocalFile | null>(null);
  protected readonly inspection = signal<BankStatementInspection | null>(null);
  protected readonly inspecting = signal(false);
  protected readonly inspectionError = signal<string | null>(null);
  protected readonly reviewComplete = signal(false);

  private readonly synchronizeProfile = effect(() => {
    this.form.controls.profile.setValue(
      known(this.params().get('profil'), PROFILES) ?? 'CNPM_DEMO_CSV_V0',
      { emitEvent: false },
    );
  });

  /** Une URL de contrôle/revue se restaure avec le seul fichier exemple public. */
  private readonly hydrateShareableStep = effect(() => {
    if (
      this.state() === 'ready' &&
      this.step() !== 'deposit' &&
      !this.inspection() &&
      !this.inspecting()
    ) {
      this.selectedFile.set(SAMPLE_FILE);
      this.requestInspection(SAMPLE_FILE);
    }
  });

  protected selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    this.inspection.set(null);
    this.inspectionError.set(null);
    if (!file) {
      this.selectedFile.set(null);
      return;
    }
    this.selectedFile.set({
      fileName: file.name,
      size: file.size,
      profile: this.form.controls.profile.value,
    });
  }

  protected useSample(): void {
    this.selectedFile.set({ ...SAMPLE_FILE, profile: this.form.controls.profile.value });
    this.inspection.set(null);
    this.inspectionError.set(null);
  }

  protected analyze(): void {
    const file = this.selectedFile();
    if (!file) return;
    const selection = { ...file, profile: this.form.controls.profile.value };
    this.selectedFile.set(selection);
    this.patchUrl('control');
    this.requestInspection(selection);
  }

  protected goToStep(step: ImportStep): void {
    if (step === 'review' && !this.inspection()) return;
    if (step === 'control' && !this.inspection()) {
      const file = this.selectedFile();
      if (!file) return;
      this.requestInspection(file);
    }
    this.patchUrl(step);
  }

  protected openReview(): void {
    if (!this.inspection()) return;
    this.reviewComplete.set(false);
    this.patchUrl('review');
  }

  protected completeReview(): void {
    this.reviewAccepted.markAsTouched();
    if (this.reviewAccepted.invalid) return;
    this.reviewComplete.set(true);
  }

  protected profileLabel(profile: DemoStatementProfile): string {
    return profile === 'CNPM_DEMO_CSV_V0' ? 'CSV CNPM v0 · format interne' : profile;
  }

  protected statusLabel(status: StatementLineControlStatus): string {
    return {
      VALID: 'Contrôlée',
      DUPLICATE: 'Doublon potentiel',
      UNALLOCATED: 'Non imputée',
      INVALID: 'Incohérente',
    }[status];
  }

  protected statusTone(status: StatementLineControlStatus): CnpmBadgeTone {
    if (status === 'VALID') return 'success';
    if (status === 'INVALID') return 'error';
    return 'warning';
  }

  protected recentStatusLabel(status: 'REVIEWED' | 'TO_REVIEW'): string {
    return status === 'REVIEWED' ? 'Revue locale terminée' : 'À revoir';
  }

  protected formatFileSize(size: number): string {
    return `${Math.max(1, Math.round(size / 1024)).toLocaleString('fr-FR')} Ko`;
  }

  private requestInspection(file: BankStatementLocalFile): void {
    if (this.inspecting() || this.state() !== 'ready') return;
    this.inspecting.set(true);
    this.inspectionError.set(null);
    this.gateway
      .inspectLocalDemo(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (inspection) => {
          this.inspection.set(inspection);
          this.inspecting.set(false);
        },
        error: () => {
          this.inspectionError.set(
            'Le fichier n’a pas pu être contrôlé dans le banc local. Utilisez le fichier exemple CSV.',
          );
          this.inspecting.set(false);
        },
      });
  }

  private patchUrl(step: ImportStep): void {
    const profile = this.form.controls.profile.value;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        etape: step === 'deposit' ? null : step,
        profil: profile === 'CNPM_DEMO_CSV_V0' ? null : profile,
      },
      queryParamsHandling: 'merge',
    });
  }
}

function known<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

