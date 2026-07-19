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
    'Utilisateur 01',
    'administration.01',
    'Administrateur de l’entreprise',
    'ACTIVE',
    '2026-07-18',
  ),
  user(
    '0002',
    'Utilisateur 02',
    'delegue.02',
    'Utilisateur délégué',
    'ACTIVE',
    '2026-07-16',
  ),
  user(
    '0003',
    'Utilisateur 03',
    'delegue.03',
    'Utilisateur délégué',
    'ACTIVE',
    '2026-07-12',
  ),
  user(
    '0004',
    'Utilisateur 04',
    'delegue.04',
    'Utilisateur délégué',
    'INACTIVE',
    '2026-05-30',
  ),
  user(
    '0005',
    'Utilisateur 05',
    'delegue.05',
    'Utilisateur délégué',
    'ACTIVE',
    null,
  ),
  user(
    '0006',
    'Utilisateur 06',
    'delegue.06',
    'Utilisateur délégué',
    'INACTIVE',
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
    id: `user-${suffix}`,
    reference: `CNPM-USR-${suffix}`,
    displayLabel,
    email: `${mailbox}@sahel-agro.example`,
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
