import { Injectable, signal } from '@angular/core';

export interface PublicEnrollmentValues {
  readonly legalName: string;
  readonly tradeName: string;
  readonly legalForm: string;
  readonly rccm: string;
  readonly nif: string;
  readonly contactName: string;
  readonly contactEmail: string;
  readonly contactPhone: string;
}

export interface PublicEnrollmentLocalConfirmation {
  readonly reference: `DEMO-${string}`;
  readonly organizationLabel: string;
  readonly channelLabel: 'Démonstration locale';
  readonly officialCaseCreated: false;
}

/**
 * État éphémère partagé par PUB-012 et PUB-013.
 *
 * Le service est fourni par la route parente `adhesion`, jamais à la racine : son
 * contenu disparaît dès que l'arbre de route est détruit. Il n'écrit ni dans le
 * navigateur ni sur le réseau et ne conserve aucun contact ni identifiant saisi.
 */
@Injectable()
export class PublicEnrollmentSession {
  private readonly value = signal<PublicEnrollmentLocalConfirmation | null>(null);

  readonly confirmation = this.value.asReadonly();

  create(values: PublicEnrollmentValues): PublicEnrollmentLocalConfirmation {
    const confirmation: PublicEnrollmentLocalConfirmation = {
      reference: 'DEMO-ADH-2026-001',
      organizationLabel: values.legalName.trim(),
      channelLabel: 'Démonstration locale',
      officialCaseCreated: false,
    };
    this.value.set(confirmation);
    return confirmation;
  }

  clear(): void {
    this.value.set(null);
  }
}
