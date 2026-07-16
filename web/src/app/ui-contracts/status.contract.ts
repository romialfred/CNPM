export type CnpmStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';
export interface CnpmStatusPresentation { label: string; tone: CnpmStatusTone; icon?: string; description?: string; }
export const MEMBER_STATUS: Record<string, CnpmStatusPresentation> = {
  ACTIVE: { label: 'Actif', tone: 'success', icon: 'circle-check' },
  DORMANT: { label: 'Dormant', tone: 'warning', icon: 'clock-3' },
  PROSPECT: { label: 'Prospect', tone: 'info', icon: 'user-plus' },
  SUSPENDED: { label: 'Suspendu', tone: 'error', icon: 'circle-pause' },
};
