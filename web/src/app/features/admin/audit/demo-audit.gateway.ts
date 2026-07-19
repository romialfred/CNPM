import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import type { AuditEvent, AuditEventPage, AuditEventQuery, AuditGateway } from './audit-gateway';

/** Empreinte synthétique de 64 caractères, jamais dérivée d'une donnée CNPM. */
function demoHash(character: string): string {
  return character.repeat(64);
}

/**
 * Journal de démonstration fermé et déterministe.
 *
 * Toutes les valeurs sont FICTIVES : UUID réservés à la fixture, codes préfixés
 * `DEMO_`, acteurs non nominatifs et empreintes répétitives. Aucun événement, compte,
 * secret, signature, cachet ou identifiant réel du CNPM n'est utilisé.
 */
const DEMO_EVENTS: readonly AuditEvent[] = Object.freeze(
  [
    {
      id: '00000000-0000-4000-8000-000000000001',
      createdAt: '2026-07-19T09:42:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000001',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_AUDIT_VIEWED',
      entityType: 'DEMO_AUDIT_LOG',
      entityId: null,
      beforeHash: null,
      afterHash: demoHash('a'),
      correlationId: '20000000-0000-4000-8000-000000000001',
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      createdAt: '2026-07-19T09:18:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000002',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_ROLE_REVIEWED',
      entityType: 'DEMO_ROLE',
      entityId: '30000000-0000-4000-8000-000000000001',
      beforeHash: demoHash('b'),
      afterHash: demoHash('c'),
      correlationId: '20000000-0000-4000-8000-000000000002',
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      createdAt: '2026-07-19T08:51:00Z',
      actorUserId: null,
      actorType: 'DEMO_SYSTEM',
      actionCode: 'DEMO_SESSION_EXPIRED',
      entityType: 'DEMO_SESSION',
      entityId: '30000000-0000-4000-8000-000000000002',
      beforeHash: demoHash('d'),
      afterHash: null,
      correlationId: '20000000-0000-4000-8000-000000000003',
    },
    {
      id: '00000000-0000-4000-8000-000000000004',
      createdAt: '2026-07-19T08:25:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000003',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_MEMBER_VIEWED',
      entityType: 'DEMO_MEMBER',
      entityId: '30000000-0000-4000-8000-000000000003',
      beforeHash: null,
      afterHash: demoHash('e'),
      correlationId: '20000000-0000-4000-8000-000000000004',
    },
    {
      id: '00000000-0000-4000-8000-000000000005',
      createdAt: '2026-07-18T17:36:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000001',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_PERMISSION_CHECKED',
      entityType: 'DEMO_PERMISSION',
      entityId: '30000000-0000-4000-8000-000000000004',
      beforeHash: demoHash('f'),
      afterHash: demoHash('1'),
      correlationId: '20000000-0000-4000-8000-000000000005',
    },
    {
      id: '00000000-0000-4000-8000-000000000006',
      createdAt: '2026-07-18T16:04:00Z',
      actorUserId: null,
      actorType: 'DEMO_SYSTEM',
      actionCode: 'DEMO_ACCOUNT_LOCKED',
      entityType: 'DEMO_ACCOUNT',
      entityId: '30000000-0000-4000-8000-000000000005',
      beforeHash: demoHash('2'),
      afterHash: demoHash('3'),
      correlationId: '20000000-0000-4000-8000-000000000006',
    },
    {
      id: '00000000-0000-4000-8000-000000000007',
      createdAt: '2026-07-18T14:40:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000002',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_ACCOUNT_VIEWED',
      entityType: 'DEMO_ACCOUNT',
      entityId: '30000000-0000-4000-8000-000000000006',
      beforeHash: null,
      afterHash: demoHash('4'),
      correlationId: '20000000-0000-4000-8000-000000000007',
    },
    {
      id: '00000000-0000-4000-8000-000000000008',
      createdAt: '2026-07-18T11:22:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000003',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_ENROLLMENT_REVIEWED',
      entityType: 'DEMO_ENROLLMENT',
      entityId: '30000000-0000-4000-8000-000000000007',
      beforeHash: demoHash('5'),
      afterHash: demoHash('6'),
      correlationId: '20000000-0000-4000-8000-000000000008',
    },
    {
      id: '00000000-0000-4000-8000-000000000009',
      createdAt: '2026-07-18T10:06:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000001',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_SECURITY_EVENT_VIEWED',
      entityType: 'DEMO_SECURITY_EVENT',
      entityId: '30000000-0000-4000-8000-000000000008',
      beforeHash: null,
      afterHash: demoHash('7'),
      correlationId: '20000000-0000-4000-8000-000000000009',
    },
    {
      id: '00000000-0000-4000-8000-000000000010',
      createdAt: '2026-07-18T08:31:00Z',
      actorUserId: null,
      actorType: 'DEMO_SYSTEM',
      actionCode: 'DEMO_SESSION_OPENED',
      entityType: 'DEMO_SESSION',
      entityId: '30000000-0000-4000-8000-000000000009',
      beforeHash: null,
      afterHash: demoHash('8'),
      correlationId: '20000000-0000-4000-8000-000000000010',
    },
    {
      id: '00000000-0000-4000-8000-000000000011',
      createdAt: '2026-07-17T16:55:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000002',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_ROLE_VIEWED',
      entityType: 'DEMO_ROLE',
      entityId: '30000000-0000-4000-8000-000000000010',
      beforeHash: null,
      afterHash: demoHash('9'),
      correlationId: '20000000-0000-4000-8000-000000000011',
    },
    {
      id: '00000000-0000-4000-8000-000000000012',
      createdAt: '2026-07-17T13:12:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000003',
      actorType: 'DEMO_USER',
      actionCode: 'DEMO_MEMBER_VIEWED',
      entityType: 'DEMO_MEMBER',
      entityId: '30000000-0000-4000-8000-000000000011',
      beforeHash: null,
      afterHash: demoHash('0'),
      correlationId: '20000000-0000-4000-8000-000000000012',
    },
  ].map((event) => Object.freeze(event)),
);

@Injectable()
export class DemoAuditGateway implements AuditGateway {
  search(query: AuditEventQuery): Observable<AuditEventPage> {
    const pageIndex = Math.max(0, query.page - 1);
    const start = pageIndex * query.size;
    const items = DEMO_EVENTS.slice(start, start + query.size);
    return of({
      items,
      page: pageIndex,
      size: query.size,
      totalElements: DEMO_EVENTS.length,
      totalPages: Math.ceil(DEMO_EVENTS.length / query.size),
    }).pipe(delay(120));
  }
}
