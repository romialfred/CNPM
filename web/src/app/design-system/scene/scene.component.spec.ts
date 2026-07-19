import { provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CnpmSceneName, SceneComponent } from './scene.component';

const SCENES: readonly CnpmSceneName[] = ['assembly', 'digital', 'network', 'training'];

describe('SceneComponent', () => {
  let fixture: ComponentFixture<SceneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SceneComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(SceneComponent);
  });

  function render(name: CnpmSceneName, decorative = false): HTMLElement {
    fixture.componentRef.setInput('name', name);
    fixture.componentRef.setInput('decorative', decorative);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it.each(SCENES)('rend la scène %s avec un niveau de détail réel', (name) => {
    const host = render(name);
    const svg = host.querySelector('svg');

    expect(svg).not.toBeNull();
    // Le seuil garde contre la régression que ce composant existe pour corriger : un
    // aplat de couleur tenant lieu d'image. Les scènes livrées comptent 77 formes ou plus.
    expect(
      svg!.querySelectorAll('path, rect, circle, ellipse, polygon, line').length,
    ).toBeGreaterThanOrEqual(40);
  });

  it.each(SCENES)('n’embarque ni script ni ressource externe dans %s', (name) => {
    const host = render(name);
    const svg = host.querySelector('svg')!;

    expect(svg.querySelector('script')).toBeNull();
    // Une référence externe casserait l'illustration hors ligne et fuiterait une requête.
    expect(svg.outerHTML).not.toMatch(/(href|src)\s*=\s*["']https?:/i);
    expect(svg.outerHTML).not.toContain('<image');
  });

  it('annonce la scène aux lecteurs d’écran par défaut', () => {
    const host = render('assembly');
    const wrapper = host.querySelector('.cnpm-scene')!;

    expect(wrapper.getAttribute('role')).toBe('img');
    expect(wrapper.getAttribute('aria-label')).toContain('assemblée');
    expect(wrapper.getAttribute('aria-hidden')).toBeNull();
  });

  it('se masque lorsqu’elle est déclarée décorative', () => {
    // Une illustration qui double un titre déjà écrit ne doit pas être annoncée deux fois.
    const wrapper = render('training', true).querySelector('.cnpm-scene')!;

    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper.getAttribute('role')).toBeNull();
    expect(wrapper.getAttribute('aria-label')).toBeNull();
  });

  it('change de scène sans conserver la précédente', () => {
    render('network');
    const apres = render('digital');

    expect(apres.querySelectorAll('svg')).toHaveLength(1);
  });
});
