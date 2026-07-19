import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_MEMBER_REQUESTS_GATEWAY } from '../unavailable-member-gateways';
import { DemoMemberRequestsGateway } from './demo-member-requests.gateway';
import {
  MemberRequestNotFoundError,
  type MemberRequestQuery,
  type SimulatedMemberAttachment,
} from './member-requests-gateway';

const DEFAULT_QUERY: MemberRequestQuery = {
  search: '',
  sort: 'updatedAt',
  direction: 'desc',
  page: 1,
  size: 5,
};

const ATTACHMENT: SimulatedMemberAttachment = {
  id: 'simulated-test-file',
  fileName: 'preuve-justificative.pdf',
  sizeBytes: 2048,
  mimeType: 'application/pdf',
  simulated: true,
};

describe('DemoMemberRequestsGateway — MP-009/010/011', () => {
  it('filtre, trie et pagine les dossiers côté source', async () => {
    const gateway = new DemoMemberRequestsGateway();
    const page = await firstValueFrom(gateway.list(DEFAULT_QUERY));
    expect(page.items).toHaveLength(5);
    expect(page.totalElements).toBe(6);
    expect(page.totalPages).toBe(2);
    expect(page.items[0]?.reference).toBe('CNPM-REQ-MEMBRE-2026-0006');

    const filtered = await firstValueFrom(
      gateway.list({
        ...DEFAULT_QUERY,
        search: 'délai',
        kind: 'CLAIM',
        status: 'IN_PROGRESS',
      }),
    );
    expect(filtered.items.map((item) => item.reference)).toEqual(['CNPM-REC-MEMBRE-2026-0004']);
  });

  it('crée un accusé déterministe puis le rend consultable', async () => {
    const gateway = new DemoMemberRequestsGateway();
    const created = await firstValueFrom(
      gateway.create({
        kind: 'REQUEST',
        category: 'DEMO_DOCUMENT',
        subject: 'Objet de la demande',
        description: 'Description suffisamment longue pour la demande.',
        attachments: [ATTACHMENT],
      }),
    );

    expect(created).toMatchObject({
      reference: 'CNPM-REQ-MEMBRE-2026-0007',
      status: 'SUBMITTED',
      createdAt: '2026-07-19T12:00:00Z',
      targetAt: '2026-07-26T16:00:00Z',
    });
    expect(created.conversation[0]?.attachments).toEqual([ATTACHMENT]);
    const loaded = await firstValueFrom(gateway.loadDetail(created.id));
    expect(loaded.reference).toBe(created.reference);
    const refreshed = await firstValueFrom(gateway.list(DEFAULT_QUERY));
    expect(refreshed.totalElements).toBe(7);
  });

  it('ajoute uniquement un message membre partagé et ses métadonnées locales', async () => {
    const gateway = new DemoMemberRequestsGateway();
    const updated = await firstValueFrom(
      gateway.addMessage('demo-member-request-1', {
        body: 'Réponse du membre.',
        attachments: [ATTACHMENT],
      }),
    );
    const last = updated.conversation.at(-1);
    expect(last).toMatchObject({ sender: 'MEMBER', body: 'Réponse du membre.' });
    expect(last?.attachments).toEqual([ATTACHMENT]);
    expect(Object.keys(updated)).not.toContain('internalNotes');
    expect(JSON.stringify(updated)).not.toContain('strictement interne');
  });

  it('signale les dossiers absents et ferme toutes les opérations en profil HTTP', async () => {
    const gateway = new DemoMemberRequestsGateway();
    await expect(firstValueFrom(gateway.loadDetail('absent'))).rejects.toBeInstanceOf(
      MemberRequestNotFoundError,
    );
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_REQUESTS_GATEWAY.list(DEFAULT_QUERY)),
    ).rejects.toMatchObject({ feature: 'MP-009' });
    await expect(
      firstValueFrom(
        UNAVAILABLE_MEMBER_REQUESTS_GATEWAY.create({
          kind: 'REQUEST',
          category: 'DEMO_INFORMATION',
          subject: 'x',
          description: 'x',
          attachments: [],
        }),
      ),
    ).rejects.toMatchObject({ feature: 'MP-010' });
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_REQUESTS_GATEWAY.loadDetail('x')),
    ).rejects.toMatchObject({ feature: 'MP-011' });
  });
});
