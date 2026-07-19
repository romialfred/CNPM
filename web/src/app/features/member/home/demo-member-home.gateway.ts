import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import type {
  ContributionCall,
  MemberDocument,
  MemberActivity,
  MemberHomeGateway,
  MemberHomeSnapshot,
  MemberReceipt,
  MemberRequest,
} from './member-home-gateway';

/**
 * Adaptateur de démonstration du port `MEMBER_HOME_GATEWAY`.
 *
 * Toutes les données sont manifestement synthétiques : raison sociale fictive,
 * domaines `.example`, numéros neutralisés. Aucune entreprise, aucune personne et
 * aucun montant officiel du CNPM n'y figurent — `CLAUDE.md` interdit d'inventer une
 * donnée institutionnelle, et une donnée réelle de membre n'a rien à faire dans une
 * fixture.
 *
 * Il tient le rôle de l'API : les totaux par exercice sont établis ici, comme le fera
 * le backend, si bien que le remplacer par l'adaptateur HTTP ne touchera pas l'écran.
 */

const CALLS: readonly ContributionCall[] = [
  {
    id: 'call-2026-t3',
    reference: 'APP-2026-0142-T3',
    period: '3e trimestre 2026',
    year: 2026,
    dueOn: '2026-09-30',
    amount: 900_000,
    settled: 0,
    outstanding: 900_000,
    status: 'PENDING',
  },
  {
    id: 'call-2026-t2',
    reference: 'APP-2026-0142-T2',
    period: '2e trimestre 2026',
    year: 2026,
    dueOn: '2026-06-30',
    amount: 900_000,
    settled: 450_000,
    outstanding: 450_000,
    status: 'OVERDUE',
  },
  {
    id: 'call-2026-t1',
    reference: 'APP-2026-0142-T1',
    period: '1er trimestre 2026',
    year: 2026,
    dueOn: '2026-03-31',
    amount: 900_000,
    settled: 900_000,
    outstanding: 0,
    status: 'SETTLED',
  },
  {
    id: 'call-2025-t4',
    reference: 'APP-2025-0142-T4',
    period: '4e trimestre 2025',
    year: 2025,
    dueOn: '2025-12-31',
    amount: 800_000,
    settled: 800_000,
    outstanding: 0,
    status: 'SETTLED',
  },
  {
    id: 'call-2025-t3',
    reference: 'APP-2025-0142-T3',
    period: '3e trimestre 2025',
    year: 2025,
    dueOn: '2025-09-30',
    amount: 800_000,
    settled: 800_000,
    outstanding: 0,
    status: 'SETTLED',
  },
  {
    id: 'call-2025-t2',
    reference: 'APP-2025-0142-T2',
    period: '2e trimestre 2025',
    year: 2025,
    dueOn: '2025-06-30',
    amount: 800_000,
    settled: 800_000,
    outstanding: 0,
    status: 'SETTLED',
  },
  {
    id: 'call-2025-t1',
    reference: 'APP-2025-0142-T1',
    period: '1er trimestre 2025',
    year: 2025,
    dueOn: '2025-03-31',
    amount: 800_000,
    settled: 800_000,
    outstanding: 0,
    status: 'SETTLED',
  },
  {
    id: 'call-2024-t4',
    reference: 'APP-2024-0142-T4',
    period: '4e trimestre 2024',
    year: 2024,
    dueOn: '2024-12-31',
    amount: 725_000,
    settled: 725_000,
    outstanding: 0,
    status: 'SETTLED',
  },
  {
    id: 'call-2024-t3',
    reference: 'APP-2024-0142-T3',
    period: '3e trimestre 2024',
    year: 2024,
    dueOn: '2024-09-30',
    amount: 725_000,
    settled: 725_000,
    outstanding: 0,
    status: 'SETTLED',
  },
];

const RECEIPTS: readonly MemberReceipt[] = [
  {
    id: 'receipt-2026-0047',
    reference: 'REC-2026-0142-0047',
    year: 2026,
    period: '2e trimestre 2026 — acompte',
    paidOn: '2026-06-27',
    amount: 450_000,
    fileFormat: 'PDF',
    fileSizeKb: 112,
  },
  {
    id: 'receipt-2026-0031',
    reference: 'REC-2026-0142-0031',
    year: 2026,
    period: '1er trimestre 2026',
    paidOn: '2026-03-28',
    amount: 900_000,
    fileFormat: 'PDF',
    fileSizeKb: 118,
  },
  {
    id: 'receipt-2025-0061',
    reference: 'REC-2025-0142-0061',
    year: 2025,
    period: '4e trimestre 2025',
    paidOn: '2025-12-19',
    amount: 800_000,
    fileFormat: 'PDF',
    fileSizeKb: 115,
  },
  {
    id: 'receipt-2025-0044',
    reference: 'REC-2025-0142-0044',
    year: 2025,
    period: '3e trimestre 2025',
    paidOn: '2025-09-26',
    amount: 800_000,
    fileFormat: 'PDF',
    fileSizeKb: 114,
  },
  {
    id: 'receipt-2025-0028',
    reference: 'REC-2025-0142-0028',
    year: 2025,
    period: '2e trimestre 2025',
    paidOn: '2025-06-24',
    amount: 800_000,
    fileFormat: 'PDF',
    fileSizeKb: 116,
  },
  {
    id: 'receipt-2025-0012',
    reference: 'REC-2025-0142-0012',
    year: 2025,
    period: '1er trimestre 2025',
    paidOn: '2025-03-25',
    amount: 800_000,
    fileFormat: 'PDF',
    fileSizeKb: 113,
  },
  {
    id: 'receipt-2024-0038',
    reference: 'REC-2024-0142-0038',
    year: 2024,
    period: '4e trimestre 2024',
    paidOn: '2024-12-20',
    amount: 725_000,
    fileFormat: 'PDF',
    fileSizeKb: 110,
  },
  {
    id: 'receipt-2024-0022',
    reference: 'REC-2024-0142-0022',
    year: 2024,
    period: '3e trimestre 2024',
    paidOn: '2024-09-27',
    amount: 725_000,
    fileFormat: 'PDF',
    fileSizeKb: 109,
  },
];

