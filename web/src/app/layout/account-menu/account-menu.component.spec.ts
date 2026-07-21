import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccountMenuComponent } from './account-menu.component';

describe('AccountMenuComponent', () => {
  let fixture: ComponentFixture<AccountMenuComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountMenuComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AccountMenuComponent);
    fixture.componentRef.setInput('name', 'Romuald Tiegnan');
    fixture.componentRef.setInput('secondary', 'Super administrateur');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('affiche les initiales et un déclencheur replié', () => {
    expect(host.querySelector('.cnpm-account-menu__avatar')?.textContent?.trim()).toBe('RT');
    const trigger = host.querySelector('.cnpm-account-menu__trigger');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger?.getAttribute('aria-label')).toBe(
      'Compte de Romuald Tiegnan, Super administrateur',
    );
    // Rien n'est ouvert : pas de déconnexion visible tant que le menu est fermé.
    expect(host.querySelector('[routerLink="/auth/logout"], a[href="/auth/logout"]')).toBeNull();
  });

  it('ouvre le menu et expose la déconnexion vers /auth/logout', () => {
    host.querySelector<HTMLButtonElement>('.cnpm-account-menu__trigger')?.click();
    fixture.detectChanges();

    const trigger = host.querySelector('.cnpm-account-menu__trigger');
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    const logout = host.querySelector<HTMLAnchorElement>('a[href="/auth/logout"]');
    expect(logout).not.toBeNull();
    expect(logout?.getAttribute('role')).toBe('menuitem');
    expect(logout?.textContent).toContain('Se déconnecter');
    // Pas de lien profil tant qu'aucune route n'est fournie.
    expect(host.textContent).not.toContain('Mon profil');
  });

  it('propose « Mon profil » quand une route est fournie', () => {
    fixture.componentRef.setInput('profileLink', '/member/profile');
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('.cnpm-account-menu__trigger')?.click();
    fixture.detectChanges();

    expect(host.querySelector<HTMLAnchorElement>('a[href="/member/profile"]')?.textContent).toContain(
      'Mon profil',
    );
  });

  it('referme le menu à la touche Échap', () => {
    host.querySelector<HTMLButtonElement>('.cnpm-account-menu__trigger')?.click();
    fixture.detectChanges();
    expect(host.querySelector('.cnpm-account-menu__panel')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.querySelector('.cnpm-account-menu__panel')).toBeNull();
  });
});
