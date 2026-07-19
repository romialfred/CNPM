import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export interface PublicDemoArticle {
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  readonly summary: string;
  readonly body: readonly string[];
  readonly publishedOn: string;
  readonly readingMinutes: number;
  readonly fictionalDemo: true;
}

export interface PublicDemoEvent {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly summary: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly location: string;
  readonly fictionalDemo: true;
}

export interface EditorialGateway {
  listArticles(): Observable<readonly PublicDemoArticle[]>;
  findArticle(slug: string): Observable<PublicDemoArticle | null>;
  listEvents(): Observable<readonly PublicDemoEvent[]>;
}

export const EDITORIAL_GATEWAY = new InjectionToken<EditorialGateway>('EDITORIAL_GATEWAY');
