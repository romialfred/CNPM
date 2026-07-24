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

  it('ne laisse bloqués que les parcours dont la politique n’est pas tranchée', () => {
    // AUTH-005 (réinitialisation) et AUTH-006 (activation) sont livrés : le titulaire pose
    // son mot de passe avec un jeton à usage unique. AUTH-004 reste bloqué — la demande
    // en LIBRE-SERVICE d'un lien suppose un canal d'envoi (courriel, SMS) non livré ;
    // aujourd'hui le lien est émis par un administrateur.
    const children = authRoutes[0].children ?? [];
    const blocked = children.filter((route) => route.data?.['blockedAuth']);

    expect(blocked).toHaveLength(2);
    expect(blocked.map((route) => route.data?.['blockedAuth'].screenId)).toEqual([
      'AUTH-003',
      'AUTH-004',
    ]);
  });

  it('livre la pose du mot de passe sur les deux routes qui la demandent', () => {
    const children = authRoutes[0].children ?? [];
    const routes = children.filter((route) =>
      ['reset-password', 'activate'].includes(route.path ?? ''),
    );

    expect(routes).toHaveLength(2);
    expect(routes.every((route) => route.loadComponent)).toBe(true);
    // Le drapeau distingue l'activation d'un compte neuf d'une récupération d'accès.
    expect(routes.map((route) => route.data?.['activation'])).toEqual([false, true]);
  });

  it('livre l’enrôlement 2FA comme composant réel, non comme écran bloqué', () => {
    const children = authRoutes[0].children ?? [];
    const enrollment = children.find((route) => route.path === '2fa-enrollment');

    expect(enrollment).toBeDefined();
    expect(enrollment?.data?.['blockedAuth']).toBeUndefined();
    expect(enrollment?.loadComponent).toBeDefined();
  });
});
