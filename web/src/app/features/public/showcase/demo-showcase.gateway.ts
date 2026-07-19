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
 * Adaptateur local de la vitrine, en attente de l'API R4.
 *
 * Deux origines, volontairement distinctes :
 *
 * 1. L'identité et le SEO proviennent de `assets/demo-fixtures.json` (copie déclarée
 *    de la fixture du handoff). Ces valeurs ancrent l'écran sur la source du handoff.
 * 2. Le contenu de présentation (activités, réalisations, galerie, partenaires,
 *    témoignages) est rédigé ici. La fixture est en ASCII non accentué et ne couvre
 *    pas ces rubriques ; elle n'est pas modifiée, car elle est partagée avec les
 *    autres écrans et le pack de validation.
 *
 * Aucun organisme réel n'est cité : les partenaires et les témoignages sont attribués
 * à des rôles génériques, afin qu'aucune institution existante ne paraisse cautionner
 * ou contracter avec ce membre.
 */
@Injectable()
export class DemoShowcaseGateway implements ShowcaseGateway {
  private static readonly LATENCY_MS = 300;
  /**
   * Jeu fermé de l'annuaire pilote. Aucune fiche ne porte de contact, de média ou de
   * licence dans la projection publique de liste.
   */
  private static readonly DIRECTORY: readonly DemoDirectoryRecord[] = [
    {
      slug: 'atelier-kanu-demonstration',
      name: 'Atelier Kanu',
      tagline: 'Solutions numériques pour les entreprises',
      sector: 'Services numériques',
      location: 'Bamako',
      summary:
        'Entreprise de services numériques accompagnant les organisations sur leurs projets applicatifs et leur infrastructure.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'horizon-sahel-demo',
      name: 'Horizon Sahel',
      tagline: 'Transport et logistique multimodale',
      sector: 'Logistique',
      location: 'Kayes',
      summary:
        'Opérateur logistique assurant le transport, l’entreposage et la distribution de marchandises sur les corridors régionaux.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'fabrique-nianan',
      name: 'Fabrique Nianan',
      tagline: 'Transformation agroalimentaire',
      sector: 'Agroalimentaire',
      location: 'Sikasso',
      summary:
        'Unité de transformation valorisant les productions agricoles locales en produits conditionnés pour le marché national.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'studio-bolo-demo',
      name: 'Studio Bolo',
      tagline: 'Conseil créatif et communication',
      sector: 'Services aux entreprises',
      location: 'Mopti',
      summary:
        'Agence de conseil accompagnant les entreprises sur leur identité de marque et leurs supports de communication.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'energie-diarra-scenario',
      name: 'Énergie Diarra',
      tagline: 'Maintenance et efficacité énergétique',
      sector: 'Énergie',
      location: 'Koutiala',
      summary:
        'Prestataire spécialisé dans l’installation et la maintenance d’équipements énergétiques pour sites industriels et tertiaires.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'batir-kora-demonstration',
      name: 'Bâtir Kora',
      tagline: 'Construction responsable',
      sector: 'BTP et génie civil',
      location: 'Ségou',
      summary:
        'Entreprise de BTP intervenant sur les ouvrages de bâtiment et de génie civil, de l’étude à la réception des travaux.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'sante-niela-demo',
      name: 'Santé Niela',
      tagline: 'Équipements professionnels de santé',
      sector: 'Équipements professionnels',
      location: 'Gao',
      summary:
        'Fournisseur d’équipements professionnels et de consommables pour les structures de santé et les laboratoires.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'conseil-faro-demonstration',
      name: 'Conseil Faro',
      tagline: 'Accompagnement des petites entreprises',
      sector: 'Conseil',
      location: 'Bamako',
      summary:
        'Cabinet de conseil accompagnant les petites entreprises sur leur gestion, leur organisation et leur mise en conformité.',
      publicationStatus: 'PUBLISHED',
    },
    {
      slug: 'cooperative-demo-brouillon',
      name: 'Coopérative Sanan',
      tagline: 'Production et commercialisation agricoles',
      sector: 'Agriculture',
      location: 'Kolokani',
      summary: 'Fiche en cours de préparation, non publiée dans l’annuaire.',
      publicationStatus: 'DRAFT',
    },
  ];
  /** Slug en brouillon, pour exercer l'état « non publiée » de la fiche. */
  private static readonly DRAFT_SLUG = 'somacop-sa-brouillon';
  /**
   * Slug sans consentement, pour exercer la règle des coordonnées.
   *
   * La vitrine publiée porte désormais un consentement : sans ce second slug, plus
   * aucun parcours ne montrerait le retrait des coordonnées quand le consentement
   * manque, et la règle deviendrait invérifiable à l'écran.
   */
  private static readonly NO_CONSENT_SLUG = 'somacop-sa-sans-consentement';

