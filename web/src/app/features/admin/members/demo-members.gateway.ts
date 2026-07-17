import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import type {
  MemberQuery,
  MemberRow,
  MemberStatus,
  MembersGateway,
  MembersOverview,
  MembersPage,
} from './members-gateway';

/** Forme brute d'un membre dans `demo-fixtures.json`. */
interface MemberFixture {
  readonly id: string;
  readonly code: string;
  readonly organization: string;
  readonly category: string;
  readonly segment: string;
  readonly group: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly contactEmail: string;
  readonly due: number;
  readonly paid: number;
  readonly status: string;
  readonly lastActivity: string;
}

const STATUSES: readonly MemberStatus[] = ['ACTIVE', 'DORMANT', 'PROSPECT'];

function isMemberStatus(value: string): value is MemberStatus {
  return (STATUSES as readonly string[]).includes(value);
}

/**
 * Comparaison insensible à la casse et aux diacritiques.
 *
 * Sans dépliage des accents, chercher « Segou » ne trouverait pas « Ségou Industries » :
 * l'utilisateur qui tape vite, ou sur un clavier sans accents, n'obtiendrait rien.
 */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Adaptateur de démonstration du port `MEMBERS_GATEWAY`.
 *
 * Il tient le rôle de l'API : c'est lui qui filtre, trie et pagine, exactement comme
 * le fera le backend. L'écran ne reçoit qu'une page déjà découpée, si bien que le
 * remplacer par l'adaptateur HTTP ne touchera aucune page.
 *
 * Les données proviennent de `demo-fixtures.json` — 33 enregistrements fictifs, voir
 * DATA-DEC-003. Aucune donnée réelle de membre, conformément à `CLAUDE.md`.
 */
@Injectable()
export class DemoMembersGateway implements MembersGateway {
  private readonly all: readonly MemberRow[] = (fixtures.members as readonly MemberFixture[])
    .filter((member) => isMemberStatus(member.status))
    .map((member) => ({
      id: member.id,
      code: member.code,
      organization: member.organization,
      category: member.category,
      group: member.group,
      contactName: member.contactName,
      contactPhone: member.contactPhone,
      contactEmail: member.contactEmail,
      due: member.due,
      paid: member.paid,
      status: member.status as MemberStatus,
      lastActivity: member.lastActivity,
      // `segment` mélange un marqueur et des échos du statut, parfois contradictoires
      // (`CNPM-2024-0528` est DORMANT et « Actif »). Seul le marqueur est retenu ;
      // les échos sont ignorés. Voir DATA-DEC-001.
      isLargeContributor: member.segment === 'Grand cotisant',
    }));

  search(query: MemberQuery): Observable<MembersPage> {
    const filtered = this.all.filter((member) => this.matches(member, query));
    const sorted = this.sortRows(filtered, query);

    const start = (query.page - 1) * query.pageSize;
    const rows = sorted.slice(start, start + query.pageSize);

    const page: MembersPage = {
      rows,
      totalItems: filtered.length,
      // La synthèse décrit la base entière, pas le filtre courant : elle répond à
      // « où en est le CNPM ? », question dont la réponse ne change pas parce qu'on
      // a restreint l'affichage.
      overview: this.overview(),
      categories: this.distinct((member) => member.category),
      groups: this.distinct((member) => member.group),
    };

    // Latence simulée : sans elle, l'état de chargement ne serait jamais peint et ne
    // serait jamais éprouvé.
    return of(page).pipe(delay(120));
  }

  private matches(member: MemberRow, query: MemberQuery): boolean {
    if (query.status && member.status !== query.status) {
      return false;
    }
    if (query.category && member.category !== query.category) {
      return false;
    }
    if (query.group && member.group !== query.group) {
      return false;
    }
    const term = fold(query.search.trim());
    if (!term) {
      return true;
    }
    return [
      member.code,
      member.organization,
      member.contactName,
      member.contactEmail,
      member.contactPhone,
    ].some((field) => fold(field).includes(term));
  }

  private sortRows(rows: readonly MemberRow[], query: MemberQuery): readonly MemberRow[] {
    const sort = query.sort;
    if (!sort) {
      return rows;
    }
    const factor = sort.direction === 'asc' ? 1 : -1;
    // La copie est délibérée : `sort` trie en place, ce qui réordonnerait `this.all`
    // et ferait partir le tri suivant d'un ordre déjà altéré.
    return [...rows].sort((left, right) => factor * this.compare(left, right, sort.key));
  }

  private compare(left: MemberRow, right: MemberRow, key: string): number {
    switch (key) {
      case 'due':
        return left.due - right.due;
      case 'paid':
        return left.paid - right.paid;
      case 'lastActivity':
        // Format ISO `AAAA-MM-JJ` : l'ordre lexicographique est l'ordre chronologique.
        return left.lastActivity.localeCompare(right.lastActivity);
      case 'organization':
        return left.organization.localeCompare(right.organization, 'fr');
      case 'status':
        return left.status.localeCompare(right.status);
      case 'code':
      default:
        return left.code.localeCompare(right.code, 'fr', { numeric: true });
    }
  }

  private distinct(pick: (member: MemberRow) => string): readonly string[] {
    return [...new Set(this.all.map(pick))].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  private overview(): MembersOverview {
    const active = this.all.filter((member) => member.status === 'ACTIVE');
    const dormant = this.all.filter((member) => member.status === 'DORMANT');
    const prospects = this.all.filter((member) => member.status === 'PROSPECT');
    // La base de membres exclut les prospects : `membersTotal` est donc calculé, et
    // non compté sur `this.all`, faute de quoi il inclurait les prospects et
    // contredirait le critère d'acceptation.
    const base = [...active, ...dormant];

    const expected = base.reduce((sum, member) => sum + member.due, 0);
    const collected = base.reduce((sum, member) => sum + member.paid, 0);

    return {
      membersTotal: base.length,
      active: active.length,
      dormant: dormant.length,
      prospects: prospects.length,
      largeContributors: this.all.filter((member) => member.isLargeContributor).length,
      expected,
      collected,
      recoveryRate: expected === 0 ? null : (collected / expected) * 100,
    };
  }
}
