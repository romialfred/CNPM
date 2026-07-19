import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type { MemberShowcaseDraft, MemberShowcaseGateway } from './member-showcase-gateway';

const STORAGE_KEY = 'cnpm.demo.member-showcase-draft.v1';

export const DEMO_MEMBER_SHOWCASE_DRAFT: MemberShowcaseDraft = {
  version: 1,
  slug: 'atelier-kanu-demonstration',
  name: 'Atelier Kanu — entreprise fictive',
  tagline: 'Des services agricoles simulés pour présenter le gabarit',
  sector: 'Services agricoles — scénario',
  location: 'Sikasso — localisation fictive',
  employeeRange: '10–19 collaborateurs — scénario',
  foundedYear: 2021,
  legalForm: 'Entreprise fictive de démonstration',
  verificationStatus: 'UNVERIFIED',
  summary:
    'Atelier Kanu est une organisation entièrement inventée pour tester la vitrine membre CNPM. Ses activités, réalisations et caractéristiques ne décrivent aucune entreprise, équipe, exploitation ou clientèle réelle.',
  activities: ['Conseil agronomique fictif', 'Ateliers de démonstration', 'Suivi qualité simulé'],
  projects: [
    {
      title: 'Parcours pilote Sahel — réalisation fictive',
      summary:
        'Scénario inventé pour éprouver une carte de réalisation, sans client, site ni résultat réel.',
      category: 'Démonstration',
    },
    {
      title: 'Atelier témoin 2026 — réalisation fictive',
      summary:
        'Exemple éditorial local sans bénéficiaire, partenaire, promesse commerciale ou production réelle.',
      category: 'Scénario local',
    },
  ],
  certifications: [],
  seo: {
    title: 'Atelier Kanu — vitrine fictive CNPM',
    description:
      'Aperçu privé d’une entreprise fictive utilisé pour valider le gabarit de vitrine membre CNPM.',
    allowIndexing: false,
  },
  publication: {
    status: 'DRAFT',
    lastSavedAt: '2026-07-19T10:00:00.000Z',
    scheduledAt: null,
  },
  disclosure:
    'Brouillon local de démonstration, sans donnée membre réelle, contact, média, document ou valeur officielle.',
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
