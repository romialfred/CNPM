import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import {
  DefinitionListComponent,
  type CnpmDefinition,
} from '../../../design-system/definition-list/definition-list.component';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { PublicShellComponent } from '../public-shell.component';
import { PublicEnrollmentSession } from './public-enrollment-session';

type EnrollmentStepId = 'entreprise' | 'contact' | 'pieces' | 'verification';
type FieldKey =
  | 'legalName'
  | 'tradeName'
  | 'legalForm'
  | 'rccm'
  | 'nif'
  | 'contactName'
  | 'contactEmail'
  | 'contactPhone';
type StepStatus = 'current' | 'complete' | 'error' | 'todo';

interface EnrollmentStep {
  readonly id: EnrollmentStepId;
  readonly label: string;
  readonly heading: string;
  readonly hint: string;
}

const STEPS: readonly EnrollmentStep[] = [
  {
    id: 'entreprise',
    label: 'Entreprise',
    heading: 'Identifier l’entreprise',
    hint: 'Les références RCCM et NIF sont saisies en texte libre.',
  },
  {
    id: 'contact',
    label: 'Contact',
    heading: 'Ajouter un contact',
    hint: 'Ces coordonnées ne quittent pas cette page et ne sont enregistrées dans aucun stockage.',
  },
  {
    id: 'pieces',
    label: 'Pièces',
    heading: 'Consulter l’état des pièces',
    hint: 'La matrice officielle des pièces par forme juridique n’est pas publiée dans les sources.',
  },
  {
    id: 'verification',
    label: 'Vérification',
    heading: 'Vérifier les informations',
    hint: 'La dernière action génère un récapitulatif, pas un dossier d’adhésion.',
  },
];

const STEP_FIELDS: Readonly<Record<EnrollmentStepId, readonly FieldKey[]>> = {
  entreprise: ['legalName', 'tradeName', 'legalForm', 'rccm', 'nif'],
  contact: ['contactName', 'contactEmail', 'contactPhone'],
  pieces: [],
  verification: [],
};

const FIELD_LABELS: Readonly<Record<FieldKey, string>> = {
  legalName: 'Raison sociale',
  tradeName: 'Nom commercial',
  legalForm: 'Forme juridique déclarée',
  rccm: 'Référence RCCM',
  nif: 'Référence NIF',
  contactName: 'Nom du contact',
  contactEmail: 'Adresse e-mail',
  contactPhone: 'Téléphone',
};

const trimmedRequired: ValidatorFn = (
  control: AbstractControl<unknown>,
): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

function isStep(value: string | null): value is EnrollmentStepId {
  return STEPS.some((step) => step.id === value);
}

/** PUB-012 — parcours public de préparation, local et sans persistance. */
@Component({
  selector: 'cnpm-public-enrollment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  imports: [
    AlertComponent,
    ButtonComponent,
    DefinitionListComponent,
    InlineErrorSummaryComponent,
    PublicShellComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './public-enrollment.page.html',
  styleUrl: './public-enrollment.page.scss',
})
export class PublicEnrollmentPage {
  private readonly document = inject(DOCUMENT);
  private readonly dataMode = inject(CNPM_DATA_MODE);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(PublicEnrollmentSession);
  private readonly seo = inject(PageSeoService);
  private readonly injector = inject(Injector);
  private readonly pageTitle = viewChild<ElementRef<HTMLElement>>('pageTitle');
  private readonly exitPanel = viewChild<ElementRef<HTMLElement>>('exitPanel');

  protected readonly isDemo = this.dataMode === 'demo';
  protected readonly steps = STEPS;
  protected readonly current = signal<EnrollmentStepId>('entreprise');
  protected readonly visited = signal<ReadonlySet<EnrollmentStepId>>(
    new Set<EnrollmentStepId>(['entreprise']),
  );
  protected readonly attempted = signal<ReadonlySet<EnrollmentStepId>>(new Set<EnrollmentStepId>());
  protected readonly errors = signal<readonly CnpmFieldError[]>([]);
  protected readonly dirty = signal(false);
  protected readonly exitPrompt = signal(false);
  protected readonly currentStep = computed(
    () => STEPS.find((step) => step.id === this.current()) ?? STEPS[0],
  );
  protected readonly currentIndex = computed(() =>
    STEPS.findIndex((step) => step.id === this.current()),
  );

