import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DocContentComponent } from './doc-content.component';
import type { DocBlock } from './documentation.model';

/**
 * Le rendu des blocs doit rester sémantique et accessible : listes et tableaux réels,
 * en-têtes de colonnes, et un mot d'état sur les encadrés (jamais la couleur seule).
 */
async function render(blocks: readonly DocBlock[]) {
  await TestBed.configureTestingModule({
    imports: [DocContentComponent],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(DocContentComponent);
  fixture.componentRef.setInput('blocks', blocks);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('DocContentComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend un tableau avec en-têtes de colonnes et cellules', async () => {
    const host = await render([
      {
        kind: 'table',
        caption: 'Exemple',
        headers: ['Colonne', 'Rôle'],
        rows: [
          ['id', 'Identifiant'],
          ['email', 'Connexion'],
        ],
      },
    ]);

    const headers = [...host.querySelectorAll('table.cnpm-doc__table thead th')];
    expect(headers.map((h) => h.textContent?.trim())).toEqual(['Colonne', 'Rôle']);
    expect(headers.every((h) => h.getAttribute('scope') === 'col')).toBe(true);
    expect(host.querySelectorAll('table.cnpm-doc__table tbody tr').length).toBe(2);
    // La région défilable est focalisable au clavier (reflow WCAG).
    expect(host.querySelector('.cnpm-doc__table-scroll')?.getAttribute('tabindex')).toBe('0');
  });

  it('rend les étapes en liste ordonnée et les puces en liste non ordonnée', async () => {
    const host = await render([
      { kind: 'steps', items: ['Un', 'Deux', 'Trois'] },
      { kind: 'list', items: ['A', 'B'] },
    ]);

    expect(host.querySelectorAll('ol.cnpm-doc__steps li').length).toBe(3);
    expect(host.querySelectorAll('ul.cnpm-doc__list li').length).toBe(2);
  });

  it('rend le code et l’arborescence en blocs préformatés distincts', async () => {
    const host = await render([
      { kind: 'code', lines: ['ligne 1', 'ligne 2'] },
      { kind: 'tree', lines: ['racine/', '└─ enfant'] },
    ]);

    expect(host.querySelector('pre.cnpm-doc__code')?.textContent).toContain('ligne 1');
    expect(host.querySelector('pre.cnpm-doc__tree')?.textContent).toContain('enfant');
  });

  it('porte le ton d’un encadré par un mot d’état, pas seulement par la couleur', async () => {
    const host = await render([{ kind: 'callout', tone: 'warning', text: 'Danger financier.' }]);

    const callout = host.querySelector('.cnpm-doc__callout--warning');
    expect(callout).not.toBeNull();
    expect(callout?.getAttribute('role')).toBe('note');
    expect(callout?.textContent).toContain('Attention');
    expect(callout?.textContent).toContain('Danger financier.');
  });
});
