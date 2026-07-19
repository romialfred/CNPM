import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type {
  MemberUserPage,
  MemberUserQuery,
  MemberUserSummary,
  MemberUsersGateway,
} from './member-users-gateway';

const DEMO_USERS: readonly MemberUserSummary[] = [
  user(
    '0001',
    'Utilisateur fictif 01',
    'administration.01',
    'Administrateur fictif de l’entreprise',
    'ACTIVE_DEMO',
    '2026-07-18',
  ),
  user(
    '0002',
    'Utilisateur fictif 02',
    'delegue.02',
    'Utilisateur délégué fictif',
    'ACTIVE_DEMO',
    '2026-07-16',
  ),
  user(
    '0003',
    'Utilisateur fictif 03',
    'delegue.03',
    'Utilisateur délégué fictif',
    'ACTIVE_DEMO',
    '2026-07-12',
  ),
  user(
    '0004',
    'Utilisateur fictif 04',
    'delegue.04',
    'Utilisateur délégué fictif',
    'INACTIVE_DEMO',
    '2026-05-30',
  ),
  user(
    '0005',
    'Utilisateur fictif 05',
    'delegue.05',
    'Utilisateur délégué fictif',
    'ACTIVE_DEMO',
    null,
  ),
  user(
    '0006',
    'Utilisateur fictif 06',
    'delegue.06',
    'Utilisateur délégué fictif',
    'INACTIVE_DEMO',
    '2025-12-18',
  ),
];

@Injectable()
export class DemoMemberUsersGateway implements MemberUsersGateway {
  list(query: MemberUserQuery): Observable<MemberUserPage> {
    const term = query.search.trim().toLocaleLowerCase('fr');
    const filtered = DEMO_USERS.filter(
      (user) =>
        (!term ||
          [user.reference, user.displayLabel, user.email, user.roleLabel].some((value) =>
            value.toLocaleLowerCase('fr').includes(term),
          )) &&
        (!query.status || user.status === query.status),
    );
    const ordered = [...filtered].sort((left, right) => {
      const comparison = sortValue(left, query).localeCompare(sortValue(right, query), 'fr');
      return query.direction === 'asc' ? comparison : -comparison;
    });
    const start = (query.page - 1) * query.size;

    return of({
      items: ordered.slice(start, start + query.size),
      page: query.page,
      size: query.size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / query.size),
    }).pipe(delay(0));
  }
}

function user(
  suffix: string,
  displayLabel: string,
  mailbox: string,
  roleLabel: string,
  status: MemberUserSummary['status'],
  lastActivityOn: string | null,
): MemberUserSummary {
  return {
    id: `demo-user-${suffix}`,
    reference: `DEMO-USR-${suffix}`,
    displayLabel,
    email: `${mailbox}@entreprise-demo.example`,
    roleLabel,
    status,
    lastActivityOn,
  };
}

function sortValue(user: MemberUserSummary, query: MemberUserQuery): string {
  switch (query.sort) {
    case 'displayLabel':
      return user.displayLabel;
    case 'roleLabel':
      return user.roleLabel;
    default:
      return user.lastActivityOn ?? '';
  }
}
