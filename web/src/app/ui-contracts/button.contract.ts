export type CnpmButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'public-cta';
export type CnpmButtonSize = 'sm' | 'md' | 'lg';
export interface CnpmButtonContract {
  variant: CnpmButtonVariant;
  size?: CnpmButtonSize;
  loading?: boolean;
  disabled?: boolean;
  iconStart?: string;
  iconEnd?: string;
  accessibleLabel?: string;
}
