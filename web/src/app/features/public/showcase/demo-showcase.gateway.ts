import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import type {
  ContactConsent,
  MemberShowcase,
  PublicationStatus,
  PublicShowcasePage,
  PublicShowcaseQuery,
  PublicShowcaseSummary,
  ShowcaseActivity,
  ShowcaseCertification,
  ShowcaseGalleryItem,
  ShowcaseGateway,
  ShowcasePartner,
  ShowcaseProject,
  ShowcaseResult,
  ShowcaseTestimonial,
} from './showcase-gateway';

interface DemoDirectoryRecord {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly sector: string;
  readonly location: string;
  readonly summary: string;
  readonly publicationStatus: PublicationStatus;
}

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
  /**
   * Jeu fermé de l'annuaire pilote. Chaque libellé indique sa nature fictive et
   * aucune fiche ne porte de contact, de média ou de licence dans la projection
   * publique de liste.
   */
  private static readonly DIRECTORY: readonly DemoDirectoryRecord[] = [
    {
      slug: 'atelier-kanu-demonstration',
      name: 'Atelier Kanu — démonstration',
      tagline: 'Un scénario fictif pour les services numériques',
      sector: 'Services numériques',
      location: 'Bamako — localisation fictive',
      summary:
        'Entreprise entièrement fictive créée pour valider la recherche et la consultation de l’annuaire public.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'horizon-sahel-demo',
      name: 'Horizon Sahel — démo',
      tagline: 'Une vitrine fictive consacrée à la logistique',
      sector: 'Logistique',
      location: 'Kayes — localisation fictive',
      summary:
        'Profil de démonstration sans activité réelle, utilisé uniquement pour éprouver le tri visuel des cartes.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'fabrique-nianan-fictive',
      name: 'Fabrique Nianan — entreprise fictive',
      tagline: 'Transformation agroalimentaire de démonstration',
      sector: 'Agroalimentaire',
      location: 'Sikasso — localisation fictive',
      summary:
        'Contenu inventé pour le prototype CNPM ; il ne décrit aucune entreprise ni production existante.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'studio-bolo-demo',
      name: 'Studio Bolo — démonstration',
      tagline: 'Conseil créatif dans un environnement fictif',
      sector: 'Services aux entreprises',
      location: 'Mopti — localisation fictive',
      summary:
        'Fiche de test destinée à vérifier la lisibilité des résultats publics sur toutes les tailles d’écran.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'energie-diarra-scenario',
      name: 'Énergie Diarra — scénario fictif',
      tagline: 'Maintenance énergétique simulée pour le pilote',
      sector: 'Énergie',
      location: 'Koutiala — localisation fictive',
      summary:
        'Organisation sans existence réelle, incluse pour tester un secteur et une localisation supplémentaires.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'batir-kora-demonstration',
      name: 'Bâtir Kora — démonstration',
      tagline: 'Construction responsable dans un scénario de test',
      sector: 'BTP et génie civil',
      location: 'Ségou — localisation fictive',
      summary:
        'Vitrine de démonstration ne représentant aucun chantier, client ou ouvrage réellement réalisé.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'sante-niela-demo',
      name: 'Santé Niela — entreprise fictive',
      tagline: 'Équipements professionnels simulés',
      sector: 'Équipements professionnels',
      location: 'Gao — localisation fictive',
      summary:
        'Profil factice conçu pour le parcours de recherche ; aucune offre commerciale réelle n’y est associée.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'conseil-faro-demonstration',
      name: 'Conseil Faro — démonstration',
      tagline: 'Accompagnement fictif des petites entreprises',
      sector: 'Conseil',
      location: 'Bamako — localisation fictive',
      summary:
        'Donnée de démonstration strictement réservée à la validation de l’interface publique CNPM.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'cooperative-demo-brouillon',
      name: 'Coopérative Démo — brouillon fictif',
      tagline: 'Cette fiche ne doit jamais apparaître dans l’annuaire',
      sector: 'Agriculture',
      location: 'Localisation fictive',
      summary: 'Enregistrement de contrôle pour prouver le retrait des contenus non publiés.',
      publicationStatus: 'DRAFT',
    },
  ];
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
      description: 'Routes, ponts et ouvrages d’art.',
      icon: 'roads',
    },
    {
      title: 'Bâtiment et génie civil',
      description: 'Bâtiments et ouvrages industriels.',
      icon: 'building',
    },
    {
      title: 'Aménagement urbain',
      description: 'Voirie, réseaux et éclairage public.',
      icon: 'urban',
    },
    {
      title: 'Études et ingénierie',
      description: 'Études techniques et contrôle qualité.',
      icon: 'studies',
    },
    {
      title: 'Matériaux et équipements',
      description: 'Matériaux et équipements BTP.',
      icon: 'materials',
    },
    {
      title: 'Maintenance et réhabilitation',
      description: 'Entretien et réhabilitation d’infrastructures.',
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
        alt: 'Illustration, et non photographie : une route bitumée vue en perspective, marquage axial jaune, bandes de rive blanches, accotements de latérite, poteaux électriques et arbres jusqu’à l’horizon.',
        label: 'Route bitumée — 42 km',
      },
    },
    {
      title: 'Pont de Sénou',
      summary: 'Construction d’un pont en béton armé de 180 m, avec culées et voies d’accès.',
      category: 'Ouvrages d’art',
      visual: {
        shape: 'bridge',
        alt: 'Illustration, et non photographie : un pont en béton à trois arches franchissant une rivière, avec garde-corps, lampadaires, reflets sur l’eau, berges plantées et une pirogue.',
        label: 'Ouvrage d’art — 180 m',
      },
    },
    {
      title: 'Immeuble SOMAPLAZA',
      summary: 'Construction d’un immeuble de bureaux R+6, livré avec ses lots techniques.',
      category: 'Bâtiments',
      visual: {
        shape: 'tower',
        alt: 'Illustration, et non photographie : un immeuble de bureaux de six étages à façade vitrée quadrillée, avec auvent d’entrée, parvis, arbres, mât et passants au premier plan.',
        label: 'Immeuble de bureaux R+6',
      },
    },
  ];

  /**
   * Galerie de démonstration.
   *
   * Quatre vignettes illustrées : aucune photographie de chantier n'est disponible et
   * aucune ne sera inventée. Chaque vignette porte un sujet distinct — un engin, une
   * équipe, un ferraillage, une vue d'installation de chantier — pour que la galerie
   * se lise d'un coup d'œil au lieu de répéter les visuels des réalisations. Le
   * compteur de la dernière vignette annonce le reste du fonds, comme à la maquette.
   */
  private static readonly GALLERY: readonly ShowcaseGalleryItem[] = [
    {
      visual: {
        shape: 'machine',
        alt: 'Illustration, et non photographie : une pelle mécanique jaune sur ses chenilles, godet abaissé devant un tas de terre.',
        label: 'Engin de chantier',
      },
    },
    {
      visual: {
        shape: 'crew',
        alt: 'Illustration, et non photographie : trois ouvriers casqués en gilet de chantier devant un plan technique.',
        label: 'Équipe sur site',
      },
    },
    {
      visual: {
        shape: 'rebar',
        alt: 'Illustration, et non photographie : des armatures en acier dressées entre deux panneaux de coffrage, sur une dalle de béton.',
        label: 'Coffrage et armatures',
      },
    },
    {
      visual: {
        shape: 'yard',
        alt: 'Illustration, et non photographie : une vue d’installation de chantier avec base-vie, clôture, grue, buses en béton et tas de sable.',
        label: 'Installation de chantier',
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

  listPublished(query: PublicShowcaseQuery): Observable<PublicShowcasePage> {
    const normalizedQuery = this.normalize(query.q ?? '');
    const normalizedSector = this.normalize(query.sector ?? '');
    const page = Math.max(0, Math.trunc(query.page));
    const pageSize = Math.min(100, Math.max(1, Math.trunc(query.pageSize)));

    const published = DemoShowcaseGateway.DIRECTORY.filter(
      (record): record is DemoDirectoryRecord & { readonly publicationStatus: 'PUBLISHED' } =>
        record.publicationStatus === 'PUBLISHED',
    ).filter((record) => {
      const searchable = this.normalize(
        `${record.name} ${record.tagline} ${record.sector} ${record.location} ${record.summary}`,
      );
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (!normalizedSector || this.normalize(record.sector) === normalizedSector)
      );
    });

    const offset = page * pageSize;
    const items: PublicShowcaseSummary[] = published
      .slice(offset, offset + pageSize)
      .map((record) => ({ ...record, isDemoContent: true }));

    return this.respondPage({
      items,
      page,
      pageSize,
      totalItems: published.length,
      totalPages: published.length === 0 ? 0 : Math.ceil(published.length / pageSize),
    });
  }

  findBySlug(slug: string): Observable<ShowcaseResult> {
    const sample = fixtures.showcaseSample;
    const normalized = slug.trim().toLowerCase();
    const directoryRecord = DemoShowcaseGateway.DIRECTORY.find(
      (record) => record.slug === normalized,
    );

    if (directoryRecord) {
      return directoryRecord.publicationStatus === 'PUBLISHED'
        ? this.respond({
            outcome: 'published',
            showcase: this.toDirectoryShowcase(directoryRecord),
          })
        : this.respond({ outcome: 'not-public', status: directoryRecord.publicationStatus });
    }

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

  private toDirectoryShowcase(record: DemoDirectoryRecord): MemberShowcase {
    return {
      slug: record.slug,
      name: record.name,
      tagline: record.tagline,
      sector: record.sector,
      location: record.location,
      employeeRange: 'Donnée fictive non publiée',
      foundedYear: 2026,
      legalForm: 'Structure fictive de démonstration',
      verificationStatus: 'PENDING',
      verifiedAt: null,
      memberSince: '2026 — démonstration',
      summary: record.summary,
      heroVisual: {
        shape: 'grid',
        alt: 'Illustration géométrique de démonstration, et non photographie de l’entreprise.',
        label: 'Vitrine fictive de démonstration',
      },
      contacts: {},
      contactConsent: null,
      activities: [],
      projects: [],
      gallery: [],
      certifications: [],
      partners: [],
      testimonials: [],
      brochureAvailable: false,
      isDemoContent: true,
      publicationStatus: 'PUBLISHED',
      seoTitle: `${record.name} — annuaire de démonstration CNPM`,
      seoDescription: record.summary,
      allowIndexing: false,
    };
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
        shape: 'site',
        alt: 'Illustration, et non photographie : un chantier de pont en construction au coucher du soleil. Le tablier repose sur trois piles en béton au-dessus d’une rivière ; la dernière travée laisse voir ses armatures. Une grue à tour jaune lève une poutre, un camion-benne et des ouvriers casqués travaillent sur la berge.',
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

  private respondPage(result: PublicShowcasePage): Observable<PublicShowcasePage> {
    return of(result).pipe(delay(DemoShowcaseGateway.LATENCY_MS));
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}
