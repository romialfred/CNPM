import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Port de l'enrôlement (BO-009).
 *
 * Le contrat isole l'écran du transport : référentiels, brouillon, vérification
 * RCCM/NIF, analyse des pièces et soumission sont autant d'opérations que le backend
 * assumera. Aucune règle métier ne vit ici — l'écran ne calcule ni barème, ni montant,
 * ni statut de vérification.
 */

/** Les six étapes de la fiche BO-009, dans l'ordre normatif. */
export type EnrollmentStepId =
  | 'identification'
  | 'contacts'
  | 'category'
  | 'contribution'
  | 'documents'
  | 'review';

/** Entrée de référentiel : l'identifiant est stocké, le libellé est affiché. */
export interface EnrollmentOption {
  readonly id: string;
  readonly label: string;
}

export interface EnrollmentDocumentType {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly hint: string;
  /** Extensions admises, point compris (`.pdf`). Le contrôle serveur reste souverain. */
  readonly acceptedExtensions: readonly string[];
  readonly maxSizeBytes: number;
}

/**
 * Nomenclatures fournies par le back-office.
 *
 * Elles ne sont jamais écrites en dur dans l'écran : une liste figée côté navigateur
 * divergerait de la nomenclature officielle dès sa première évolution.
 */
export interface EnrollmentReference {
  readonly legalForms: readonly EnrollmentOption[];
  readonly categories: readonly EnrollmentOption[];
  readonly groups: readonly EnrollmentOption[];
  readonly periodicities: readonly EnrollmentOption[];
  readonly documentTypes: readonly EnrollmentDocumentType[];
}

/**
 * Valeurs saisies du dossier.
 *
 * Tout est `string` : `rccm` et `nif` sont du texte libre, sans masque ni format
 * imposé côté écran — un masque rejetterait des références officielles valides que
 * l'écran ne connaît pas.
 */
export interface EnrollmentDraftValues {
  readonly legalName: string;
  readonly tradeName: string;
  readonly legalForm: string;
  readonly rccm: string;
  readonly nif: string;
  readonly creationDate: string;
  readonly contactName: string;
  readonly contactRole: string;
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly address: string;
  readonly city: string;
  readonly category: string;
  readonly group: string;
  readonly workforce: string;
  readonly periodicity: string;
  readonly startDate: string;
  readonly notes: string;
  readonly certified: boolean;
}

export interface EnrollmentDraft {
  readonly id: string;
  /** Horodatage ISO 8601 de la dernière sauvegarde, produit par la source. */
  readonly savedAt: string;
  readonly values: EnrollmentDraftValues;
}

export interface EnrollmentContext {
  readonly reference: EnrollmentReference;
  /** Brouillon repris, ou `null` pour un dossier neuf. */
  readonly draft: EnrollmentDraft | null;
}

/**
 * Résultat daté d'un contrôle RCCM/NIF.
 *
 * `unavailable` n'est pas un échec de l'écran : la fiche prévoit une vérification
 * « via service si disponible ». L'écran affiche l'issue telle quelle et ne conclut
 * jamais à la place du service.
 */
export interface EnrollmentRegistrationCheck {
  readonly outcome: 'verified' | 'not-found' | 'unavailable';
  readonly checkedAt: string;
  readonly detail: string;
}

export type EnrollmentDocumentStatus = 'scanning' | 'accepted' | 'rejected';

export interface EnrollmentDocumentResult {
  readonly status: EnrollmentDocumentStatus;
  readonly message: string;
}

export interface EnrollmentSubmission {
  readonly reference: string;
  readonly submittedAt: string;
}

export interface EnrollmentGateway {
  /** Référentiels et éventuel brouillon repris, en une seule lecture. */
  load(): Observable<EnrollmentContext>;
  saveDraft(values: EnrollmentDraftValues): Observable<EnrollmentDraft>;
  checkRegistration(input: { rccm: string; nif: string }): Observable<EnrollmentRegistrationCheck>;
  /**
   * Dépôt d'une pièce : le flux émet d'abord `scanning`, puis l'issue de l'analyse
   * antivirus. Un statut final immédiat masquerait l'étape d'analyse, que
   * `.claude/rules/security.md` impose de rendre visible.
   */
  scanDocument(input: {
    typeId: string;
    fileName: string;
    sizeBytes: number;
  }): Observable<EnrollmentDocumentResult>;
  submit(values: EnrollmentDraftValues): Observable<EnrollmentSubmission>;
}

export const ENROLLMENT_GATEWAY = new InjectionToken<EnrollmentGateway>('ENROLLMENT_GATEWAY');

/**
 * Refus d'autorisation (403) renvoyé par le port.
 *
 * Distingué d'une panne temporaire : un droit refusé ne se « réessaie » pas, et
 * proposer de recommencer inviterait à répéter une action condamnée.
 */
export class EnrollmentAccessError extends Error {
  constructor(message = 'Accès refusé au formulaire d’enrôlement') {
    super(message);
    this.name = 'EnrollmentAccessError';
  }
}
