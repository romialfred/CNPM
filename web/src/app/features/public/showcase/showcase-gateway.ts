import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * États de publication d'une vitrine, conformes à `docs/12-member-showcase/`.
 * Seul `PUBLISHED` est visible du public ; `SUSPENDED` retire la vitrine sans
 * supprimer les révisions.
 */
export type PublicationStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'UNPUBLISHED'
  | 'SUSPENDED';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'EXPIRED' | 'SUSPENDED';

/**
 * Sujet illustré d'un visuel de vitrine.
 *
 * La photothèque et les droits d'usage relèvent d'UX-DEC-003 : aucune photographie
 * n'est disponible et la règle interdit l'image bitmap générée en production. Le
 * contrat ne porte donc pas d'URL d'image mais le SUJET à illustrer, rendu en SVG
 * vectoriel par l'écran. Quand la photothèque sera arbitrée, ce champ cédera la place
 * à un média porteur de ses métadonnées de droits et de son texte alternatif.
 */
export type ShowcaseVisualShape =
  'site' | 'road' | 'bridge' | 'tower' | 'machine' | 'crew' | 'rebar' | 'yard' | 'grid';

export interface ShowcaseVisual {
  readonly shape: ShowcaseVisualShape;
  /**
   * Texte alternatif. Il décrit une illustration, jamais une photographie : annoncer
   * une vue réelle là où le rendu est dessiné tromperait l'utilisateur de lecteur
   * d'écran. Chaque texte le dit explicitement.
   */
  readonly alt: string;
  /** Libellé lisible superposé au visuel. */
  readonly label: string;
}

/** Fait clé du bandeau d'en-tête ; `icon` désigne un pictogramme du jeu Lucide. */
export interface ShowcaseKeyFact {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly icon: 'sector' | 'location' | 'people' | 'calendar' | 'legal' | 'member';
}

export interface ShowcaseActivity {
  readonly title: string;
  readonly description: string;
  /**
   * Pictogramme d'accompagnement. Porté par la donnée et non déduit du rang : une
   * réorganisation des activités ne doit pas décaler les symboles.
   */
  readonly icon: 'roads' | 'building' | 'urban' | 'studies' | 'materials' | 'maintenance';
}

export interface ShowcaseProject {
  readonly title: string;
  readonly summary: string;
  readonly category: string;
  readonly visual: ShowcaseVisual;
}

export interface ShowcaseGalleryItem {
  readonly visual: ShowcaseVisual;
  /**
   * Nombre de médias supplémentaires, porté par la dernière vignette.
   * Absent sur les vignettes ordinaires.
   */
  readonly moreCount?: number;
}

export interface ShowcaseCertification {
  readonly name: string;
  /** Portée de la certification : un sigle seul n'informe pas le visiteur. */
  readonly scope: string;
}

/**
 * Partenaire cité par le membre.
 *
 * Aucun logo n'est stocké : publier la marque d'un tiers suppose une autorisation
 * d'usage que la vitrine ne porte pas. Le monogramme est dérivé du nom.
 */
export interface ShowcasePartner {
  readonly name: string;
  readonly initials: string;
}

export interface ShowcaseTestimonial {
  readonly quote: string;
  readonly author: string;
  readonly role: string;
}

export interface ShowcaseContacts {
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly hours?: string;
}

/**
 * Consentement à la publication des coordonnées.
 *
 * `docs/12-member-showcase/requirements.md` l'impose : « Les contacts publics
 * nécessitent un consentement et une date de vérification ». Le porter dans le
 * contrat plutôt que dans l'affichage rend la règle explicite — une vitrine sans
 * consentement ne peut pas exposer de coordonnées, même par erreur d'intégration.
 */
export interface ContactConsent {
  readonly grantedAt: string;
  readonly verifiedAt: string;
}

export interface MemberShowcase {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly sector: string;
  readonly location: string;
  readonly employeeRange: string;
  readonly foundedYear: number;
  readonly legalForm: string;
  readonly verificationStatus: VerificationStatus;
  /** Date à laquelle le CNPM a constaté le statut ; le badge doit l'exposer. */
  readonly verifiedAt: string | null;
  /** Ancienneté d'adhésion, distincte de l'année de création de l'entreprise. */
  readonly memberSince: string;
  readonly summary: string;
  readonly heroVisual: ShowcaseVisual;
  readonly contacts: ShowcaseContacts;
  /** `null` quand le membre n'a pas consenti : les coordonnées ne sont alors pas publiées. */
  readonly contactConsent: ContactConsent | null;
  readonly activities: readonly ShowcaseActivity[];
  readonly projects: readonly ShowcaseProject[];
  readonly gallery: readonly ShowcaseGalleryItem[];
  readonly certifications: readonly ShowcaseCertification[];
  readonly partners: readonly ShowcasePartner[];
  readonly testimonials: readonly ShowcaseTestimonial[];
  /**
   * Disponibilité de la brochure. Aucun document n'est déposé à ce jour : le
   * téléchargement s'annonce indisponible plutôt que de mener à une adresse morte.
   */
  readonly brochureAvailable: boolean;
  /**
   * Contenu de démonstration.
   *
   * Porté par la donnée et non par l'écran : lorsque l'API R4 alimentera la vitrine,
   * la mention disparaîtra d'elle-même au lieu de rester gravée dans le gabarit.
   */
  readonly isDemoContent: boolean;
  readonly publicationStatus: PublicationStatus;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly allowIndexing: boolean;
}

/** Une vitrine non publiée n'est pas « introuvable » : la distinction est visible. */
export type ShowcaseResult =
  | { readonly outcome: 'published'; readonly showcase: MemberShowcase }
  | { readonly outcome: 'not-public'; readonly status: PublicationStatus }
  | { readonly outcome: 'not-found' };

/**
 * Projection minimale d'une vitrine dans l'annuaire public (PUB-004/PUB-005).
 *
 * Elle exclut volontairement les contacts, médias, licences et données de
 * consentement. Le statut littéral interdit à un adaptateur de livrer un brouillon à
 * l'écran public sans rompre le contrat TypeScript.
 */
export interface PublicShowcaseSummary {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly sector: string;
  readonly location: string;
  readonly summary: string;
  readonly isDemoContent: boolean;
  readonly publicationStatus: 'PUBLISHED';
}

/** Paramètres du draft R4. `page` est indexée à partir de zéro. */
export interface PublicShowcaseQuery {
  readonly q?: string;
  readonly sector?: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface PublicShowcasePage {
  readonly items: readonly PublicShowcaseSummary[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

/**
 * Port de lecture d'une vitrine publique (PUB-006).
 *
 * L'API R4 correspondante n'est pas promue dans le contrat canonique : la checklist
 * de `docs/12-member-showcase/promotion-checklist.md` et les décisions UX-DEC-004 à
 * UX-DEC-008 restent ouvertes. Ce port permet à l'écran pilote d'exister sans
 * préempter ce contrat ; seul l'adaptateur changera.
 */
export interface ShowcaseGateway {
  listPublished(query: PublicShowcaseQuery): Observable<PublicShowcasePage>;
  findBySlug(slug: string): Observable<ShowcaseResult>;
}

export const SHOWCASE_GATEWAY = new InjectionToken<ShowcaseGateway>('SHOWCASE_GATEWAY');
