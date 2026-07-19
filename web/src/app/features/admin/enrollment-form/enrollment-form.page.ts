import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LucideChevronLeft, LucideChevronRight, LucideUpload } from '@lucide/angular';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { CheckboxComponent } from '../../../design-system/checkbox/checkbox.component';
import {
  DefinitionListComponent,
  type CnpmDefinition,
} from '../../../design-system/definition-list/definition-list.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import {
  InlineErrorSummaryComponent,
  type CnpmFieldError,
} from '../../../design-system/inline-error-summary/inline-error-summary.component';
import { OfflineNoticeComponent } from '../../../design-system/offline-notice/offline-notice.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { TextInputComponent } from '../../../design-system/text-input/text-input.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import {
  ENROLLMENT_GATEWAY,
  EnrollmentAccessError,
  type EnrollmentDocumentStatus,
  type EnrollmentDocumentType,
  type EnrollmentDraftValues,
  type EnrollmentOption,
  type EnrollmentRegistrationCheck,
  type EnrollmentStepId,
  type EnrollmentSubmission,
} from './enrollment-gateway';

/** Clé de champ du dossier ; sert d'ancre au résumé d'erreurs. */
type FieldKey = keyof EnrollmentDraftValues;

type ScreenState = 'loading' | 'error' | 'forbidden' | 'empty' | 'ready';
type SaveState = 'idle' | 'saving' | 'saved' | 'failed';
type SubmitState = 'idle' | 'submitting' | 'failed' | 'done';
type StepStatus = 'current' | 'complete' | 'error' | 'todo';

interface EnrollmentStep {
  readonly id: EnrollmentStepId;
  readonly label: string;
  readonly heading: string;
  readonly hint: string;
}

/** Pièce déposée, avec l'issue de son analyse. */
interface DocumentEntry {
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly status: EnrollmentDocumentStatus;
  readonly message: string;
}

const STEPS: readonly EnrollmentStep[] = [
  {
    id: 'identification',
    label: 'Identification',
    heading: 'Identification de l’entreprise',
    hint: 'Recopiez la raison sociale, le RCCM et le NIF tels qu’ils figurent sur les documents officiels. Aucun format n’est imposé par l’écran.',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    heading: 'Contact et adresse',
    hint: 'Le contact principal reçoit les notifications du dossier. Une seule adresse e-mail suffit.',
  },
  {
    id: 'category',
    label: 'Catégorie',
    heading: 'Catégorie et groupement',
    hint: 'La catégorie et le groupement proviennent du référentiel du back-office. En cas de doute, laissez le groupement vide.',
  },
  {
    id: 'contribution',
    label: 'Cotisation',
    heading: 'Modalités de cotisation',
    hint: 'Le montant de la cotisation n’est pas saisi ici : il est calculé par le back-office après examen du dossier.',
  },
  {
    id: 'documents',
    label: 'Documents',
    heading: 'Pièces justificatives',
    hint: 'Chaque pièce passe par une analyse antivirus avant d’être acceptée. Vous pouvez remplacer une pièce tant que le dossier n’est pas soumis.',
  },
  {
    id: 'review',
    label: 'Validation',
    heading: 'Récapitulatif et validation',
    hint: 'Relisez le dossier. Après soumission, la version examinée est verrouillée ; toute correction passera par le back-office.',
  },
];

/** Champs obligatoirement contrôlés avant de quitter chaque étape. */
const STEP_FIELDS: Readonly<Record<EnrollmentStepId, readonly FieldKey[]>> = {
  identification: ['legalName', 'tradeName', 'legalForm', 'rccm', 'nif', 'creationDate'],
  contacts: ['contactName', 'contactRole', 'contactEmail', 'contactPhone', 'address', 'city'],
  category: ['category', 'group', 'workforce'],
  contribution: ['periodicity', 'startDate', 'notes'],
  documents: [],
  review: ['certified'],
};

