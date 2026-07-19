import { Injectable } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';
import type {
  EditorialGateway,
  PublicDemoArticle,
  PublicDemoEvent,
} from './editorial-gateway';

const ARTICLES: readonly PublicDemoArticle[] = [
  {
    slug: 'portail-membre-reperes',
    category: 'Services numériques',
    title: 'Trois repères pour découvrir le portail membre',
    summary: 'Un parcours éditorial pour situer cotisations, reçus et requêtes.',
    body: [
      'Cette publication illustre la manière dont une actualité peut guider les membres vers leurs services numériques.',
      'Les démarches citées restent soumises aux règles, validations et contrats officiels du CNPM.',
      'Chaque information sensible demeure accessible uniquement après authentification.',
    ],
    publishedOn: '2026-07-08',
    readingMinutes: 3,
    fictionalDemo: true,
  },
  {
    slug: 'reseau-entreprises',
    category: 'Réseau',
    title: 'Mettre en valeur les initiatives du réseau',
    summary:
      'Une publication consacrée à la visibilité des entreprises et de leurs réalisations.',
    body: [
      'Ce contenu montre comment les initiatives du réseau sont présentées dans un format éditorial sobre et accessible.',
      'Chaque organisation reste maîtresse des informations qu’elle choisit de mettre en avant.',
    ],
    publishedOn: '2026-06-18',
    readingMinutes: 2,
    fictionalDemo: true,
  },
  {
    slug: 'demarches-lisibles',
    category: 'Repère',
    title: 'Rendre chaque démarche plus lisible',
    summary: 'Une note sur la traçabilité des demandes et la clarté des prochaines étapes.',
    body: [
      'Le parcours présente une information structurée autour du statut, de la date de mise à jour et de la prochaine action disponible.',
      'Les règles applicables restent celles qui sont officiellement approuvées et publiées.',
    ],
    publishedOn: '2026-05-27',
    readingMinutes: 2,
    fictionalDemo: true,
  },
  {
    slug: 'annuaire-public',
    category: 'Annuaire',
    title: 'Découvrir les vitrines publiques',
    summary:
      'Un aperçu des informations qu’une entreprise peut choisir de publier avec consentement.',
    body: [
      'Les vitrines publiques reposent exclusivement sur les contenus validés par chaque entreprise.',
      'La publication reste conditionnée au consentement, à la modération et aux preuves de droits prévues par le dispositif.',
    ],
    publishedOn: '2026-04-09',
    readingMinutes: 2,
    fictionalDemo: true,
  },
  {
    slug: 'documents-membre',
    category: 'Document',
    title: 'Retrouver ses documents dans un espace unique',
    summary: 'Le classement et la consultation des documents membre.',
    body: [
      'Cette page publique présente l’organisation de l’espace documentaire ; les documents officiels restent accessibles depuis l’espace membre authentifié.',
      'La disponibilité, la durée de conservation et les droits d’accès dépendent des règles officiellement validées.',
    ],
    publishedOn: '2026-03-21',
    readingMinutes: 2,
    fictionalDemo: true,
  },
  {
    slug: 'accessibilite-services',
    category: 'Expérience',
    title: 'Des services numériques accessibles à chacun',
    summary: 'Un repère sur la lisibilité, le clavier et l’adaptation aux petits écrans.',
    body: [
      'La plateforme applique une structure sémantique, des contrastes contrôlés et un reflow adapté aux écrans étroits.',
      'Cette publication ne constitue pas une déclaration de conformité officielle ; les audits de recette restent indispensables.',
    ],
    publishedOn: '2026-02-12',
    readingMinutes: 2,
    fictionalDemo: true,
  },
];

const EVENTS: readonly PublicDemoEvent[] = [
  {
    id: 'evt-2026-09-17',
    kind: 'Atelier',
    title: 'Prise en main des services numériques',
    summary: 'Présentation guidée du portail membre et de ses principaux parcours.',
    startsOn: '2026-09-17T09:00:00Z',
    endsOn: '2026-09-17T11:00:00Z',
    location: 'Bamako',
    fictionalDemo: true,
  },
  {
    id: 'evt-2026-10-08',
    kind: 'Rencontre',
    title: 'Échanges entre entreprises du réseau',
    summary: 'Temps d’échange entre entreprises autour des services numériques.',
    startsOn: '2026-10-08T14:00:00Z',
    endsOn: '2026-10-08T16:30:00Z',
    location: 'Bamako',
    fictionalDemo: true,
  },
  {
    id: 'evt-2026-11-05',
    kind: 'Webinaire',
    title: 'Lire ses indicateurs en toute clarté',
    summary: 'Rendez-vous à distance consacré à la lecture des indicateurs du portail.',
    startsOn: '2026-11-05T10:00:00Z',
    endsOn: '2026-11-05T11:00:00Z',
    location: 'En ligne',
    fictionalDemo: true,
  },
];

@Injectable()
export class DemoEditorialGateway implements EditorialGateway {
  private static readonly LATENCY_MS = 180;

  listArticles(): Observable<readonly PublicDemoArticle[]> {
    return of(ARTICLES.filter((article) => article.fictionalDemo)).pipe(
      delay(DemoEditorialGateway.LATENCY_MS),
    );
  }

  findArticle(slug: string): Observable<PublicDemoArticle | null> {
    const normalized = slug.trim().toLowerCase();
    return of(ARTICLES).pipe(
      map((articles) => articles.find((article) => article.slug === normalized) ?? null),
      delay(DemoEditorialGateway.LATENCY_MS),
    );
  }

  listEvents(): Observable<readonly PublicDemoEvent[]> {
    return of(EVENTS.filter((event) => event.fictionalDemo)).pipe(
      delay(DemoEditorialGateway.LATENCY_MS),
    );
  }
}
