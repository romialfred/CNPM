import type { MemberShowcaseDraft } from './member-showcase-gateway';

export interface MemberShowcaseIssue {
  readonly id: string;
  readonly section: 'identity' | 'hero' | 'about' | 'activities' | 'projects' | 'seo';
  readonly label: string;
  readonly description: string;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Limites issues du schéma et du guide éditorial, sans règle métier inventée. */
export function memberShowcaseIssues(draft: MemberShowcaseDraft): readonly MemberShowcaseIssue[] {
  const issues: MemberShowcaseIssue[] = [];
  required(issues, draft.name, 120, 'name', 'identity', 'Nom', '2 à 120 caractères requis.');
  if (!SLUG.test(draft.slug)) {
    issues.push({
      id: 'slug',
      section: 'identity',
      label: 'Slug',
      description: 'Utilisez des minuscules, chiffres et tirets simples.',
    });
  }
  optional(issues, draft.tagline, 80, 'tagline', 'hero', 'Phrase de présentation');
  required(issues, draft.sector, 120, 'sector', 'identity', 'Secteur', '120 caractères maximum.');
  required(
    issues,
    draft.location,
    160,
    'location',
    'identity',
    'Localisation',
    '160 caractères maximum.',
  );
  required(issues, draft.summary, 600, 'summary', 'about', 'Résumé', '600 caractères maximum.');
  if (draft.foundedYear < 1800 || draft.foundedYear > 2100) {
    issues.push({
      id: 'foundedYear',
      section: 'about',
      label: 'Année de création',
      description: 'Valeur attendue entre 1800 et 2100.',
    });
  }
  if (draft.activities.length > 12) {
    issues.push({
      id: 'activities',
      section: 'activities',
      label: 'Activités',
      description: '12 activités maximum.',
    });
  }
  draft.activities.forEach((activity, index) =>
    optional(issues, activity, 120, `activity-${index + 1}`, 'activities', `Activité ${index + 1}`),
  );
  if (draft.projects.length > 24) {
    issues.push({
      id: 'projects',
      section: 'projects',
      label: 'Réalisations',
      description: '24 réalisations maximum.',
    });
  }
  draft.projects.forEach((project, index) => {
    required(
      issues,
      project.title,
      120,
      `project-title-${index + 1}`,
      'projects',
      `Titre de réalisation ${index + 1}`,
      '120 caractères maximum.',
    );
    optional(
      issues,
      project.summary,
      300,
      `project-summary-${index + 1}`,
      'projects',
      `Résumé de réalisation ${index + 1}`,
    );
    optional(
      issues,
      project.category,
      80,
      `project-category-${index + 1}`,
      'projects',
      `Catégorie de réalisation ${index + 1}`,
    );
  });
  required(issues, draft.seo.title, 60, 'seoTitle', 'seo', 'Métatitre', '60 caractères maximum.');
  required(
    issues,
    draft.seo.description,
    160,
    'seoDescription',
    'seo',
    'Métadescription',
    '160 caractères maximum.',
  );
  return issues;
}

function required(
  issues: MemberShowcaseIssue[],
  value: string,
  maxLength: number,
  id: string,
  section: MemberShowcaseIssue['section'],
  label: string,
  description: string,
): void {
  const length = value.trim().length;
  if (length < 2 || length > maxLength) {
    issues.push({ id, section, label, description });
  }
}

function optional(
  issues: MemberShowcaseIssue[],
  value: string,
  maxLength: number,
  id: string,
  section: MemberShowcaseIssue['section'],
  label: string,
  description = `${maxLength} caractères maximum.`,
): void {
  if (value.length > maxLength) {
    issues.push({ id, section, label, description });
  }
}
