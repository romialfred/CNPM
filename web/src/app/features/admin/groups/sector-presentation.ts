/**
 * Présentation d'un secteur professionnel côté administration.
 *
 * Le contrat de lecture n'expose qu'un `sectorCode` brut (ex. « SEC-BTP »). Ce module
 * en dérive uniquement de la *présentation* — un libellé lisible et une photographie
 * topique — sans jamais inventer de règle métier, de rattachement ni de donnée
 * officielle. Le libellé de repli reste une simple mise en forme du code reçu, afin
 * qu'un code inconnu demeure honnête et ne soit jamais masqué.
 */

interface SectorPresentation {
  /** Libellé humain affiché à la place du code brut. */
  readonly label: string;
  /** Mots-clés loremflickr décrivant le secteur. */
  readonly keywords: string;
  /** Verrou loremflickr : rend la photo déterministe et stable dans le temps. */
  readonly lock: number;
}

/**
 * Table de présentation des secteurs connus du référentiel de démonstration.
 * Un code absent de la table retombe sur une mise en forme générique.
 */
const SECTORS: Readonly<Record<string, SectorPresentation>> = {
  'SEC-AGRI': { label: 'Agriculture', keywords: 'agriculture,farm', lock: 41 },
  'SEC-ARTISANAT': { label: 'Artisanat', keywords: 'craft,workshop', lock: 42 },
  'SEC-BTP': { label: 'BTP et construction', keywords: 'construction,building', lock: 43 },
  'SEC-COMMERCE': { label: 'Commerce', keywords: 'store,market', lock: 44 },
  'SEC-ENERGIE': { label: 'Énergie', keywords: 'energy,powerplant', lock: 45 },
  'SEC-HOTELLERIE': { label: 'Hôtellerie', keywords: 'hotel,hospitality', lock: 46 },
  'SEC-INDUSTRIE': { label: 'Industrie', keywords: 'factory,industry', lock: 47 },
  'SEC-LOGISTIQUE': { label: 'Logistique', keywords: 'logistics,warehouse', lock: 48 },
  'SEC-NUMERIQUE': { label: 'Numérique', keywords: 'technology,datacenter', lock: 49 },
  'SEC-SERVICES': { label: 'Services', keywords: 'office,service', lock: 50 },
  'SEC-TEXTILE': { label: 'Textile', keywords: 'textile,fabric', lock: 51 },
};

const GENERIC_KEYWORDS = 'business,office';
const GENERIC_LOCK = 60;
const IMAGE_WIDTH = 480;
const IMAGE_HEIGHT = 320;

/** Libellé humain d'un secteur ; `null`/vide restitue « Non renseigné ». */
export function sectorLabel(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return 'Non renseigné';
  }
  return SECTORS[value]?.label ?? humanize(value);
}

/**
 * URL loremflickr topique et déterministe pour un secteur.
 * Retourne `null` lorsqu'aucun secteur n'est renseigné, afin de laisser l'appelant
 * afficher une icône de repli du design system.
 */
export function sectorImage(value: string | null): string | null {
  if (value === null || value.trim().length === 0) {
    return null;
  }
  const preset = SECTORS[value];
  const keywords = preset?.keywords ?? GENERIC_KEYWORDS;
  const lock = preset?.lock ?? genericLock(value);
  return `https://loremflickr.com/${IMAGE_WIDTH}/${IMAGE_HEIGHT}/${keywords}?lock=${lock}`;
}

/** Mise en forme générique d'un code inconnu : retire le préfixe, normalise la casse. */
function humanize(value: string): string {
  const raw = value
    .replace(/^SEC[-_]/i, '')
    .replaceAll(/[-_]+/g, ' ')
    .trim()
    .toLowerCase();
  return raw.length > 0 ? raw.charAt(0).toUpperCase() + raw.slice(1) : value;
}

/** Verrou stable dérivé d'un code inconnu, pour varier les photos génériques. */
function genericLock(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000;
  }
  return GENERIC_LOCK + hash;
}