const DOCUMENTS: readonly MemberDocument[] = [
  {
    id: 'doc-attestation-2026',
    name: 'Attestation d’adhésion 2026',
    kind: 'Attestation',
    issuedOn: '2026-01-20',
    fileFormat: 'PDF',
    fileSizeKb: 96,
    expiresOn: '2026-12-31',
  },
  {
    id: 'doc-appel-2026-t3',
    name: 'Appel de cotisation — 3e trimestre 2026',
    kind: 'Appel de cotisation',
    issuedOn: '2026-07-06',
    fileFormat: 'PDF',
    fileSizeKb: 88,
    expiresOn: null,
  },
  {
    id: 'doc-statuts-2025',
    name: 'Récépissé de mise à jour des statuts',
    kind: 'Pièce du dossier',
    issuedOn: '2025-11-04',
    fileFormat: 'PDF',
    fileSizeKb: 240,
    expiresOn: null,
  },
  {
    id: 'doc-attestation-2025',
    name: 'Attestation d’adhésion 2025',
    kind: 'Attestation',
    issuedOn: '2025-01-18',
    fileFormat: 'PDF',
    fileSizeKb: 94,
    expiresOn: '2025-12-31',
  },
];

const REQUESTS: readonly MemberRequest[] = [
  {
    id: 'req-2026-021',
    reference: 'REQ-2026-0142-021',
    subject: 'Demande d’attestation d’adhésion',
    submittedOn: '2026-07-02',
    status: 'IN_PROGRESS',
  },
  {
    id: 'req-2026-018',
    reference: 'REQ-2026-0142-018',
    subject: 'Correction de l’adresse de facturation',
    submittedOn: '2026-06-12',
    status: 'ANSWERED',
  },
];

const ACTIVITIES: readonly MemberActivity[] = [
  {
    id: 'activity-overdue-call',
    title: 'Cotisation du 2e trimestre échue',
    description: 'Échéance initiale : 30 juin 2026',
    occurredOn: '2026-07-16',
    tone: 'critical',
  },
  {
    id: 'activity-payment',
    title: 'Paiement enregistré',
    description: 'Reçu REC-2026-0142-0047 disponible',
    occurredOn: '2026-06-27',
    tone: 'info',
  },
  {
    id: 'activity-request',
    title: 'Requête mise à jour',
    description: 'Des éléments ont été ajoutés au dossier',
    occurredOn: '2026-06-18',
    tone: 'success',
  },
  {
    id: 'activity-receipt',
    title: 'Nouveau reçu disponible',
    description: 'REC-2026-0142-0031',
    occurredOn: '2026-03-28',
    tone: 'neutral',
  },
];

const SNAPSHOT: MemberHomeSnapshot = {
  identity: {
    organization: 'Sahel Agro SA',
    memberCode: 'CNPM-2026-0142',
    category: 'Grande entreprise',
    group: 'Agro-industrie',
    status: 'ACTIVE',
    memberSince: '2016-03-14',
  },
  situation: {
    // Somme des `outstanding` des appels non soldés : 900 000 (T3, à échoir) +
    // 450 000 (T2, échu). Le total est porté par la source pour rester cohérent avec
    // les lignes affichées.
    outstandingTotal: 1_350_000,
    overdueAmount: 450_000,
    nextDueDate: '2026-09-30',
    exercises: [
      { year: 2026, called: 2_700_000, settled: 1_350_000, outstanding: 1_350_000 },
      { year: 2025, called: 3_200_000, settled: 3_200_000, outstanding: 0 },
      { year: 2024, called: 1_450_000, settled: 1_450_000, outstanding: 0 },
    ],
  },
  calls: CALLS,
  receipts: RECEIPTS,
  documents: DOCUMENTS,
  requests: REQUESTS,
  paymentCount: 4,
  activities: ACTIVITIES,
  contact: {
    contactName: 'Awa Diakité',
    role: 'Directrice administrative et financière',
    phone: '+223 00 00 00 01',
    email: 'awa.diakite@sahel-agro.example',
    address: 'Zone industrielle, lot 42 — Bamako',
    updatedOn: '2026-05-04',
  },
  profile: {
    percent: 80,
    missingFields: [
      'Numéro d’identification fiscale',
      'Effectif déclaré',
      'Représentant légal suppléant',
    ],
  },
  support: {
    channel: 'Service adhésions du CNPM',
    phone: '+223 00 00 00 00',
    email: 'adhesions@cnpm.example',
    hours: 'Lundi au vendredi, 08h00 – 16h00',
  },
};

@Injectable()
export class DemoMemberHomeGateway implements MemberHomeGateway {
  load(): Observable<MemberHomeSnapshot> {
    // Latence simulée : sans elle, l'état de chargement ne serait jamais peint, donc
    // jamais éprouvé.
    return of(SNAPSHOT).pipe(delay(160));
  }
}
