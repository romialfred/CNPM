import { DecimalPipe } from '@angular/common';
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
  CONTRIBUTION_CALL_GENERATION_GATEWAY,
  type ContributionAudience,
  type ContributionGenerationContext,
  type ContributionGenerationPeriod,
  type ContributionGenerationRequest,
  type ContributionGenerationSimulation,
  type ContributionSimulationSeverity,
} from './contribution-call-generation-gateway';

type GenerationStep = 'scope' | 'simulation' | 'review';
const STEPS: readonly GenerationStep[] = ['scope', 'simulation', 'review'];
const PERIODS: readonly ContributionGenerationPeriod[] = ['T1', 'T2', 'T3', 'T4'];
const AUDIENCES: readonly ContributionAudience[] = [
  'ALL_ACTIVE',
  'NEW_MEMBERS',
  'LARGE_CONTRIBUTORS',
];

@Component({
  selector: 'cnpm-contribution-call-generation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
  templateUrl: './contribution-call-generation.page.html',
  styleUrls: [
    './contribution-call-generation.page.scss',
    './contribution-call-generation.responsive.scss',
  ],
})
export class ContributionCallGenerationPage {
  private readonly gateway = inject(CONTRIBUTION_CALL_GENERATION_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly form = new FormGroup({
    fiscalYear: new FormControl('2024', { nonNullable: true, validators: [Validators.required] }),
    period: new FormControl<ContributionGenerationPeriod>('T3', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    audience: new FormControl<ContributionAudience>('ALL_ACTIVE', {
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
  protected readonly context = computed<ContributionGenerationContext | null>(
    () => this.contextResult().context,
  );
  protected readonly step = computed<GenerationStep>(() =>
    known(this.params().get('etape'), STEPS) ?? 'scope',
  );
  protected readonly simulation = signal<ContributionGenerationSimulation | null>(null);
  protected readonly simulating = signal(false);
  protected readonly simulationError = signal(false);
  protected readonly reviewComplete = signal(false);
  protected readonly progress = computed(() =>
    ({ scope: 33, simulation: 66, review: 100 })[this.step()],
  );

  private readonly synchronizeFormFromUrl = effect(() => {
    const params = this.params();
    this.form.patchValue(
      {
        fiscalYear: params.get('exercice') ?? '2024',
        period: known(params.get('periode'), PERIODS) ?? 'T3',
        audience: known(params.get('audience'), AUDIENCES) ?? 'ALL_ACTIVE',
      },
      { emitEvent: false },
    );
  });

  /** Rend un lien vers simulation/revue autonome sans émettre le moindre appel. */
  private readonly hydrateShareableStep = effect(() => {
    if (
      this.state() === 'ready' &&
      this.step() !== 'scope' &&
      !this.simulation() &&
      !this.simulating()
    ) {
      this.requestSimulation();
    }
  });

  protected goToStep(step: GenerationStep): void {
    if (step === 'review' && !this.simulation()) return;
    if (step === 'simulation' && !this.simulation()) this.requestSimulation();
    this.patchUrl(step);
  }

  protected simulate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.patchUrl('simulation');
    this.requestSimulation();
  }

  protected openReview(): void {
    if (!this.simulation()) return;
    this.reviewComplete.set(false);
    this.patchUrl('review');
  }

  protected completeLocalReview(): void {
    this.reviewAccepted.markAsTouched();
    if (this.reviewAccepted.invalid) return;
    this.reviewComplete.set(true);
  }

  protected audienceLabel(audience: ContributionAudience): string {
    return {
      ALL_ACTIVE: 'Tous les membres actifs',
      NEW_MEMBERS: 'Nouveaux membres',
      LARGE_CONTRIBUTORS: 'Segment grands cotisants',
    }[audience];
  }

  protected periodLabel(period: ContributionGenerationPeriod): string {
    return {
      T1: 'T1 · janvier à mars',
      T2: 'T2 · avril à juin',
      T3: 'T3 · juillet à septembre',
      T4: 'T4 · octobre à décembre',
    }[period];
  }

  protected severityLabel(severity: ContributionSimulationSeverity): string {
    return {
      BLOCKING: 'Bloquante',
      WARNING: 'À contrôler',
      INFORMATION: 'Information',
    }[severity];
  }

  protected severityTone(severity: ContributionSimulationSeverity): CnpmBadgeTone {
    if (severity === 'BLOCKING') return 'error';
    if (severity === 'WARNING') return 'warning';
    return 'info';
  }

  private requestSimulation(): void {
    if (this.simulating() || this.state() !== 'ready') return;
    const request = this.form.getRawValue() satisfies ContributionGenerationRequest;
    this.simulating.set(true);
    this.simulationError.set(false);
    this.gateway
      .simulate(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (simulation) => {
          this.simulation.set(simulation);
          this.simulating.set(false);
        },
        error: () => {
          this.simulationError.set(true);
          this.simulating.set(false);
        },
      });
  }

  private patchUrl(step: GenerationStep): void {
    const value = this.form.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        etape: step === 'scope' ? null : step,
        exercice: value.fiscalYear === '2024' ? null : value.fiscalYear,
        periode: value.period === 'T3' ? null : value.period,
        audience: value.audience === 'ALL_ACTIVE' ? null : value.audience,
      },
      queryParamsHandling: 'merge',
    });
  }
}

function known<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

