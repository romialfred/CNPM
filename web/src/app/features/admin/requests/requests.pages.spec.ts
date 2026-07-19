import { provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { RequestDetailPage } from './request-detail.page';
import {
  REQUESTS_GATEWAY,
  RequestAccessError,
  RequestNotFoundError,
  type RequestsGateway,
  type ServiceRequestDetail,
  type ServiceRequestPage,
} from './requests-gateway';
import { RequestsPage } from './requests.page';

const DETAIL: ServiceRequestDetail = {
  id: '70000000-0000-4000-8000-000000000001',
  reference: 'REQ-DEMO-TEST-0001',
  subject: 'Question fictive de test',
  requesterLabel: 'Entreprise Test fictive',
  categoryLabel: 'Information — démonstration',
  serviceLabel: 'Support — démonstration',
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  submittedAt: '2026-07-18T09:20:00Z',
  targetAt: '2026-07-20T16:00:00Z',
  slaState: 'DUE_SOON',
  assigneeLabel: 'Agent support fictif',
  confidentialityLabel: 'Interne CNPM — démonstration',
  description: 'Description fictive.',
  memberConversation: [
    {
      id: 'message-1',
      direction: 'MEMBER',
      authorLabel: 'Contact fictif',
      body: 'Échange visible par le membre.',
      createdAt: '2026-07-18T09:20:00Z',
    },
  ],
  internalNotes: [
    {
      id: 'note-1',
      authorLabel: 'Agent fictif',
      body: 'Note strictement interne de test.',
      createdAt: '2026-07-18T10:00:00Z',
    },
  ],
  attachments: { available: false, reason: 'GED indisponible dans le test.' },
  resolutionProofLabel: null,
  notificationNotice: 'Aucune notification de test envoyée.',
};

class RequestsStub implements RequestsGateway {
  readonly searches: Subject<ServiceRequestPage>[] = [];
  readonly details: Subject<ServiceRequestDetail>[] = [];

  search(): Observable<ServiceRequestPage> {
    const subject = new Subject<ServiceRequestPage>();
    this.searches.push(subject);
    return subject;
  }

  get(): Observable<ServiceRequestDetail> {
    const subject = new Subject<ServiceRequestDetail>();
    this.details.push(subject);
    return subject;
  }
}

function activatedRoute(id: string | null = null, queryParams: Record<string, string> = {}) {
  const params = new BehaviorSubject(convertToParamMap(id ? { id } : {}));
  const query = new BehaviorSubject(convertToParamMap(queryParams));
  return {
    paramMap: params.asObservable(),
    queryParamMap: query.asObservable(),
    snapshot: { paramMap: params.value, queryParamMap: query.value },
  };
}

async function setup<T>(
  component: Type<T>,
  options: { id?: string; query?: Record<string, string> } = {},
) {
  const gateway = new RequestsStub();
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: CNPM_DATA_MODE, useValue: 'demo' },
      { provide: ActivatedRoute, useValue: activatedRoute(options.id ?? null, options.query) },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      { provide: REQUESTS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('écrans requêtes et réclamations', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('BO-021 rend le chargement puis la table issue du port', async () => {
    const { fixture, gateway, host } = await setup(RequestsPage);
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();

    gateway.searches[0].next({ rows: [DETAIL], totalItems: 1 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain(DETAIL.reference);
    expect(host.textContent).toContain('1 dossier trouvé');
    expect(host.querySelector('table caption')?.textContent).toContain('Requêtes et réclamations');
  });

  it.each([
    { label: 'empty', query: {}, error: null, expected: 'Aucun dossier accessible' },
    {
      label: 'no-result',
      query: { q: 'absent' },
      error: null,
      expected: 'Aucun dossier ne correspond',
    },
    { label: 'error', query: {}, error: new Error('panne'), expected: 'n’ont pas pu être chargés' },
    {
      label: 'forbidden',
      query: {},
      error: new RequestAccessError(),
      expected: 'Accès refusé aux requêtes',
    },
  ])('BO-021 supporte l’état $label', async ({ query, error, expected }) => {
    const { fixture, gateway, host } = await setup(RequestsPage, {
      query: query as Record<string, string>,
    });
    if (error) gateway.searches[0].error(error);
    else gateway.searches[0].next({ rows: [], totalItems: 0 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain(expected);
  });

  it('BO-022 sépare conversation et notes, et prépare seulement un aperçu local', async () => {
    const { fixture, gateway, host } = await setup(RequestDetailPage, { id: DETAIL.id });
    gateway.details[0].next(DETAIL);
    await fixture.whenStable();
    fixture.detectChanges();

    const conversation = host.querySelector('.cnpm-request-detail__conversation');
    const internal = host.querySelector('.cnpm-request-detail__internal');
    expect(conversation?.textContent).toContain('Échange visible par le membre');
    expect(conversation?.textContent).not.toContain('Note strictement interne');
    expect(internal?.textContent).toContain('Note strictement interne');
    expect(host.textContent).toContain('GED indisponible');
    expect(
      [...host.querySelectorAll('button[aria-disabled="true"]')].find((button) =>
        button.textContent?.includes('Clôturer'),
      ),
    ).toBeDefined();

    const page = fixture.componentInstance as unknown as {
      replyControl: { setValue(value: string): void };
      prepareReply(): void;
    };
    page.replyControl.setValue('Projet local fictif.');
    page.prepareReply();
    fixture.detectChanges();
    expect(host.textContent).toContain('Aperçu non envoyé et non enregistré');
    expect(conversation?.textContent).not.toContain('Projet local fictif');
  });

  it.each([
    { error: new RequestAccessError(), expected: 'Dossier hors de votre périmètre' },
    { error: new RequestNotFoundError(), expected: 'Dossier introuvable' },
    { error: new Error('panne'), expected: 'n’a pas pu être chargé' },
  ])('BO-022 rend le repli $expected', async ({ error, expected }) => {
    const { fixture, gateway, host } = await setup(RequestDetailPage, { id: 'test' });
    gateway.details[0].error(error);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain(expected);
  });
});
