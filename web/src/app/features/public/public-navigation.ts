import type { CnpmNavMenuItem } from '../../design-system/nav-menu/nav-menu.component';

export interface PublicNavGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly CnpmNavMenuItem[];
}

/**
 * Source unique de la navigation publique — barre desktop, tiroir mobile et pied de page.
 *
 * Trois listes distinctes étaient auparavant écrites en dur dans la coquille : elles
 * avaient divergé (le desktop omettait /contact, exposé par les deux autres) et la barre
 * concaténait en plus les ancres de la page courante, ce qui produisait des libellés
 * strictement dupliqués. Les ancres relèvent du sommaire de page, pas de la navigation
 * de site : elles ne sont plus projetées ici.
 *
 * Aucune destination n'est inventée : chacune correspond à une route déclarée dans
 * `public.routes.ts`. L'accueil reste atteignable par le logo, et le portail membre
 * demeure un appel à l'action isolé — une seule action primaire par zone.
 *
 * Divergence assumée et tracée : REF-PUB-001 décrit huit entrées dont deux déroulantes.
 * Le regroupement en quatre menus est une demande explicite du client, consignée dans
 * `docs/00-governance/open-decisions.md` (UX-DEC-012).
 */
export const PUBLIC_NAVIGATION: readonly PublicNavGroup[] = [
  {
    id: 'nav-institution',
    label: 'Le CNPM',
    items: [
      { label: 'Présentation', routerLink: '/le-cnpm', hint: 'Missions, gouvernance et réseau' },
      { label: 'Agenda', routerLink: '/agenda', hint: 'Rendez-vous et événements' },
      { label: 'Contact', routerLink: '/contact', hint: 'Nous écrire' },
    ],
  },
  {
    id: 'nav-services',
    label: 'Services',
    items: [
      { label: 'Nos services', routerLink: '/services', hint: 'Accompagnement aux entreprises' },
      { label: 'Adhérer au CNPM', routerLink: '/adhesion', hint: 'Préparer une demande' },
      {
        label: 'Vérifier un reçu',
        routerLink: '/verification/DEMO-VERIF-2026-001',
        hint: 'Contrôle d’authenticité',
      },
    ],
  },
  {
    id: 'nav-membres',
    label: 'Membres',
    items: [
      {
        label: 'Annuaire des membres',
        routerLink: '/membres',
        hint: 'Entreprises référencées',
        exact: true,
      },
      {
        label: 'Recherche avancée',
        routerLink: '/membres/recherche',
        hint: 'Filtrer par secteur et région',
      },
    ],
  },
  {
    id: 'nav-actualites',
    label: 'Actualités',
    items: [
      { label: 'Toutes les actualités', routerLink: '/actualites', hint: 'Publications récentes' },
    ],
  },
];

/** Pages légales : pied de page uniquement, jamais dans la navigation principale. */
export const PUBLIC_LEGAL_LINKS: readonly CnpmNavMenuItem[] = [
  { label: 'Mentions légales', routerLink: '/legal/mentions-legales' },
  { label: 'Confidentialité', routerLink: '/legal/confidentialite' },
  { label: 'Conditions d’utilisation', routerLink: '/legal/conditions-utilisation' },
];
