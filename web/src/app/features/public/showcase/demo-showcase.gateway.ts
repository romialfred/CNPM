import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import type {
  ContactConsent,
  MemberShowcase,
  ShowcaseActivity,
  ShowcaseCertification,
  ShowcaseGalleryItem,
  ShowcaseGateway,
  ShowcasePartner,
  ShowcaseProject,
  ShowcaseResult,
  ShowcaseTestimonial,
} from './showcase-gateway';

/**
 * Adaptateur de démonstration de la vitrine.
 *
 * NON destiné à la production : aucune règle métier, aucune API.
 *
 * Deux origines, volontairement distinctes :
 *
 * 1. L'identité et le SEO proviennent de `assets/demo-fixtures.json` (copie déclarée
 *    de la fixture du handoff, portant la mention « Donnees fictives; ne pas importer
 *    en production »). Ces valeurs ancrent l'écran sur la source du handoff.
 * 2. Le contenu de présentation (activités, réalisations, galerie, partenaires,
 *    témoignages) est rédigé ici pour la démonstration client. La fixture est en
 *    ASCII non accentué et ne couvre pas ces rubriques ; elle n'est pas modifiée,
 *    car elle est partagée avec les autres écrans et le pack de validation.
 *
 * Tout ce contenu est fictif et signalé comme tel par `isDemoContent`, qui fait
 * afficher la mention « Données de démonstration » sur la page. Aucun organisme réel
 * n'est cité : les partenaires portent le suffixe « exemple » et les témoignages sont
 * attribués à des rôles génériques, afin qu'aucune institution existante ne paraisse
 * cautionner ou contracter avec ce membre fictif.
 */
@Injectable()
export class DemoShowcaseGateway implements ShowcaseGateway {
  private static readonly LATENCY_MS = 300;
  /** Slug en brouillon, pour exercer l'état « non publiée » de la fiche. */
  private static readonly DRAFT_SLUG = 'somacop-sa-brouillon';
  /**
   * Slug sans consentement, pour exercer la règle des coordonnées.
   *
   * La vitrine publiée porte désormais un consentement de démonstration : sans ce
   * second slug, plus aucun parcours ne montrerait le retrait des coordonnées quand
   * le consentement manque, et la règle deviendrait invérifiable à l'écran.
   */
  private static readonly NO_CONSENT_SLUG = 'somacop-sa-sans-consentement';

  /**
   * Consentement de démonstration.
   *
   * Le commanditaire a validé une vitrine complète, coordonnées comprises. Le
   * consentement est donc explicitement porté par la donnée, et non contourné dans
   * l'affichage : l'écran continue de retirer les coordonnées lorsqu'il vaut `null`.
   */
  private static readonly DEMO_CONSENT: ContactConsent = {
    grantedAt: '2026-02-10',
    verifiedAt: '2026-02-12',
  };

  private static readonly ACTIVITIES: readonly ShowcaseActivity[] = [
    {
      title: 'Travaux publics et infrastructures',
      description: 'Routes, pistes rurales, réseaux d’assainissement et voiries urbaines.',
      icon: 'roads',
    },
    {
      title: 'Bâtiment et génie civil',
      description: 'Bâtiments administratifs, logements collectifs et ouvrages en béton armé.',
      icon: 'building',
    },
    {
      title: 'Aménagement urbain',
      description: 'Espaces publics, éclairage, mobilier urbain et aménagements paysagers.',
      icon: 'urban',
    },
    {
      title: 'Études et ingénierie',
      description: 'Études techniques, métrés, suivi de chantier et contrôle qualité.',
      icon: 'studies',
    },
    {
      title: 'Matériaux et équipements',
      description: 'Production de granulats, centrale à béton et location d’engins.',
      icon: 'materials',
    },
    {
      title: 'Maintenance et réhabilitation',
      description: 'Entretien courant, reprise d’ouvrages et mise aux normes.',
      icon: 'maintenance',
    },
  ];

