import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CnpmFieldError, InlineErrorSummaryComponent } from './inline-error-summary.component';

@Component({
  imports: [InlineErrorSummaryComponent],
  template: `
    <button type="button" id="ailleurs">Ailleurs</button>
    <cnpm-inline-error-summary [errors]="errors()" />
  `,
})
class HostComponent {
  readonly errors = signal<readonly CnpmFieldError[]>([]);
}

describe('InlineErrorSummaryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('ne rend rien tant qu’il n’y a pas d’erreur', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cnpm-error-summary')).toBeNull();
  });

  it('liste les erreurs et pointe chaque lien vers son champ', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.errors.set([
      { fieldId: 'email', message: 'L’adresse est requise' },
      { fieldId: 'code', message: 'Le code est invalide' },
    ]);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll(
      '.cnpm-error-summary__link',
    ) as NodeListOf<HTMLAnchorElement>;
    expect(links).toHaveLength(2);
    // Le lien cible l'ancre du champ, pour y déplacer le focus.
    expect(links[0].getAttribute('href')).toBe('#email');
    expect(links[1].getAttribute('href')).toBe('#code');
  });

  it('reçoit le focus dès qu’il paraît', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    fixture.componentInstance.errors.set([{ fieldId: 'email', message: 'requis' }]);
    fixture.detectChanges();
    // La résolution du viewChild réveille l'effet qui pose le focus : on laisse le
    // rendu se stabiliser avant de constater où le focus a atterri.
    await fixture.whenStable();
    fixture.detectChanges();

    const summary = fixture.nativeElement.querySelector('.cnpm-error-summary') as HTMLElement;
    // À la soumission d'un formulaire invalide, le focus atterrit sur le résumé plutôt
    // que de rester sur le bouton d'envoi.
    expect(document.activeElement).toBe(summary);
  });

  it('ne reprend PAS le focus quand le nombre d’erreurs change en restant non nul', async () => {
    // C'est la raison d'être de la garde `lastCount` : sans elle, corriger un champ (ce
    // qui recalcule la liste) rapatrierait le focus sur le résumé à chaque frappe — un
    // piège de focus. On vérifie donc l'absence de re-focus, pas seulement sa présence.
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    fixture.componentInstance.errors.set([{ fieldId: 'email', message: 'requis' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // L'utilisateur déplace le focus pour corriger ses champs.
    const ailleurs = fixture.nativeElement.querySelector('#ailleurs') as HTMLButtonElement;
    ailleurs.focus();
    expect(document.activeElement).toBe(ailleurs);

    // Une seconde erreur apparaît (N -> M, toutes deux > 0) : le focus ne doit pas bouger.
    fixture.componentInstance.errors.set([
      { fieldId: 'email', message: 'requis' },
      { fieldId: 'code', message: 'invalide' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(document.activeElement).toBe(ailleurs);
  });

  it('reprend le focus sur un nouveau cycle 0 → N après être repassé par 0', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    // Premier cycle.
    fixture.componentInstance.errors.set([{ fieldId: 'email', message: 'requis' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Retour à zéro (formulaire corrigé), on déplace le focus.
    fixture.componentInstance.errors.set([]);
    fixture.detectChanges();
    const ailleurs = fixture.nativeElement.querySelector('#ailleurs') as HTMLButtonElement;
    ailleurs.focus();

    // Nouvelle soumission invalide : le résumé doit de nouveau recevoir le focus.
    fixture.componentInstance.errors.set([{ fieldId: 'code', message: 'invalide' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.cnpm-error-summary') as HTMLElement;
    expect(document.activeElement).toBe(summary);
  });

  it('porte role="alert" pour être annoncé', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.errors.set([{ fieldId: 'email', message: 'requis' }]);
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.cnpm-error-summary') as HTMLElement;
    expect(summary.getAttribute('role')).toBe('alert');
  });
});
