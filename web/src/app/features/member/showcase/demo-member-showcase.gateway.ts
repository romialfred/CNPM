import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type { MemberShowcaseDraft, MemberShowcaseGateway } from './member-showcase-gateway';

const STORAGE_KEY = 'cnpm.demo.member-showcase-draft.v1';

export const DEMO_MEMBER_SHOWCASE_DRAFT: MemberShowcaseDraft = {
  version: 1,
  slug: 'atelier-kanu',
  name: 'Atelier Kanu',
  tagline: 'Services agronomiques de proximité pour les exploitations du Sud',
  sector: 'Services agricoles',
  location: 'Sikasso',
  employeeRange: '10–19 collaborateurs',
  foundedYear: 2021,
  legalForm: 'Société à responsabilité limitée',
  verificationStatus: 'UNVERIFIED',
  summary:
    'Atelier Kanu accompagne les exploitations agricoles de la région de Sikasso : conseil agronomique, formation des équipes techniques et suivi de la qualité des productions.',
  activities: ['Conseil agronomique', 'Ateliers de formation', 'Suivi qualité'],
  projects: [
    {
      title: 'Parcours pilote Sahel',
      summary:
        'Accompagnement d’un groupement d’exploitations sur un cycle complet de production.',
      category: 'Accompagnement',
    },
    {
      title: 'Atelier de formation 2026',
      summary:
        'Sessions de formation des équipes techniques aux bonnes pratiques agronomiques.',
      category: 'Formation',
    },
  ],
  certifications: [],
  seo: {
    title: 'Atelier Kanu — vitrine CNPM',
    description:
      'Présentation des activités et des réalisations d’Atelier Kanu, membre du CNPM.',
    allowIndexing: false,
  },
  publication: {
    status: 'DRAFT',
    lastSavedAt: '2026-07-19T10:00:00.000Z',
    scheduledAt: null,
  },
  disclosure:
    'Brouillon local conservé dans ce navigateur, sans contact, média ni document publié.',
};

@Injectable()
export class DemoMemberShowcaseGateway implements MemberShowcaseGateway {
  loadDraft(feature: 'MP-015' | 'MP-016'): Observable<MemberShowcaseDraft> {
    void feature;
    return of(this.readLocalDraft() ?? DEMO_MEMBER_SHOWCASE_DRAFT).pipe(delay(0));
  }

  storeLocalDraft(draft: MemberShowcaseDraft): Observable<MemberShowcaseDraft> {
    const stored: MemberShowcaseDraft = {
      ...draft,
      publication: {
        status: 'DRAFT',
        lastSavedAt: new Date().toISOString(),
        scheduledAt: null,
      },
      verificationStatus: 'UNVERIFIED',
      certifications: [],
      seo: { ...draft.seo, allowIndexing: false },
    };
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Le brouillon reste utilisable en mémoire même si le stockage navigateur est refusé.
    }
    return of(stored).pipe(delay(0));
  }

  private readLocalDraft(): MemberShowcaseDraft | null {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const candidate = JSON.parse(raw) as Partial<MemberShowcaseDraft>;
      return isStoredDraft(candidate) ? candidate : null;
    } catch {
      return null;
    }
  }
}

function isStoredDraft(candidate: Partial<MemberShowcaseDraft>): candidate is MemberShowcaseDraft {
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.slug === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.tagline === 'string' &&
    typeof candidate.sector === 'string' &&
    typeof candidate.location === 'string' &&
    typeof candidate.employeeRange === 'string' &&
    typeof candidate.foundedYear === 'number' &&
    typeof candidate.legalForm === 'string' &&
    typeof candidate.summary === 'string' &&
    Array.isArray(candidate.activities) &&
    Array.isArray(candidate.projects) &&
    !!candidate.seo &&
    candidate.publication?.status === 'DRAFT' &&
    candidate.verificationStatus === 'UNVERIFIED' &&
    typeof candidate.disclosure === 'string'
  );
}
