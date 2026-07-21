import { authRoutes } from './auth.routes';

describe('authRoutes', () => {
  it('expose tous les parcours AUTH inventoriés', () => {
    const children = authRoutes[0].children ?? [];
    const paths = children.map((route) => route.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'login',
        'verify',
        'verify/method',
        'forgot-password',
        'reset-password',
        'activate',
        '2fa-enrollment',
        'session-ended',
      ]),
    );
  });

  it('porte une configuration fermée et traçable sur AUTH-003 à AUTH-006', () => {
    // AUTH-007 (enrôlement 2FA) n'est plus un écran « bloqué » : il est livré comme popup
    // premium pilotant le TOTP du fournisseur d'identité. Restent bloqués les quatre
    // parcours dont la politique dépend encore d'UX-DEC-011.
    const children = authRoutes[0].children ?? [];
    const blocked = children.filter((route) => route.data?.['blockedAuth']);

    expect(blocked).toHaveLength(4);
    expect(blocked.map((route) => route.data?.['blockedAuth'].screenId)).toEqual([
      'AUTH-003',
      'AUTH-004',
      'AUTH-005',
      'AUTH-006',
    ]);
  });

  it('livre l’enrôlement 2FA comme composant réel, non comme écran bloqué', () => {
    const children = authRoutes[0].children ?? [];
    const enrollment = children.find((route) => route.path === '2fa-enrollment');

    expect(enrollment).toBeDefined();
    expect(enrollment?.data?.['blockedAuth']).toBeUndefined();
    expect(enrollment?.loadComponent).toBeDefined();
  });
});
