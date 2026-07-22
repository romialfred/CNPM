/**
 * Modèle de contenu de l'aide et de la documentation.
 *
 * Le contenu est décrit en données typées (et non en HTML brut) : rendu par des gabarits
 * Angular sûrs, il évite tout `innerHTML` non maîtrisé (règle frontend), reste accessible
 * (titres, tableaux et listes sémantiques) et localisable. Chaque bloc correspond à un
 * élément de rendu discret.
 */
export type DocBlock =
  | { readonly kind: 'paragraph'; readonly text: string }
  /** Marche à suivre ordonnée (rendue en `<ol>`). */
  | { readonly kind: 'steps'; readonly items: readonly string[] }
  /** Liste à puces (rendue en `<ul>`). */
  | { readonly kind: 'list'; readonly items: readonly string[] }
  | {
      readonly kind: 'table';
      readonly caption?: string;
      readonly headers: readonly string[];
      readonly rows: readonly (readonly string[])[];
    }
  /** Bloc de code ou de configuration, préformaté. */
  | { readonly kind: 'code'; readonly caption?: string; readonly lines: readonly string[] }
  /** Arborescence de fichiers, préformatée en police à chasse fixe. */
  | { readonly kind: 'tree'; readonly caption?: string; readonly lines: readonly string[] }
  /** Encadré d'information, d'avertissement ou d'astuce (le ton n'est jamais porté par la seule couleur). */
  | { readonly kind: 'callout'; readonly tone: 'info' | 'warning' | 'tip'; readonly text: string };

export interface DocSubsection {
  /** Ancre stable pour la navigation par sommaire. */
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly DocBlock[];
}

export interface DocSection {
  /** Ancre stable pour la navigation par sommaire. */
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly subsections: readonly DocSubsection[];
}

export type DocManualId = 'user' | 'technical';

export interface DocManual {
  readonly id: DocManualId;
  /** Libellé de l'onglet. */
  readonly label: string;
  /** Sous-titre affiché sous l'onglet actif. */
  readonly tagline: string;
  readonly sections: readonly DocSection[];
}
