import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CnpmSkeletonVariant, SkeletonComponent } from './skeleton.component';

@Component({
  imports: [SkeletonComponent],
  template: `
    <cnpm-skeleton [variant]="variant()" [rows]="rows()" [columns]="columns()" [label]="label()" />
  `,
})
class HostComponent {
  readonly variant = signal<CnpmSkeletonVariant>('text');
  readonly rows = signal(3);
  readonly columns = signal(4);
  readonly label = signal('Chargement en cours…');
}

describe('SkeletonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('annonce l’occupation par une région de statut, une seule fois', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.label.set('Chargement des membres…');
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('.cnpm-skeleton__status') as HTMLElement;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent).toContain('Chargement des membres…');
  });

  it('masque les barres décoratives aux technologies d’assistance', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const bones = fixture.nativeElement.querySelector('.cnpm-skeleton__bones') as HTMLElement;
    // Sans cela, un lecteur d'écran énoncerait une succession de blocs vides.
    expect(bones.getAttribute('aria-hidden')).toBe('true');
  });

  it('reproduit la structure d’un tableau : en-tête plus lignes demandées', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant.set('table');
    fixture.componentInstance.rows.set(5);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.cnpm-skeleton__row');
    // Cinq lignes de corps plus une ligne d'en-tête.
    expect(rows).toHaveLength(6);
  });

  it('rend la structure du variant « card »', () => {
    // FDB-005 exige les quatre états : text, table, card, chart. Sans assertion sur la
    // structure, une régression d'un @case retomberait en silence sur le variant texte.
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant.set('card');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cnpm-skeleton__card')).not.toBeNull();
  });

  it('rend la structure du variant « chart » avec autant de barres que de colonnes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant.set('chart');
    fixture.componentInstance.columns.set(6);
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('.cnpm-skeleton__chart');
    expect(chart).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.cnpm-skeleton__bar')).toHaveLength(6);
  });
});