const FIELD_LABELS: Readonly<Record<FieldKey, string>> = {
  legalName: 'Raison sociale',
  tradeName: 'Nom commercial',
  legalForm: 'Forme juridique',
  rccm: 'Numéro RCCM',
  nif: 'Numéro d’identification fiscale (NIF)',
  creationDate: 'Date de création',
  contactName: 'Nom du contact principal',
  contactRole: 'Fonction du contact',
  contactEmail: 'Adresse e-mail',
  contactPhone: 'Téléphone',
  address: 'Adresse postale',
  city: 'Ville ou localité',
  category: 'Catégorie d’entreprise',
  group: 'Groupement professionnel',
  workforce: 'Effectif déclaré',
  periodicity: 'Périodicité de cotisation',
  startDate: 'Date d’effet souhaitée',
  notes: 'Observations',
  certified: 'Attestation d’exactitude',
};

const AUTOSAVE_DELAY_MS = 1200;

/**
 * BO-009 — formulaire d’enrôlement.
 *
 * Six étapes, un seul formulaire réactif : l’état complet vit dans le `FormGroup`,
 * si bien que revenir en arrière ne perd jamais une saisie — critère d’acceptation de
 * la fiche. Les étapes ne sont pas des sous-formulaires ; elles ne font que découper
 * l’affichage.
 *
 * La validation est progressive : elle se déclenche au passage à l’étape suivante ou à
 * la soumission, jamais pendant la frappe, et n’empêche à aucun moment l’enregistrement
 * du brouillon.
 *
 * `rccm` et `nif` sont du texte libre. Un masque de format rejetterait des références
 * officielles valides que l’écran ne connaît pas ; le contrôle appartient au service de
 * vérification et au back-office.
 *
 * Le port est fourni par la route afin que l'assemblage puisse sélectionner un
 * adaptateur local ou HTTP sans être masqué par le composant.
 */
