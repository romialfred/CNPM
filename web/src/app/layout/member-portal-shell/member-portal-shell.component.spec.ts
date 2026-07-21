import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemberPortalShellComponent } from './member-portal-shell.component';

describe('MemberPortalShellComponent — barre latérale dédiée au membre', () => {
  let fixture: ComponentFixture<MemberPortalShellComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberPortalShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'member/home', children: [] },
          { path: 'member/contributions/:id', children: [] },
          { path: 'member/contributions', children: [] },
          { path: 'member/payments', children: [] },
          { path: 'member/receipts', children: [] },
          { path: 'member/documents', children: [] },
          { path: 'member/requests', children: [] },
          { path: 'member/cnpm', children: [] },
          { path: 'member/directory', children: [] },
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

  it('expose le logo, le lien d’évitement et une navigation groupée à la voix du membre', () => {
    expect(host.querySelector<HTMLImageElement>('.member-shell__brand img')?.src).toContain(
      '/assets/brand/logo-CNPM-lockup.png',
    );
    expect(host.querySelector('.member-shell__skip-link')?.getAttribute('href')).toBe(
      '#contenu-principal',
    );

    const titles = Array.from(host.querySelectorAll('.member-shell__group-title')).map((element) =>
      element.textContent?.trim(),
    );
    expect(titles).toEqual(['Mon espace', 'Le CNPM', 'Mon compte']);
  });

  it('rend les douze destinations comme de vrais liens, sans lien mort', () => {
    const items = Array.from(
      host.querySelectorAll<HTMLAnchorElement>('.member-shell__nav a.member-shell__item'),
    );
    expect(items).toHaveLength(12);
    expect(items.every((link) => (link.getAttribute('href')?.length ?? 0) > 0)).toBe(true);
    expect(host.querySelectorAll('.member-shell__nav [aria-disabled="true"]')).toHaveLength(0);
    expect(host.querySelector('.member-shell__notification-count')?.textContent).toContain('3');
  });

  it('surface bien l’entrée « Le CNPM » attendue par le membre', () => {
    const labels = Array.from(host.querySelectorAll('.member-shell__item-label')).map((element) =>
      element.textContent?.trim(),
    );
    expect(labels).toContain('Mes cotisations');
    expect(labels).toContain('Mes documents');
    expect(labels).toContain('Mes requêtes');
    expect(labels).toContain('Actualités & informations');
    const cnpm = host.querySelector<HTMLAnchorElement>(
      '.member-shell__nav a[href="/member/cnpm"]',
    );
    expect(cnpm?.textContent).toContain('Actualités & informations');
  });

  it('annonce uniquement la destination réellement active', async () => {
    await TestBed.inject(Router).navigateByUrl('/member/contributions');
    fixture.detectChanges();
    await fixture.whenStable();

    const current = Array.from(host.querySelectorAll<HTMLAnchorElement>('[aria-current="page"]'));
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('Mes cotisations');
    expect(host.querySelectorAll('.member-shell__item--active')).toHaveLength(1);
  });

  it('garde la rubrique parente active sur un écran enfant', async () => {
    await TestBed.inject(Router).navigateByUrl('/member/contributions/CNPM-2024');
    fixture.detectChanges();
    await fixture.whenStable();

    const current = Array.from(host.querySelectorAll<HTMLAnchorElement>('[aria-current="page"]'));
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('Mes cotisations');
  });

  it('distingue Vitrine et Statistiques malgré leur préfixe commun', async () => {
    await TestBed.inject(Router).navigateByUrl('/member/showcase/analytics');
    fixture.detectChanges();
    await fixture.whenStable();

    const current = Array.from(host.querySelectorAll<HTMLAnchorElement>('[aria-current="page"]'));
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('Statistiques');
  });

  it('ouvre le tiroir mobile en dialogue modal, neutralise le cadre et focalise Fermer', async () => {
    const trigger = await openDrawer();

    const sidebar = host.querySelector<HTMLElement>('.member-shell__sidebar');
    const frame = host.querySelector<HTMLElement>('.member-shell__frame');
    const close = host.querySelector<HTMLButtonElement>('[data-drawer-initial-focus]');

    expect(sidebar?.getAttribute('role')).toBe('dialog');
    expect(sidebar?.getAttribute('aria-modal')).toBe('true');
    expect(frame?.hasAttribute('inert')).toBe(true);
    expect(frame?.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe('hidden');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('boucle le focus avec Tab et Maj+Tab dans le tiroir', async () => {
    await openDrawer();

    const focusable = Array.from(
      host.querySelectorAll<HTMLElement>(
        '.member-shell__sidebar a[href], .member-shell__sidebar button:not([disabled])',
      ),
    );
    const first = focusable[0];

    focusable.at(-1)?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);

    first?.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    const sidebar = host.querySelector<HTMLElement>('.member-shell__sidebar');
    expect(sidebar?.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(first);
  });

  it('ferme avec Échap, restitue le focus au déclencheur et réactive le cadre', async () => {
    const trigger = await openDrawer();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    const frame = host.querySelector<HTMLElement>('.member-shell__frame');
    const sidebar = host.querySelector<HTMLElement>('.member-shell__sidebar');
    expect(frame?.hasAttribute('inert')).toBe(false);
    expect(sidebar?.hasAttribute('role')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  /** Ouvre le tiroir via le déclencheur et laisse la micro-tâche de focus initial s'exécuter. */
  async function openDrawer(): Promise<HTMLButtonElement> {
    const trigger = host.querySelector<HTMLButtonElement>('.member-shell__menu-button');
    if (!trigger) throw new Error('Déclencheur du tiroir introuvable');
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // La mise au focus de Fermer passe par queueMicrotask : l'await la laisse s'exécuter.
    await Promise.resolve();
    return trigger;
  }
});
