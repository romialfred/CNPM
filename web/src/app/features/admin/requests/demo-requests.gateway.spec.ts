import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import {
  DEMO_REQUEST_ERROR_ID,
  DEMO_REQUEST_FORBIDDEN_ID,
  DemoRequestsGateway,
} from './demo-requests.gateway';
import {
  RequestAccessError,
  RequestNotFoundError,
  type ServiceRequestQuery,
} from './requests-gateway';

const BASE_QUERY: ServiceRequestQuery = {
  search: '',
  status: null,
  priority: null,
  sort: { key: 'submittedAt', direction: 'desc' },
  page: 1,
  pageSize: 10,
};

describe('DemoRequestsGateway', () => {
  const gateway = new DemoRequestsGateway();

  it('filtre, trie et pagine le registre fictif de façon déterministe', async () => {
    const page = await firstValueFrom(
      gateway.search({
        ...BASE_QUERY,
        priority: 'HIGH',
        sort: { key: 'priority', direction: 'desc' },
        pageSize: 2,
      }),
    );

    expect(page.totalItems).toBeGreaterThan(2);
    expect(page.rows).toHaveLength(2);
    expect(page.rows.every((row) => row.priority === 'HIGH')).toBe(true);
    expect(page.rows.every((row) => row.requesterLabel.match(/ficti|démo|scénario/i))).toBe(true);
  });

  it('sépare structurellement les échanges membre des notes internes', async () => {
    const page = await firstValueFrom(gateway.search(BASE_QUERY));
    const detail = await firstValueFrom(gateway.get(page.rows[0].id));

    expect(detail.memberConversation.length).toBeGreaterThan(0);
    expect(detail.internalNotes.length).toBeGreaterThan(0);
    expect(
      detail.memberConversation.some((message) => message.body.includes('strictement interne')),
    ).toBe(false);
    expect(detail.attachments.available).toBe(false);
  });

  it('expose les replis interdit, erreur et introuvable sans contenu de dossier', async () => {
    await expect(firstValueFrom(gateway.get(DEMO_REQUEST_FORBIDDEN_ID))).rejects.toBeInstanceOf(
      RequestAccessError,
    );
    await expect(firstValueFrom(gateway.get(DEMO_REQUEST_ERROR_ID))).rejects.toThrow(
      'indisponible',
    );
    await expect(firstValueFrom(gateway.get('REQ-DEMO-INCONNU'))).rejects.toBeInstanceOf(
      RequestNotFoundError,
    );
  });
});
