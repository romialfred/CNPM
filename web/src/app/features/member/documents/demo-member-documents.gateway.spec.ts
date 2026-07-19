import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_MEMBER_DOCUMENTS_GATEWAY } from '../unavailable-member-gateways';
import { DemoMemberDocumentsGateway } from './demo-member-documents.gateway';
import type { MemberDocumentQuery } from './member-documents-gateway';

const DEFAULT_QUERY: MemberDocumentQuery = {
  search: '',
  sort: 'metadataRecordedOn',
  direction: 'desc',
  page: 1,
  size: 5,
};

describe('DemoMemberDocumentsGateway — MP-012', () => {
  it('filtre, trie et pagine un catalogue déterministe', async () => {
    const gateway = new DemoMemberDocumentsGateway();
    const page = await firstValueFrom(gateway.list(DEFAULT_QUERY));
    expect(page.items).toHaveLength(5);
    expect(page.totalElements).toBe(6);
    expect(page.totalPages).toBe(2);
    expect(page.items[0]?.reference).toBe('DEMO-DOC-0001');

    const filtered = await firstValueFrom(
      gateway.list({
        ...DEFAULT_QUERY,
        search: '2025',
        type: 'ATTESTATION',
        status: 'EXPIRED',
      }),
    );
    expect(filtered.items.map((item) => item.reference)).toEqual(['DEMO-DOC-0003']);

    const secondPage = await firstValueFrom(
      gateway.list({ ...DEFAULT_QUERY, sort: 'reference', direction: 'asc', page: 2 }),
    );
    expect(secondPage.items.map((item) => item.reference)).toEqual(['DEMO-DOC-0006']);
  });

  it('ne sert que des métadonnées publiques fictives, sans contenu ni attribut GED interne', async () => {
    const gateway = new DemoMemberDocumentsGateway();
    const page = await firstValueFrom(gateway.list(DEFAULT_QUERY));
    const document = page.items[0];
    if (!document) throw new Error('Fixture documentaire absente');

    expect(document.reference).toMatch(/^DEMO-DOC-/);
    expect(document.availabilityDisclosure).toContain('Aucun fichier ni preuve officielle');
    expect(Object.keys(document)).not.toEqual(
      expect.arrayContaining([
        'classification',
        'authorLabel',
        'businessObjectLabel',
        'objectKey',
        'fileName',
        'mediaType',
        'sizeBytes',
        'sha256',
        'malwareScanStatus',
        'content',
        'file',
        'pdf',
        'url',
        'downloadUrl',
        'qrCode',
        'signature',
        'stamp',
        'kyc',
      ]),
    );
  });

  it('ferme le profil HTTP tant que le contrat ne porte pas la projection MP-012', async () => {
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_DOCUMENTS_GATEWAY.list(DEFAULT_QUERY)),
    ).rejects.toMatchObject({ feature: 'MP-012' });
  });
});
