import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface PageSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly robots: 'index,follow' | 'noindex,nofollow';
  /** Chemin public sans paramètres de recherche, par exemple `/membres`. */
  readonly canonicalPath: `/${string}`;
}

/** Maintient les métadonnées d'une navigation SPA sans hériter de la page précédente. */
@Injectable({ providedIn: 'root' })
export class PageSeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  apply(metadata: PageSeoMetadata): void {
    const canonicalUrl = new URL(metadata.canonicalPath, this.document.location.origin).href;

    this.title.setTitle(metadata.title);
    this.meta.updateTag({ name: 'description', content: metadata.description });
    this.meta.updateTag({ name: 'robots', content: metadata.robots });
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: metadata.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });

    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.append(canonical);
    }
    canonical.href = canonicalUrl;
  }
}
