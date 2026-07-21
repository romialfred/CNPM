import { describe, expect, it } from 'vitest';
import {
  facadeOfRole,
  facadesOfRoles,
  primaryFacade,
  ROLE_FACADES,
  roleFacadeInfo,
} from './role-facade';

describe('façade des rôles', () => {
  it('expose exactement les cinq rôles de la mission', () => {
    expect(ROLE_FACADES.map((f) => f.id)).toEqual([
      'SUPER_ADMIN',
      'ADMIN_CNPM',
      'RESPONSABLE_ORGANISATION',
      'MEMBRE_CNPM',
      'AUDITEUR',
    ]);
  });

  it('rattache les rôles canoniques représentatifs à leur façade', () => {
    expect(facadeOfRole('SUPER_ADMIN_TECH')).toBe('SUPER_ADMIN');
    expect(facadeOfRole('ADMIN_FONCTIONNEL')).toBe('ADMIN_CNPM');
    expect(facadeOfRole('RESPONSABLE_GROUPEMENT')).toBe('RESPONSABLE_ORGANISATION');
    expect(facadeOfRole('MEMBRE_UTILISATEUR')).toBe('MEMBRE_CNPM');
    expect(facadeOfRole('AUDITEUR_INTERNE')).toBe('AUDITEUR');
  });

  it('ne rattache aucun rôle inconnu — le serveur reste la source des droits', () => {
    expect(facadeOfRole('ROLE_INVENTE')).toBeNull();
  });

  it('résume un cumul de rôles par la façade la plus élevée', () => {
    // Un compte à la fois auditeur et super-admin est présenté comme super-admin.
    expect(primaryFacade(['AUDITEUR_INTERNE', 'SUPER_ADMIN_TECH'])).toBe('SUPER_ADMIN');
  });

  it('liste les façades distinctes, ordonnées par priorité, sans doublon', () => {
    const facades = facadesOfRoles([
      'MEMBRE_UTILISATEUR',
      'AUDITEUR_EXTERNE',
      'AUDITEUR_INTERNE',
      'ADMIN_FONCTIONNEL',
    ]);
    expect(facades).toEqual(['ADMIN_CNPM', 'MEMBRE_CNPM', 'AUDITEUR']);
  });

  it('fournit un libellé et une description lisibles pour chaque façade', () => {
    for (const info of ROLE_FACADES) {
      expect(roleFacadeInfo(info.id).label.length).toBeGreaterThan(0);
      expect(roleFacadeInfo(info.id).description.length).toBeGreaterThan(0);
    }
  });
});
