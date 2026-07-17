import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CnpmErrorStateVariant, ErrorStateComponent } from './error-state.component';

@Component({
  imports: [ErrorStateComponent],
  template: `
    <cnpm-error-state [variant]="variant()" [title]="title()" [titleAs]="titleAs()" />
  `,
})
class HostComponent {
  readonly variant = signal<CnpmErrorStateVariant>('recoverable');
  readonly title = signal<string | undefined>(undefined);
  readonly titleAs = signal<'p' | 'h1' | 'h2'>('p');
}

describe('ErrorStateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('affiche le titre par défaut du variant', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant.set('forbidden');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cnpm-error__title').textContent).toContain(
      'Accès refusé',
    );
  });

  it('n’annonce jamais pourquoi l’accès est refusé', () => {
    // UX-DEC-011 : raison générique, aucun détail sur le motif du refus.
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant.set('forbidden');
    fixture.detectChanges();
    const text = (fixture.nativeElement.textContent ?? '').toLowerCase();
    expect(text).not.toContain('suspendu');
    expect(text).not.toContain('rôle');
  });

  it('rend le titre comme paragraphe par défaut, pour ne pas polluer la hiérarchie', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')).toBeNull();
    expect(fixture.nativeElement.querySelector('p.cnpm-error__title')).not.toBeNull();
  });

  it('rend un h1 quand l’état est le contenu principal de la page', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.titleAs.set('h1');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1.cnpm-error__title')).not.toBeNull();
  });

  it('n’a role="alert" que pour l’erreur récupérable', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cnpm-error').getAttribute('role')).toBe('alert');

    fixture.componentInstance.variant.set('not-found');
    fixture.detectChanges();
    // Une page 404 est atteinte délibérément : elle n'a pas à interrompre le lecteur.
    expect(fixture.nativeElement.querySelector('.cnpm-error').getAttribute('role')).toBeNull();
  });

  it('remplace le titre par défaut quand le contexte le précise', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.title.set('La liste des membres n’a pas pu être chargée');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cnpm-error__title').textContent).toContain(
      'La liste des membres',
    );
  });
});
