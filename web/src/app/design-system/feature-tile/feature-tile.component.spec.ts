import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CnpmTileAccent, FeatureTileComponent } from './feature-tile.component';

@Component({
  imports: [FeatureTileComponent],
  template: `
    <cnpm-feature-tile [heading]="heading()" [accent]="accent()">
      <svg tileIcon data-role="icone"></svg>
      Porter la voix des entreprises.
    </cnpm-feature-tile>
  `,
})
class HostComponent {
  readonly heading = signal('Représentation et plaidoyer');
  readonly accent = signal<CnpmTileAccent>('teal');
}

describe('FeatureTileComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('rend le titre, le texte projeté et l’icône projetée', () => {
    expect(host.querySelector('.cnpm-tile__heading')?.textContent).toContain(
      'Représentation et plaidoyer',
    );
    expect(host.querySelector('.cnpm-tile__text')?.textContent).toContain(
      'Porter la voix des entreprises',
    );
    expect(host.querySelector('[data-role="icone"]')).not.toBeNull();
  });

  it('applique l’accent demandé et le change à la volée', () => {
    expect(host.querySelector('.cnpm-tile--teal')).not.toBeNull();

    fixture.componentInstance.accent.set('amber');
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-tile--amber')).not.toBeNull();
    // L'ancienne classe doit disparaître, sinon deux accents se superposeraient.
    expect(host.querySelector('.cnpm-tile--teal')).toBeNull();
  });

  it('retient l’accent indigo par défaut', async () => {
    const local = TestBed.createComponent(FeatureTileComponent);
    local.componentRef.setInput('heading', 'Sans accent explicite');
    local.detectChanges();

    expect(
      (local.nativeElement as HTMLElement).querySelector('.cnpm-tile--indigo'),
    ).not.toBeNull();
  });

  it('masque l’icône aux technologies d’assistance', () => {
    // Décorative : elle double le titre, l'annoncer serait du bruit.
    expect(host.querySelector('.cnpm-tile__icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('titre les tuiles en h3 pour rester sous le titre de section', () => {
    // Une tuile ne doit jamais introduire un h1/h2 concurrent de la section qui la porte.
    expect(host.querySelector('h3.cnpm-tile__heading')).not.toBeNull();
    expect(host.querySelectorAll('h1, h2')).toHaveLength(0);
  });
});