@Component({
  selector: 'cnpm-enrollment-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Une fermeture d'onglet avec des modifications non enregistrées demande confirmation
  // (critère d'acceptation de la fiche). Le navigateur porte lui-même la boîte de
  // dialogue : seul le signalement est de notre ressort.
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  imports: [
    DatePipe,
    ReactiveFormsModule,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    CheckboxComponent,
    DefinitionListComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    InlineErrorSummaryComponent,
    OfflineNoticeComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TextInputComponent,
    LucideChevronLeft,
    LucideChevronRight,
    LucideUpload,
  ],
  templateUrl: './enrollment-form.page.html',
  styleUrl: './enrollment-form.page.scss',
})
export class EnrollmentFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly gateway = inject(ENROLLMENT_GATEWAY);
  private readonly router = inject(Router);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly steps = STEPS;
  protected readonly fieldLabels = FIELD_LABELS;

  protected readonly form = this.fb.group({
    legalName: ['', [Validators.required, Validators.maxLength(160)]],
    tradeName: ['', [Validators.maxLength(160)]],
    legalForm: ['', [Validators.required]],
    // Aucun `pattern` : la fiche impose du texte libre pour le RCCM et le NIF.
    rccm: ['', [Validators.required, Validators.maxLength(60)]],
    nif: ['', [Validators.required, Validators.maxLength(60)]],
    creationDate: [''],
    contactName: ['', [Validators.required, Validators.maxLength(120)]],
    contactRole: ['', [Validators.maxLength(120)]],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', [Validators.required, Validators.maxLength(40)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['', [Validators.required]],
    group: [''],
    workforce: ['', [Validators.maxLength(10)]],
    periodicity: ['', [Validators.required]],
    startDate: ['', [Validators.required]],
    notes: ['', [Validators.maxLength(500)]],
    certified: [false, [Validators.requiredTrue]],
  });

  protected readonly current = signal<EnrollmentStepId>('identification');
  protected readonly visited = signal<ReadonlySet<EnrollmentStepId>>(
    new Set<EnrollmentStepId>(['identification']),
  );
  /** Étapes dont l’utilisateur a tenté de sortir : seules celles-ci affichent leurs erreurs. */
  protected readonly attempted = signal<ReadonlySet<EnrollmentStepId>>(new Set<EnrollmentStepId>());

  protected readonly errors = signal<readonly CnpmFieldError[]>([]);
  protected readonly saveState = signal<SaveState>('idle');
  protected readonly savedAt = signal<string | null>(null);
  protected readonly submitState = signal<SubmitState>('idle');
  protected readonly submission = signal<EnrollmentSubmission | null>(null);
  protected readonly registrationCheck = signal<EnrollmentRegistrationCheck | null>(null);
  protected readonly checkingRegistration = signal(false);
  protected readonly cancelPending = signal(false);
  /** Vrai dès la première frappe non sauvegardée ; garde le signalement de fermeture. */
  protected readonly dirty = signal(false);

  /** `undefined` explicite dans le type : une pièce absente est un cas normal, pas un trou. */
  private readonly documents = signal<Readonly<Record<string, DocumentEntry | undefined>>>({});
  private readonly retryTick = signal(0);
  private hydrated = false;
  private pendingExitDecision: {
    readonly promise: Promise<boolean>;
    resolve(value: boolean): void;
  } | null = null;

  /**
   * `switchMap` sur un compteur de relance : « Réessayer » réémet la requête sans
   * recharger la page, comme l’exige la matrice `loading-empty-error.md`. Un refus de
   * droit est distingué d’une panne temporaire — le premier ne se réessaie pas.
   */
  private readonly result = toSignal(
    toObservable(this.retryTick).pipe(
      switchMap(() =>
        this.gateway.load().pipe(
          map((context) => ({ kind: 'ready' as const, context })),
          catchError((error: unknown) =>
            of(
              error instanceof EnrollmentAccessError
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

  private readonly context = computed(() => {
    const result = this.result();
    return result.kind === 'ready' ? result.context : null;
  });

  protected readonly reference = computed(() => this.context()?.reference ?? null);
  protected readonly legalForms = computed<readonly EnrollmentOption[]>(
    () => this.reference()?.legalForms ?? [],
  );
  protected readonly categories = computed<readonly EnrollmentOption[]>(
    () => this.reference()?.categories ?? [],
  );
  protected readonly groups = computed<readonly EnrollmentOption[]>(
    () => this.reference()?.groups ?? [],
  );
  protected readonly periodicities = computed<readonly EnrollmentOption[]>(
    () => this.reference()?.periodicities ?? [],
  );
  protected readonly documentTypes = computed<readonly EnrollmentDocumentType[]>(
    () => this.reference()?.documentTypes ?? [],
  );

  protected readonly screenState = computed<ScreenState>(() => {
    const result = this.result();
    if (result.kind === 'loading') {
      return 'loading';
    }
    if (result.kind === 'error') {
      return 'error';
    }
    if (result.kind === 'forbidden') {
      return 'forbidden';
    }
    // Un référentiel vide n'est pas une panne : c'est un dossier qu'on ne peut pas
    // ouvrir faute de nomenclature. Le confondre avec une erreur inviterait à
    // « réessayer » indéfiniment une requête qui répond correctement.
    const { reference } = result.context;
    return reference.categories.length === 0 || reference.documentTypes.length === 0
      ? 'empty'
      : 'ready';
  });

  protected readonly currentStep = computed<EnrollmentStep>(
    () => STEPS.find((step) => step.id === this.current()) ?? STEPS[0],
  );
  protected readonly currentIndex = computed(() =>
    STEPS.findIndex((step) => step.id === this.current()),
  );
  protected readonly isFirstStep = computed(() => this.currentIndex() <= 0);
  protected readonly isLastStep = computed(() => this.currentIndex() >= STEPS.length - 1);

  /** Le dossier est verrouillé après soumission : la version examinée ne bouge plus. */
  protected readonly locked = computed(() => this.submitState() === 'done');

  constructor() {
    // Reprise d'un brouillon : les valeurs sont replacées sans réémettre d'événement,
    // faute de quoi l'hydratation déclencherait aussitôt une autosauvegarde qui
    // réécrirait le brouillon qu'on vient de lire.
    effect(() => {
      const context = this.context();
      if (!context || this.hydrated) {
        return;
      }
      this.hydrated = true;
      const draft = context.draft;
      if (!draft) {
        return;
      }
      this.form.patchValue(draft.values, { emitEvent: false });
      this.savedAt.set(draft.savedAt);
      this.saveState.set('saved');
      // À la reprise, on revient à la première étape incomplète — pattern
      // `forms-and-validation.md`. Repartir de l'étape 1 ferait relire six écrans
      // déjà remplis.
      this.goTo(this.firstIncompleteStep());
    });

    this.form.valueChanges
      .pipe(debounceTime(AUTOSAVE_DELAY_MS), takeUntilDestroyed())
      .subscribe(() => this.autosave());

    // Les erreurs déjà affichées suivent la frappe : une fois l'étape signalée, corriger
    // un champ doit faire disparaître sa ligne du résumé sans nouvelle soumission.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.dirty.set(true);
      if (this.attempted().has(this.current())) {
        this.refreshErrors(this.current());
      }
    });
  }

  // ---------------------------------------------------------------- identifiants

  /**
   * Ancre du champ, cible des liens du résumé d’erreurs.
   *
   * Les champs natifs (listes, dates, zone de texte) portent cet identifiant
   * eux-mêmes : le lien y place directement le focus. Les champs du design system
   * génèrent leur propre `id` interne, hors de portée de l’écran ; leur conteneur porte
   * alors l’ancre avec `tabindex="-1"`, et le focus atterrit sur le libellé du champ.
   */
  protected fieldId(key: FieldKey): string {
    return `champ-${key}`;
  }

  protected errorId(key: FieldKey): string {
    return `erreur-${key}`;
  }

  protected documentFieldId(typeId: string): string {
    return `piece-${typeId}`;
  }

  // ---------------------------------------------------------------- validation

  /** Message d’erreur du champ, ou `undefined` tant que son étape n’a pas été signalée. */
  protected errorFor(key: FieldKey): string | undefined {
    const control = this.form.controls[key];
    if (control.valid || !this.attempted().has(this.stepOf(key))) {
      return undefined;
    }
    return this.messageFor(key, control);
  }

  protected describedBy(key: FieldKey): string | null {
    return this.errorFor(key) ? this.errorId(key) : null;
  }

  protected invalidAttr(key: FieldKey): 'true' | null {
    return this.errorFor(key) ? 'true' : null;
  }

  private stepOf(key: FieldKey): EnrollmentStepId {
    const step = STEPS.find((candidate) => STEP_FIELDS[candidate.id].includes(key));
    return step?.id ?? 'identification';
  }

  private messageFor(key: FieldKey, control: AbstractControl): string {
    const label = FIELD_LABELS[key];
    if (control.hasError('required')) {
      return key === 'certified'
        ? 'Cochez l’attestation d’exactitude pour soumettre le dossier.'
        : `${label} : ce champ est obligatoire.`;
    }
    if (control.hasError('email')) {
      return `${label} : saisissez une adresse e-mail valide.`;
    }
    if (control.hasError('maxlength')) {
      return `${label} : la saisie est trop longue.`;
    }
    return `${label} : la saisie n’est pas valide.`;
  }

  /**
   * Erreurs d’une étape, dans l’ordre d’affichage des champs.
   *
   * L’étape des pièces n’a pas de contrôle de formulaire : ses manques sont dérivés des
   * documents obligatoires effectivement acceptés.
   */
  private collect(stepId: EnrollmentStepId): readonly CnpmFieldError[] {
    const errors: CnpmFieldError[] = [];
    for (const key of STEP_FIELDS[stepId]) {
      const control = this.form.controls[key];
      if (control.invalid) {
        errors.push({ fieldId: this.fieldId(key), message: this.messageFor(key, control) });
      }
    }
    if (stepId === 'documents') {
      for (const type of this.missingDocuments()) {
        errors.push({
          fieldId: this.documentFieldId(type.id),
          message: `${type.label} : cette pièce est obligatoire.`,
        });
      }
    }
    return errors;
  }

  private refreshErrors(stepId: EnrollmentStepId): void {
    this.errors.set(this.collect(stepId));
  }

  private missingDocuments(): readonly EnrollmentDocumentType[] {
    const entries = this.documents();
    return this.documentTypes().filter(
      (type) => type.required && entries[type.id]?.status !== 'accepted',
    );
  }

  // ---------------------------------------------------------------- étapes

  protected stepStatus(stepId: EnrollmentStepId): StepStatus {
    if (stepId === this.current()) {
      return 'current';
    }
    if (this.attempted().has(stepId) && this.collect(stepId).length > 0) {
      return 'error';
    }
    if (this.visited().has(stepId) && this.collect(stepId).length === 0) {
      return 'complete';
    }
    return 'todo';
  }

  /** Le statut est toujours doublé d’un libellé : jamais porté par la seule couleur. */
  protected stepStatusLabel(stepId: EnrollmentStepId): string {
    switch (this.stepStatus(stepId)) {
      case 'current':
        return 'Étape en cours';
      case 'complete':
        return 'Terminée';
      case 'error':
        return 'À corriger';
      default:
        return 'À compléter';
    }
  }

  protected completedSteps(): number {
    return STEPS.filter((step) => this.stepStatus(step.id) === 'complete').length;
  }

  protected progressPercent(): number {
    return Math.round((this.completedSteps() / STEPS.length) * 100);
  }

  private firstIncompleteStep(): EnrollmentStepId {
    const step = STEPS.find((candidate) => this.collect(candidate.id).length > 0);
    return step?.id ?? STEPS[0].id;
  }

  /**
   * Navigation libre entre étapes.
   *
   * Aucune étape n’est verrouillée : le pattern interdit d’empêcher le retour en
   * arrière, et interdire la marche avant piégerait un opérateur qui attend une pièce
   * pour compléter une étape antérieure.
   */
  protected goTo(stepId: EnrollmentStepId): void {
    this.current.set(stepId);
    this.visited.update((current) => new Set(current).add(stepId));
    // Une étape simplement ouverte n'affiche pas ses manques : signaler « obligatoire »
    // sur des champs que l'utilisateur n'a pas encore atteints transformerait la
    // découverte du formulaire en liste de reproches.
    this.errors.set(this.attempted().has(stepId) ? this.collect(stepId) : []);
  }

  protected previous(): void {
    const index = this.currentIndex();
    if (index > 0) {
      this.goTo(STEPS[index - 1].id);
    }
  }

  /** Passe à l’étape suivante après contrôle ; le résumé d’erreurs prend le focus sinon. */
  protected next(): void {
    const stepId = this.current();
    this.markStepTouched(stepId);
    this.attempted.update((current) => new Set(current).add(stepId));
    const errors = this.collect(stepId);
    this.errors.set(errors);
    if (errors.length > 0) {
      return;
    }
    const index = this.currentIndex();
    if (index < STEPS.length - 1) {
      this.goTo(STEPS[index + 1].id);
    }
  }

  private markStepTouched(stepId: EnrollmentStepId): void {
    for (const key of STEP_FIELDS[stepId]) {
      this.form.controls[key].markAsTouched();
    }
  }

  // ---------------------------------------------------------------- brouillon

  private autosave(): void {
    if (this.screenState() !== 'ready' || this.locked() || this.submitState() === 'submitting') {
      return;
    }
    this.persistDraft();
  }

  /** Enregistrement explicite : jamais bloqué par la validation, même sur un dossier incomplet. */
  protected saveDraftNow(): void {
    if (this.screenState() !== 'ready' || this.locked()) {
      return;
    }
    this.persistDraft();
  }

  protected saveAndLeave(): void {
    if (this.screenState() !== 'ready' || this.locked()) {
      return;
    }
    this.persistDraft(() => this.approveExit());
  }

  private persistDraft(onSuccess?: () => void): void {
    this.saveState.set('saving');
    this.gateway.saveDraft(this.form.getRawValue()).subscribe({
      next: (draft) => {
        this.savedAt.set(draft.savedAt);
        this.saveState.set('saved');
        this.dirty.set(false);
        onSuccess?.();
      },
      error: () => this.saveState.set('failed'),
    });
  }

  protected saveStateLabel(): string {
    switch (this.saveState()) {
      case 'saving':
        return 'Enregistrement du brouillon…';
      case 'saved':
        return 'Brouillon enregistré';
      case 'failed':
        return 'Le brouillon n’a pas pu être enregistré. Vos saisies restent à l’écran.';
      default:
        return 'Brouillon non encore enregistré';
    }
  }

  // ---------------------------------------------------------------- RCCM / NIF

  /**
   * Contrôle RCCM/NIF auprès du service, « si disponible ».
   *
   * L’écran affiche l’issue datée telle que le service la rend et ne conclut jamais à
   * sa place : un « vérifié » fabriqué côté navigateur ferait passer un dossier non
   * contrôlé pour un dossier contrôlé.
   */
  protected checkRegistration(): void {
    const { rccm, nif } = this.form.getRawValue();
    if (!rccm.trim() && !nif.trim()) {
      return;
    }
    this.checkingRegistration.set(true);
    this.gateway.checkRegistration({ rccm, nif }).subscribe({
      next: (check) => {
        this.registrationCheck.set(check);
        this.checkingRegistration.set(false);
      },
      error: () => {
        this.registrationCheck.set(null);
        this.checkingRegistration.set(false);
      },
    });
  }

  protected checkTone(outcome: EnrollmentRegistrationCheck['outcome']): CnpmBadgeTone {
    switch (outcome) {
      case 'verified':
        return 'success';
      case 'not-found':
        return 'error';
      default:
        return 'warning';
    }
  }

  protected checkLabel(outcome: EnrollmentRegistrationCheck['outcome']): string {
    switch (outcome) {
      case 'verified':
        return 'Références confirmées';
      case 'not-found':
        return 'Références introuvables';
      default:
        return 'Vérification indisponible';
    }
  }

  // ---------------------------------------------------------------- pièces

  protected documentEntry(typeId: string): DocumentEntry | null {
    return this.documents()[typeId] ?? null;
  }

  protected attachedDocuments(): readonly EnrollmentDocumentType[] {
    const entries = this.documents();
    return this.documentTypes().filter((type) => entries[type.id] !== undefined);
  }

  protected acceptAttribute(type: EnrollmentDocumentType): string {
    return type.acceptedExtensions.join(',');
  }

  protected maxSizeLabel(type: EnrollmentDocumentType): string {
    return `${Math.round(type.maxSizeBytes / (1024 * 1024))} Mo`;
  }

  protected documentTone(status: EnrollmentDocumentStatus): CnpmBadgeTone {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'info';
    }
  }

  protected documentStatusLabel(status: EnrollmentDocumentStatus): string {
    switch (status) {
      case 'accepted':
        return 'Pièce acceptée';
      case 'rejected':
        return 'Pièce refusée';
      default:
        return 'Analyse en cours';
    }
  }

  /**
   * Dépôt d’une pièce.
   *
   * Extension et taille sont éprouvées avant tout envoi : c’est un confort, pas une
   * garantie — `.claude/rules/security.md` fait du contrôle serveur l’autorité, et
   * l’analyse antivirus reste à la charge du service.
   */
  protected onFileSelected(type: EnrollmentDocumentType, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!type.acceptedExtensions.includes(extension)) {
      this.setDocument(type.id, {
        fileName: file.name,
        sizeBytes: file.size,
        status: 'rejected',
        message: `Format non admis. Formats acceptés : ${type.acceptedExtensions.join(', ')}.`,
      });
      input.value = '';
      return;
    }
    if (file.size > type.maxSizeBytes) {
      this.setDocument(type.id, {
        fileName: file.name,
        sizeBytes: file.size,
        status: 'rejected',
        message: `Fichier trop volumineux. Taille maximale : ${this.maxSizeLabel(type)}.`,
      });
      input.value = '';
      return;
    }

    this.gateway
      .scanDocument({ typeId: type.id, fileName: file.name, sizeBytes: file.size })
      .subscribe({
        next: (result) =>
          this.setDocument(type.id, {
            fileName: file.name,
            sizeBytes: file.size,
            status: result.status,
            message: result.message,
          }),
        error: () =>
          this.setDocument(type.id, {
            fileName: file.name,
            sizeBytes: file.size,
            status: 'rejected',
            message: 'L’analyse du fichier a échoué. Réessayez dans un instant.',
          }),
      });
    // Le champ natif est vidé pour que redéposer deux fois le même fichier déclenche
    // bien un nouvel événement `change`.
    input.value = '';
  }

  protected removeDocument(typeId: string): void {
    this.documents.update((current) => {
      const next = { ...current };
      delete next[typeId];
      return next;
    });
    this.dirty.set(true);
    if (this.attempted().has('documents')) {
      this.refreshErrors(this.current());
    }
  }

  private setDocument(typeId: string, entry: DocumentEntry): void {
    this.documents.update((current) => ({ ...current, [typeId]: entry }));
    this.dirty.set(true);
    if (this.attempted().has('documents') && this.current() === 'documents') {
      this.refreshErrors('documents');
    }
  }

  // ---------------------------------------------------------------- récapitulatif

  private entries(keys: readonly FieldKey[]): readonly CnpmDefinition[] {
    const values = this.form.getRawValue();
    const items: CnpmDefinition[] = [];
    for (const key of keys) {
      const raw = values[key];
      if (typeof raw !== 'string' || raw.trim().length === 0) {
        // Une entrée vide laisserait un espace mort dans la liste de définitions ;
        // le composant attend de ne recevoir que les valeurs renseignées.
        continue;
      }
      items.push({ label: FIELD_LABELS[key], value: this.displayValue(key, raw) });
    }
    return items;
  }

  private displayValue(key: FieldKey, raw: string): string {
    switch (key) {
      case 'legalForm':
        return this.labelOf(this.legalForms(), raw);
      case 'category':
        return this.labelOf(this.categories(), raw);
      case 'group':
        return this.labelOf(this.groups(), raw);
      case 'periodicity':
        return this.labelOf(this.periodicities(), raw);
      default:
        return raw;
    }
  }

  private labelOf(options: readonly EnrollmentOption[], id: string): string {
    return options.find((option) => option.id === id)?.label ?? id;
  }

  protected identificationRecap(): readonly CnpmDefinition[] {
    return this.entries(STEP_FIELDS.identification);
  }

  protected contactsRecap(): readonly CnpmDefinition[] {
    return this.entries(STEP_FIELDS.contacts);
  }

  protected membershipRecap(): readonly CnpmDefinition[] {
    return [...this.entries(STEP_FIELDS.category), ...this.entries(STEP_FIELDS.contribution)];
  }

  // ---------------------------------------------------------------- soumission

  /**
   * Soumission du formulaire.
   *
   * L’envoi par la touche Entrée depuis une étape intermédiaire ne soumet pas le
   * dossier : il équivaut à « Suivant ». Sans cette distinction, une frappe dans un
   * champ de l’étape 1 déposerait un dossier vide.
   */
  protected onSubmit(): void {
    if (this.locked()) {
      return;
    }
    if (!this.isLastStep()) {
      this.next();
      return;
    }
    this.submitDossier();
  }

  private submitDossier(): void {
    this.form.markAllAsTouched();
    this.attempted.set(new Set(STEPS.map((step) => step.id)));

    const firstFaulty = STEPS.find((step) => this.collect(step.id).length > 0);
    if (firstFaulty) {
      // Le résumé n'énumère que les manques de l'étape ouverte : ses liens pointent
      // vers des champs réellement affichés. Lister les erreurs des six étapes
      // produirait des ancres mortes, puisque les autres étapes ne sont pas rendues.
      // Les étapes restantes sont signalées « À corriger » dans le stepper, donc rien
      // n'est caché. Le résumé prend le focus de lui-même.
      this.current.set(firstFaulty.id);
      this.visited.update((current) => new Set(current).add(firstFaulty.id));
      this.errors.set(this.collect(firstFaulty.id));
      return;
    }
    this.errors.set([]);

    this.submitState.set('submitting');
    this.gateway.submit(this.form.getRawValue()).subscribe({
      next: (submission) => {
        this.submission.set(submission);
        this.submitState.set('done');
        this.dirty.set(false);
        // La version examinée est verrouillée : le formulaire n'accepte plus de
        // modification, conformément à la fiche.
        this.form.disable({ emitEvent: false });
      },
      error: () => this.submitState.set('failed'),
    });
  }

  // ---------------------------------------------------------------- sortie

  /**
   * Point d'entrée du garde de route. La décision est rendue par la confirmation
   * intégrée à l'écran : aucun `window.confirm` non stylable et aucune perte silencieuse.
   */
  confirmNavigation(): boolean | Promise<boolean> {
    if (!this.dirty() || this.locked()) {
      return true;
    }

    this.cancelPending.set(true);
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

  protected requestCancel(): void {
    if (this.dirty() && !this.locked()) {
      this.cancelPending.set(true);
      return;
    }
    this.leave();
  }

  protected dismissCancel(): void {
    this.cancelPending.set(false);
    this.resolvePendingExit(false);
  }

  protected leave(): void {
    this.approveExit();
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty() && !this.locked()) {
      event.preventDefault();
    }
  }

  protected retry(): void {
    this.retryTick.update((tick) => tick + 1);
  }

  private approveExit(): void {
    this.cancelPending.set(false);
    this.dirty.set(false);
    if (this.pendingExitDecision) {
      this.resolvePendingExit(true);
      return;
    }
    void this.router.navigate(['/admin/members']);
  }

  private resolvePendingExit(value: boolean): void {
    const decision = this.pendingExitDecision;
    this.pendingExitDecision = null;
    decision?.resolve(value);
  }
}
