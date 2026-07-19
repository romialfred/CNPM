import { Injectable } from '@angular/core';
import { concat, delay, type Observable, of } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import type {
  EnrollmentContext,
  EnrollmentDocumentResult,
  EnrollmentDraft,
  EnrollmentDraftValues,
  EnrollmentGateway,
  EnrollmentOption,
  EnrollmentRegistrationCheck,
  EnrollmentSubmission,
} from './enrollment-gateway';

/** Forme minimale exploitée dans `demo-fixtures.json` : seules ces deux clés servent ici. */
interface MemberFixture {
  readonly category: string;
  readonly group: string;
}

/** Identifiant technique stable dérivé d'un libellé, sans accent ni espace. */
function toId(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toOptions(labels: readonly string[]): readonly EnrollmentOption[] {
  return labels.map((label) => ({ id: toId(label), label }));
}

function distinct(pick: (member: MemberFixture) => string): readonly string[] {
  const members = fixtures.members as readonly MemberFixture[];
  return [...new Set(members.map(pick))].sort((a, b) => a.localeCompare(b, 'fr'));
}

/**
 * Formes juridiques et périodicités servies par l'adaptateur local.
 *
 * La nomenclature officielle du CNPM reste servie par le back-office. L'écran
 * l'affiche telle qu'elle lui parvient et n'en fabrique aucune.
 */
const DEMO_LEGAL_FORMS: readonly string[] = [
  'Société anonyme (SA)',
  'Société à responsabilité limitée (SARL)',
  'Société unipersonnelle (SUARL)',
  'Groupement d’intérêt économique (GIE)',
  'Entreprise individuelle',
  'Coopérative',
];

const DEMO_PERIODICITIES: readonly string[] = ['Annuelle', 'Semestrielle', 'Trimestrielle'];

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS: readonly string[] = ['.pdf', '.jpg', '.jpeg', '.png'];

/**
 * Brouillon de reprise servi par l'adaptateur local.
 *
 * Les valeurs reprennent la densité de BO-009 sans représenter un membre réel :
 * domaines `.example` et aucun résultat officiel de registre.
 * Le mode HTTP ne compose jamais cet adaptateur.
 */
const DEMO_DRAFT: EnrollmentDraft = {
  id: 'ENR-BROUILLON-2026-0001',
  savedAt: '2024-05-27T10:15:00Z',
  values: {
    legalName: 'SOCIÉTÉ MALIENNE DE LOGISTIQUE',
    tradeName: 'SML',
    legalForm: 'societe-anonyme-sa',
    rccm: 'MA.BKO.2024.B.1234',
    nif: '081234567A',
    creationDate: '2015-06-12',
    contactName: 'Awa Dembélé',
    contactRole: 'Directrice administrative',
    contactEmail: 'awa.dembele@sml.example',
    contactPhone: '+223 76 00 12 34',
    address: 'Rue 395, quartier du Fleuve, Bamako',
    city: 'Bamako',
    category: 'grande-entreprise',
    group: 'commerce-et-distribution',
    workforce: '152',
    periodicity: 'trimestrielle',
    startDate: '2024-01-01',
    notes: 'Dossier en cours de constitution.',
    certified: false,
  },
};

/**
 * Adaptateur local du port `ENROLLMENT_GATEWAY`.
 *
 * Il tient le rôle de l'API : référentiels, sauvegarde de brouillon, analyse des
 * pièces et soumission passent tous par lui, si bien que le remplacer par
 * l'adaptateur HTTP ne touchera pas l'écran.
 *
 * Catégories et groupements proviennent des fixtures déterministes du handoff.
 * Aucune donnée réelle de membre, conformément à `CLAUDE.md`.
 */
@Injectable()
export class DemoEnrollmentGateway implements EnrollmentGateway {
  private draft: EnrollmentDraft | null = DEMO_DRAFT;
  private sequence = 0;

  load(): Observable<EnrollmentContext> {
    const context: EnrollmentContext = {
      reference: {
        legalForms: toOptions(DEMO_LEGAL_FORMS),
        categories: toOptions(distinct((member) => member.category)),
        groups: toOptions(distinct((member) => member.group)),
        periodicities: toOptions(DEMO_PERIODICITIES),
        documentTypes: [
          {
            id: 'rccm-copy',
            label: 'Copie du registre du commerce (RCCM)',
            required: true,
            hint: 'Document officiel lisible, non rogné.',
            acceptedExtensions: ACCEPTED_EXTENSIONS,
            maxSizeBytes: MAX_DOCUMENT_BYTES,
          },
          {
            id: 'nif-copy',
            label: 'Attestation d’identification fiscale (NIF)',
            required: true,
            hint: 'Version la plus récente en votre possession.',
            acceptedExtensions: ACCEPTED_EXTENSIONS,
            maxSizeBytes: MAX_DOCUMENT_BYTES,
          },
          {
            id: 'statutes',
            label: 'Statuts de l’entreprise',
            required: true,
            hint: 'Statuts signés, toutes pages comprises.',
            acceptedExtensions: ACCEPTED_EXTENSIONS,
            maxSizeBytes: MAX_DOCUMENT_BYTES,
          },
          {
            id: 'representative-id',
            label: 'Pièce d’identité du représentant légal',
            required: true,
            hint: 'Recto et verso dans un même fichier.',
            acceptedExtensions: ACCEPTED_EXTENSIONS,
            maxSizeBytes: MAX_DOCUMENT_BYTES,
          },
          {
            id: 'logo',
            label: 'Logo de l’entreprise',
            required: false,
            hint: 'Facultatif — utilisé pour la vitrine membre.',
            acceptedExtensions: ['.jpg', '.jpeg', '.png'],
            maxSizeBytes: MAX_DOCUMENT_BYTES,
          },
        ],
      },
      // Le brouillon exerce la reprise et restitue la densité de la maquette.
      // Un adaptateur HTTP reste seul habilité à fournir un véritable dossier.
      draft: this.draft,
    };

    // Latence appliquée : sans elle, l'ossature de chargement ne serait jamais peinte,
    // donc jamais éprouvée.
    return of(context).pipe(delay(180));
  }

  saveDraft(values: EnrollmentDraftValues): Observable<EnrollmentDraft> {
    this.draft = {
      id: this.draft?.id ?? 'ENR-BROUILLON-2026-0001',
      savedAt: new Date().toISOString(),
      values,
    };
    return of(this.draft).pipe(delay(320));
  }

  /**
   * Contrôle RCCM/NIF.
   *
   * L'adaptateur local répond systématiquement `unavailable` : conclure « vérifié »
   * fabriquerait un résultat de registre officiel que rien n'atteste. L'écran, lui,
   * sait afficher les trois issues du contrat.
   */
  checkRegistration(): Observable<EnrollmentRegistrationCheck> {
    return of<EnrollmentRegistrationCheck>({
      outcome: 'unavailable',
      checkedAt: new Date().toISOString(),
      detail:
        'Le service de vérification n’est pas raccordé dans cet environnement. Le RCCM et le NIF seront contrôlés par le back-office.',
    }).pipe(delay(700));
  }

  scanDocument(input: {
    typeId: string;
    fileName: string;
    sizeBytes: number;
  }): Observable<EnrollmentDocumentResult> {
    const scanning = of<EnrollmentDocumentResult>({
      status: 'scanning',
      message: 'Analyse antivirus en cours…',
    });

    // Un nom porteur de `eicar` déclenche une détection : c'est la convention de test
    // antivirus, et elle permet d'éprouver le refus sans fichier réellement infecté.
    const rejected = input.fileName.toLowerCase().includes('eicar');
    const verdict: EnrollmentDocumentResult = rejected
      ? {
          status: 'rejected',
          message: 'Fichier refusé par l’analyse antivirus. Déposez un autre document.',
        }
      : {
          status: 'accepted',
          message: 'Pièce acceptée. Elle reste modifiable avant soumission.',
        };

    return concat(scanning, of(verdict).pipe(delay(900)));
  }

  submit(): Observable<EnrollmentSubmission> {
    this.sequence += 1;
    const sequence = String(this.sequence).padStart(4, '0');
    return of<EnrollmentSubmission>({
      reference: `ENR-2026-${sequence}`,
      submittedAt: new Date().toISOString(),
    }).pipe(delay(600));
  }
}
