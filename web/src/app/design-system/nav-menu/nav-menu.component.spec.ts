import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CnpmNavMenuItem, NavMenuComponent } from './nav-menu.component';

const ITEMS: readonly CnpmNavMenuItem[] = [
  { label: 'Présentation', routerLink: '/le-cnpm', hint: 'Missions' },
  { label: 'Agenda', routerLink: '/agenda' },
];

@Component({
  imports: [NavMenuComponent],
  template: `
    <button type="button" class="dehors">Dehors</button>
    <cnpm-nav-menu menuId="nav-test" label="Le CNPM" [items]="items()" />
  `,
})
class HostComponent {
  readonly items = signal(ITEMS);
}

describe('NavMenuComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'le-cnpm', children: [] },
          { path: 'agenda', children: [] },
        ]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  function trigger(): HTMLButtonElement {
    return host.querySelector<HTMLButtonElement>('.cnpm-nav-menu__trigger')!;
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('reste replié au chargement et n’expose aucun lien', () => {
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('.cnpm-nav-menu__panel')).toBeNull();
    expect(host.querySelectorAll('.cnpm-nav-menu__link')).toHaveLength(0);
  });

  it('déroule les destinations et lie le panneau au déclencheur', async () => {
    trigger().click();
    await settle();

    const panel = host.querySelector<HTMLElement>('.cnpm-nav-menu__panel')!;
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    // Le lien ARIA doit être réel : un aria-controls pointant dans le vide n'annonce rien.
    expect(panel.id).toBe(trigger().getAttribute('aria-controls'));
    expect(panel.querySelector('ul')?.getAttribute('aria-labelledby')).toBe(trigger().id);
    expect(
      Array.from(panel.querySelectorAll<HTMLAnchorElement>('a')).map((link) =>
        link.getAttribute('href'),
      ),
    ).toEqual(['/le-cnpm', '/agenda']);
  });

  it('referme sur Échap et rend le focus au déclencheur', async () => {
    trigger().focus();
    trigger().click();
    await settle();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();

    expect(host.querySelector('.cnpm-nav-menu__panel')).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    // Sans restitution, le focus resterait sur un lien devenu invisible.
    expect(document.activeElement).toBe(trigger());
  });

  it('referme sur Échap même si le focus se trouve ailleurs dans la page', async () => {
    // L'écoute au niveau de l'hôte laissait le menu ouvert dans ce cas précis :
    // l'événement, émis hors du composant, ne lui parvenait jamais.
    trigger().click();
    await settle();

    host.querySelector<HTMLButtonElement>('.dehors')!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();

    expect(host.querySelector('.cnpm-nav-menu__panel')).toBeNull();
  });

  it('referme sur un clic extérieur', async () => {
    trigger().click();
    await settle();

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();

    expect(host.querySelector('.cnpm-nav-menu__panel')).toBeNull();
  });

  it('referme après la sélection d’une destination', async () => {
    trigger().click();
    await settle();

    host.querySelector<HTMLAnchorElement>('.cnpm-nav-menu__link')!.click();
    await settle();

    expect(host.querySelector('.cnpm-nav-menu__panel')).toBeNull();
  });
});