  protected readonly form = this.fb.group({
    legalName: ['', [trimmedRequired, Validators.maxLength(255)]],
    tradeName: ['', [Validators.maxLength(255)]],
    legalForm: ['', [trimmedRequired, Validators.maxLength(40)]],
    // Aucun pattern RCCM/NIF : les formats officiels ne figurent pas dans les sources.
    rccm: ['', [trimmedRequired, Validators.maxLength(160)]],
    nif: ['', [trimmedRequired, Validators.maxLength(160)]],
    contactName: ['', [trimmedRequired, Validators.maxLength(351)]],
    contactEmail: ['', [trimmedRequired, Validators.email, Validators.maxLength(320)]],
    // Aucun pattern téléphonique : seule la présence est contrôlée à ce stade.
    contactPhone: ['', [trimmedRequired, Validators.maxLength(30)]],
  });

  private pendingExitDecision: {
    readonly promise: Promise<boolean>;
    resolve(value: boolean): void;
  } | null = null;
  private cancelRequested = false;

  constructor() {
    this.seo.apply({
      title: 'Demande d’adhésion — CNPM',
      description:
        'Parcours local présentant les informations attendues pour une future demande d’adhésion.',
      robots: 'noindex,nofollow',
      canonicalPath: '/adhesion',
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const rawStep = params.get('etape');
      const step = isStep(rawStep) ? rawStep : 'entreprise';
      this.activateStep(step);
      if (rawStep !== step) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { etape: step },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.dirty.set(true);
      if (this.attempted().has(this.current())) {
        this.errors.set(this.collect(this.current()));
      }
    });

    afterNextRender(() => this.pageTitle()?.nativeElement.focus(), { injector: this.injector });
  }

  protected fieldId(key: FieldKey): string {
    return `adhesion-${key}`;
  }

  protected helperId(key: FieldKey): string {
    return `adhesion-${key}-aide`;
  }

  protected errorId(key: FieldKey): string {
    return `adhesion-${key}-erreur`;
  }

  protected errorFor(key: FieldKey): string | null {
    if (!this.attempted().has(this.current())) {
      return null;
    }
    const control = this.form.controls[key];
    if (!control.invalid) {
      return null;
    }
    if (control.hasError('required')) {
      return `${FIELD_LABELS[key]} : renseignez une valeur.`;
    }
    if (control.hasError('email')) {
      return 'Adresse e-mail : utilisez une adresse au format valide.';
    }
    return `${FIELD_LABELS[key]} : la valeur est trop longue.`;
  }

  protected describedBy(key: FieldKey): string {
    return this.errorFor(key) ? `${this.helperId(key)} ${this.errorId(key)}` : this.helperId(key);
  }

  protected invalidAttr(key: FieldKey): string | null {
    return this.errorFor(key) ? 'true' : null;
  }

  /**
   * Le `<base href="/">` transforme un lien natif `#champ` en `/#champ`. Le résumé
   * partagé expose volontairement de telles ancres ; sur cette route imbriquée, on
   * conserve donc la page courante et on déplace explicitement le focus.
   */
  protected focusErrorField(event: Event): void {
    const target = event.target as HTMLElement | null;
    const link = target?.closest<HTMLAnchorElement>('a[href^="#"]');
    const fieldId = link?.hash.slice(1);
    if (!fieldId) {
      return;
    }
    const field = this.document.getElementById(decodeURIComponent(fieldId));
    if (!field) {
      return;
    }
    event.preventDefault();
    field.focus();
  }

  protected stepStatus(stepId: EnrollmentStepId): StepStatus {
    if (stepId === this.current()) {
      return 'current';
    }
    if (this.attempted().has(stepId) && this.collect(stepId).length > 0) {
      return 'error';
    }
    if (this.visited().has(stepId)) {
      return 'complete';
    }
    return 'todo';
  }

  protected stepStatusLabel(stepId: EnrollmentStepId): string {
    switch (this.stepStatus(stepId)) {
      case 'current':
        return 'Étape en cours';
      case 'complete':
        return 'Étape consultée';
      case 'error':
        return 'Étape à corriger';
      default:
        return 'Étape à venir';
    }
  }

