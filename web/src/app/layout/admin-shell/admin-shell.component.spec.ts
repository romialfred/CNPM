import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminShellComponent } from './admin-shell.component';
import { DemoSessionGateway } from './demo-session.gateway';
import { SESSION_GATEWAY } from './session-gateway';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AdminShellComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminShellComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

async function openDrawer(
  fixture: ComponentFixture<AdminShellComponent>,
  host: HTMLElement,
): Promise<HTMLButtonElement> {
  const trigger = host.querySelector<HTMLButtonElement>('.cnpm-topbar__drawer');
  if (!trigger) throw new Error('Déclencheur du drawer introuvable');
  trigger.focus();
  trigger.click();
  await fixture.whenStable();
  fixture.detectChanges();
  await Promise.resolve();
  return trigger;
}

describe('AdminShellComponent — drawer accessible', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('expose le logo CNPM autorisé et les landmarks du shell', async () => {
    const { host } = await setup();

    expect(host.querySelector('a[href="#contenu-principal"]')).not.toBeNull();
    expect(host.querySelector('main#contenu-principal')).not.toBeNull();
    expect(host.querySelector<HTMLImageElement>('.cnpm-sidebar__logo')?.src).toContain(
      '/assets/brand/logo-CNPM-lockup.png',
    );
  });

  it('rend BO-037 découvrable pour la persona de démonstration autorisée', async () => {
    const { fixture, host } = await setup();

    // Les groupes sont repliés : tout déplier demandait 968 px de navigation pour 502
    // disponibles, et la colonne défilait. La découvrabilité passe donc par l'intitulé
    // du domaine, toujours visible, puis par son dépliage — c'est le chemin réel de
    // l'utilisateur, et c'est lui que ce test parcourt.
    const groupe = Array.from(
      host.querySelectorAll<HTMLButtonElement>('.cnpm-sidebar__group-trigger'),
    ).find((bouton) => (bouton.textContent ?? '').includes('Relation membre'));

    expect(groupe).toBeDefined();
    expect(groupe?.getAttribute('aria-expanded')).toBe('false');

    groupe?.click();
    fixture.detectChanges();

    const link = host.querySelector<HTMLAnchorElement>('a[href="/admin/showcases/moderation"]');
    expect(link?.textContent).toContain('Vitrines');
  });

  it('garde les cinq intitules de domaine visibles et les groupes replies', async () => {
    // Contrainte du client : aucune barre de defilement dans la navigation. Vingt-trois
    // lignes n'y tiennent pas ; ce sont les intitules qui doivent tous rester visibles.
    const { host } = await setup();
    const intitules = Array.from(
      host.querySelectorAll<HTMLButtonElement>('.cnpm-sidebar__group-trigger'),
    );

    expect(intitules).toHaveLength(5);
    expect(intitules.every((bouton) => bouton.getAttribute('aria-expanded') === 'false')).toBe(
      true,
    );
    // Aucun panneau de groupe n'est monte tant qu'aucun n'est ouvert.
    expect(host.querySelectorAll('.cnpm-sidebar__sublist')).toHaveLength(0);
  });

  it('ne porte plus le bloc « Exercice en cours » en pied de navigation', async () => {
    // Il occupait 60 px sans servir a naviguer ; l'exercice se choisit sur le tableau de
    // bord, ou il pilote reellement les chiffres affiches.
    const { host } = await setup();

    expect(host.querySelector('.cnpm-sidebar__exercise')).toBeNull();
  });

  it('ouvre un dialogue modal, neutralise le contenu et place le focus sur Fermer', async () => {
    const { fixture, host } = await setup();
    await openDrawer(fixture, host);

    const sidebar = host.querySelector<HTMLElement>('.cnpm-admin__sidebar');
    const frame = host.querySelector<HTMLElement>('.cnpm-admin__frame');
    const close = host.querySelector<HTMLButtonElement>('[data-drawer-initial-focus]');

    expect(sidebar?.getAttribute('role')).toBe('dialog');
    expect(sidebar?.getAttribute('aria-modal')).toBe('true');
    expect(frame?.hasAttribute('inert')).toBe(true);
    expect(frame?.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('boucle le focus avec Tab et Maj+Tab dans le drawer', async () => {
    const { fixture, host } = await setup();
    await openDrawer(fixture, host);

    const focusable = Array.from(
      host.querySelectorAll<HTMLElement>(
        '.cnpm-admin__sidebar a[href], .cnpm-admin__sidebar button:not([disabled])',
      ),
    ).filter((element) => getComputedStyle(element).display !== 'none');
    const first = focusable[0];
    const last = focusable.at(-1);

    last?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);

    first?.focus();
    const component = fixture.componentInstance as unknown as {
      trapDrawerFocus(event: Event): void;
    };
    component.trapDrawerFocus(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    const sidebar = host.querySelector<HTMLElement>('.cnpm-admin__sidebar');
    expect(sidebar?.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(first);
  });

  it('ferme avec Échap, restitue le focus et réactive le contenu', async () => {
    const { fixture, host } = await setup();
    const trigger = await openDrawer(fixture, host);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    await Promise.resolve();

    const frame = host.querySelector<HTMLElement>('.cnpm-admin__frame');
    const sidebar = host.querySelector<HTMLElement>('.cnpm-admin__sidebar');
    expect(frame?.hasAttribute('inert')).toBe(false);
    expect(frame?.hasAttribute('aria-hidden')).toBe(false);
    expect(sidebar?.hasAttribute('role')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
  });
});