  /**
   * Consentement à la publication des coordonnées.
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
      id: 'travaux-publics-infrastructures',
      title: 'Travaux publics et infrastructures',
      description: 'Routes, ponts et ouvrages d’art.',
      icon: 'roads',
    },
    {
      id: 'batiment-genie-civil',
      title: 'Bâtiment et génie civil',
      description: 'Bâtiments et ouvrages industriels.',
      icon: 'building',
    },
    {
      id: 'amenagement-urbain',
      title: 'Aménagement urbain',
      description: 'Voirie, réseaux et éclairage public.',
      icon: 'urban',
    },
    {
      id: 'etudes-ingenierie',
      title: 'Études et ingénierie',
      description: 'Études techniques et contrôle qualité.',
      icon: 'studies',
    },
    {
      id: 'materiaux-equipements',
      title: 'Matériaux et équipements',
      description: 'Matériaux et équipements BTP.',
      icon: 'materials',
    },
    {
      id: 'maintenance-rehabilitation',
      title: 'Maintenance et réhabilitation',
      description: 'Entretien et réhabilitation d’infrastructures.',
      icon: 'maintenance',
    },
  ];

  private static readonly PROJECTS: readonly ShowcaseProject[] = [
    {
      id: 'route-kati-koulikoro',
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
      id: 'pont-de-senou',
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
      id: 'immeuble-somaplaza',
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
   * Galerie.
   *
   * Quatre vignettes illustrées : aucune photographie de chantier n'est disponible
   * (UX-DEC-003). Chaque vignette porte un sujet distinct — un engin, une
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
   * référentiel abrogé daterait la vitrine dès sa mise en ligne.
   */
  private static readonly CERTIFICATIONS: readonly ShowcaseCertification[] = [
    { name: 'ISO 9001', scope: 'Management de la qualité' },
    { name: 'ISO 14001', scope: 'Management environnemental' },
    { name: 'ISO 45001', scope: 'Santé et sécurité au travail' },
    { name: 'Prix d’excellence BTP', scope: 'Distinction professionnelle' },
  ];

  /**
   * Partenaires.
   *
   * Aucune organisation existante n'est citée : les dénominations ci-dessous ne
   * désignent aucune institution ni entreprise réelle.
   */
  private static readonly PARTNERS: readonly ShowcasePartner[] = [
    { name: 'Agence Nationale des Infrastructures', initials: 'AN' },
    { name: 'Fonds Régional de Développement', initials: 'FR' },
    { name: 'Groupe Industriel du Sahel', initials: 'GI' },
    { name: 'Compagnie des Ports Fluviaux', initials: 'CP' },
    { name: 'Consortium Énergie Durable', initials: 'CE' },
  ];

  private static readonly TESTIMONIALS: readonly ShowcaseTestimonial[] = [
    {
      quote:
        'Les délais ont été tenus sur l’ensemble des lots, et les points de blocage nous ont été signalés avant qu’ils ne deviennent des retards.',
      author: 'Directeur de projet',
      role: 'Maître d’ouvrage',
    },
    {
      quote:
        'La qualité d’exécution des ouvrages en béton armé et la rigueur du suivi de chantier ont facilité la réception des travaux.',
      author: 'Responsable technique',
      role: 'Société cliente',
    },
    {
      quote:
        'Les rapports d’avancement étaient clairs et documentés, ce qui a simplifié nos arbitrages tout au long du programme.',
      author: 'Coordinatrice de programme',
      role: 'Bailleur privé',
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
      employeeRange: 'Non communiqué',
      foundedYear: 2026,
      legalForm: 'Société anonyme',
      verificationStatus: 'PENDING',
      verifiedAt: null,
      memberSince: '2026',
      summary: record.summary,
      heroVisual: {
        shape: 'grid',
        alt: 'Illustration géométrique, et non photographie de l’entreprise.',
        label: 'Vitrine membre',
      },
      contacts: {},
      contactConsent: null,
      activities: this.toDirectoryActivities(record),
      projects: this.toDirectoryProjects(record),
      gallery: [],
      certifications: [],
      partners: [],
      testimonials: [],
      brochureAvailable: false,
      isDemoContent: true,
      publicationStatus: 'PUBLISHED',
      seoTitle: `${record.name} — annuaire CNPM`,
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
        // Coordonnées d'entreprise : une ligne d'accueil et une boîte générique,
        // jamais la ligne directe d'une personne identifiée.
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

  private toDirectoryActivities(record: DemoDirectoryRecord): readonly ShowcaseActivity[] {
    return [
      {
        id: 'diagnostic-pilote',
        title: 'Diagnostic pilote',
        description: `Analyse des besoins et cadrage des priorités dans le secteur « ${record.sector} ».`,
        icon: 'studies',
      },
      {
        id: 'atelier-demonstration',
        title: 'Atelier de cadrage',
        description:
          'Atelier conduit avec les équipes pour préciser le périmètre, les livrables et le calendrier.',
        icon: 'maintenance',
      },
      {
        id: 'suivi-simule',
        title: 'Suivi de service',
        description:
          'Suivi qualité de la prestation, du démarrage jusqu’à la clôture de la mission.',
        icon: 'materials',
      },
    ];
  }

  private toDirectoryProjects(record: DemoDirectoryRecord): readonly ShowcaseProject[] {
    return [
      {
        id: 'parcours-pilote-2026',
        title: 'Parcours pilote 2026',
        summary: `Parcours d’accompagnement conduit par ${record.name} dans le secteur « ${record.sector} », du diagnostic initial à la mise en service.`,
        category: record.sector,
        visual: {
          shape: 'grid',
          alt: 'Illustration vectorielle géométrique, et non photographie d’une réalisation.',
          label: 'Parcours pilote',
        },
      },
      {
        id: 'atelier-temoin-2026',
        title: 'Atelier de terrain 2026',
        summary:
          'Atelier conduit sur site pour accompagner les équipes dans la prise en main du service et en consolider les usages.',
        category: 'Accompagnement des équipes',
        visual: {
          shape: 'yard',
          alt: 'Illustration vectorielle abstraite d’un atelier, et non photographie d’un site réel.',
          label: 'Atelier de terrain',
        },
      },
    ];
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