  private static readonly PROJECTS: readonly ShowcaseProject[] = [
    {
      title: 'Route Kati–Koulikoro',
      summary:
        'Construction de 42 km de route bitumée, avec ouvrages de drainage et signalisation.',
      category: 'Routes et infrastructures',
      visual: {
        shape: 'road',
        alt: 'Schéma d’une route bitumée en perspective, aux couleurs du CNPM.',
        label: 'Route bitumée — 42 km',
      },
    },
    {
      title: 'Pont de Sénou',
      summary: 'Construction d’un pont en béton armé de 180 m, avec culées et voies d’accès.',
      category: 'Ouvrages d’art',
      visual: {
        shape: 'bridge',
        alt: 'Schéma d’un pont à arche et haubans, aux couleurs du CNPM.',
        label: 'Ouvrage d’art — 180 m',
      },
    },
    {
      title: 'Immeuble SOMAPLAZA',
      summary: 'Construction d’un immeuble de bureaux R+6, livré avec ses lots techniques.',
      category: 'Bâtiments',
      visual: {
        shape: 'tower',
        alt: 'Schéma d’un immeuble de bureaux de six niveaux, aux couleurs du CNPM.',
        label: 'Immeuble de bureaux R+6',
      },
    },
  ];

  /**
   * Galerie de démonstration.
   *
   * Quatre vignettes schématiques : aucune photographie de chantier n'est disponible
   * et aucune ne sera inventée. Le compteur de la dernière vignette annonce le reste
   * du fonds tel qu'il figure à la maquette.
   */
  private static readonly GALLERY: readonly ShowcaseGalleryItem[] = [
    {
      visual: {
        shape: 'grid',
        alt: 'Schéma d’un plan de masse quadrillé, aux couleurs du CNPM.',
        label: 'Plan de masse',
      },
    },
    {
      visual: {
        shape: 'tower',
        alt: 'Schéma d’une façade de bâtiment, aux couleurs du CNPM.',
        label: 'Façade livrée',
      },
    },
    {
      visual: {
        shape: 'road',
        alt: 'Schéma d’un tracé routier, aux couleurs du CNPM.',
        label: 'Tracé routier',
      },
    },
    {
      visual: {
        shape: 'bridge',
        alt: 'Schéma d’un ouvrage franchissant un cours d’eau, aux couleurs du CNPM.',
        label: 'Franchissement',
      },
      moreCount: 25,
    },
  ];

  /**
   * Certifications.
   *
   * La fixture porte ISO 45001 ; la maquette mentionnait OHSAS 18001, référentiel
   * retiré en 2021 et remplacé par ISO 45001. La fixture prime : afficher un
   * référentiel abrogé daterait la vitrine dès sa mise en ligne. La distinction est
   * explicitement marquée « exemple », aucun prix réel n'étant décerné à ce membre.
   */
  private static readonly CERTIFICATIONS: readonly ShowcaseCertification[] = [
    { name: 'ISO 9001', scope: 'Management de la qualité' },
    { name: 'ISO 14001', scope: 'Management environnemental' },
    { name: 'ISO 45001', scope: 'Santé et sécurité au travail' },
    { name: 'Prix d’excellence BTP', scope: 'Distinction professionnelle — exemple' },
  ];

  /**
   * Partenaires fictifs.
   *
   * Le suffixe « exemple » est porté par le nom lui-même : une mention de bas de page
   * se perd au premier partage de capture, alors que la vitrine, elle, circule.
   */
  private static readonly PARTNERS: readonly ShowcasePartner[] = [
    { name: 'Agence Nationale des Infrastructures — exemple', initials: 'AN' },
    { name: 'Fonds Régional de Développement — exemple', initials: 'FR' },
    { name: 'Groupe Industriel du Sahel — exemple', initials: 'GI' },
    { name: 'Compagnie des Ports Fluviaux — exemple', initials: 'CP' },
    { name: 'Consortium Énergie Durable — exemple', initials: 'CE' },
  ];

