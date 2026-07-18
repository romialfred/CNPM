import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemberHomePage } from './member-home.page';

/**
 * Vérifie ce qu'un simple contrôle de type ne peut pas garantir : que chacun des
 * quatre tableaux de l'écran rend bien SON gabarit de ligne. Quatre `#row` coexistent
 * dans le même gabarit ; si les requêtes de contenu se mélangeaient, les reçus
 * s'afficheraient avec les colonnes des appels — un défaut invisible à la compilation.
 */
describe('MemberHomePage', () => {
  let fixture: ComponentFixture<MemberHomePage>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberHomePage],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberHomePage);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  /**
   * L'adaptateur de démonstration simule une latence réseau. `whenStable` n'attend pas
   * un `setTimeout` en mode sans zone : il faut laisser le délai s'écouler, sans quoi
   * on n'observerait jamais que l'état de chargement.
   */
  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('annonce le chargement plutôt qu’une page blanche', () => {
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.textContent).toContain('Chargement de votre espace membre');
  });

  it('rend un unique titre de rang 1', async () => {
    await settle();
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('h1')?.textContent).toContain('Espace membre');
  });

  it('affiche la situation du membre et son reste dû', async () => {
    await settle();
    const text = host.textContent ?? '';
    expect(text).toContain('Sahel Agro SA');
    expect(text).toContain('CNPM-DEMO-0142');
    expect(text).toContain('Échéance dépassée');
  });

  it('rend chaque tableau avec son propre gabarit de ligne', async () => {
    await settle();

    const tables = host.querySelectorAll('table');
    expect(tables).toHaveLength(4);

    const [calls, receipts, documents, requests] = Array.from(tables);
    expect(calls.textContent).toContain('APP-2026-0142-T2');
    expect(receipts.textContent).toContain('REC-2026-0142-0047');
    expect(documents.textContent).toContain('Attestation d’adhésion 2026');
    expect(requests.textContent).toContain('REQ-2026-0142-021');

    // Un mélange des gabarits ferait fuir les références d'un tableau dans l'autre.
    expect(receipts.textContent).not.toContain('APP-2026-0142');
    expect(documents.textContent).not.toContain('REC-2026-0142');
  });

  it('nomme les éléments manquants du dossier, et pas seulement leur nombre', async () => {
    await settle();
    const missing = host.querySelector('.cnpm-member-home__missing');
    expect(missing?.textContent).toContain('Numéro d’identification fiscale');
  });
});
