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
        { path: 'le-cnpm', children: [] },
        { path: 'services', children: [] },
        { path: 'actualites', children: [] },
        { path: 'agenda', children: [] },
        { path: 'contact', children: [] },
        { path: 'legal/:document', children: [] },
        { path: 'adhesion', children: [] },
        { path: 'verification/:code', children: [] },
        { path: 'membres/recherche', children: [] },
      ]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PublicShellComponent);
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

    expect(logo?.getAttribute('src')).toBe('/assets/brand/logo-CNPM-lockup.png');
    // Dimensions intrinsèques de l'actif détouré. Elles doivent rester exactes : c'est
    // ce ratio que le navigateur réserve avant chargement, et un ratio faux y réintroduit
    // la déformation que le détourage vient justement de supprimer.
    expect(logo?.getAttribute('width')).toBe('276');
    expect(logo?.getAttribute('height')).toBe('137');
    expect(host.querySelector('.cnpm-public__brand-link')?.getAttribute('aria-label')).toContain(
      'Conseil National du Patronat du Mali',
    );
  });

  it('n’expose aucun libellé dupliqué dans la navigation principale', async () => {
    // Défaut constaté par le client, capture à l'appui : la barre concaténait sept
    // liens de site puis les ancres de la page, si bien que « Le CNPM », « Services »
    // et « Actualités » y figuraient deux fois — et les deux ancres homonymes
    // pointaient en prime vers des sections croisées.
    const { host } = await setup();
    const nav = host.querySelector('.cnpm-public__nav--desktop')!;
    const libelles = Array.from(nav.querySelectorAll<HTMLElement>('button, a'))
      .map((element) => element.textContent?.trim())
      .filter((label): label is string => Boolean(label));

    expect(new Set(libelles).size).toBe(libelles.length);
  });

  it('regroupe la navigation de site en quatre menus déroulants', async () => {
    const { host } = await setup();
    const declencheurs = Array.from(
      host.querySelectorAll<HTMLButtonElement>('.cnpm-nav-menu__trigger'),
    );

    expect(declencheurs.map((bouton) => bouton.textContent?.trim())).toEqual([
      'Le CNPM',
      'Services',
      'Membres',
      'Actualités',
    ]);
    // Replié par défaut : le déroulé ne doit pas encombrer la barre au chargement.
    expect(declencheurs.every((bouton) => bouton.getAttribute('aria-expanded') === 'false')).toBe(
      true,
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
    expect(hrefs).toContain('/le-cnpm');
    expect(hrefs).toContain('/services');
    expect(hrefs).toContain('/actualites');
    expect(hrefs).toContain('/agenda');
    expect(hrefs).toContain('/contact');
    expect(hrefs).toContain('/legal/mentions-legales');
    expect(hrefs).toContain('/legal/confidentialite');
    expect(hrefs).toContain('/legal/conditions-utilisation');
    expect(hrefs).toContain('/verification/DEMO-VERIF-2026-001');
    // Les ancres de page ne sont plus projetées dans la coquille : concaténées à la
    // navigation de site, elles produisaient des libellés strictement dupliqués
    // (« Le CNPM », « Services », « Actualités » apparaissaient deux fois).
    expect(hrefs).not.toContain('#services');
    expect(hrefs).not.toContain('#chiffres');
    expect(hrefs).not.toContain('#');
    expect(
      host.querySelector('ul[aria-label="Statut des documents légaux non publiés"]'),
    ).not.toBeNull();
    expect(host.textContent).toContain('Statut des mentions légales');
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
    expect(
      fixture.nativeElement.querySelector('.cnpm-public__menu-button')?.getAttribute('aria-label'),
    ).toBe('Fermer la navigation principale');
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