  protected goTo(stepId: EnrollmentStepId): void {
    this.activateStep(stepId);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { etape: stepId },
      queryParamsHandling: 'merge',
    });
  }

  protected previous(): void {
    const index = this.currentIndex();
    if (index > 0) {
      this.goTo(STEPS[index - 1].id);
    }
  }

  protected onSubmit(): void {
    if (this.current() !== 'verification') {
      this.next();
      return;
    }
    this.createLocalConfirmation();
  }

  protected requestCancel(): void {
    if (!this.dirty()) {
      void this.router.navigate(['/']);
      return;
    }
    this.cancelRequested = true;
    this.showExitPrompt();
  }

  protected stay(): void {
    this.exitPrompt.set(false);
    this.cancelRequested = false;
    this.resolvePendingExit(false);
  }

  protected discardAndLeave(): void {
    this.exitPrompt.set(false);
    this.dirty.set(false);
    if (this.pendingExitDecision) {
      this.resolvePendingExit(true);
      return;
    }
    if (this.cancelRequested) {
      this.cancelRequested = false;
      void this.router.navigate(['/']);
    }
  }

  confirmNavigation(): boolean | Promise<boolean> {
    if (!this.dirty()) {
      return true;
    }
    this.showExitPrompt();
    if (this.pendingExitDecision) {
      return this.pendingExitDecision.promise;
    }
    let resolver: (value: boolean) => void = () => undefined;
    const promise = new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
    this.pendingExitDecision = { promise, resolve: resolver };
    return promise;
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
    }
  }

  protected reviewItems(): readonly CnpmDefinition[] {
    const values = this.form.getRawValue();
    return [
      { label: FIELD_LABELS.legalName, value: values.legalName.trim() || 'Non renseignée' },
      { label: FIELD_LABELS.tradeName, value: values.tradeName.trim() || 'Non renseigné' },
      { label: FIELD_LABELS.legalForm, value: values.legalForm.trim() || 'Non renseignée' },
      { label: FIELD_LABELS.rccm, value: values.rccm.trim() || 'Non renseignée' },
      { label: FIELD_LABELS.nif, value: values.nif.trim() || 'Non renseignée' },
      { label: FIELD_LABELS.contactName, value: values.contactName.trim() || 'Non renseigné' },
      { label: FIELD_LABELS.contactEmail, value: values.contactEmail.trim() || 'Non renseignée' },
      { label: FIELD_LABELS.contactPhone, value: values.contactPhone.trim() || 'Non renseigné' },
    ];
  }

  private next(): void {
    const step = this.current();
    this.markStepTouched(step);
    this.attempted.update((attempted) => new Set(attempted).add(step));
    const errors = this.collect(step);
    this.errors.set(errors);
    if (errors.length > 0) {
      return;
    }
    const index = this.currentIndex();
    if (index < STEPS.length - 1) {
      this.goTo(STEPS[index + 1].id);
    }
  }

  private createLocalConfirmation(): void {
    this.form.markAllAsTouched();
    this.attempted.set(new Set(STEPS.map((step) => step.id)));
    const firstInvalid = STEPS.find((step) => this.collect(step.id).length > 0);
    if (firstInvalid) {
      this.activateStep(firstInvalid.id);
      this.errors.set(this.collect(firstInvalid.id));
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { etape: firstInvalid.id },
        queryParamsHandling: 'merge',
      });
      return;
    }

    const confirmation = this.session.create(this.form.getRawValue());
    this.errors.set([]);
    this.dirty.set(false);
    void this.router.navigate(['/adhesion/confirmation'], {
      queryParams: { reference: confirmation.reference },
    });
  }

  private activateStep(stepId: EnrollmentStepId): void {
    this.current.set(stepId);
    this.visited.update((visited) => new Set(visited).add(stepId));
    this.errors.set(this.attempted().has(stepId) ? this.collect(stepId) : []);
  }

  private collect(stepId: EnrollmentStepId): readonly CnpmFieldError[] {
    return STEP_FIELDS[stepId].flatMap((key) => {
      const control = this.form.controls[key];
      if (!control.invalid) {
        return [];
      }
      const message = control.hasError('required')
        ? `${FIELD_LABELS[key]} : renseignez une valeur.`
        : control.hasError('email')
          ? 'Adresse e-mail : utilisez une adresse au format valide.'
          : `${FIELD_LABELS[key]} : la valeur est trop longue.`;
      return [{ fieldId: this.fieldId(key), message }];
    });
  }

  private markStepTouched(stepId: EnrollmentStepId): void {
    for (const key of STEP_FIELDS[stepId]) {
      this.form.controls[key].markAsTouched();
    }
  }

  private showExitPrompt(): void {
    this.exitPrompt.set(true);
    afterNextRender(() => this.exitPanel()?.nativeElement.focus(), { injector: this.injector });
  }

  private resolvePendingExit(value: boolean): void {
    const decision = this.pendingExitDecision;
    this.pendingExitDecision = null;
    decision?.resolve(value);
  }
}
