import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemberPortalShellComponent } from './member-portal-shell.component';

describe('MemberPortalShellComponent', () => {
  let fixture: ComponentFixture<MemberPortalShellComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberPortalShellComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
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
    expect(host.querySelectorAll('nav a')).toHaveLength(2);
    expect(host.querySelectorAll('[aria-disabled="true"]')).toHaveLength(10);
    expect(host.querySelectorAll('[aria-current="page"]')).toHaveLength(2);
  });

  it('reprend les sept destinations desktop et borne le mobile à cinq entrées', () => {
    expect(host.querySelectorAll('.member-shell__desktop-nav > *')).toHaveLength(7);
    expect(host.querySelectorAll('.member-shell__mobile-nav > *')).toHaveLength(5);
    expect(host.querySelector('.member-shell__notification-count')?.textContent).toContain('3');
  });
});
