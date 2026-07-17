import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CnpmEmptyStateVariant, EmptyStateComponent } from './empty-state.component';

@Component({
  imports: [EmptyStateComponent],
  template: `<cnpm-empty-state [variant]="variant()" title="Rien à afficher" />`,
})
class HostComponent {
  readonly variant = signal<CnpmEmptyStateVariant>('no-data');
}

describe('EmptyStateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('annonce « aucun résultat », car il découle d’une action de filtre', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant.set('no-results');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.cnpm-empty') as HTMLElement;
    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-live')).toBe('polite');
  });

  it('n’annonce pas la première utilisation ni l’absence de données', () => {
    // Ce sont des états d'entrée, pas des changements survenus sous les yeux.
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant.set('first-use');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.cnpm-empty') as HTMLElement;
    expect(root.getAttribute('role')).toBeNull();
  });

  it('masque le pictogramme aux technologies d’assistance', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.cnpm-empty__icon') as HTMLElement;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