  private static readonly TESTIMONIALS: readonly ShowcaseTestimonial[] = [
    {
      quote:
        'Les délais ont été tenus sur l’ensemble des lots, et les points de blocage nous ont été signalés avant qu’ils ne deviennent des retards.',
      author: 'Directeur de projet',
      role: 'Maître d’ouvrage — exemple',
    },
    {
      quote:
        'La qualité d’exécution des ouvrages en béton armé et la rigueur du suivi de chantier ont facilité la réception des travaux.',
      author: 'Responsable technique',
      role: 'Société cliente — exemple',
    },
    {
      quote:
        'Les rapports d’avancement étaient clairs et documentés, ce qui a simplifié nos arbitrages tout au long du programme.',
      author: 'Coordinatrice de programme',
      role: 'Bailleur privé — exemple',
    },
  ];

  findBySlug(slug: string): Observable<ShowcaseResult> {
    const sample = fixtures.showcaseSample;
    const normalized = slug.trim().toLowerCase();

    if (normalized === DemoShowcaseGateway.DRAFT_SLUG) {
      return this.respond({ outcome: 'not-public', status: 'DRAFT' });
    }
    if (normalized === DemoShowcaseGateway.NO_CONSENT_SLUG) {
      return this.respond({
        outcome: 'published',
        showcase: { ...this.toShowcase(sample), contactConsent: null },
      });
    }
    if (normalized !== sample.slug) {
      return this.respond({ outcome: 'not-found' });
    }
    return this.respond({ outcome: 'published', showcase: this.toShowcase(sample) });
  }

  private toShowcase(sample: typeof fixtures.showcaseSample): MemberShowcase {
    return {
      // Identité et référencement : repris de la fixture du handoff.
      slug: sample.slug,
      name: sample.name,
      location: sample.location,
      employeeRange: sample.employeeRange,
      foundedYear: sample.foundedYear,
      seoTitle: sample.seo.title,
      allowIndexing: sample.seo.allowIndexing,

      // Contenu rédactionnel : la fixture est en ASCII non accentué, ce qui n'est pas
      // publiable en français. Les libellés sont repris à l'identique, accentués.
      tagline: 'Bâtir aujourd’hui, construire demain',
      sector: 'BTP et génie civil',
      legalForm: 'Société anonyme',
      summary:
        'Entreprise malienne spécialisée dans les travaux publics, le génie civil et l’aménagement durable des infrastructures.',
      seoDescription:
        'Découvrez les activités, réalisations et coordonnées de SOMACOP SA, membre vérifié du CNPM.',

      verificationStatus: 'VERIFIED',
      // La fixture ne porte pas de date de vérification. Le badge doit exposer la
      // date à laquelle le CNPM a constaté le statut ; à défaut, il ne l'annonce pas
      // plutôt que d'afficher une date fabriquée.
      verifiedAt: null,
      memberSince: 'mai 2022',

      heroVisual: {
        shape: 'grid',
        alt: 'Schéma abstrait d’un chantier d’infrastructure, aux couleurs du CNPM.',
        label: 'Infrastructures et génie civil',
      },

      contacts: {
        // Coordonnées d'entreprise fictives : une ligne d'accueil et une boîte
        // générique, jamais la ligne directe d'une personne identifiée.
        phone: '+223 20 00 00 00',
        email: 'accueil@somacop.example',
        address: 'ACI 2000, Bamako, Mali',
        hours: 'Du lundi au vendredi, 08h00 – 17h00',
      },
      contactConsent: DemoShowcaseGateway.DEMO_CONSENT,

      activities: DemoShowcaseGateway.ACTIVITIES,
      projects: DemoShowcaseGateway.PROJECTS,
      gallery: DemoShowcaseGateway.GALLERY,
      certifications: DemoShowcaseGateway.CERTIFICATIONS,
      partners: DemoShowcaseGateway.PARTNERS,
      testimonials: DemoShowcaseGateway.TESTIMONIALS,

      // Aucun document n'est déposé : le bouton annonce son indisponibilité.
      brochureAvailable: false,
      isDemoContent: true,
      publicationStatus: 'PUBLISHED',
    };
  }

  private respond(result: ShowcaseResult): Observable<ShowcaseResult> {
    return of(result).pipe(delay(DemoShowcaseGateway.LATENCY_MS));
  }
}
