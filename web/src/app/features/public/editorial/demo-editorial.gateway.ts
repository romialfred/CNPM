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
    category: 'Services numériques fictifs',
    title: 'Trois repères pour découvrir le portail membre',
    summary:
      'Un parcours éditorial de démonstration pour situer cotisations, reçus et requêtes.',
    body: [
      'Cette publication fictive illustre la manière dont une actualité peut guider les membres vers leurs services numériques.',
      'Les démarches citées restent soumises aux règles, validations et contrats officiels du CNPM. Aucun délai de traitement ni engagement institutionnel n’est annoncé ici.',
      'Dans cette démonstration, chaque information sensible demeure accessible uniquement après authentification.',
    ],
    publishedOn: '2026-07-08',
    readingMinutes: 3,
    fictionalDemo: true,
  },
  {
    slug: 'reseau-entreprises-demo',
    category: 'Réseau fictif',
    title: 'Mettre en valeur les initiatives du réseau',
    summary:
      'Une publication fictive consacrée à la visibilité des entreprises et de leurs réalisations.',
    body: [
      'Ce contenu de maquette montre comment des initiatives pourraient être présentées dans un format éditorial sobre et accessible.',
      'Les organisations, chiffres et rendez-vous évoqués dans la démonstration ne correspondent à aucune communication officielle.',
    ],
    publishedOn: '2026-06-18',
    readingMinutes: 2,
    fictionalDemo: true,
  },
  {
    slug: 'demarches-lisibles-demo',
    category: 'Repère fictif',
    title: 'Rendre chaque démarche plus lisible',
    summary:
      'Une note fictive sur la traçabilité des demandes et la clarté des prochaines étapes.',
    body: [
      'Le scénario présente une information structurée autour du statut, de la date de mise à jour et de la prochaine action disponible.',
      'Il ne définit aucune procédure métier : les règles applicables restent celles qui seront officiellement approuvées et publiées.',
    ],
    publishedOn: '2026-05-27',
    readingMinutes: 2,
    fictionalDemo: true,
  },
  {
    slug: 'annuaire-public-demo',
    category: 'Annuaire fictif',
    title: 'Découvrir les vitrines publiques de démonstration',
    summary:
      'Un aperçu fictif des informations qu’une entreprise peut choisir de publier avec consentement.',
    body: [
      'Les vitrines de démonstration utilisent exclusivement des identités et contenus fictifs.',
      'La publication réelle restera conditionnée au consentement, à la modération et aux preuves de droits prévues par le dispositif.',
    ],
    publishedOn: '2026-04-09',
    readingMinutes: 2,
    fictionalDemo: true,
  },
  {
    slug: 'documents-membre-demo',
    category: 'Document fictif',
    title: 'Retrouver ses documents dans un espace unique',
    summary:
      'Une illustration fictive du classement et de la consultation des documents membre.',
    body: [
      'Ce contenu présente uniquement une intention d’interface : aucun document officiel n’est produit ni téléchargé depuis cette page publique.',
      'La disponibilité, la durée de conservation et les droits d’accès dépendront des règles officiellement validées.',
    ],
    publishedOn: '2026-03-21',
    readingMinutes: 2,
    fictionalDemo: true,
  },
  {
    slug: 'accessibilite-services-demo',
    category: 'Expérience fictive',
    title: 'Des services numériques accessibles à chacun',
    summary:
      'Un repère fictif sur la lisibilité, le clavier et l’adaptation aux petits écrans.',
    body: [
      'La démonstration applique une structure sémantique, des contrastes contrôlés et un reflow adapté aux écrans étroits.',
      'Cette publication ne constitue pas une déclaration de conformité officielle ; les audits de recette restent indispensables.',
    ],
    publishedOn: '2026-02-12',
    readingMinutes: 2,
    fictionalDemo: true,
  },
];

const EVENTS: readonly PublicDemoEvent[] = [
  {
    id: 'demo-event-2026-09-17',
    kind: 'Atelier fictif',
    title: 'Prise en main des services numériques',
    summary: 'Scénario de présentation du portail, sans ouverture d’inscription réelle.',
    startsOn: '2026-09-17T09:00:00Z',
    endsOn: '2026-09-17T11:00:00Z',
    location: 'Lieu fictif — Bamako',
    fictionalDemo: true,
  },
  {
    id: 'demo-event-2026-10-08',
    kind: 'Rencontre fictive',
    title: 'Échanges entre entreprises du réseau',
    summary: 'Exemple d’agenda, sans invitation ni engagement institutionnel.',
    startsOn: '2026-10-08T14:00:00Z',
    endsOn: '2026-10-08T16:30:00Z',
    location: 'Espace de démonstration',
    fictionalDemo: true,
  },
  {
    id: 'demo-event-2026-11-05',
    kind: 'Webinaire fictif',
    title: 'Lire ses indicateurs en toute clarté',
    summary: 'Démonstration éditoriale d’un rendez-vous à distance non planifié.',
    startsOn: '2026-11-05T10:00:00Z',
    endsOn: '2026-11-05T11:00:00Z',
    location: 'En ligne — démonstration',
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
