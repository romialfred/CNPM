import type { Organization } from './organizations-gateway';

/**
 * Profil enrichi et DÉTERMINISTE d'une entreprise, dérivé de son identité.
 *
 * <p>Les chiffres et l'activité ci-dessous sont des données de DÉMONSTRATION, pas des faits
 * officiels : ils rendent la fiche « vivante » en attendant que le backend serve un vrai
 * flux d'activité (paiements, reçus, relances). Ils sont marqués comme illustratifs à
 * l'écran, jamais présentés comme la vérité du registre.
 *
 * <p>Tout est déterministe (graine tirée de l'identifiant) : la même entreprise produit
 * toujours le même profil, ce qui rend les captures de régression stables et évite qu'une
 * page « bouge » d'un rendu à l'autre. Aucun `Math.random`, aucune horloge.
 */

export type ActivityKind = 'payment' | 'receipt' | 'reminder' | 'update' | 'document' | 'meeting';

export interface OrganizationActivity {
  readonly kind: ActivityKind;
  readonly title: string;
  readonly detail: string;
  /** Date ISO `AAAA-MM-JJ`, formatée à l'affichage. */
  readonly date: string;
}

export interface OrganizationKeyFigure {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly caption: string;
}

export interface OrganizationProfile {
  readonly tagline: string;
  readonly presentation: string;
  readonly employees: string;
  readonly foundedYear: number;
  readonly keyFigures: readonly OrganizationKeyFigure[];
  readonly activities: readonly OrganizationActivity[];
  readonly activities2026: number;
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) amorcé par une graine entière. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Graine stable tirée d'une chaîne (FNV-1a 32 bits). */
function seedFrom(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Présentation type par secteur (secteur inconnu → texte générique). */
const SECTOR_PRESENTATION: Readonly<Record<string, { tagline: string; presentation: string }>> = {
  AGRICULTURE: {
    tagline: 'Cultiver la valeur, nourrir le Mali',
    presentation:
      'Acteur du secteur agricole et agro-alimentaire, engagé dans des filières durables et la valorisation des productions locales.',
  },
  BTP: {
    tagline: 'Bâtir aujourd’hui, construire demain',
    presentation:
      'Entreprise de bâtiment, de génie civil et d’aménagement, mobilisée sur les grands ouvrages et les infrastructures du pays.',
  },
  COMMERCE: {
    tagline: 'Distribuer au plus près des besoins',
    presentation:
      'Opérateur du commerce et de la distribution, présent sur l’ensemble de la chaîne d’approvisionnement.',
  },
  ENERGIE: {
    tagline: 'L’énergie au service du développement',
    presentation:
      'Entreprise du secteur de l’énergie, investie dans l’accès et la transition vers des solutions plus durables.',
  },
  FINANCE: {
    tagline: 'Financer la croissance des entreprises',
    presentation:
      'Institution du secteur financier, au service du financement de l’économie et de l’inclusion.',
  },
  INDUSTRIE: {
    tagline: 'Produire local, exporter loin',
    presentation:
      'Unité industrielle engagée dans la transformation et la montée en gamme de la production nationale.',
  },
  MINES: {
    tagline: 'Valoriser les ressources du sous-sol',
    presentation:
      'Entreprise du secteur minier, attachée à une exploitation responsable et à la valeur ajoutée locale.',
  },
  SANTE: {
    tagline: 'Prendre soin, durablement',
    presentation:
      'Acteur du secteur de la santé, mobilisé pour l’accès aux soins et à des produits de qualité.',
  },
  SERVICES: {
    tagline: 'Le conseil au service de la performance',
    presentation:
      'Entreprise de services aux organisations, du conseil à l’accompagnement opérationnel.',
  },
  TELECOM: {
    tagline: 'Connecter le Mali',
    presentation:
      'Opérateur des télécommunications et du numérique, engagé dans la connectivité du territoire.',
  },
  TRANSPORT: {
    tagline: 'Relier les territoires',
    presentation: 'Entreprise de transport et de logistique, au cœur des échanges régionaux.',
  },
  TOURISME: {
    tagline: 'Faire rayonner le Mali',
    presentation:
      'Acteur du tourisme et de l’hôtellerie, engagé dans la valorisation du patrimoine et de l’accueil.',
  },
};

const ACTIVITY_POOL: readonly Omit<OrganizationActivity, 'date'>[] = [
  {
    kind: 'payment',
    title: 'Cotisation encaissée',
    detail: 'Versement rattaché à l’exercice en cours.',
  },
  {
    kind: 'receipt',
    title: 'Reçu officiel émis',
    detail: 'Reçu CNPM généré et transmis au contact principal.',
  },
  {
    kind: 'reminder',
    title: 'Relance envoyée',
    detail: 'Rappel d’échéance adressé par le canal habituel.',
  },
  {
    kind: 'update',
    title: 'Fiche mise à jour',
    detail: 'Coordonnées et informations descriptives actualisées.',
  },
  {
    kind: 'document',
    title: 'Document déposé',
    detail: 'Pièce justificative ajoutée au dossier de l’entreprise.',
  },
  {
    kind: 'meeting',
    title: 'Rencontre du groupement',
    detail: 'Participation à une réunion sectorielle du CNPM.',
  },
];

/** Construit un profil déterministe pour une entreprise. */
export function buildOrganizationProfile(
  organization: Organization,
  currentYear: number,
): OrganizationProfile {
  const random = seededRandom(seedFrom(organization.id + organization.legalName));
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

  const sector = (organization.sectorCode ?? 'SERVICES').toUpperCase();
  const preset = SECTOR_PRESENTATION[sector] ?? {
    tagline: 'Au service de ses membres et de l’économie',
    presentation:
      'Entreprise membre du réseau CNPM, engagée dans le développement du secteur privé malien.',
  };

  const foundedYear = 1995 + Math.floor(random() * 28);
  const employeeBrackets = ['10 – 50', '50 – 150', '150 – 500', '500 – 1 000'];
  const employees = pick(employeeBrackets);

  const annualContribution = (2 + Math.floor(random() * 18)) * 5_000_000;
  const recoveryRate = 70 + Math.floor(random() * 30);
  const openRequests = Math.floor(random() * 4);

  const keyFigures: OrganizationKeyFigure[] = [
    {
      key: 'seniority',
      label: 'Membre depuis',
      value: `${foundedYear}`,
      caption: `${Math.max(0, currentYear - foundedYear)} ans d’ancienneté`,
    },
    {
      key: 'employees',
      label: 'Effectif estimé',
      value: employees,
      caption: 'salariés déclarés',
    },
    {
      key: 'contribution',
      label: 'Cotisation annuelle',
      value: `${annualContribution.toLocaleString('fr-FR')} FCFA`,
      caption: 'appel de l’exercice en cours',
    },
    {
      key: 'recovery',
      label: 'Taux de recouvrement',
      value: `${recoveryRate} %`,
      caption: 'part réglée sur l’appelé',
    },
    {
      key: 'requests',
      label: 'Requêtes ouvertes',
      value: `${openRequests}`,
      caption: openRequests === 1 ? 'demande en cours' : 'demandes en cours',
    },
  ];

  // Fil d'activité : dates décroissantes déterministes dans l'année en cours et la
  // précédente, pour un rendu « vivant » mais reproductible.
  const activities: OrganizationActivity[] = [];
  let dayOffset = 2 + Math.floor(random() * 4);
  const anchor = new Date(Date.UTC(currentYear, 6, 1));
  for (let i = 0; i < 6; i += 1) {
    const base = pick(ACTIVITY_POOL);
    const date = new Date(anchor);
    date.setUTCDate(date.getUTCDate() - dayOffset);
    activities.push({ ...base, date: date.toISOString().slice(0, 10) });
    dayOffset += 6 + Math.floor(random() * 40);
  }

  const activities2026 = activities.filter(
    (activity) => activity.date.slice(0, 4) === String(currentYear),
  ).length;

  return {
    tagline: preset.tagline,
    presentation: preset.presentation,
    employees,
    foundedYear,
    keyFigures,
    activities,
    activities2026,
  };
}
