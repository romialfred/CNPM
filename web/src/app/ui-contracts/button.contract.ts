export type CnpmButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'public-cta';
export type CnpmButtonSize = 'sm' | 'md' | 'lg';
export interface CnpmButtonContract {
  variant: CnpmButtonVariant;
  size?: CnpmButtonSize;
  /**
   * Destination de navigation. Renseignée, l'action est rendue comme un lien : un
   * contrôle qui change d'adresse doit être une ancre porteuse d'un `href`, sinon
   * l'ouverture dans un nouvel onglet, le clic milieu et le rôle annoncé disparaissent.
   */
  routerLink?: string | readonly unknown[];
  loading?: boolean;
  disabled?: boolean;
  iconStart?: string;
  iconEnd?: string;
  accessibleLabel?: string;
}
