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
          { path: 'member/documents', children: [] },
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
      '/assets/brand/logo-CNPM.png',
    );
    expect(host.querySelector('.member-shell__skip-link')?.getAttribute('href')).toBe(
      '#contenu-principal',
    );
    expect(host.querySelectorAll('nav')).toHaveLength(2);
  });

  it('ne transforme pas les destinations absentes en liens morts', () => {
    expect(host.querySelectorAll('nav a')).toHaveLength(12);
    expect(host.querySelectorAll('[aria-disabled="true"]')).toHaveLength(2);
    expect(host.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
  });

  it('reprend les neuf destinations desktop et borne le mobile à cinq entrées', () => {
    expect(host.querySelectorAll('.member-shell__desktop-nav > *')).toHaveLength(9);
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

  it('active Documents sur desktop et mobile sans ajouter une sixième destination', async () => {
    await TestBed.inject(Router).navigateByUrl('/member/documents');
    fixture.detectChanges();
    await fixture.whenStable();

    const current = Array.from(host.querySelectorAll<HTMLAnchorElement>('[aria-current="page"]'));
    expect(current).toHaveLength(2);
    expect(current.every((link) => link.textContent?.trim() === 'Documents')).toBe(true);
    expect(host.querySelectorAll('.member-shell__mobile-nav > *')).toHaveLength(5);
  });

  it.each([
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
