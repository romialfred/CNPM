import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { InstitutionalPage } from './institutional.page';

async function setup(mode: 'about' | 'services') {
  await TestBed.configureTestingModule({
    imports: [InstitutionalPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
        { path: 'le-cnpm', children: [] },
        { path: 'services', children: [] },
        { path: 'membres', children: [] },
        { path: 'actualites', children: [] },
        { path: 'agenda', children: [] },
      ]),
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode } } } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(InstitutionalPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

describe('InstitutionalPage (PUB-002/PUB-003)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('présente le rôle du CNPM sans inventer de règle institutionnelle', async () => {
    const { host } = await setup('about');
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('h1')?.textContent).toContain('plateforme au service');
    expect(host.querySelectorAll('.role-card')).toHaveLength(4);
    expect(host.textContent).toContain('ne remplace aucun texte statutaire');
    expect(host.querySelector('h1')).toBe(document.activeElement);
  });

  it('rend le catalogue avec une authentification unique pour les services sensibles', async () => {
    const { host } = await setup('services');
    expect(host.querySelectorAll('.service-card')).toHaveLength(6);
    expect(host.textContent).toContain('backend');
    expect(host.querySelector<HTMLAnchorElement>('a[href="/auth/login"]')).not.toBeNull();
    expect(host.querySelector<HTMLAnchorElement>('a[href="/membres"]')).not.toBeNull();
  });

  it('bloque l’indexation de la copie non encore approuvée', async () => {
    await setup('services');
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe(
      'noindex,nofollow',
    );
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toContain(
      '/services',
    );
  });
});
