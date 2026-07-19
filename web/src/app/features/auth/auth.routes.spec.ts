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

  it('porte une configuration fermée et traçable sur AUTH-003 à AUTH-007', () => {
    const children = authRoutes[0].children ?? [];
    const blocked = children.filter((route) => route.data?.['blockedAuth']);

    expect(blocked).toHaveLength(5);
    expect(blocked.map((route) => route.data?.['blockedAuth'].screenId)).toEqual([
      'AUTH-003',
      'AUTH-004',
      'AUTH-005',
      'AUTH-006',
      'AUTH-007',
    ]);
  });
});
