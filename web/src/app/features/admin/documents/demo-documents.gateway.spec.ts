import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoDocumentsGateway } from './demo-documents.gateway';

describe('DemoDocumentsGateway', () => {
  const gateway = new DemoDocumentsGateway();

  it('retourne uniquement des métadonnées DEMO sans contenu ni téléchargement', async () => {
    const page = await firstValueFrom(
      gateway.search({
        search: '',
        classification: null,
        lifecycle: null,
        kind: null,
        sort: { key: 'updatedAt', direction: 'desc' },
        page: 1,
        pageSize: 10,
      }),
    );
    expect(page.totalItems).toBe(12);
    expect(page.rows).toHaveLength(10);
    expect(page.rows.every((row) => row.demonstrationReference.startsWith('DEMO-DOC-'))).toBe(true);
    expect(page.rows.every((row) => row.contentAvailable === false)).toBe(true);
    expect(JSON.stringify(page)).not.toContain('download');
  });

  it('filtre, trie et pagine de manière déterministe', async () => {
    const page = await firstValueFrom(
      gateway.search({
        search: 'entreprise',
        classification: 'RESTRICTED',
        lifecycle: null,
        kind: 'ORGANIZATION',
        sort: { key: 'title', direction: 'asc' },
        page: 1,
        pageSize: 10,
      }),
    );
    expect(page.rows.map((row) => row.demonstrationReference)).toEqual([
      'DEMO-DOC-2026-0011',
      'DEMO-DOC-2026-0003',
    ]);
    expect(page.overview.restricted).toBe(2);
  });
});
