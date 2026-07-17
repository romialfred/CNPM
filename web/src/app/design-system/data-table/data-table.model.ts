export type DataTableAlign = 'start' | 'end';

export interface DataTableColumn {
  readonly key: string;
  readonly label: string;
  /**
   * Les montants s'alignent à droite (critère d'acceptation de BO-002) : l'œil
   * compare des ordres de grandeur en lisant les unités les unes sous les autres.
   */
  readonly align?: DataTableAlign;
  readonly sortable?: boolean;
  /** Précision d'en-tête, par exemple l'unité monétaire. */
  readonly note?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  readonly key: string;
  readonly direction: SortDirection;
}

/**
 * États exigés par le catalogue (DAT-001) et par la fiche BO-002, qui impose de
 * couvrir « chargement, vide, aucun résultat, erreur, accès interdit ».
 *
 * `empty` et `noResult` sont distincts et ne doivent jamais être confondus : une
 * collection vide appelle à créer un premier enregistrement, un filtre sans
 * correspondance appelle à élargir la recherche. Proposer « créer un membre » à
 * quelqu'un dont le filtre est trop étroit est une impasse.
 */
export type DataTableState = 'loading' | 'ready' | 'empty' | 'noResult' | 'error' | 'forbidden';
