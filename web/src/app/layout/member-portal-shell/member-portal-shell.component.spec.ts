import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemberPortalShellComponent } from './member-portal-shell.component';

describe('MemberPortalShellComponent', () => {
  let fixture: ComponentFixture<MemberPortalShellComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberPortalShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'member/home', children: [] },
          { path: 'member/contributions', children: [] },
          { path: 'member/receipts', children: [] },
          { path: 'member/requests', children: [] },
          { path: 'member/directory', children: [] },
          { path: 'member/documents', children: [] },
          { path: 'member/showcase/edit', children: [] },
          { path: 'member/showcase/analytics', children: [] },
          { path: 'member/profile', children: [] },
          { path: 'member/users', children: [] },
        ]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MemberPortalShellComponent);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('expose le vrai logo, le lien d’évitement et les deux navigations', () => {
    expect(host.querySelector<HTMLImageElement>('.member-shell__brand img')?.src).toContain(
      '/assets/brand/logo-CNPM-lockup.png',
    );
    expect(host.querySelector('.member-shell__skip-link')?.getAttribute('href')).toBe(
      '#contenu-principal',
    );
    expect(host.querySelectorAll('nav')).toHaveLength(2);
  });

  it('ne transforme pas les destinations absentes en liens morts', () => {
    // 11 destinations desktop + les 4 premières reprises en mobile (la 5e entrée
    // mobile est le déclencheur « Plus », pas un lien).
    expect(host.querySelectorAll('nav a')).toHaveLength(15);
    expect(host.querySelectorAll('[aria-disabled="true"]')).toHaveLength(0);
    expect(host.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
  });

  it('reprend les onze destinations desktop et borne le mobile à cinq entrées', () => {
    // L'ajout du parcours Paiements porte le desktop à 11 ; le bornage mobile à 5,
    // lui, ne bouge pas — c'est l'invariant que ce test protège.
    expect(host.querySelectorAll('.member-shell__desktop-nav > *')).toHaveLength(11);
    expect(host.querySelectorAll('.member-shell__mobile-nav > *')).toHaveLength(5);
    expect(host.querySelector('.member-shell__notification-count')?.textContent).toContain('3');
  });

  it('annonce uniquement la destination réellement active', async () => {
    await TestBed.inject(Router).navigateByUrl('/member/contributions');
    fixture.detectChanges();
    await fixture.whenStable();

    const current = Array.from(host.querySelectorAll<HTMLAnchorElement>('[aria-current="page"]'));
    expect(current).toHaveLength(2);
    expect(current.every((link) => link.textContent?.trim() === 'Cotisations')).toBe(true);
    expect(host.querySelectorAll('.member-shell__link--active')).toHaveLength(2);
  });

  it('active Documents uniquement sur desktop sans ajouter une sixième destination', async () => {
    await TestBed.inject(Router).navigateByUrl('/member/documents');
    fixture.detectChanges();
    await fixture.whenStable();

    const current = Array.from(host.querySelectorAll<HTMLAnchorElement>('[aria-current="page"]'));
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('Documents');
    expect(host.querySelectorAll('.member-shell__mobile-nav > *')).toHaveLength(5);
  });

  it('rend Annuaire découvrable dans Plus sans dépasser cinq destinations fixes', async () => {
    await TestBed.inject(Router).navigateByUrl('/member/directory');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    const plus = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (item) => item.textContent?.trim() === 'Plus',
    );
    plus?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const current = Array.from(host.querySelectorAll<HTMLAnchorElement>('[aria-current="page"]'));
    expect(current).toHaveLength(2);
    expect(current.every((link) => link.textContent?.trim() === 'Annuaire')).toBe(true);
    expect(host.querySelectorAll('.member-shell__mobile-nav > *')).toHaveLength(5);
  });

  it('ouvre Plus au clavier, piège le focus et restaure le déclencheur à la fermeture', async () => {
    const plus = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (item) => item.textContent?.trim() === 'Plus',
    );
    if (!plus) throw new Error('Bouton Plus absent');

    plus.focus();
    plus.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panel = host.querySelector<HTMLElement>('.member-shell__more-panel');
    const close = host.querySelector<HTMLButtonElement>('.member-shell__more-close');
    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-modal')).toBe('true');
    expect(close).toBe(document.activeElement);
    expect(
      Array.from(panel?.querySelectorAll<HTMLAnchorElement>('nav a') ?? []).map((link) =>
        link.textContent?.trim(),
      ),
    // Paiements prend la 3e place fixe en mobile : Requêtes bascule donc dans « Plus ».
    ).toEqual([
      'Requêtes',
      'Annuaire',
      'Documents',
      'Vitrine',
      'Statistiques',
      'Profil',
      'Utilisateurs',
    ]);

    close?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    );
    const lastLink = panel?.querySelector<HTMLAnchorElement>('nav a:last-child');
    expect(lastLink).toBe(document.activeElement);
    lastLink?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.member-shell__more-panel')).toBeNull();
    expect(plus).toBe(document.activeElement);
    expect(plus.getAttribute('aria-expanded')).toBe('false');
  });

  it.each([
    ['/member/showcase/edit', 'Vitrine'],
    ['/member/showcase/analytics', 'Statistiques'],
    ['/member/profile', 'Profil'],
    ['/member/users', 'Utilisateurs'],
  ])('active %s uniquement dans la navigation desktop', async (url, label) => {
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();

    const current = Array.from(host.querySelectorAll<HTMLAnchorElement>('[aria-current="page"]'));
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe(label);
    expect(host.querySelectorAll('.member-shell__mobile-nav > *')).toHaveLength(5);
  });
});
