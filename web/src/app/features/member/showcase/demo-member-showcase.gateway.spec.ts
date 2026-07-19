import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UNAVAILABLE_MEMBER_SHOWCASE_GATEWAY } from '../unavailable-member-gateways';
import {
  DEMO_MEMBER_SHOWCASE_DRAFT,
  DemoMemberShowcaseGateway,
} from './demo-member-showcase.gateway';
import { memberShowcaseIssues } from './member-showcase-validation';

describe('DemoMemberShowcaseGateway — MP-015/MP-016', () => {
  beforeEach(() => globalThis.localStorage?.clear());

  it('sert un brouillon fictif conforme, sans contact, média ni attribut institutionnel', async () => {
    const draft = await firstValueFrom(new DemoMemberShowcaseGateway().loadDraft('MP-015'));
    expect(draft.name).toContain('fictive');
    expect(draft.publication.status).toBe('DRAFT');
    expect(draft.seo.allowIndexing).toBe(false);
    expect(memberShowcaseIssues(draft)).toEqual([]);
    expect(Object.keys(draft)).not.toEqual(
      expect.arrayContaining([
        'contacts',
        'contactConsent',
        'gallery',
        'media',
        'documents',
        'verificationBadge',
        'organizationId',
        'rccm',
        'nif',
      ]),
    );
  });

  it('récupère uniquement le brouillon fictif stocké dans le navigateur', async () => {
    const gateway = new DemoMemberShowcaseGateway();
    const stored = await firstValueFrom(
      gateway.storeLocalDraft({
        ...DEMO_MEMBER_SHOWCASE_DRAFT,
        tagline: 'Phrase fictive modifiée localement',
      }),
    );
    expect(stored.tagline).toBe('Phrase fictive modifiée localement');
    expect(stored.publication.lastSavedAt).not.toBe(
      DEMO_MEMBER_SHOWCASE_DRAFT.publication.lastSavedAt,
    );

    const recovered = await firstValueFrom(gateway.loadDraft('MP-016'));
    expect(recovered.tagline).toBe('Phrase fictive modifiée localement');
    expect(recovered.verificationStatus).toBe('UNVERIFIED');
    expect(recovered.certifications).toEqual([]);
  });

  it('détecte les limites éditoriales sans inventer de règle de publication', () => {
    const issues = memberShowcaseIssues({
      ...DEMO_MEMBER_SHOWCASE_DRAFT,
      name: '',
      slug: 'Slug invalide',
      seo: { ...DEMO_MEMBER_SHOWCASE_DRAFT.seo, title: 'x'.repeat(61) },
    });
    expect(issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(['name', 'slug', 'seoTitle']),
    );
  });

  it('ferme le mode HTTP pour chaque écran tant que R4 n’est pas promue', async () => {
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_SHOWCASE_GATEWAY.loadDraft('MP-015')),
    ).rejects.toMatchObject({ feature: 'MP-015' });
    await expect(
      firstValueFrom(UNAVAILABLE_MEMBER_SHOWCASE_GATEWAY.loadDraft('MP-016')),
    ).rejects.toMatchObject({ feature: 'MP-016' });
  });
});
