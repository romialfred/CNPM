import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import type {
  MemberShowcase,
  ShowcaseGateway,
  ShowcaseResult,
} from './showcase-gateway';

/**
 * Adaptateur de démonstration de la vitrine, alimenté par les fixtures du handoff.
 *
 * NON destiné à la production : aucune règle métier, aucune API. Les données
 * proviennent exclusivement de `docs/ui-handoff/data/demo-fixtures.json` (copie
 * déclarée), qui porte la mention « Donnees fictives; ne pas importer en production ».
 *
 * La fixture décrit une vitrine en état `DRAFT` — cet état sert les écrans d'édition
 * (MP-015/MP-016). Pour que l'écran pilote public puisse être validé, l'adaptateur
 * expose la même vitrine sous deux slugs : le slug canonique en état publié, et un
 * second en état brouillon pour éprouver le repli. La fixture n'est pas modifiée.
 */
@Injectable()
export class DemoShowcaseGateway implements ShowcaseGateway {
  private static readonly LATENCY_MS = 300;
  /** Slug en brouillon, pour exercer l'état « non publiée » de la fiche. */
  private static readonly DRAFT_SLUG = 'somacop-sa-brouillon';

  findBySlug(slug: string): Observable<ShowcaseResult> {
    const sample = fixtures.showcaseSample;
    const normalized = slug.trim().toLowerCase();

    if (normalized === DemoShowcaseGateway.DRAFT_SLUG) {
      return this.respond({ outcome: 'not-public', status: 'DRAFT' });
    }
    if (normalized !== sample.slug) {
      return this.respond({ outcome: 'not-found' });
    }
    return this.respond({ outcome: 'published', showcase: this.toShowcase(sample) });
  }

  private toShowcase(sample: typeof fixtures.showcaseSample): MemberShowcase {
    return {
      slug: sample.slug,
      name: sample.name,
      tagline: sample.tagline,
      sector: sample.sector,
      location: sample.location,
      employeeRange: sample.employeeRange,
      foundedYear: sample.foundedYear,
      legalForm: sample.legalForm,
      verificationStatus: 'VERIFIED',
      // La fixture ne porte pas de date de vérification. Le badge doit exposer la
      // date à laquelle le CNPM a constaté le statut ; à défaut, il ne l'annonce pas
      // plutôt que d'afficher une date fabriquée.
      verifiedAt: null,
      summary: sample.summary,
      contacts: sample.contacts,
      // La fixture ne porte ni consentement ni date de vérification des coordonnées.
      // La règle exige les deux pour les publier : à défaut, aucune coordonnée n'est
      // exposée. Fabriquer un consentement reviendrait à publier des contacts sans
      // base. Voir UX-DEC-013.
      contactConsent: null,
      activities: sample.activities,
      projects: sample.projects,
      certifications: sample.certifications,
      publicationStatus: 'PUBLISHED',
      seoTitle: sample.seo.title,
      seoDescription: sample.seo.description,
      allowIndexing: sample.seo.allowIndexing,
    };
  }

  private respond(result: ShowcaseResult): Observable<ShowcaseResult> {
    return of(result).pipe(delay(DemoShowcaseGateway.LATENCY_MS));
  }
}
