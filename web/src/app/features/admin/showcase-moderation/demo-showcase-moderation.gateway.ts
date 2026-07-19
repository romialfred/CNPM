import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type {
  ShowcaseModerationGateway,
  ShowcaseModerationItem,
  ShowcaseModerationQueue,
  ShowcasePreviewVersion,
} from './showcase-moderation-gateway';

const VERSION_BASE: ShowcasePreviewVersion = {
  versionLabel: 'Version publiée fictive',
  tagline: 'Présentation institutionnelle de démonstration',
  summary:
    'Cette vitrine factice illustre une mise en page sans décrire une organisation existante.',
  sectorLabel: 'Activité de démonstration',
  locationDisclosure: 'Localisation masquée dans la démonstration',
  activities: ['Service fictif A', 'Service fictif B'],
  mediaPresentation: 'PLACEHOLDER_ONLY',
  publicContactPresentation: 'MASKED_NO_CONSENT',
};

const ITEMS: readonly ShowcaseModerationItem[] = [
  {
    id: 'demo-showcase-submission-0001',
    demonstrationReference: 'DEMO-VITRINE-2026-0001',
    organizationLabel: 'Organisation Démo Alpha',
    submittedAt: '2026-07-18T09:30:00Z',
    queueLabel: 'À examiner',
    membershipLabel: 'Adhésion active — scénario fictif',
    publishedVersion: VERSION_BASE,
    proposedVersion: {
      ...VERSION_BASE,
      versionLabel: 'Proposition fictive R2',
      tagline: 'Savoir-faire fictif au service d’un territoire de démonstration',
      summary:
        'Proposition entièrement fictive destinée à tester le différentiel de modération, sans personne, contact ni promesse commerciale réelle.',
      activities: ['Conseil fictif', 'Atelier de démonstration', 'Accompagnement simulé'],
    },
    changedFields: ['Accroche publique', 'Résumé de présentation', 'Liste des activités'],
    checks: [
      {
        id: 'MEDIA_RIGHTS',
        label: 'Droits des médias',
        status: 'NOT_APPLICABLE',
        detail: 'Aucun média joint : le prototype utilise seulement un repère graphique.',
      },
      {
        id: 'CONTACT_CONSENT',
        label: 'Consentement aux contacts publics',
        status: 'NOT_VERIFIED',
        detail: 'Aucun contact n’est affiché tant que le modèle de consentement reste ouvert.',
      },
      {
        id: 'CLAIMS',
        label: 'Allégations commerciales',
        status: 'REVIEW_REQUIRED',
        detail: 'Le vocabulaire fictif reste à examiner selon une politique non arbitrée.',
      },
      {
        id: 'MEMBERSHIP',
        label: 'Statut d’adhésion',
        status: 'SAFE_DEMO',
        detail: 'Statut actif uniquement dans ce scénario de démonstration.',
      },
      {
        id: 'REPORTS',
        label: 'Signalements',
        status: 'SAFE_DEMO',
        detail: 'Aucun signalement dans la file fictive.',
      },
    ],
  },
  {
    id: 'demo-showcase-submission-0002',
    demonstrationReference: 'DEMO-VITRINE-2026-0002',
    organizationLabel: 'Organisation Démo Bêta',
    submittedAt: '2026-07-17T14:10:00Z',
    queueLabel: 'Contrôle requis',
    membershipLabel: 'Adhésion active — scénario fictif',
    publishedVersion: VERSION_BASE,
    proposedVersion: {
      ...VERSION_BASE,
      versionLabel: 'Proposition fictive R3',
      tagline: 'Une activité simulée, visible sans donnée personnelle',
      summary:
        'Variante de maquette conçue pour vérifier la sélection par URL et les contrôles de publication neutralisés.',
      sectorLabel: 'Secteur fictif B',
      activities: ['Production simulée', 'Formation fictive'],
    },
    changedFields: ['Accroche publique', 'Secteur affiché'],
    checks: [
      {
        id: 'MEDIA_RIGHTS',
        label: 'Droits des médias',
        status: 'NOT_APPLICABLE',
        detail: 'Aucun média joint : aucune preuve de droit n’est simulée.',
      },
      {
        id: 'CONTACT_CONSENT',
        label: 'Consentement aux contacts publics',
        status: 'NOT_VERIFIED',
        detail: 'La section de contact demeure masquée.',
      },
      {
        id: 'CLAIMS',
        label: 'Allégations commerciales',
        status: 'REVIEW_REQUIRED',
        detail: 'La politique de contenu interdit et de recours reste ouverte.',
      },
      {
        id: 'MEMBERSHIP',
        label: 'Statut d’adhésion',
        status: 'SAFE_DEMO',
        detail: 'Statut actif uniquement dans ce scénario de démonstration.',
      },
      {
        id: 'REPORTS',
        label: 'Signalements',
        status: 'SAFE_DEMO',
        detail: 'Aucun signalement dans la file fictive.',
      },
    ],
  },
];

@Injectable()
export class DemoShowcaseModerationGateway implements ShowcaseModerationGateway {
  loadQueue(): Observable<ShowcaseModerationQueue> {
    return of({
      items: ITEMS.map((item) => ({
        ...item,
        publishedVersion: { ...item.publishedVersion },
        proposedVersion: { ...item.proposedVersion },
        changedFields: [...item.changedFields],
        checks: item.checks.map((check) => ({ ...check })),
      })),
    }).pipe(delay(80));
  }
}
