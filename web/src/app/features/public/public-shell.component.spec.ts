import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PublicShellComponent } from './public-shell.component';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [PublicShellComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
        { path: 'membres', children: [] },
        { path: 'actualites', children: [] },
        { path: 'agenda', children: [] },
      ]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PublicShellComponent);
  fixture.componentRef.setInput('sections', [
    { id: 'services', label: 'Services' },
    { id: 'chiffres', label: 'Chiffres clés' },
  ]);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

function click(element: Element): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('PublicShellComponent (LAY-003 / NAV-003)', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => {
    document.body.style.removeProperty('overflow');
  });

  it('rend le logo officiel complet depuis l’actif de marque', async () => {
    const { host } = await setup();
    const logo = host.querySelector<HTMLImageElement>('.cnpm-public__logo');

    expect(logo?.getAttribute('src')).toBe('/assets/brand/logo-CNPM.png');
    expect(logo?.getAttribute('width')).toBe('300');
    expect(logo?.getAttribute('height')).toBe('212');
    expect(host.querySelector('.cnpm-public__brand-link')?.getAttribute('aria-label')).toContain(
      'Conseil National du Patronat du Mali',
    );
  });

  it('ne crée que des destinations réelles ou des ancres fournies par la page', async () => {
    const { host } = await setup();
    const hrefs = Array.from(host.querySelectorAll<HTMLAnchorElement>('a[href]')).map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/auth/login');
    expect(hrefs).toContain('/membres');
    expect(hrefs).toContain('/actualites');
    expect(hrefs).toContain('/agenda');
    expect(hrefs).toContain('#services');
    expect(hrefs).toContain('#chiffres');
    expect(hrefs).not.toContain('#');
  });

  it('ouvre le drawer, pose le focus et rend le contenu arrière inerte', async () => {
    const { fixture, host } = await setup();
    const trigger = host.querySelector<HTMLButtonElement>('.cnpm-public__menu-button')!;

    click(trigger);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Fermer le menu');
    expect(fixture.nativeElement.querySelector('.cnpm-public__menu-button')?.getAttribute('aria-label')).toBe(
      'Fermer la navigation principale',
    );
    expect(host.querySelector('main')?.hasAttribute('inert')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('piège Tab dans le drawer et restaure le focus avec Échap', async () => {
    const { fixture, host } = await setup();
    const trigger = host.querySelector<HTMLButtonElement>('.cnpm-public__menu-button')!;
    click(trigger);
    fixture.detectChanges();
    await fixture.whenStable();

    const drawer = host.querySelector<HTMLElement>('[role="dialog"]')!;
    const focusable = Array.from(drawer.querySelectorAll<HTMLElement>('button, a[href]'));
    const first = focusable[0];
    const last = focusable.at(-1)!;
    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
  });
});
