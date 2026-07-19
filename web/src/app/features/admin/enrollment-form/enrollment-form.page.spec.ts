import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  ENROLLMENT_GATEWAY,
  type EnrollmentContext,
  type EnrollmentDraftValues,
  type EnrollmentGateway,
} from './enrollment-gateway';
import { EnrollmentFormPage } from './enrollment-form.page';

const CONTEXT: EnrollmentContext = {
  reference: {
    legalForms: [{ id: 'sa', label: 'Société anonyme' }],
    categories: [{ id: 'grande-entreprise', label: 'Grande entreprise' }],
    groups: [],
    periodicities: [{ id: 'annual', label: 'Annuelle' }],
    documentTypes: [
      {
        id: 'rccm',
        label: 'Copie RCCM',
        required: true,
        hint: 'Document officiel lisible.',
        acceptedExtensions: ['.pdf'],
        maxSizeBytes: 5_000_000,
      },
    ],
  },
  draft: null,
};

class StubEnrollmentGateway implements EnrollmentGateway {
  readonly load = vi.fn(() => of(CONTEXT));

  saveDraft(values: EnrollmentDraftValues) {
    return of({ id: 'DRAFT-2026-0001', savedAt: '2026-07-18T18:00:00Z', values });
  }

  checkRegistration() {
    return of({
      outcome: 'unavailable' as const,
      checkedAt: '2026-07-18T18:00:00Z',
      detail: 'Service non raccordé.',
    });
  }

  scanDocument() {
    return of({ status: 'accepted' as const, message: 'Pièce acceptée.' });
  }

  submit() {
    return of({ reference: 'ENR-2026-0001', submittedAt: '2026-07-18T18:00:00Z' });
  }
}

async function setup() {
  const gateway = new StubEnrollmentGateway();
  await TestBed.configureTestingModule({
    imports: [EnrollmentFormPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      { provide: ENROLLMENT_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(EnrollmentFormPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return {
    fixture,
    gateway,
    page: fixture.componentInstance,
    host: fixture.nativeElement as HTMLElement,
  };
}

function editLegalName(page: EnrollmentFormPage): void {
  const exposed = page as unknown as {
    form: { controls: { legalName: { setValue(value: string): void } } };
  };
  exposed.form.controls.legalName.setValue('Entreprise modifiée');
}

describe('EnrollmentFormPage — protection des modifications', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('utilise le provider de route au lieu de masquer le port dans le composant', async () => {
    const { gateway, host } = await setup();
    expect(gateway.load).toHaveBeenCalledOnce();
    expect(host.textContent).toContain('Nouvel enrôlement');
    expect(host.querySelector('.cnpm-enrollment__stepper')).not.toBeNull();
  });

  it('autorise immédiatement la navigation lorsque le formulaire est intact', async () => {
    const { page } = await setup();
    expect(page.confirmNavigation()).toBe(true);
  });

  it('annule la navigation lorsque l’utilisateur choisit de rester', async () => {
    const { fixture, page, host } = await setup();
    editLegalName(page);

    const decision = page.confirmNavigation();
    fixture.detectChanges();
    expect(decision).toBeInstanceOf(Promise);
    expect(host.querySelector('.cnpm-enrollment__confirm')).not.toBeNull();

    const exposed = page as unknown as { dismissCancel(): void };
    exposed.dismissCancel();
    await expect(Promise.resolve(decision)).resolves.toBe(false);
  });

  it('reprend la navigation demandée après confirmation de la sortie', async () => {
    const { page } = await setup();
    editLegalName(page);

    const decision = page.confirmNavigation();
    const exposed = page as unknown as { leave(): void };
    exposed.leave();

    await expect(decision).resolves.toBe(true);
  });
});
