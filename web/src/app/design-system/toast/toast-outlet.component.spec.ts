import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastOutletComponent } from './toast-outlet.component';
import { ToastService } from './toast.service';

/**
 * Le service est testé isolément ; ici on vérifie le câblage service → DOM, la seule
 * partie que l'utilisateur voit réellement : le bon aiguillage vers les régions polie
 * et assertive, et les boutons d'action et de fermeture.
 */
describe('ToastOutletComponent', () => {
  let fixture: ComponentFixture<ToastOutletComponent>;
  let service: ToastService;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastOutletComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(ToastOutletComponent);
    service = TestBed.inject(ToastService);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  const polite = () => host.querySelector('.cnpm-toasts__region[aria-live="polite"]') as HTMLElement;
  const assertive = () =>
    host.querySelector('.cnpm-toasts__region[aria-live="assertive"]') as HTMLElement;

  it('monte les deux régions vivantes, vides au repos', () => {
    expect(polite()).not.toBeNull();
    expect(assertive()).not.toBeNull();
    expect(host.querySelectorAll('.cnpm-toast')).toHaveLength(0);
  });

  it('achemine un succès vers la région polie, pas l’assertive', () => {
    service.success('Membre enregistré');
    fixture.detectChanges();
    expect(polite().querySelectorAll('.cnpm-toast')).toHaveLength(1);
    expect(assertive().querySelectorAll('.cnpm-toast')).toHaveLength(0);
    expect(polite().textContent).toContain('Membre enregistré');
  });

  it('achemine une erreur vers la région assertive, pas la polie', () => {
    // Une inversion des deux régions enverrait les erreurs dans le flux poli : c'est
    // exactement ce que ce test empêche de passer inaperçu.
    service.error('Le paiement a échoué');
    fixture.detectChanges();
    expect(assertive().querySelectorAll('.cnpm-toast')).toHaveLength(1);
    expect(polite().querySelectorAll('.cnpm-toast')).toHaveLength(0);
  });

  it('exécute l’action puis referme le toast', () => {
    const run = vi.fn();
    service.info('Membre supprimé', { action: { label: 'Annuler', run } });
    fixture.detectChanges();

    const actionButton = host.querySelector('.cnpm-toast__action') as HTMLButtonElement;
    expect(actionButton.textContent).toContain('Annuler');
    actionButton.click();
    fixture.detectChanges();

    expect(run).toHaveBeenCalledOnce();
    expect(host.querySelectorAll('.cnpm-toast')).toHaveLength(0);
  });

  it('referme le toast au clic sur le bouton de fermeture', () => {
    service.info('Information');
    fixture.detectChanges();
    const close = host.querySelector('.cnpm-toast__close') as HTMLButtonElement;
    close.click();
    fixture.detectChanges();
    expect(host.querySelectorAll('.cnpm-toast')).toHaveLength(0);
  });
});
