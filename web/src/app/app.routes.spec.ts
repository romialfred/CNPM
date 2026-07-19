import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouteConfigLoadStart, Router, type Routes } from '@angular/router';

import { provideCnpmApi } from './core/api/api.config';
import { routes } from './app.routes';

describe('routes racine', () => {
  it('monte chaque catalogue sous un prefixe lazy explicite', async () => {
    const cataloguePaths = ['auth', 'member', 'admin', 'membres', ''];
    const catalogues = cataloguePaths.map((path) => routes.find((route) => route.path === path)!);

    expect(catalogues.every((route) => route.loadChildren)).toBe(true);

    const loaded = await Promise.all(
      catalogues.map((route) => (route.loadChildren as () => Promise<Routes>)()),
    );

    expect(loaded.map((catalogue) => catalogue.map((route) => route.path))).toEqual([
      [''],
      ['home'],
      [''],
      [':slug'],
      [''],
    ]);
  });

  it('conserve les alias puis le repli public', () => {
    expect(routes.find((route) => route.path === 'espace-membre')).toMatchObject({
      pathMatch: 'full',
      redirectTo: 'member/home',
    });
    expect(routes.at(-1)).toMatchObject({ path: '**', redirectTo: '' });
  });

  it('ne charge que le catalogue admin pour une navigation profonde froide', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideCnpmApi({ dataMode: 'demo' }),
        provideRouter(routes),
      ],
    });
    const router = TestBed.inject(Router);
    const loadedPaths: string[] = [];
    const subscription = router.events.subscribe((event) => {
      if (event instanceof RouteConfigLoadStart) loadedPaths.push(event.route.path ?? '');
    });

    await router.navigateByUrl('/admin/dashboard');

    expect(router.url).toBe('/admin/dashboard');
    expect(loadedPaths).toContain('admin');
    expect(loadedPaths).not.toContain('auth');
    expect(loadedPaths).not.toContain('member');
    expect(loadedPaths).not.toContain('membres');
    subscription.unsubscribe();
  }, 20_000);
});
