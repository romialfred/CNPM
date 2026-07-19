import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoShowcaseGateway } from './demo-showcase.gateway';

describe('DemoShowcaseGateway (PUB-004/PUB-005)', () => {
  const gateway = new DemoShowcaseGateway();

  it('ne liste que des vitrines publiées et une projection publique minimale', async () => {
    const result = await firstValueFrom(gateway.listPublished({ page: 0, pageSize: 100 }));

    expect(result.totalItems).toBeGreaterThan(1);
    expect(result.items.every((item) => item.publicationStatus === 'PUBLISHED')).toBe(true);
    expect(result.items.every((item) => item.isDemoContent)).toBe(true);
    expect(result.items.every((item) => item.name.trim().length > 0)).toBe(true);
    expect(result.items[0]).not.toHaveProperty('contacts');
    expect(result.items[0]).not.toHaveProperty('heroVisual');
    expect(result.items[0]).not.toHaveProperty('gallery');
    expect(result.items[0]).not.toHaveProperty('licence');
  });

  it('applique q, sector et la pagination zéro-indexée du draft R4', async () => {
    const search = await firstValueFrom(
      gateway.listPublished({ q: 'energie', sector: 'Énergie', page: 0, pageSize: 6 }),
    );
    expect(search.items.map((item) => item.slug)).toEqual(['energie-diarra-scenario']);

    const first = await firstValueFrom(gateway.listPublished({ page: 0, pageSize: 2 }));
    const second = await firstValueFrom(gateway.listPublished({ page: 1, pageSize: 2 }));
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
    expect(second.items[0]?.slug).not.toBe(first.items[0]?.slug);
    expect(second.page).toBe(1);
  });

  it('rend les liens PUB-006 résolvables sans publier le brouillon de contrôle', async () => {
    const published = await firstValueFrom(gateway.findBySlug('atelier-kanu-demonstration'));
    expect(published.outcome).toBe('published');
    if (published.outcome === 'published') {
      expect(published.showcase.contacts).toEqual({});
      expect(published.showcase.contactConsent).toBeNull();
      expect(published.showcase.allowIndexing).toBe(false);
      expect(published.showcase.activities.map((item) => item.id)).toEqual([
        'diagnostic-pilote',
        'atelier-demonstration',
        'suivi-simule',
      ]);
      expect(published.showcase.projects.map((item) => item.id)).toEqual([
        'parcours-pilote-2026',
        'atelier-temoin-2026',
      ]);
      expect(published.showcase.projects.every((item) => item.title.trim().length > 0)).toBe(true);
    }

    const draft = await firstValueFrom(gateway.findBySlug('cooperative-demo-brouillon'));
    expect(draft).toEqual({ outcome: 'not-public', status: 'DRAFT' });
  });
});
