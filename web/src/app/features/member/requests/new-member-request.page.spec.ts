import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CNPM_DATA_MODE, type CnpmDataMode } from '../../../core/api/api.config';
import {
  MEMBER_REQUESTS_GATEWAY,
  type CreateMemberRequestInput,
  type MemberRequestDetail,
  type MemberRequestPage,
  type MemberRequestsGateway,
} from './member-requests-gateway';
import { NewMemberRequestPage } from './new-member-request.page';

const CREATED: MemberRequestDetail = {
  id: 'demo-member-request-created-0007',
  reference: 'DEMO-REQ-MEMBRE-2026-0007',
  kind: 'REQUEST',
  category: 'DEMO_DOCUMENT',
  subject: 'Demande fictive complète',
  description: 'Description fictive suffisamment longue pour le scénario.',
  status: 'SUBMITTED',
  createdAt: '2026-07-19T12:00:00Z',
  updatedAt: '2026-07-19T12:00:00Z',
  targetAt: '2026-07-26T16:00:00Z',
  slaState: 'ON_TRACK',
  conversation: [],
  requestedDocuments: [],
};

class ControllableGateway implements MemberRequestsGateway {
  readonly created = new Subject<MemberRequestDetail>();
  input: CreateMemberRequestInput | null = null;

  list(): Subject<MemberRequestPage> {
    return new Subject<MemberRequestPage>();
  }

  create(input: CreateMemberRequestInput): Subject<MemberRequestDetail> {
    this.input = input;
    return this.created;
  }

  loadDetail(): Subject<MemberRequestDetail> {
    return new Subject<MemberRequestDetail>();
  }

  addMessage(): Subject<MemberRequestDetail> {
    return new Subject<MemberRequestDetail>();
  }
}

async function setup(mode: CnpmDataMode = 'demo') {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [NewMemberRequestPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: CNPM_DATA_MODE, useValue: mode },
      { provide: MEMBER_REQUESTS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(NewMemberRequestPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, navigate, host: fixture.nativeElement as HTMLElement };
}

function setValue(host: HTMLElement, selector: string, value: string, event = 'input'): void {
  const control = host.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    selector,
  );
  if (!control) throw new Error(`Champ absent : ${selector}`);
  control.value = value;
  control.dispatchEvent(new Event(event));
}

function submit(host: HTMLElement): void {
  const form = host.querySelector<HTMLFormElement>('form');
  if (!form) throw new Error('Formulaire absent');
  form.dispatchEvent(new Event('submit'));
}

describe('NewMemberRequestPage — MP-010', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('focalise le résumé après une soumission invalide puis actualise les erreurs corrigées', async () => {
    const { fixture, host } = await setup();
    submit(host);
    await fixture.whenStable();
    fixture.detectChanges();

    const summary = host.querySelector<HTMLElement>('.cnpm-error-summary');
    expect(summary?.textContent).toContain('4 erreurs à corriger');
    expect(document.activeElement).toBe(summary);

    setValue(host, '#new-request-kind', 'REQUEST', 'change');
    setValue(host, '#new-request-category', 'DEMO_DOCUMENT', 'change');
    setValue(host, '#new-request-subject', 'Demande fictive complète');
    setValue(
      host,
      '#new-request-description',
      'Description fictive suffisamment longue pour le scénario.',
    );
    fixture.detectChanges();
    expect(host.querySelector('.cnpm-error-summary')).toBeNull();
  });

  it('ne conserve que les métadonnées simulées puis crée localement le dossier', async () => {
    const { fixture, gateway, navigate, host } = await setup();
    setValue(host, '#new-request-kind', 'REQUEST', 'change');
    setValue(host, '#new-request-category', 'DEMO_DOCUMENT', 'change');
    setValue(host, '#new-request-subject', '  Demande fictive complète  ');
    setValue(
      host,
      '#new-request-description',
      '  Description fictive suffisamment longue pour le scénario.  ',
    );
    const fileInput = host.querySelector<HTMLInputElement>('#new-request-attachments');
    if (!fileInput) throw new Error('Sélecteur de pièces absent');
    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: Object.assign(
        [new File(['non lu'], 'preuve-fictive.pdf', { type: 'application/pdf' })],
        {
          item: (index: number) => (index === 0 ? (fileInput.files?.[0] ?? null) : null),
        },
      ),
    });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(host.textContent).toContain('preuve-fictive.pdf');
    expect(host.textContent).toContain('non téléversé');

    submit(host);
    expect(gateway.input).toMatchObject({
      kind: 'REQUEST',
      category: 'DEMO_DOCUMENT',
      subject: 'Demande fictive complète',
      description: 'Description fictive suffisamment longue pour le scénario.',
    });
    expect(gateway.input?.attachments[0]).toMatchObject({
      fileName: 'preuve-fictive.pdf',
      simulated: true,
    });
    expect(Object.keys(gateway.input?.attachments[0] ?? {})).not.toContain('content');

    gateway.created.next(CREATED);
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/member/requests', CREATED.id], {
      queryParams: { created: '1' },
    });
  });

  it('reste explicitement indisponible en profil HTTP', async () => {
    const { gateway, host } = await setup('http');
    expect(host.textContent).toContain('Création indisponible en mode HTTP');
    expect(host.querySelector('form')).toBeNull();
    expect(gateway.input).toBeNull();
  });
});
