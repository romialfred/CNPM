import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_REQUESTS_GATEWAY,
  MemberRequestNotFoundError,
  type AddMemberRequestMessageInput,
  type MemberRequestDetail,
  type MemberRequestPage,
  type MemberRequestsGateway,
} from './member-requests-gateway';
import { MemberRequestDetailPage } from './member-request-detail.page';

const DETAIL: MemberRequestDetail = {
  id: 'demo-member-request-1',
  reference: 'DEMO-REQ-MEMBRE-2026-0006',
  kind: 'REQUEST',
  category: 'DEMO_DOCUMENT',
  subject: 'Comprendre une pièce demandée dans le scénario',
  description: 'Demande initiale fictive et partagée.',
  status: 'WAITING_MEMBER',
  createdAt: '2026-07-18T09:20:00Z',
  updatedAt: '2026-07-19T08:45:00Z',
  targetAt: '2026-07-22T16:00:00Z',
  slaState: 'DUE_SOON',
  conversation: [
    {
      id: 'demo-message-1',
      sender: 'MEMBER',
      authorLabel: 'Membre fictif',
      body: 'Message partagé du membre.',
      createdAt: '2026-07-18T09:20:00Z',
      attachments: [],
    },
    {
      id: 'demo-message-2',
      sender: 'CNPM',
      authorLabel: 'Équipe CNPM fictive',
      body: 'Réponse partagée et fictive.',
      createdAt: '2026-07-19T08:45:00Z',
      attachments: [],
    },
  ],
  requestedDocuments: [
    { id: 'demo-document-1', label: 'Justificatif fictif au format PDF', state: 'REQUESTED' },
  ],
};

class ActivatedRouteStub {
  private readonly params = new BehaviorSubject(convertToParamMap({ id: DETAIL.id }));
  private readonly queries = new BehaviorSubject(convertToParamMap({ created: '1', q: 'pièce' }));
  readonly paramMap = this.params.asObservable();
  readonly queryParamMap = this.queries.asObservable();
  readonly snapshot = { paramMap: this.params.value, queryParamMap: this.queries.value };
}

class ControllableGateway implements MemberRequestsGateway {
  readonly detail = new Subject<MemberRequestDetail>();
  readonly reply = new Subject<MemberRequestDetail>();
  loadedId = '';
  replyCall: { id: string; input: AddMemberRequestMessageInput } | null = null;

  list(): Subject<MemberRequestPage> {
    return new Subject<MemberRequestPage>();
  }

  create(): Subject<MemberRequestDetail> {
    return new Subject<MemberRequestDetail>();
  }

  loadDetail(id: string): Subject<MemberRequestDetail> {
    this.loadedId = id;
    return this.detail;
  }

  addMessage(id: string, input: AddMemberRequestMessageInput): Subject<MemberRequestDetail> {
    this.replyCall = { id, input };
    return this.reply;
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [MemberRequestDetailPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useClass: ActivatedRouteStub },
      { provide: MEMBER_REQUESTS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(MemberRequestDetailPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('MemberRequestDetailPage — MP-011', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('charge la route et conserve les paramètres de retour hors accusé', async () => {
    const { gateway, host } = await setup();
    expect(gateway.loadedId).toBe(DETAIL.id);
    expect(host.textContent).toContain('Chargement de la requête fictive');
    const back = host.querySelector<HTMLAnchorElement>('.member-request-detail__back');
    expect(back?.href).toContain('q=pi%C3%A8ce');
    expect(back?.href).not.toContain('created=1');
  });

  it('rend accusé, SLA, pièces demandées et conversation exclusivement partagée', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.detail.next(DETAIL);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.textContent).toContain('Accusé fictif créé localement');
    expect(host.textContent).toContain(DETAIL.reference);
    expect(host.textContent).toContain('Justificatif fictif au format PDF');
    expect(host.textContent).toContain('Message partagé du membre.');
    expect(host.textContent).toContain('notes réservées aux agents ne sont jamais transmises');
    expect(host.textContent).not.toContain('strictement interne');
    expect(Object.keys(DETAIL)).not.toContain('internalNotes');
  });

  it('valide puis ajoute un message partagé et replace le focus sur la conversation', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.detail.next(DETAIL);
    await fixture.whenStable();
    fixture.detectChanges();
    const form = host.querySelector<HTMLFormElement>('form');
    form?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(host.textContent).toContain('Saisissez un message');

    const textarea = host.querySelector<HTMLTextAreaElement>('#member-request-reply');
    if (!textarea) throw new Error('Champ message absent');
    textarea.value = 'Réponse membre entièrement fictive.';
    textarea.dispatchEvent(new Event('input'));
    form?.dispatchEvent(new Event('submit'));
    expect(gateway.replyCall).toEqual({
      id: DETAIL.id,
      input: { body: 'Réponse membre entièrement fictive.', attachments: [] },
    });

    const updated: MemberRequestDetail = {
      ...DETAIL,
      conversation: [
        ...DETAIL.conversation,
        {
          id: 'demo-message-3',
          sender: 'MEMBER',
          authorLabel: 'Membre fictif',
          body: 'Réponse membre entièrement fictive.',
          createdAt: '2026-07-19T12:01:00Z',
          attachments: [],
        },
      ],
    };
    gateway.reply.next(updated);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Message ajouté à la conversation fictive locale');
    expect(document.activeElement?.id).toBe('conversation-title');
  });

  it('distingue absence, erreur et contrat HTTP indisponible', async () => {
    const missing = await setup();
    missing.gateway.detail.error(new MemberRequestNotFoundError(DETAIL.id));
    await missing.fixture.whenStable();
    missing.fixture.detectChanges();
    expect(missing.host.textContent).toContain('Requête introuvable');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.detail.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('Le dossier n’a pas pu être chargé');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.detail.error(new UnavailableHttpFeatureError('MP-011'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Détail indisponible en mode HTTP');
  });
});
