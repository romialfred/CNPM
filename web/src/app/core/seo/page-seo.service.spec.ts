import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PageSeoService } from './page-seo.service';

describe('PageSeoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    TestBed.resetTestingModule();
  });

  it('remplace toutes les métadonnées susceptibles de rester après une navigation SPA', () => {
    const service = TestBed.inject(PageSeoService);
    service.apply({
      title: 'Annuaire des membres — CNPM',
      description: 'Annuaire public de démonstration.',
      robots: 'noindex,nofollow',
      canonicalPath: '/membres',
    });

    expect(document.title).toBe('Annuaire des membres — CNPM');
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe(
      'noindex,nofollow',
    );
    expect(document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content).toBe(
      'Annuaire des membres — CNPM',
    );
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(new URL(canonical?.href ?? 'http://invalid/').pathname).toBe('/membres');
  });
});
