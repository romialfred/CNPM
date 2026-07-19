import { Injectable } from '@angular/core';
import { concatMap, delay, of, throwError, type Observable } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import {
  type EditableMemberCore,
  MemberEditAccessError,
  MemberEditConflictError,
  type MemberEditGateway,
  MemberEditNotFoundError,
  type MemberCoreUpdate,
} from './member-edit-gateway';

const DEMO_LATENCY_MS = 90;

/**
 * Données intégralement synthétiques, sans identifiant officiel, contact, RCCM ou NIF.
 * Les alias `MEM-*` permettent d'ouvrir BO-004 depuis la liste de démonstration sans
 * transformer ces identifiants en identifiants serveur.
 */
interface MemberFixture {
  readonly id: string;
  readonly organization: string;
  readonly status: string;
}

/**
 * Reprend l'identité fictive déjà partagée par BO-002 et BO-003. Les champs que leur
 * read-model ne fournit pas restent explicitement neutres : aucun type juridique,
 * nom commercial ou code secteur n'est déduit d'une catégorie ou d'un groupement.
 */
const DEMO_MEMBERS: readonly EditableMemberCore[] = (
  fixtures.members as readonly MemberFixture[]
).map((member) => ({
  id: member.id,
  legalName: member.organization,
  tradeName: null,
  organizationType: 'Entreprise membre',
  sectorCode: null,
  status: member.status,
  riskLevel: 'NORMAL',
  version: 1,
}));

@Injectable()
export class DemoMemberEditGateway implements MemberEditGateway {
  private records = DEMO_MEMBERS.map((record) => ({ ...record }));

  load(id: string): Observable<EditableMemberCore> {
    if (id === 'MEM-INTERDIT') {
      return this.fail(new MemberEditAccessError());
    }
    const member = this.records.find((candidate) => candidate.id === id);
    return member
      ? of({ ...member }).pipe(delay(DEMO_LATENCY_MS))
      : this.fail(new MemberEditNotFoundError());
  }

  update(
    id: string,
    expectedVersion: number,
    changes: MemberCoreUpdate,
  ): Observable<EditableMemberCore> {
    const index = this.records.findIndex((candidate) => candidate.id === id);
    if (index < 0) {
      return throwError(() => new MemberEditNotFoundError());
    }
    const current = this.records[index];
    if (current.version !== expectedVersion) {
      return throwError(() => new MemberEditConflictError());
    }
    const updated: EditableMemberCore = {
      ...current,
      legalName: changes.legalName.trim(),
      tradeName: changes.tradeName.trim() || null,
      organizationType: changes.organizationType.trim(),
      sectorCode: changes.sectorCode.trim() || null,
      version: current.version + 1,
    };
    this.records[index] = updated;
    return of({ ...updated }).pipe(delay(DEMO_LATENCY_MS));
  }

  private fail(error: Error): Observable<never> {
    return of(null).pipe(
      delay(DEMO_LATENCY_MS),
      concatMap(() => throwError(() => error)),
    );
  }
}
