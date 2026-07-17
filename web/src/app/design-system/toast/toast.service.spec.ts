import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche un toast et l’expose dans la file', () => {
    service.success('Membre enregistré');
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0]).toMatchObject({ tone: 'success', message: 'Membre enregistré' });
  });

  it('efface automatiquement un succès après la durée par défaut', () => {
    service.success('Fait');
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('ne referme jamais une erreur automatiquement', () => {
    // Une erreur appelle une lecture : une disparition minutée l'escamoterait.
    service.error('Le paiement a échoué');
    vi.advanceTimersByTime(60_000);
    expect(service.toasts()).toHaveLength(1);
  });

  it('ne referme jamais un toast porteur d’une action', () => {
    service.info('Membre supprimé', { action: { label: 'Annuler', run: () => undefined } });
    vi.advanceTimersByTime(60_000);
    expect(service.toasts()).toHaveLength(1);
  });

  it('traite une durée de 0 comme persistante', () => {
    service.info('Reste affiché', { durationMs: 0 });
    vi.advanceTimersByTime(60_000);
    expect(service.toasts()).toHaveLength(1);
  });

  it('sépare les toasts polis des toasts assertifs', () => {
    service.success('ok');
    service.info('info');
    service.error('erreur');
    expect(service.politeToasts()).toHaveLength(2);
    expect(service.assertiveToasts()).toHaveLength(1);
    expect(service.assertiveToasts()[0].tone).toBe('error');
  });

  it('retire un toast à la demande et annule son minuteur', () => {
    const id = service.success('à retirer');
    service.dismiss(id);
    expect(service.toasts()).toHaveLength(0);
    // Le minuteur ne doit pas retirer une seconde fois un toast déjà parti.
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    expect(service.toasts()).toHaveLength(0);
  });
});
