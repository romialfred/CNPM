import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, filter, map, of, switchMap } from 'rxjs';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { EmptyStateComponent } from '../../../design-system/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../design-system/error-state/error-state.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { SkeletonComponent } from '../../../design-system/skeleton/skeleton.component';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { MEMBER_SHOWCASE_GATEWAY, type MemberShowcaseDraft } from './member-showcase-gateway';
import { memberShowcaseIssues } from './member-showcase-validation';

type EditorState = 'loading' | 'ready' | 'empty' | 'error' | 'unavailable';
type SaveState = 'idle' | 'saving' | 'saved' | 'invalid' | 'error';

const SECTIONS = [
  { id: 'identity', label: 'Identité', available: true },
  { id: 'hero', label: 'Hero', available: true },
  { id: 'about', label: 'À propos', available: true },
  { id: 'activities', label: 'Activités', available: true },
  { id: 'projects', label: 'Réalisations', available: true },
  { id: 'gallery', label: 'Galerie', available: false },
  { id: 'certifications', label: 'Certifications', available: false },
  { id: 'documents', label: 'Documents', available: false },
  { id: 'news', label: 'Actualités', available: false },
  { id: 'contacts', label: 'Contacts', available: false },
  { id: 'seo', label: 'SEO', available: true },
  { id: 'publication', label: 'Publication', available: false },
] as const;

/** MP-015 — atelier local de brouillon, sans écriture serveur ni capacité de publication. */
@Component({
  selector: 'cnpm-member-showcase-editor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MemberPortalShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './member-showcase-editor.page.html',
  styleUrl: './member-showcase-editor.page.scss',
})
export class MemberShowcaseEditorPage {
  private readonly gateway = inject(MEMBER_SHOWCASE_GATEWAY);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageHeader = viewChild(PageHeaderComponent);
  private readonly validationSummary = viewChild<ElementRef<HTMLElement>>('validationSummary');
  private hydrated = false;

