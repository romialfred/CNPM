export type CnpmToastTone = 'success' | 'error' | 'info';

export interface CnpmToastAction {
  readonly label: string;
  readonly run: () => void;
}

export interface CnpmToast {
  readonly id: number;
  readonly tone: CnpmToastTone;
  readonly message: string;
  /** Action facultative (« Annuler », « Voir »), rendue comme un bouton dans le toast. */
  readonly action?: CnpmToastAction;
}

/**
 * Durée d'affichage par défaut, en millisecondes. `0` = persistant jusqu'au rejet
 * manuel. Les erreurs et les toasts porteurs d'une action ne disparaissent pas seuls :
 * ils exigent une lecture ou un geste, qu'une disparition automatique escamoterait.
 */
export interface CnpmToastOptions {
  readonly tone?: CnpmToastTone;
  readonly action?: CnpmToastAction;
  readonly durationMs?: number;
}
