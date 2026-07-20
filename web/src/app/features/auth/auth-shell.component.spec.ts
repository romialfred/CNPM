import { Component, provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthShellComponent } from './auth-shell.component';

@Component({
  imports: [AuthShellComponent],
  template: `
    <cnpm-auth-shell>
      <h1>Connexion à votre espace</h1>
      <form><button type="submit">Se connecter</button></form>
    </cnpm-auth-shell>
  `,
})
class HostComponent {}

describe('AuthShellComponent', () => {
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

  it('présente le siège du CNPM en photographie, non en illustration', () => {
    const photo = host.querySelector<HTMLImageElement>('.cnpm-auth__photo');

    expect(photo?.getAttribute('src')).toBe('/assets/photos/cnpm-siege.webp');
    // Dimensions intrinsèques : elles réservent le cadre avant chargement. Sans elles,
    // la page saute au moment où la photographie arrive.
    expect(photo?.getAttribute('width')).toBe('1672');
    expect(photo?.getAttribute('height')).toBe('941');
    // Alternative vide : toute l'information est portée par le texte adjacent.
    expect(photo?.getAttribute('alt')).toBe('');
  });

  it('place le contenu projeté avant le panneau institutionnel dans le DOM', () => {
    const titres = Array.from(host.querySelectorAll('h1, h2')).map((titre) => titre.tagName);

    // Invariant d'accessibilité : le formulaire est la tâche principale et son h1 doit
    // précéder le h2 du panneau. L'ordre visuel est rétabli par la grille, pas par le DOM.
    expect(titres).toEqual(['H1', 'H2']);
  });

  it('expose les quatre bénéfices avec leur intitulé', () => {
    const benefices = Array.from(
      host.querySelectorAll('.cnpm-auth__benefits li strong'),
    ).map((element) => element.textContent?.trim());

    expect(benefices).toEqual([
      'Sécurité renforcée',
      'Gestion simplifiée',
      'Portail membre dédié',
      'Reporting & insights',
    ]);
  });

  it('rend la langue en texte et non en contrôle actionnable', () => {
    // UX-DEC-007 reste ouverte : une seule langue est disponible. Un sélecteur serait
    // focusable et annoncé comme actionnable alors qu'il ne peut rien changer.
    const langue = host.querySelector('.cnpm-auth__lang');

    expect(langue?.querySelectorAll('button, a, select')).toHaveLength(0);
    expect(langue?.querySelector('.cnpm-auth__lang-value')?.textContent?.trim()).toBe('FR');
    expect(langue?.querySelector('.cnpm-auth__lang-unavailable')?.getAttribute('aria-disabled')).toBe(
      'true',
    );
  });

  it('nomme le panneau par son titre et laisse le message audible', () => {
    const panneau = host.querySelector('.cnpm-auth__visual');
    const titre = host.querySelector('#cnpm-auth-trust-title');

    expect(panneau?.getAttribute('aria-labelledby')).toBe(titre?.id);
    // Pas d'aria-hidden : sur l'étape 2FA ce panneau explique pourquoi une seconde
    // vérification est demandée. Le masquer priverait les lecteurs d'écran.
    expect(panneau?.getAttribute('aria-hidden')).toBeNull();
  });

  it('laisse la page hôte adapter le discours du panneau', () => {
    // L'étape 2FA réutilise la même coquille avec un autre message : le panneau doit
    // donc rester pilotable par la page, sans quoi il annoncerait « Bienvenue » à
    // quelqu'un qui est déjà en train de se connecter.
    expect(host.querySelector('.cnpm-auth__trust-title')?.textContent?.trim()).toBe(
      'Bienvenue dans votre espace CNPM',
    );

    const local = TestBed.createComponent(AuthShellComponent);
    local.componentRef.setInput('trustTitle', 'Vérification renforcée');
    local.detectChanges();

    expect(
      (local.nativeElement as HTMLElement)
        .querySelector('.cnpm-auth__trust-title')
        ?.textContent?.trim(),
    ).toBe('Vérification renforcée');
  });
});