  protected readonly sections = SECTIONS;
  protected readonly state = signal<EditorState>('loading');
  protected readonly saveState = signal<SaveState>('idle');
  protected readonly draft = signal<MemberShowcaseDraft | null>(null);
  protected readonly validationChecked = signal(false);
  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    sector: ['', [Validators.required, Validators.maxLength(120)]],
    location: ['', [Validators.required, Validators.maxLength(160)]],
    tagline: ['', [Validators.maxLength(80)]],
    summary: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(600)]],
    employeeRange: ['', [Validators.required, Validators.maxLength(40)]],
    foundedYear: [2021, [Validators.min(1800), Validators.max(2100)]],
    legalForm: ['', [Validators.required, Validators.maxLength(80)]],
    activityOne: ['', [Validators.maxLength(120)]],
    activityTwo: ['', [Validators.maxLength(120)]],
    activityThree: ['', [Validators.maxLength(120)]],
    projectTitleOne: ['', [Validators.required, Validators.maxLength(120)]],
    projectSummaryOne: ['', [Validators.maxLength(300)]],
    projectCategoryOne: ['', [Validators.maxLength(80)]],
    projectTitleTwo: ['', [Validators.required, Validators.maxLength(120)]],
    projectSummaryTwo: ['', [Validators.maxLength(300)]],
    projectCategoryTwo: ['', [Validators.maxLength(80)]],
    seoTitle: ['', [Validators.required, Validators.maxLength(60)]],
    seoDescription: ['', [Validators.required, Validators.maxLength(160)]],
  });
  protected readonly issues = computed(() => {
    const draft = this.draft();
    return draft ? memberShowcaseIssues(draft) : [];
  });
  protected readonly saveLabel = computed(() => {
    switch (this.saveState()) {
      case 'saving':
        return 'Enregistrement local en cours…';
      case 'saved':
        return 'Brouillon local enregistré dans ce navigateur.';
      case 'invalid':
        return 'Brouillon local incomplet enregistré pour reprise.';
      case 'error':
        return 'Le stockage local a échoué ; les modifications restent dans cette page.';
      default:
        return 'Brouillon local chargé.';
    }
  });

  constructor() {
    this.load();
    this.form.valueChanges
      .pipe(
        debounceTime(350),
        filter(() => this.hydrated),
        map(() => this.buildDraft()),
        switchMap((draft) => {
          this.saveState.set('saving');
          return this.gateway.storeLocalDraft(draft).pipe(
            map((stored) => ({ kind: 'stored' as const, stored })),
            catchError(() => of({ kind: 'error' as const })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.kind === 'error') {
          this.saveState.set('error');
          return;
        }
        this.draft.set(result.stored);
        this.saveState.set(memberShowcaseIssues(result.stored).length ? 'invalid' : 'saved');
      });
  }

  protected retry(): void {
    this.load();
  }

  protected verifyDraft(): void {
    this.form.markAllAsTouched();
    this.validationChecked.set(true);
    this.draft.set(this.buildDraft());
    afterNextRender(() => this.validationSummary()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  private load(): void {
    this.hydrated = false;
    this.state.set('loading');
    this.gateway.loadDraft('MP-015').subscribe({
      next: (draft) => {
        if (!draft) {
          this.state.set('empty');
          return;
        }
        this.draft.set(draft);
        this.hydrate(draft);
        this.state.set('ready');
        this.hydrated = true;
        afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
      },
      error: (error: unknown) => {
        this.state.set(error instanceof UnavailableHttpFeatureError ? 'unavailable' : 'error');
        afterNextRender(() => this.pageHeader()?.focusTitle(), { injector: this.injector });
      },
    });
  }

  private hydrate(draft: MemberShowcaseDraft): void {
    const [activityOne = '', activityTwo = '', activityThree = ''] = draft.activities;
    const [projectOne, projectTwo] = draft.projects;
    this.form.setValue(
      {
        name: draft.name,
        slug: draft.slug,
        sector: draft.sector,
        location: draft.location,
        tagline: draft.tagline,
        summary: draft.summary,
        employeeRange: draft.employeeRange,
        foundedYear: draft.foundedYear,
        legalForm: draft.legalForm,
        activityOne,
        activityTwo,
        activityThree,
        projectTitleOne: projectOne?.title ?? '',
        projectSummaryOne: projectOne?.summary ?? '',
        projectCategoryOne: projectOne?.category ?? '',
        projectTitleTwo: projectTwo?.title ?? '',
        projectSummaryTwo: projectTwo?.summary ?? '',
        projectCategoryTwo: projectTwo?.category ?? '',
        seoTitle: draft.seo.title,
        seoDescription: draft.seo.description,
      },
      { emitEvent: false },
    );
  }

  private buildDraft(): MemberShowcaseDraft {
    const values = this.form.getRawValue();
    const previous = this.draft();
    return {
      version: previous?.version ?? 1,
      slug: values.slug.trim(),
      name: values.name.trim(),
      tagline: values.tagline.trim(),
      sector: values.sector.trim(),
      location: values.location.trim(),
      employeeRange: values.employeeRange.trim(),
      foundedYear: values.foundedYear,
      legalForm: values.legalForm.trim(),
      verificationStatus: 'UNVERIFIED',
      summary: values.summary.trim(),
      activities: [values.activityOne, values.activityTwo, values.activityThree].map((value) =>
        value.trim(),
      ),
      projects: [
        {
          title: values.projectTitleOne.trim(),
          summary: values.projectSummaryOne.trim(),
          category: values.projectCategoryOne.trim(),
        },
        {
          title: values.projectTitleTwo.trim(),
          summary: values.projectSummaryTwo.trim(),
          category: values.projectCategoryTwo.trim(),
        },
      ],
      certifications: [],
      seo: {
        title: values.seoTitle.trim(),
        description: values.seoDescription.trim(),
        allowIndexing: false,
      },
      publication: {
        status: 'DRAFT',
        lastSavedAt: previous?.publication.lastSavedAt ?? null,
        scheduledAt: null,
      },
      disclosure:
        previous?.disclosure ??
        'Brouillon local conservé dans ce navigateur, sans contenu publié.',
    };
  }
}
