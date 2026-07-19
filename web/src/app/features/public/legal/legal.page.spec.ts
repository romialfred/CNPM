import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { LegalPage } from './legal.page';

async function setup(documentSlug: string) {
  const paramMap = new BehaviorSubject(convertToParamMap({ document: documentSlug }));
  await TestBed.configureTestingModule({
    imports: [LegalPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
        { path: 'le-cnpm', children: [] },
        { path: 'services', children: [] },
        { path: 'membres', children: [] },
        { path: 'actualites', children: [] },
        { path: 'agenda', children: [] },
        { path: 'adhesion', children: [] },
        { path: 'contact', children: [] },
        { path: 'legal/:document', children: [] },
        { path: 'verification/:code', children: [] },
      ]),
      {
        provide: ActivatedRoute,
        useValue: { paramMap },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(LegalPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement, paramMap };
}

describe('LegalPage (PUB-016)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  for (const [slug, title] of [
    ['mentions-legales', 'Mentions légales'],
    ['confidentialite', 'Politique de confidentialité'],
    ['conditions-utilisation', 'Conditions d’utilisation'],
  ] as const) {
    it(`rend le statut non publié de ${slug} sans texte juridique inventé`, async () => {
      const { host } = await setup(slug);

      expect(host.querySelector('h1')?.textContent).toContain(title);
      expect(host.querySelector('h1')).toBe(document.activeElement);
      expect(host.textContent).toContain('Document non publié');
      expect(host.textContent).toContain('Version officielle');
      expect(host.textContent).toContain('Non fournie');
      expect(host.textContent).toContain('ne peut pas être inventé');
      expect(host.querySelectorAll('.legal-gaps__list > section')).toHaveLength(3);
      expect(host.querySelector('article')?.hasAttribute('aria-labelledby')).toBe(false);
      expect(host.textContent).not.toMatch(/PUB-|DEC-|dépôt|sources du projet|conseil juridique/i);
    });
  }

  it('relie les trois documents déclarés et le formulaire de contact local', async () => {
    const { host } = await setup('mentions-legales');
    const hrefs = Array.from(host.querySelectorAll<HTMLAnchorElement>('a[href]')).map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toContain('/legal/mentions-legales');
    expect(hrefs).toContain('/legal/confidentialite');
    expect(hrefs).toContain('/legal/conditions-utilisation');
    expect(hrefs).toContain('/contact');
  });

  it('borne une référence inconnue et focalise son H1 après navigation', async () => {
    const { fixture, host, paramMap } = await setup('mentions-legales');
    const longSlug = `document-${'invente'.repeat(80)}`;
    paramMap.next(convertToParamMap({ document: longSlug }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('h1')?.textContent).toContain('Document légal introuvable');
    expect(host.querySelector('h1')).toBe(document.activeElement);
    const renderedReference = host.querySelector('.legal-not-found strong')?.textContent ?? '';
    expect(renderedReference.length).toBeLessThanOrEqual(64);
    expect(renderedReference).toContain('…');
    expect(host.textContent).not.toContain(longSlug);
    expect(host.querySelector('a[href="/legal/mentions-legales"]')).not.toBeNull();
  });
});
